/**
 * Capture demo fixtures by running the LLM analysis pipeline once against
 * the redacted fairtix workflows. Output is committed to git so production
 * resets replay it for free.
 *
 * Pre-requisite:
 *   1. `npx tsx scripts/redact-fairtix.ts` (writes
 *      scripts/seed-fixtures/fairtix-workflows-redacted.json)
 *   2. .env points at your DEV database + OPENROUTER_API_KEY is set
 *
 * Run:
 *   npx tsx scripts/capture-demo-fixtures.ts
 *
 * Cost: ~$1-2 in OpenRouter spend (9 workflow per-LLM-calls + 1 workspace
 * aggregate call). One-time.
 *
 * Workflow:
 *   - Creates a temp workspace ("__capture-demo-tmp__").
 *   - Inserts the 9 redacted workflows as Automation rows.
 *   - Calls runAnalysisPipeline() to produce all the LLM-derived fields +
 *     BusinessProcess + Recommendation + CompanyProfile rows.
 *   - Reads everything back and serializes to scripts/seed-fixtures/demo-data.json.
 *   - Cleans up the temp workspace.
 */
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";

import { prisma } from "@/lib/prisma";
import { runAnalysisPipeline } from "@/lib/actions/analysis";

const REDACTED_PATH = path.join(
  process.cwd(),
  "scripts",
  "seed-fixtures",
  "fairtix-workflows-redacted.json",
);
const OUT_PATH = path.join(
  process.cwd(),
  "scripts",
  "seed-fixtures",
  "demo-data.json",
);
const TMP_WORKSPACE_NAME = "__capture-demo-tmp__";
const TMP_USER_EMAIL = "__capture-demo-tmp__@example.com";

type N8nWorkflow = {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  nodes?: Array<{ type: string; parameters?: Record<string, unknown> }>;
  [k: string]: unknown;
};

async function cleanupTmp(): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: TMP_USER_EMAIL } });
  if (!user) return;
  await prisma.$transaction([
    prisma.recommendation.deleteMany({ where: { workspaceId: user.workspaceId } }),
    prisma.processSuggestion.deleteMany({ where: { workspaceId: user.workspaceId } }),
    prisma.automation.deleteMany({ where: { workspaceId: user.workspaceId } }),
    prisma.businessProcess.deleteMany({ where: { workspaceId: user.workspaceId } }),
    prisma.connectorConfig.deleteMany({ where: { workspaceId: user.workspaceId } }),
    prisma.companyProfile.deleteMany({ where: { workspaceId: user.workspaceId } }),
    prisma.account.deleteMany({ where: { userId: user.id } }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
    prisma.workspace.delete({ where: { id: user.workspaceId } }),
  ]);
}

async function main(): Promise<number> {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set.");
    return 1;
  }
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY not set.");
    return 1;
  }
  if (!fs.existsSync(REDACTED_PATH)) {
    console.error(
      "Redacted workflows not found. Run scripts/redact-fairtix.ts first:",
    );
    console.error("  npx tsx scripts/redact-fairtix.ts");
    return 1;
  }

  const workflows: N8nWorkflow[] = JSON.parse(
    fs.readFileSync(REDACTED_PATH, "utf8"),
  );
  console.log(`Loaded ${workflows.length} redacted workflows.`);

  // Cleanup any prior temp workspace from failed runs.
  await cleanupTmp();

  // 1. Create temp workspace + user.
  console.log("Creating temp workspace…");
  const workspace = await prisma.workspace.create({
    data: { name: TMP_WORKSPACE_NAME },
  });
  await prisma.user.create({
    data: {
      email: TMP_USER_EMAIL,
      passwordHash: "$2b$10$tmp.placeholder.no-login.intended", // intentional non-functional
      workspaceId: workspace.id,
    },
  });

  // 2. Insert workflows as Automation rows (raw, pre-analysis).
  console.log(`Inserting ${workflows.length} automations…`);
  for (const wf of workflows) {
    await prisma.automation.create({
      data: {
        workspaceId: workspace.id,
        externalId: wf.id,
        platform: "n8n",
        rawWorkflowJson: wf as never,
        name: wf.name,
        automationLastUpdated: wf.updatedAt ? new Date(wf.updatedAt) : null,
        status: wf.active ? "active" : "inactive",
        analysisStatus: "pending",
      },
    });
  }

  // 3. Run the LLM pipeline (this is the $$ step — ~$1-2).
  console.log(
    "Running runAnalysisPipeline() — this will make real LLM calls (~$1-2 cost)…",
  );
  const result = await runAnalysisPipeline(workspace.id);
  if ("error" in result) {
    console.error("Pipeline failed:", result.error);
    await cleanupTmp();
    return 1;
  }
  console.log("Pipeline succeeded.");

  // 4. Read everything back.
  console.log("Reading captured data from DB…");
  const automations = await prisma.automation.findMany({
    where: { workspaceId: workspace.id },
    include: { process: true },
  });
  const processes = await prisma.businessProcess.findMany({
    where: { workspaceId: workspace.id },
  });
  const recommendations = await prisma.recommendation.findMany({
    where: { workspaceId: workspace.id },
    include: { process: true, automation: true },
  });
  const companyProfile = await prisma.companyProfile.findUnique({
    where: { workspaceId: workspace.id },
  });

  // 5. Serialize as fixture. Use stable external keys for FK-rebuilding on replay.
  const processKeyById = new Map<string, string>();
  for (const p of processes) {
    // Use process name as external key (assumes unique within workspace; LLM
    // generates distinct names).
    processKeyById.set(p.id, p.name);
  }

  const fixture = {
    capturedAt: new Date().toISOString(),
    automations: automations.map((a) => ({
      externalId: a.externalId,
      platform: a.platform,
      name: a.name,
      rawWorkflowJson: a.rawWorkflowJson,
      status: a.status,
      automationLastUpdated: a.automationLastUpdated?.toISOString() ?? null,
      businessNarrative: a.businessNarrative,
      dataFlow: a.dataFlow,
      impact: a.impact,
      detectability: a.detectability,
      timeSavingsEstimate: a.timeSavingsEstimate,
      revenueImpactEstimate: a.revenueImpactEstimate,
      timeSavingsConfidence: a.timeSavingsConfidence,
      revenueConfidence: a.revenueConfidence,
      technicalEvidence: a.technicalEvidence,
      trigger: a.trigger,
      triggerType: a.triggerType,
      systemsTouched: a.systemsTouched,
      stepName: a.stepName,
      processExternalKey: a.processId ? (processKeyById.get(a.processId) ?? null) : null,
      runsPerWeek: a.runsPerWeek,
      errorRate: a.errorRate,
      lastExecutedAt: a.lastExecutedAt?.toISOString() ?? null,
      avgDurationMs: a.avgDurationMs,
      upstreamIds: a.upstreamIds,
      downstreamIds: a.downstreamIds,
      analysisStatus: a.analysisStatus,
      isRemoved: a.isRemoved,
    })),
    processes: processes.map((p) => ({
      externalKey: p.name, // stable key
      name: p.name,
      summary: p.summary,
      maturityLevel: p.maturityLevel,
      valueAtStake: p.valueAtStake,
      steps: p.steps,
      order: p.order,
    })),
    recommendations: recommendations.map((r) => ({
      processExternalKey: r.processId ? (processKeyById.get(r.processId) ?? null) : null,
      automationExternalId: r.automation?.externalId ?? null,
      type: r.type,
      tier: r.tier,
      stepName: r.stepName,
      name: r.name,
      brief: r.brief,
      businessCase: r.businessCase,
      evidence: r.evidence,
      confidence: r.confidence,
      honestFraming: r.honestFraming,
      implementationNotes: r.implementationNotes,
      suggestedPlatform: r.suggestedPlatform,
      systemSource: r.systemSource,
      systemDestination: r.systemDestination,
      deployableJson: r.deployableJson,
      impactEstimate: r.impactEstimate,
      priorityOrder: r.priorityOrder,
      affectedScope: r.affectedScope,
    })),
    companyProfile: companyProfile
      ? {
          systemLandscape: companyProfile.systemLandscape,
          nextMoveText: companyProfile.nextMoveText,
          nextMoveReasoning: companyProfile.nextMoveReasoning,
          processMetrics: companyProfile.processMetrics,
          benchmarks: companyProfile.benchmarks,
          insights: companyProfile.insights,
          aggregateEstimates: companyProfile.aggregateEstimates,
          previousSnapshot: companyProfile.previousSnapshot,
          deltaSummary: companyProfile.deltaSummary,
          analysisStatus: companyProfile.analysisStatus,
          analyzedAt: companyProfile.analyzedAt?.toISOString() ?? null,
        }
      : null,
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(fixture, null, 2) + "\n");
  console.log(
    `\n[OK] Wrote ${path.relative(process.cwd(), OUT_PATH)}`,
  );
  console.log(`     Automations:     ${fixture.automations.length}`);
  console.log(`     Processes:       ${fixture.processes.length}`);
  console.log(`     Recommendations: ${fixture.recommendations.length}`);
  console.log(
    `     CompanyProfile:  ${fixture.companyProfile ? "yes" : "no"}`,
  );

  // 6. Cleanup temp workspace.
  console.log("\nCleaning up temp workspace…");
  await cleanupTmp();
  console.log("Done.");

  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch(async (err) => {
    console.error("\nCapture failed:", err);
    try {
      await cleanupTmp();
    } catch {
      /* ignore */
    }
    process.exit(1);
  });
