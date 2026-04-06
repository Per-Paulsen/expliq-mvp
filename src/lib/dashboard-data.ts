import { prisma } from "@/lib/prisma";
import { computeGovernanceDot } from "@/lib/risk-engine";
import type { GovernanceDotInput } from "@/lib/risk-engine";
import type { Snapshot } from "@/lib/delta-generation";
import { normalizeTier, normalizeConfidence } from "@/lib/opportunities-data";

// ── Types ───────────────────────────────────────────────

export interface DeltaSegment {
  text: string;
  type: "neutral" | "positive" | "negative" | "info";
}

export interface KpiDeltas {
  workflows: {
    delta: string;
    deltaType: "positive" | "negative" | "neutral";
  } | null;
  processes: {
    delta: string;
    deltaType: "positive" | "negative" | "neutral";
  } | null;
  active: { delta: string; deltaType: "neutral" };
}

export interface NextMoveRecommendation {
  id: string;
  name: string;
  brief: string;
  tier: "act-now" | "investigate" | "explore";
  impactEstimate: string;
  confidence: string | null;
  scope: string | null;
  processName: string | null;
}

export interface AttentionItem {
  id: string;
  name: string;
  governanceDot: "healthy" | "attention" | "critical";
  businessNarrative: string;
  metric: string | null;
  scope: string | null;
  processName: string | null;
}

export interface OpportunityItem {
  id: string;
  name: string;
  brief: string;
  tier: "act-now" | "investigate" | "explore";
  impactEstimate: string;
  confidence: string | null;
  scope: string | null;
  processName: string | null;
}

export interface ProcessCoverageItem {
  id: string;
  name: string;
  automatedSteps: number;
  totalSteps: number;
  coveragePercentage: number;
  reliability: number | null;
  recommendationCount: number;
  maturityLevel: string | null;
  valueAtStake: string | null;
}

export interface DashboardData {
  deltaSummary: string | null;
  deltaSegments: DeltaSegment[];
  nextMoveRecommendations: NextMoveRecommendation[];
  totalOpportunityValue: string | null;
  workflowCount: number;
  processCount: number;
  systemCount: number;
  activeCount: number;
  recommendationCount: number;
  aggregateEstimates: {
    totalTimeSavings?: string;
    totalValueAtRisk?: string;
  } | null;
  kpiDeltas: KpiDeltas;
  attentionItems: AttentionItem[];
  topOpportunities: OpportunityItem[];
  processCoverage: ProcessCoverageItem[];
  systemLandscape: Array<{ name: string; workflowCount: number }>;
}

function clampConfidence(raw: string | null): string | null {
  const normalized = normalizeConfidence(raw);
  if (!normalized) return null;
  if (normalized === "data-driven") return "benchmark-based";
  return normalized;
}

// ── Pure helpers ────────────────────────────────────────

export function formatAttentionMetric(
  errorRate: number | null,
  status: string,
  lastExecutedAt: Date | null,
): string | null {
  if (errorRate !== null && errorRate > 0) {
    return `${Math.round(errorRate * 100)}% error rate`;
  }
  if (
    status === "active" &&
    lastExecutedAt !== null &&
    Date.now() - lastExecutedAt.getTime() > 7 * 24 * 60 * 60 * 1000
  ) {
    return "Inactive";
  }
  return null;
}

export function resolveStepScope(
  stepName: string | null,
  processSteps: Array<{
    name: string;
    isGap: boolean;
    isAutomated: boolean;
  }> | null,
): string | null {
  if (!stepName || !processSteps) return null;
  const index = processSteps.findIndex((s) => s.name === stepName);
  if (index === -1) return null;
  return `Step ${index + 1} of ${processSteps.length}`;
}

export function buildProcessCoverage(
  process: {
    id: string;
    name: string;
    steps: unknown;
    maturityLevel: string | null;
    valueAtStake: string | null;
    _count: { recommendations: number };
  },
  automationsWithDots: Array<{
    processId: string | null;
    errorRate: number | null;
  }>,
): ProcessCoverageItem {
  const stepsJson = process.steps as Array<{
    name: string;
    isGap: boolean;
    isAutomated: boolean;
  }> | null;
  const totalSteps = stepsJson?.length ?? 0;
  const automatedSteps = stepsJson?.filter((s) => !s.isGap).length ?? 0;
  const percentage =
    totalSteps > 0 ? Math.round((automatedSteps / totalSteps) * 100) : 0;

  const processAutos = automationsWithDots.filter(
    (a) => a.processId === process.id,
  );
  const withErrorRate = processAutos.filter((a) => a.errorRate !== null);
  const reliability =
    withErrorRate.length > 0
      ? Math.round(
          (withErrorRate.reduce(
            (sum, a) => sum + (1 - (a.errorRate ?? 0)),
            0,
          ) /
            withErrorRate.length) *
            100,
        )
      : null;

  return {
    id: process.id,
    name: process.name,
    automatedSteps,
    totalSteps,
    coveragePercentage: percentage,
    reliability,
    recommendationCount: process._count.recommendations,
    maturityLevel: process.maturityLevel,
    valueAtStake: process.valueAtStake,
  };
}

export function generateStructuredDelta(
  previousSnapshot: unknown,
  currentData: {
    automations: Array<{
      id: string;
      name: string | null;
      errorRate: number | null;
      isActive: boolean;
    }>;
    recommendations: Array<{ id: string; name: string }>;
    processCount: number;
    analyzedAt: Date;
  },
): DeltaSegment[] {
  if (!previousSnapshot) return [];

  const previous = previousSnapshot as Snapshot;
  const segments: DeltaSegment[] = [];

  const prevIds = new Set(previous.automations.map((a) => a.id));
  const currIds = new Set(currentData.automations.map((a) => a.id));

  // New workflows
  const newWorkflows = currentData.automations.filter(
    (a) => !prevIds.has(a.id),
  );
  if (newWorkflows.length > 0) {
    segments.push({
      text: `+${newWorkflows.length}`,
      type: "neutral",
    });
    segments.push({
      text: `new workflow${newWorkflows.length === 1 ? "" : "s"} detected`,
      type: "neutral",
    });
  }

  // Removed workflows
  const removedWorkflows = previous.automations.filter(
    (a) => !currIds.has(a.id),
  );
  if (removedWorkflows.length > 0) {
    segments.push({
      text: `${removedWorkflows.length}`,
      type: "negative",
    });
    segments.push({
      text: `workflow${removedWorkflows.length === 1 ? "" : "s"} removed`,
      type: "neutral",
    });
  }

  // Metric changes on matching automations
  const prevMap = new Map(previous.automations.map((a) => [a.id, a]));
  for (const curr of currentData.automations) {
    const prev = prevMap.get(curr.id);
    if (!prev) continue;

    // Error rate changes (> 5 percentage points)
    if (
      prev.errorRate !== null &&
      curr.errorRate !== null &&
      Math.abs(curr.errorRate - prev.errorRate) > 5
    ) {
      if (curr.errorRate < prev.errorRate) {
        segments.push({ text: "improved", type: "positive" });
        segments.push({
          text: `${Math.round(prev.errorRate)}% → ${Math.round(curr.errorRate)}%`,
          type: "positive",
        });
      } else {
        segments.push({
          text: `${Math.round(prev.errorRate)}% → ${Math.round(curr.errorRate)}%`,
          type: "negative",
        });
        segments.push({
          text: `error rate worsened on ${curr.name ?? "Unnamed workflow"}`,
          type: "neutral",
        });
      }
    }

    // Active/inactive toggle
    if (prev.isActive !== curr.isActive) {
      segments.push({
        text: `${curr.name ?? "Unnamed workflow"} now ${curr.isActive ? "active" : "inactive"}`,
        type: "neutral",
      });
    }
  }

  // Recommendation changes
  const prevRecNames = new Set(previous.recommendations.map((r) => r.name));
  const currRecNames = new Set(currentData.recommendations.map((r) => r.name));

  const newRecs = currentData.recommendations.filter(
    (r) => !prevRecNames.has(r.name),
  );
  const resolvedRecs = previous.recommendations.filter(
    (r) => !currRecNames.has(r.name),
  );

  if (newRecs.length > 0) {
    segments.push({
      text: `${newRecs.length} new recommendation${newRecs.length === 1 ? "" : "s"}`,
      type: "info",
    });
  }
  if (resolvedRecs.length > 0) {
    segments.push({
      text: `${resolvedRecs.length}`,
      type: "positive",
    });
    segments.push({
      text: `recommendation${resolvedRecs.length === 1 ? "" : "s"} resolved`,
      type: "positive",
    });
  }

  return segments;
}

export function computeKpiDeltas(
  previousSnapshot: Snapshot | null,
  current: {
    workflowCount: number;
    processCount: number;
    activeCount: number;
    workflowTotal: number;
  },
): KpiDeltas {
  let workflows: KpiDeltas["workflows"] = null;
  let processes: KpiDeltas["processes"] = null;

  if (previousSnapshot) {
    const wfDiff = current.workflowCount - previousSnapshot.automationCount;
    if (wfDiff !== 0) {
      workflows = {
        delta: `${wfDiff > 0 ? "+" : ""}${wfDiff} since last sync`,
        deltaType: wfDiff > 0 ? "positive" : "negative",
      };
    }

    const pDiff = current.processCount - previousSnapshot.processCount;
    if (pDiff !== 0) {
      processes = {
        delta: `${pDiff > 0 ? "+" : ""}${pDiff} since last sync`,
        deltaType: pDiff > 0 ? "positive" : "negative",
      };
    }
  }

  return {
    workflows,
    processes,
    active: {
      delta: `of ${current.workflowTotal} total`,
      deltaType: "neutral" as const,
    },
  };
}

// ── Main data function ──────────────────────────────────

export async function prepareDashboardData(
  workspaceId: string,
): Promise<DashboardData> {
  const [
    companyProfile,
    automations,
    processes,
    topRecommendations,
    nextMoveRecommendations,
    totalRecommendations,
  ] = await Promise.all([
    prisma.companyProfile.findUnique({
      where: { workspaceId },
      select: {
        systemLandscape: true,
        nextMoveText: true,
        aggregateEstimates: true,
        deltaSummary: true,
        previousSnapshot: true,
        analyzedAt: true,
      },
    }),
    prisma.automation.findMany({
      where: { workspaceId, isRemoved: false },
      select: {
        id: true,
        name: true,
        status: true,
        businessNarrative: true,
        errorRate: true,
        impact: true,
        detectability: true,
        lastExecutedAt: true,
        rawWorkflowJson: true,
        processId: true,
        stepName: true,
        revenueImpactEstimate: true,
        timeSavingsEstimate: true,
      },
    }),
    prisma.businessProcess.findMany({
      where: { workspaceId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        steps: true,
        maturityLevel: true,
        valueAtStake: true,
        _count: { select: { recommendations: true } },
      },
    }),
    prisma.recommendation.findMany({
      where: { workspaceId },
      orderBy: { priorityOrder: "asc" },
      take: 3,
      select: {
        id: true,
        name: true,
        brief: true,
        tier: true,
        impactEstimate: true,
        confidence: true,
        affectedScope: true,
        processId: true,
        process: { select: { name: true } },
      },
    }),
    prisma.recommendation.findMany({
      where: { workspaceId },
      orderBy: { priorityOrder: "asc" },
      take: 2,
      select: {
        id: true,
        name: true,
        brief: true,
        tier: true,
        impactEstimate: true,
        confidence: true,
        affectedScope: true,
        processId: true,
        process: { select: { name: true } },
      },
    }),
    prisma.recommendation.count({ where: { workspaceId } }),
  ]);

  // Compute governance dots
  const automationsWithDots = automations.map((a) => ({
    id: a.id,
    name: a.name ?? "Untitled",
    businessNarrative: a.businessNarrative ?? "",
    processId: a.processId,
    status: a.status,
    errorRate: a.errorRate,
    lastExecutedAt: a.lastExecutedAt,
    stepName: a.stepName,
    governanceDot: computeGovernanceDot({
      errorRate: a.errorRate,
      isActive: a.status === "active",
      impact: a.impact as GovernanceDotInput["impact"],
      detectability: a.detectability as GovernanceDotInput["detectability"],
      lastExecutedAt: a.lastExecutedAt,
      rawWorkflowJson: a.rawWorkflowJson,
    }),
  }));

  // Build process map for step scope lookups
  const processMap = new Map(
    processes.map((p) => [
      p.id,
      {
        name: p.name,
        steps: p.steps as Array<{
          name: string;
          isGap: boolean;
          isAutomated: boolean;
        }> | null,
      },
    ]),
  );

  // Attention items (critical or attention, cap at 5)
  const attentionItems: AttentionItem[] = automationsWithDots
    .filter(
      (a) =>
        a.governanceDot === "critical" || a.governanceDot === "attention",
    )
    .sort((a, b) => {
      const priority = { critical: 0, attention: 1, healthy: 2 };
      return priority[a.governanceDot] - priority[b.governanceDot];
    })
    .slice(0, 5)
    .map((a) => {
      const proc = a.processId ? processMap.get(a.processId) : null;
      return {
        id: a.id,
        name: a.name,
        governanceDot: a.governanceDot,
        businessNarrative: a.businessNarrative,
        metric: formatAttentionMetric(
          a.errorRate,
          a.status,
          a.lastExecutedAt,
        ),
        scope: resolveStepScope(a.stepName, proc?.steps ?? null),
        processName: proc?.name ?? null,
      };
    });

  // Process coverage
  const processCoverage = processes.map((p) =>
    buildProcessCoverage(p, automationsWithDots),
  );

  // System landscape
  const systemLandscape =
    (companyProfile?.systemLandscape as Array<{
      name: string;
      workflowCount: number;
    }>) ?? [];

  // Aggregate estimates
  const aggregateEstimates =
    (companyProfile?.aggregateEstimates as {
      totalTimeSavings?: string;
      totalValueAtRisk?: string;
      totalOpportunityValue?: string;
    }) ?? null;

  // Previous snapshot for deltas
  const previousSnapshot =
    (companyProfile?.previousSnapshot as unknown as Snapshot) ?? null;

  const activeCount = automations.filter(
    (a) => a.status === "active",
  ).length;
  const workflowCount = automations.length;
  const processCount = processes.length;

  // Delta segments
  const deltaSegments = generateStructuredDelta(
    previousSnapshot,
    {
      automations: automations.map((a) => ({
        id: a.id,
        name: a.name,
        errorRate: a.errorRate,
        isActive: a.status === "active",
      })),
      recommendations: topRecommendations.map((r) => ({
        id: r.id,
        name: r.name,
      })),
      processCount,
      analyzedAt: companyProfile?.analyzedAt ?? new Date(),
    },
  );

  // KPI deltas
  const kpiDeltas = computeKpiDeltas(previousSnapshot, {
    workflowCount,
    processCount,
    activeCount,
    workflowTotal: workflowCount,
  });

  // Top opportunities
  const topOpportunities: OpportunityItem[] = topRecommendations.map((r) => ({
    id: r.id,
    name: r.name,
    brief: r.brief ?? "",
    tier: normalizeTier(r.tier),
    impactEstimate: r.impactEstimate ?? "",
    confidence: clampConfidence(r.confidence),
    scope: r.affectedScope ?? null,
    processName: r.process?.name ?? null,
  }));

  // Next move recommendations
  const nextMoveRecs: NextMoveRecommendation[] =
    nextMoveRecommendations.map((r) => ({
      id: r.id,
      name: r.name,
      brief: r.brief ?? "",
      tier: normalizeTier(r.tier),
      impactEstimate: r.impactEstimate ?? "",
      confidence: clampConfidence(r.confidence),
      scope: r.affectedScope ?? null,
      processName: r.process?.name ?? null,
    }));

  // Total opportunity value from aggregate estimates
  const totalOpportunityValue = aggregateEstimates?.totalOpportunityValue ?? null;

  return {
    deltaSummary: companyProfile?.deltaSummary ?? null,
    deltaSegments,
    nextMoveRecommendations: nextMoveRecs,
    totalOpportunityValue,
    workflowCount,
    processCount,
    systemCount: systemLandscape.length,
    activeCount,
    recommendationCount: totalRecommendations,
    aggregateEstimates,
    kpiDeltas,
    attentionItems,
    topOpportunities,
    processCoverage,
    systemLandscape,
  };
}
