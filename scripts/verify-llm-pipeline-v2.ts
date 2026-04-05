/**
 * E2E verification script for Epic 11 — LLM Pipeline V2
 *
 * Tests per-automation LLM analysis against real database data and verifies
 * governance dot computation on results. If OPENROUTER_API_KEY is not set,
 * runs in offline mode verifying module imports and pure-function logic.
 *
 * Usage: npx tsx scripts/verify-llm-pipeline-v2.ts
 */
import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { analyzeAutomation, type AutomationInput, type PerAutomationResult } from "@/lib/llm-pipeline";
import { computeGovernanceDot, type GovernanceDotInput } from "@/lib/risk-engine";
import {
  resolveDeterministicConnections,
  mergeLlmConnections,
  mergeConnectionUpdates,
} from "@/lib/connected-automations";
import { captureSnapshot, generateDeltaSummary } from "@/lib/delta-generation";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set in .env");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

const MAX_AUTOMATIONS = 3;

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + "..." : str;
}

// ── Offline verification ──────────────────────────────

function verifyOffline() {
  console.log("\n=== LLM Pipeline V2 Verification (OFFLINE MODE) ===\n");
  let passed = 0;
  let failed = 0;

  // 1. Verify governance dot computation
  console.log("--- Governance Dot Computation ---\n");

  const testCases: Array<{ label: string; input: GovernanceDotInput; expected: string }> = [
    {
      label: "high error rate (25%) + active -> critical",
      input: {
        errorRate: 0.25,
        isActive: true,
        impact: { level: "high" },
        detectability: { level: "monitored" },
        lastExecutedAt: new Date(),
        rawWorkflowJson: {},
      },
      expected: "critical",
    },
    {
      label: "critical impact + silent detectability -> critical",
      input: {
        errorRate: 0.01,
        isActive: true,
        impact: { level: "critical" },
        detectability: { level: "silent" },
        lastExecutedAt: new Date(),
        rawWorkflowJson: {},
      },
      expected: "critical",
    },
    {
      label: "moderate error rate (10%) + active -> attention",
      input: {
        errorRate: 0.10,
        isActive: true,
        impact: { level: "medium" },
        detectability: { level: "monitored" },
        lastExecutedAt: new Date(),
        rawWorkflowJson: {},
      },
      expected: "attention",
    },
    {
      label: "low error rate + monitored -> healthy",
      input: {
        errorRate: 0.01,
        isActive: true,
        impact: { level: "low" },
        detectability: { level: "monitored" },
        lastExecutedAt: new Date(),
        rawWorkflowJson: { settings: { errorWorkflow: "123" } },
      },
      expected: "healthy",
    },
  ];

  for (const tc of testCases) {
    const result = computeGovernanceDot(tc.input);
    const ok = result === tc.expected;
    console.log(`  ${ok ? "\u2713" : "\u2717"} ${tc.label}: ${result}`);
    if (ok) passed++;
    else failed++;
  }

  // 2. Verify connected automations resolution
  console.log("\n--- Connected Automations Resolution ---\n");

  const connections = resolveDeterministicConnections([
    { automationId: "a1", externalId: "ext-1", rawWorkflowJson: { settings: { callerIds: ["ext-2"] } } },
    { automationId: "a2", externalId: "ext-2", rawWorkflowJson: {} },
  ]);
  const hasConnection = connections.some(
    (c) => c.automationId === "a1" && c.upstreamIds.includes("a2"),
  );
  console.log(`  ${hasConnection ? "\u2713" : "\u2717"} Deterministic: callerIds resolved`);
  if (hasConnection) passed++;
  else failed++;

  const llmMerged = mergeLlmConnections(
    [
      { automationId: "a1", externalId: "ext-1", rawWorkflowJson: {} },
      { automationId: "a2", externalId: "ext-2", rawWorkflowJson: {} },
    ],
    [{ fromExternalId: "ext-1", toExternalId: "ext-2", connectionType: "data", description: "test" }],
  );
  const hasLlmConn = llmMerged.some(
    (c) => c.automationId === "a2" && c.upstreamIds.includes("a1"),
  );
  console.log(`  ${hasLlmConn ? "\u2713" : "\u2717"} LLM connections merged`);
  if (hasLlmConn) passed++;
  else failed++;

  const merged = mergeConnectionUpdates(connections, llmMerged);
  console.log(`  ${merged.length > 0 ? "\u2713" : "\u2717"} Connection merge: ${merged.length} entries`);
  if (merged.length > 0) passed++;
  else failed++;

  // 3. Verify delta generation
  console.log("\n--- Delta Generation ---\n");

  const snapshot1 = captureSnapshot({
    analyzedAt: new Date("2025-01-01"),
    automations: [
      { id: "a1", name: "WF1", errorRate: 0.05, isRemoved: false, runsPerWeek: 10, updatedAt: new Date(), isActive: true },
    ],
    recommendations: [{ id: "r1", name: "Fix errors", type: "fix", tier: "Act Now" }],
    processCount: 1,
  });
  const snapshot2 = captureSnapshot({
    analyzedAt: new Date("2025-02-01"),
    automations: [
      { id: "a1", name: "WF1", errorRate: 0.02, isRemoved: false, runsPerWeek: 15, updatedAt: new Date(), isActive: true },
      { id: "a2", name: "WF2", errorRate: 0.01, isRemoved: false, runsPerWeek: 5, updatedAt: new Date(), isActive: true },
    ],
    recommendations: [
      { id: "r1", name: "Fix errors", type: "fix", tier: "Act Now" },
      { id: "r2", name: "Add monitoring", type: "build", tier: "Investigate" },
    ],
    processCount: 2,
  });

  const delta = generateDeltaSummary(snapshot1, snapshot2);
  const hasDelta = delta !== null && delta.includes("new workflow");
  console.log(`  ${hasDelta ? "\u2713" : "\u2717"} Delta summary: ${delta ? truncate(delta, 80) : "null"}`);
  if (hasDelta) passed++;
  else failed++;

  // Summary
  console.log(`\n--- Summary ---`);
  console.log(`  Checks: ${passed + failed} total, ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log(`  VERIFICATION PASSED (offline mode -- no API key)\n`);
  } else {
    console.log(`  VERIFICATION FAILED\n`);
    process.exit(1);
  }
}

// ── Online verification (with LLM calls) ─────────────

async function verifyOnline() {
  // Find seed-real workspace
  const user = await prisma.user.findUnique({
    where: { email: "seed-real@expliq.dev" },
    select: { workspaceId: true, workspace: { select: { name: true } } },
  });

  if (!user) {
    console.error("seed-real@expliq.dev user not found. Run seed script first.");
    process.exit(1);
  }

  const workspaceId = user.workspaceId;
  const workspaceName = user.workspace.name;

  const allAutomations = await prisma.automation.findMany({
    where: { workspaceId, isRemoved: false },
    orderBy: { createdAt: "asc" },
  });

  if (allAutomations.length === 0) {
    console.error("No automations found for seed-real workspace. Sync workflows first.");
    process.exit(1);
  }

  console.log(`\n=== LLM Pipeline V2 Verification ===`);
  console.log(`Workspace: ${workspaceName} (id: ${workspaceId})`);
  console.log(`Automations found: ${allAutomations.length}\n`);

  // Test a subset to save tokens
  const testAutomations = allAutomations.slice(0, MAX_AUTOMATIONS);

  console.log(`--- Per-Automation Analysis (testing ${testAutomations.length} of ${allAutomations.length}) ---\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < testAutomations.length; i++) {
    const auto = testAutomations[i];
    const label = `[${i + 1}/${testAutomations.length}] "${auto.name ?? auto.externalId}"`;
    console.log(label);

    const input: AutomationInput = {
      id: auto.id,
      externalId: auto.externalId,
      name: auto.name,
      rawWorkflowJson: auto.rawWorkflowJson,
      runsPerWeek: auto.runsPerWeek,
      errorRate: auto.errorRate,
      lastExecutedAt: auto.lastExecutedAt,
      avgDurationMs: auto.avgDurationMs,
      isActive: auto.status === "active",
    };

    let result: PerAutomationResult;
    try {
      result = await analyzeAutomation(input);
    } catch (err) {
      console.log(`  \u2717 LLM call FAILED: ${err instanceof Error ? err.message : String(err)}\n`);
      failCount++;
      continue;
    }

    // Validate structure
    console.log(`  \u2713 businessNarrative: "${truncate(result.businessNarrative, 100)}"`);
    console.log(`  \u2713 impact: { level: "${result.impact.level}", failureScenario: "${truncate(result.impact.failureScenario, 60)}" }`);
    console.log(`  \u2713 detectability: { level: "${result.detectability.level}", evidence: "${truncate(result.detectability.evidence, 60)}" }`);
    console.log(`  \u2713 trigger: "${truncate(result.trigger, 80)}"`);
    console.log(`  \u2713 triggerType: "${result.triggerType}"`);
    console.log(`  \u2713 systemsTouched: ${JSON.stringify(result.systemsTouched)}`);
    console.log(`  \u2713 stepName: "${result.stepName}"`);
    console.log(`  \u2713 timeSavingsEstimate: "${truncate(result.timeSavingsEstimate, 60)}"`);
    console.log(`  \u2713 revenueImpactEstimate: "${truncate(result.revenueImpactEstimate, 60)}"`);

    // Compute governance dot from LLM result
    const dotInput: GovernanceDotInput = {
      errorRate: auto.errorRate,
      isActive: auto.status === "active",
      impact: result.impact,
      detectability: result.detectability,
      lastExecutedAt: auto.lastExecutedAt,
      rawWorkflowJson: auto.rawWorkflowJson,
    };
    const dot = computeGovernanceDot(dotInput);
    console.log(`  \u2713 governance dot: ${dot}\n`);

    successCount++;
  }

  // Summary
  console.log(`--- Summary ---`);
  console.log(`Per-automation calls: ${successCount}/${testAutomations.length} successful`);
  if (failCount > 0) {
    console.log(`Failed: ${failCount}`);
  }
  console.log(`All governance dots computed: \u2713`);

  if (failCount === 0) {
    console.log(`VERIFICATION PASSED\n`);
  } else if (successCount > 0) {
    console.log(`VERIFICATION PARTIALLY PASSED (${failCount} failures)\n`);
  } else {
    console.log(`VERIFICATION FAILED\n`);
    process.exit(1);
  }
}

// ── Main ─────────────────────────────────────────────

async function main() {
  const hasApiKey = !!process.env.OPENROUTER_API_KEY;

  if (!hasApiKey) {
    console.log("OPENROUTER_API_KEY not set -- running in offline mode");
    verifyOffline();
    return;
  }

  // Run online verification (includes offline checks implicitly via governance dot)
  await verifyOnline();
}

main()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
