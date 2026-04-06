import { prisma } from "@/lib/prisma";
import { computeGovernanceDot } from "@/lib/risk-engine";
import type { GovernanceDotInput, GovernanceDot } from "@/lib/risk-engine";
import { getConnectionType } from "@/lib/connected-automations";
import { normalizeTier, normalizeConfidence } from "@/lib/opportunities-data";

function clampEstimateConfidence(value: string | null | undefined): "data-driven" | "benchmark-based" | "ai-suggested" | undefined {
  const normalized = normalizeConfidence(value);
  if (normalized === "data-driven") return "benchmark-based";
  return normalized;
}

// ── Types ───────────────────────────────────────────────

export type { GovernanceDot };
export { normalizeTier, normalizeConfidence };

export interface DetailImpact {
  failureScenario: string | null;
  revenueConnection: string | null;
}

export interface DetailTechnicalEvidence {
  errorHandling: string | null;
  credentials: string[];
  keyFindings: string[];
  complexity: { nodeCount: number | null; branching: string | null };
}

export interface DetailDetectability {
  level: string | null;
  reasoning: string | null;
  evidence: string | null;
}

export interface DetailProcess {
  id: string;
  name: string;
  maturityLevel: string | null;
  steps: Array<{ name: string; isGap: boolean; isAutomated: boolean }>;
}

export interface DetailRecommendation {
  id: string;
  name: string;
  brief: string;
  tier: "act-now" | "investigate" | "explore";
  impactEstimate: string;
}

export interface DetailConnection {
  id: string;
  name: string;
  externalId: string;
  businessNarrative: string | null;
  connectionType: "error-handler" | "sub-workflow" | "logical";
}

export interface DetailData {
  id: string;
  name: string;
  externalId: string;
  status: string;
  governanceDot: GovernanceDot;
  statusLabel: string;
  systemsTouched: string[];
  stepName: string | null;
  businessNarrative: string | null;
  // Business case
  impact: DetailImpact;
  timeSavingsEstimate: string | null;
  timeSavingsConfidence: "data-driven" | "benchmark-based" | "ai-suggested" | null;
  revenueImpactEstimate: string | null;
  revenueConfidence: "data-driven" | "benchmark-based" | "ai-suggested" | null;
  // Technical evidence
  technicalEvidence: DetailTechnicalEvidence;
  detectability: DetailDetectability;
  // Execution stats
  runsPerWeek: number | null;
  errorRate: number | null;
  lastExecutedAt: Date | null;
  avgDurationMs: number | null;
  // Relationships
  process: DetailProcess | null;
  recommendations: DetailRecommendation[];
  upstream: DetailConnection[];
  downstream: DetailConnection[];
}

// ── Helpers ─────────────────────────────────────────────

function parseImpact(raw: unknown): DetailImpact {
  if (typeof raw !== "object" || raw === null) {
    return { failureScenario: null, revenueConnection: null };
  }
  const obj = raw as Record<string, unknown>;
  return {
    failureScenario: typeof obj.failureScenario === "string" ? obj.failureScenario : null,
    revenueConnection: typeof obj.revenueConnection === "string" ? obj.revenueConnection : null,
  };
}

function parseTechnicalEvidence(raw: unknown): DetailTechnicalEvidence {
  if (typeof raw !== "object" || raw === null) {
    return { errorHandling: null, credentials: [], keyFindings: [], complexity: { nodeCount: null, branching: null } };
  }
  const obj = raw as Record<string, unknown>;
  return {
    errorHandling: typeof obj.errorHandling === "string" ? obj.errorHandling : null,
    credentials: Array.isArray(obj.credentials)
      ? obj.credentials.filter((c): c is string => typeof c === "string")
      : [],
    keyFindings: Array.isArray(obj.keyFindings)
      ? obj.keyFindings.filter((f): f is string => typeof f === "string")
      : [],
    complexity: parseComplexity(obj.complexity),
  };
}

function parseComplexity(raw: unknown): { nodeCount: number | null; branching: string | null } {
  if (typeof raw !== "object" || raw === null) {
    return { nodeCount: null, branching: null };
  }
  const obj = raw as Record<string, unknown>;
  return {
    nodeCount: typeof obj.nodeCount === "number" ? obj.nodeCount : null,
    branching: typeof obj.branching === "string" ? obj.branching : null,
  };
}

function parseDetectability(raw: unknown): DetailDetectability {
  if (typeof raw !== "object" || raw === null) {
    return { level: null, reasoning: null, evidence: null };
  }
  const obj = raw as Record<string, unknown>;
  return {
    level: typeof obj.level === "string" ? obj.level : null,
    reasoning: typeof obj.reasoning === "string" ? obj.reasoning : null,
    evidence: typeof obj.evidence === "string" ? obj.evidence : null,
  };
}

function buildStatusLabel(
  dot: GovernanceDot,
  errorRate: number | null,
  status: string,
): string {
  if (dot === "critical") {
    if (errorRate !== null && errorRate > 0) {
      return `Critical — ${Math.round(errorRate * 100)}% error rate`;
    }
    return "Critical — silent failure risk";
  }
  if (dot === "attention") {
    if (errorRate !== null && errorRate >= 0.05) {
      return `Attention — ${Math.round(errorRate * 100)}% error rate`;
    }
    if (status !== "active") {
      return "Attention — recently inactive";
    }
    return "Attention — partially monitored";
  }
  if (status === "active") {
    return "Healthy — active, monitored";
  }
  return "Healthy";
}

// ── Main data function ──────────────────────────────────

export async function prepareDetailData(
  automationId: string,
  workspaceId: string,
): Promise<DetailData | null> {
  const automation = await prisma.automation.findUnique({
    where: { id: automationId },
    select: {
      id: true,
      workspaceId: true,
      externalId: true,
      name: true,
      status: true,
      businessNarrative: true,
      systemsTouched: true,
      stepName: true,
      processId: true,
      // Business case
      impact: true,
      timeSavingsEstimate: true,
      timeSavingsConfidence: true,
      revenueImpactEstimate: true,
      revenueConfidence: true,
      // Technical
      technicalEvidence: true,
      detectability: true,
      rawWorkflowJson: true,
      // Execution stats
      runsPerWeek: true,
      errorRate: true,
      lastExecutedAt: true,
      avgDurationMs: true,
      // Connections
      upstreamIds: true,
      downstreamIds: true,
    },
  });

  if (!automation || automation.workspaceId !== workspaceId) {
    return null;
  }

  // Compute governance dot
  const governanceDot = computeGovernanceDot({
    errorRate: automation.errorRate,
    isActive: automation.status === "active",
    impact: automation.impact as GovernanceDotInput["impact"],
    detectability: automation.detectability as GovernanceDotInput["detectability"],
    lastExecutedAt: automation.lastExecutedAt,
    rawWorkflowJson: automation.rawWorkflowJson,
  });

  const statusLabel = buildStatusLabel(
    governanceDot,
    automation.errorRate,
    automation.status,
  );

  // Fetch process if linked
  let process: DetailProcess | null = null;
  if (automation.processId) {
    const bp = await prisma.businessProcess.findUnique({
      where: { id: automation.processId },
      select: { id: true, name: true, maturityLevel: true, steps: true },
    });
    if (bp) {
      const steps = (bp.steps as Array<{ name: string; isGap: boolean; isAutomated: boolean }>) ?? [];
      process = { id: bp.id, name: bp.name, maturityLevel: bp.maturityLevel, steps };
    }
  }

  // Fetch recommendations: automationId match + processId match, deduplicated
  const [directRecs, processRecs] = await Promise.all([
    prisma.recommendation.findMany({
      where: { automationId: automation.id },
      orderBy: { priorityOrder: "asc" },
      select: { id: true, name: true, brief: true, tier: true, impactEstimate: true },
    }),
    automation.processId
      ? prisma.recommendation.findMany({
          where: { processId: automation.processId },
          orderBy: { priorityOrder: "asc" },
          select: { id: true, name: true, brief: true, tier: true, impactEstimate: true },
        })
      : Promise.resolve([]),
  ]);

  const seenRecIds = new Set<string>();
  const recommendations: DetailRecommendation[] = [];
  for (const rec of [...directRecs, ...processRecs]) {
    if (seenRecIds.has(rec.id)) continue;
    seenRecIds.add(rec.id);
    recommendations.push({
      id: rec.id,
      name: rec.name,
      brief: rec.brief ?? "",
      tier: normalizeTier(rec.tier),
      impactEstimate: rec.impactEstimate ?? "",
    });
  }

  // Fetch connected automations
  const allConnectionIds = [
    ...new Set([...automation.upstreamIds, ...automation.downstreamIds]),
  ];

  const connectedAutomations =
    allConnectionIds.length > 0
      ? await prisma.automation.findMany({
          where: { id: { in: allConnectionIds } },
          select: {
            id: true,
            name: true,
            externalId: true,
            rawWorkflowJson: true,
            businessNarrative: true,
          },
        })
      : [];

  // Build lookup for connection type resolution
  const allForConnectionType = [
    {
      id: automation.id,
      externalId: automation.externalId,
      rawWorkflowJson: automation.rawWorkflowJson,
    },
    ...connectedAutomations.map((a) => ({
      id: a.id,
      externalId: a.externalId,
      rawWorkflowJson: a.rawWorkflowJson,
    })),
  ];

  const connectedMap = new Map(connectedAutomations.map((a) => [a.id, a]));
  const currentId = automation.id;

  function buildConnection(id: string, direction: "upstream" | "downstream"): DetailConnection | null {
    const a = connectedMap.get(id);
    if (!a) return null;
    const connectionType =
      direction === "upstream"
        ? getConnectionType(a.id, currentId, allForConnectionType)
        : getConnectionType(currentId, a.id, allForConnectionType);
    return {
      id: a.id,
      name: a.name ?? "Untitled",
      externalId: a.externalId,
      businessNarrative: a.businessNarrative,
      connectionType,
    };
  }

  const upstream = automation.upstreamIds
    .map((id) => buildConnection(id, "upstream"))
    .filter((c): c is DetailConnection => c !== null);

  const downstream = automation.downstreamIds
    .map((id) => buildConnection(id, "downstream"))
    .filter((c): c is DetailConnection => c !== null);

  return {
    id: automation.id,
    name: automation.name ?? "Untitled",
    externalId: automation.externalId,
    status: automation.status,
    governanceDot,
    statusLabel,
    systemsTouched: automation.systemsTouched,
    stepName: automation.stepName,
    businessNarrative: automation.businessNarrative,
    impact: parseImpact(automation.impact),
    timeSavingsEstimate: automation.timeSavingsEstimate,
    timeSavingsConfidence: clampEstimateConfidence(automation.timeSavingsConfidence) ?? null,
    revenueImpactEstimate: automation.revenueImpactEstimate,
    revenueConfidence: clampEstimateConfidence(automation.revenueConfidence) ?? null,
    technicalEvidence: parseTechnicalEvidence(automation.technicalEvidence),
    detectability: parseDetectability(automation.detectability),
    runsPerWeek: automation.runsPerWeek,
    errorRate: automation.errorRate,
    lastExecutedAt: automation.lastExecutedAt,
    avgDurationMs: automation.avgDurationMs,
    process,
    recommendations,
    upstream,
    downstream,
  };
}
