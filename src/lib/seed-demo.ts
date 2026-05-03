/**
 * Portfolio-deploy demo seed for expliq.
 *
 * Idempotent. Wipes the demo workspace's automations + processes +
 * recommendations + companyProfile and re-seeds from a pre-captured
 * fixture file at scripts/seed-fixtures/demo-data.json.
 *
 * The fixture is produced by scripts/capture-demo-fixtures.ts (one-time,
 * costs ~$1-2 in LLM calls). Production seeds run from the committed
 * fixture → zero LLM cost on each daily reset.
 *
 * Demo credentials (advertised on landing when DEMO_MODE=true):
 *   email:    demo@example.com   (RFC-2606 reserved demo domain)
 *   password: demo
 *
 * Reset semantics: User row + Workspace row are kept across resets (ID
 * stability for any session cookies in flight). All workspace-scoped
 * application data (Automations, BusinessProcesses, Recommendations,
 * ProcessSuggestions, CompanyProfile, ConnectorConfig) is wiped + re-seeded.
 */

import * as bcrypt from "bcrypt";
import * as fs from "node:fs";
import * as path from "node:path";

import type { PrismaClient } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";

export const DEMO_EMAIL = "demo@example.com";
export const DEMO_PASSWORD = "demo";
export const DEMO_WORKSPACE_NAME = "fairtix (demo)";

type FixtureAutomation = {
  externalId: string;
  platform: string;
  name: string | null;
  rawWorkflowJson: unknown;
  status: string;
  automationLastUpdated: string | null;
  businessNarrative: string | null;
  dataFlow: string | null;
  impact: unknown;
  detectability: unknown;
  timeSavingsEstimate: string | null;
  revenueImpactEstimate: string | null;
  timeSavingsConfidence: string | null;
  revenueConfidence: string | null;
  technicalEvidence: unknown;
  trigger: string | null;
  triggerType: string | null;
  systemsTouched: string[];
  stepName: string | null;
  // process linkage handled via processExternalKey below
  processExternalKey: string | null;
  runsPerWeek: number | null;
  errorRate: number | null;
  lastExecutedAt: string | null;
  avgDurationMs: number | null;
  upstreamIds: string[];
  downstreamIds: string[];
  analysisStatus: string | null;
  isRemoved: boolean;
};

type FixtureBusinessProcess = {
  externalKey: string; // stable key matching processExternalKey on automations
  name: string;
  summary: string | null;
  maturityLevel: string | null;
  valueAtStake: string | null;
  steps: unknown;
  order: number;
};

type FixtureRecommendation = {
  // Either processExternalKey or automationExternalId points to the parent
  processExternalKey: string | null;
  automationExternalId: string | null;
  type: string;
  tier: string;
  stepName: string | null;
  name: string;
  brief: string | null;
  businessCase: string | null;
  evidence: unknown;
  confidence: string | null;
  honestFraming: string | null;
  implementationNotes: string | null;
  suggestedPlatform: string | null;
  systemSource: string | null;
  systemDestination: string | null;
  deployableJson: unknown;
  impactEstimate: string | null;
  priorityOrder: number;
  affectedScope: string | null;
};

type FixtureCompanyProfile = {
  systemLandscape: unknown;
  nextMoveText: string | null;
  nextMoveReasoning: string | null;
  processMetrics: unknown;
  benchmarks: unknown;
  insights: unknown;
  aggregateEstimates: unknown;
  previousSnapshot: unknown;
  deltaSummary: string | null;
  analysisStatus: string;
  analyzedAt: string | null;
};

type DemoFixture = {
  capturedAt: string;
  automations: FixtureAutomation[];
  processes: FixtureBusinessProcess[];
  recommendations: FixtureRecommendation[];
  companyProfile: FixtureCompanyProfile | null;
};

export type SeedDemoResult = {
  userId: string;
  workspaceId: string;
  automationCount: number;
  processCount: number;
  recommendationCount: number;
  resetAt: string;
};

function readFixture(): DemoFixture {
  const fixturePath = path.join(
    process.cwd(),
    "scripts",
    "seed-fixtures",
    "demo-data.json",
  );
  if (!fs.existsSync(fixturePath)) {
    throw new Error(
      `Demo fixture not found: ${fixturePath}. Run "npm run capture-demo-fixtures" first.`,
    );
  }
  return JSON.parse(fs.readFileSync(fixturePath, "utf8")) as DemoFixture;
}

export async function seedDemo(prisma: PrismaClient): Promise<SeedDemoResult> {
  const fixture = readFixture();

  // 1. Demo user — find or create.
  let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  let workspaceId: string;

  if (!user) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const workspace = await prisma.workspace.create({
      data: { name: DEMO_WORKSPACE_NAME },
    });
    workspaceId = workspace.id;
    user = await prisma.user.create({
      data: {
        email: DEMO_EMAIL,
        passwordHash,
        workspaceId,
      },
    });
  } else {
    workspaceId = user.workspaceId;
  }

  // 2. Wipe existing demo workspace data.
  // Order matters: child rows first, then parents.
  await prisma.$transaction([
    prisma.recommendation.deleteMany({ where: { workspaceId } }),
    prisma.processSuggestion.deleteMany({ where: { workspaceId } }),
    prisma.automation.deleteMany({ where: { workspaceId } }),
    prisma.businessProcess.deleteMany({ where: { workspaceId } }),
    prisma.connectorConfig.deleteMany({ where: { workspaceId } }),
    prisma.companyProfile.deleteMany({ where: { workspaceId } }),
  ]);

  // 3. Re-seed from fixtures.

  // 3a. BusinessProcesses (parents of automations + recommendations).
  const processIdByKey = new Map<string, string>();
  for (const p of fixture.processes) {
    const created = await prisma.businessProcess.create({
      data: {
        workspaceId,
        name: p.name,
        summary: p.summary,
        maturityLevel: p.maturityLevel,
        valueAtStake: p.valueAtStake,
        steps: (p.steps ?? Prisma.DbNull) as Prisma.InputJsonValue,
        order: p.order,
      },
    });
    processIdByKey.set(p.externalKey, created.id);
  }

  // 3b. Automations.
  const automationIdByExternalId = new Map<string, string>();
  for (const a of fixture.automations) {
    const created = await prisma.automation.create({
      data: {
        workspaceId,
        externalId: a.externalId,
        platform: a.platform,
        rawWorkflowJson: a.rawWorkflowJson as Prisma.InputJsonValue,
        name: a.name,
        automationLastUpdated: a.automationLastUpdated
          ? new Date(a.automationLastUpdated)
          : null,
        status: a.status as never, // enum
        businessNarrative: a.businessNarrative,
        dataFlow: a.dataFlow,
        impact: (a.impact ?? Prisma.DbNull) as Prisma.InputJsonValue,
        detectability: (a.detectability ?? Prisma.DbNull) as Prisma.InputJsonValue,
        timeSavingsEstimate: a.timeSavingsEstimate,
        revenueImpactEstimate: a.revenueImpactEstimate,
        timeSavingsConfidence: a.timeSavingsConfidence,
        revenueConfidence: a.revenueConfidence,
        technicalEvidence: (a.technicalEvidence ?? Prisma.DbNull) as Prisma.InputJsonValue,
        trigger: a.trigger,
        triggerType: a.triggerType,
        systemsTouched: a.systemsTouched,
        stepName: a.stepName,
        processId: a.processExternalKey
          ? (processIdByKey.get(a.processExternalKey) ?? null)
          : null,
        runsPerWeek: a.runsPerWeek,
        errorRate: a.errorRate,
        lastExecutedAt: a.lastExecutedAt ? new Date(a.lastExecutedAt) : null,
        avgDurationMs: a.avgDurationMs,
        upstreamIds: a.upstreamIds,
        downstreamIds: a.downstreamIds,
        analysisStatus: a.analysisStatus as never,
        isRemoved: a.isRemoved,
      },
    });
    automationIdByExternalId.set(a.externalId, created.id);
  }

  // 3c. Recommendations.
  for (const r of fixture.recommendations) {
    await prisma.recommendation.create({
      data: {
        workspaceId,
        processId: r.processExternalKey
          ? (processIdByKey.get(r.processExternalKey) ?? null)
          : null,
        automationId: r.automationExternalId
          ? (automationIdByExternalId.get(r.automationExternalId) ?? null)
          : null,
        type: r.type,
        tier: r.tier,
        stepName: r.stepName,
        name: r.name,
        brief: r.brief,
        businessCase: r.businessCase,
        evidence: (r.evidence ?? Prisma.DbNull) as Prisma.InputJsonValue,
        confidence: r.confidence,
        honestFraming: r.honestFraming,
        implementationNotes: r.implementationNotes,
        suggestedPlatform: r.suggestedPlatform,
        systemSource: r.systemSource,
        systemDestination: r.systemDestination,
        deployableJson: (r.deployableJson ?? Prisma.DbNull) as Prisma.InputJsonValue,
        impactEstimate: r.impactEstimate,
        priorityOrder: r.priorityOrder,
        affectedScope: r.affectedScope,
      },
    });
  }

  // 3d. CompanyProfile.
  if (fixture.companyProfile) {
    const cp = fixture.companyProfile;
    await prisma.companyProfile.create({
      data: {
        workspaceId,
        systemLandscape: (cp.systemLandscape ?? Prisma.DbNull) as Prisma.InputJsonValue,
        nextMoveText: cp.nextMoveText,
        nextMoveReasoning: cp.nextMoveReasoning,
        processMetrics: (cp.processMetrics ?? Prisma.DbNull) as Prisma.InputJsonValue,
        benchmarks: (cp.benchmarks ?? Prisma.DbNull) as Prisma.InputJsonValue,
        insights: (cp.insights ?? Prisma.DbNull) as Prisma.InputJsonValue,
        aggregateEstimates: (cp.aggregateEstimates ?? Prisma.DbNull) as Prisma.InputJsonValue,
        previousSnapshot: (cp.previousSnapshot ?? Prisma.DbNull) as Prisma.InputJsonValue,
        deltaSummary: cp.deltaSummary,
        analysisStatus: cp.analysisStatus as never,
        analyzedAt: cp.analyzedAt ? new Date(cp.analyzedAt) : null,
      },
    });
  }

  return {
    userId: user.id,
    workspaceId,
    automationCount: fixture.automations.length,
    processCount: fixture.processes.length,
    recommendationCount: fixture.recommendations.length,
    resetAt: new Date().toISOString(),
  };
}
