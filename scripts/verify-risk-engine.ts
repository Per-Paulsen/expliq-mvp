/**
 * E2E verification script for Epic 05 — Risk Engine
 *
 * Runs governance signal computation, risk level derivation, and exposure
 * score calculations against real database data.
 *
 * Usage: npx tsx scripts/verify-risk-engine.ts
 */
import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  getGovernanceSignals,
  getRiskLevel,
  getEffectiveStatus,
  getEffectiveImpact,
  getActiveSignalCount,
  getSystemExposure,
  getOwnerExposure,
  IMPACT_WEIGHTS,
  RISK_WEIGHTS,
} from "@/lib/risk-engine";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set in .env");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

async function main() {
  // Find the first workspace that has automations
  const firstAutomation = await prisma.automation.findFirst({
    where: { status: { not: "removed" } },
    select: { workspaceId: true },
  });

  if (!firstAutomation) {
    console.log("No non-removed automations found. Sync some workflows first.");
    return;
  }

  const workspaceId = firstAutomation.workspaceId;

  const automations = await prisma.automation.findMany({
    where: { workspaceId, status: { not: "removed" } },
  });

  console.log(`\n=== Risk Engine E2E Verification ===`);
  console.log(`Workspace: ${workspaceId}`);
  console.log(`Non-removed automations: ${automations.length}\n`);

  // ── Per-Automation Signals & Risk ──────────────────────

  console.log("--- Per-Automation Governance Signals ---\n");

  const riskCounts = { high: 0, medium: 0, low: 0 };
  const signalCounts = {
    documentationOutdated: 0,
    automationStale: 0,
    overdueReview: 0,
    noOwnerAssigned: 0,
    inactive: 0,
  };

  for (const auto of automations) {
    const signals = getGovernanceSignals(auto);
    const risk = getRiskLevel(auto);
    const effectiveStatus = getEffectiveStatus(auto);
    const effectiveImpact = getEffectiveImpact(auto);
    const activeCount = getActiveSignalCount(signals);

    riskCounts[risk]++;
    for (const [key, value] of Object.entries(signals)) {
      if (value) signalCounts[key as keyof typeof signalCounts]++;
    }

    const activeSignals = Object.entries(signals)
      .filter(([, v]) => v)
      .map(([k]) => k);

    console.log(
      `  ${auto.name ?? auto.externalId}` +
        `\n    Status: ${effectiveStatus} | Impact: ${effectiveImpact ?? "null"} | Risk: ${risk}` +
        `\n    Signals (${activeCount}): ${activeSignals.length > 0 ? activeSignals.join(", ") : "none"}`,
    );
  }

  // ── Summary ──────────────────────────────────────────

  console.log("\n--- Risk Level Distribution ---\n");
  console.log(`  High:   ${riskCounts.high}`);
  console.log(`  Medium: ${riskCounts.medium}`);
  console.log(`  Low:    ${riskCounts.low}`);

  console.log("\n--- Governance Signal Distribution ---\n");
  for (const [signal, count] of Object.entries(signalCounts)) {
    console.log(`  ${signal}: ${count}`);
  }

  // ── Exposure Scores ──────────────────────────────────

  console.log("\n--- System Exposure Ranking ---\n");
  const systemExposure = await getSystemExposure(workspaceId);
  if (systemExposure.length === 0) {
    console.log("  (no systems found)");
  }
  for (const entry of systemExposure) {
    console.log(
      `  ${entry.system}: score=${entry.exposureScore}, automations=${entry.automationCount}`,
    );
  }

  console.log("\n--- Owner Exposure Ranking ---\n");
  const ownerExposure = await getOwnerExposure(workspaceId);
  if (ownerExposure.length === 0) {
    console.log("  (no owners found)");
  }
  for (const entry of ownerExposure) {
    console.log(
      `  ${entry.owner}: score=${entry.exposureScore}, automations=${entry.automationCount}`,
    );
  }

  // ── Exposure Math Validation ─────────────────────────

  console.log("\n--- Exposure Math Spot-Check ---\n");

  // Manually compute one automation's exposure and verify it matches
  const sample = automations[0];
  const sampleImpact = getEffectiveImpact(sample);
  const sampleRisk = getRiskLevel(sample);
  const expectedImpactWeight = sampleImpact
    ? (IMPACT_WEIGHTS[sampleImpact] ?? 1)
    : 1;
  const expectedRiskWeight = RISK_WEIGHTS[sampleRisk];
  const expectedExposure = expectedImpactWeight * expectedRiskWeight;

  console.log(
    `  Sample: ${sample.name ?? sample.externalId}` +
      `\n    Impact: ${sampleImpact ?? "null"} (weight=${expectedImpactWeight})` +
      `\n    Risk: ${sampleRisk} (weight=${expectedRiskWeight})` +
      `\n    Expected exposure: ${expectedImpactWeight} x ${expectedRiskWeight} = ${expectedExposure}`,
  );

  // Verify the sample's contribution appears in system exposure
  if (sample.systemsTouched.length > 0) {
    const firstSystem = sample.systemsTouched[0];
    const systemEntry = systemExposure.find((s) => s.system === firstSystem);
    if (systemEntry && systemEntry.exposureScore >= expectedExposure) {
      console.log(
        `    System "${firstSystem}" total=${systemEntry.exposureScore} (includes this automation's ${expectedExposure}) ✓`,
      );
    } else {
      console.error(
        `    MISMATCH: System "${firstSystem}" exposure doesn't include expected contribution`,
      );
    }
  }

  console.log("\n=== Verification Complete ===\n");
}

main()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
