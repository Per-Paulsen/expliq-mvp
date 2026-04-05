import { getRequiredSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { computeGovernanceDot } from "@/lib/risk-engine";
import type { GovernanceDotInput } from "@/lib/risk-engine";
import { DashboardView } from "@/components/dashboard-view";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// Empty state component (no data yet)
function DashboardEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm text-text-secondary mb-4">
        Connect your n8n instance in Settings to get started.
      </p>
      <Link
        href="/settings"
        className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Go to Settings
      </Link>
    </div>
  );
}

// Analyzing state (analysis in progress)
function DashboardAnalyzing() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-text-secondary mb-6">
          Analyzing your automation landscape...
        </p>
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-20 w-full rounded" />
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-40 rounded" />
            <Skeleton className="h-40 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Error state (analysis failed)
function DashboardError() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-status-critical mb-2">Analysis failed</p>
        <p className="text-sm text-text-secondary mb-4">
          Something went wrong during analysis. Please try re-syncing.
        </p>
        <Link
          href="/settings"
          className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Go to Settings
        </Link>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getRequiredSession();
  const workspaceId = session.user.workspaceId;

  const companyProfile = await prisma.companyProfile.findUnique({
    where: { workspaceId },
  });

  // Empty state
  if (!companyProfile) {
    return <DashboardEmpty />;
  }

  // Analyzing state
  if (
    companyProfile.analysisStatus === "pending" ||
    companyProfile.analysisStatus === "analyzing_workflows" ||
    companyProfile.analysisStatus === "analyzing_workspace"
  ) {
    return <DashboardAnalyzing />;
  }

  // Failed state
  if (companyProfile.analysisStatus === "failed") {
    return <DashboardError />;
  }

  // Full dashboard — fetch remaining data
  const [automations, processes, topRecommendations, totalRecommendations] =
    await Promise.all([
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
        },
      }),
      prisma.businessProcess.findMany({
        where: { workspaceId },
        orderBy: { order: "asc" },
        include: {
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
    governanceDot: computeGovernanceDot({
      errorRate: a.errorRate,
      isActive: a.status === "active",
      impact: a.impact as GovernanceDotInput["impact"],
      detectability: a.detectability as GovernanceDotInput["detectability"],
      lastExecutedAt: a.lastExecutedAt,
      rawWorkflowJson: a.rawWorkflowJson,
    }),
  }));

  // Attention items (critical or attention, cap at 5)
  const attentionItems = automationsWithDots
    .filter(
      (a) =>
        a.governanceDot === "critical" || a.governanceDot === "attention",
    )
    .sort((a, b) => {
      const priority = { critical: 0, attention: 1, healthy: 2 };
      return priority[a.governanceDot] - priority[b.governanceDot];
    })
    .slice(0, 5);

  // Process coverage
  const processCoverage = processes.map((p) => {
    const stepsJson = p.steps as Array<{
      name: string;
      isGap: boolean;
      isAutomated: boolean;
    }> | null;
    const totalSteps = stepsJson?.length ?? 0;
    const automatedSteps = stepsJson?.filter((s) => !s.isGap).length ?? 0;
    const percentage =
      totalSteps > 0
        ? Math.round((automatedSteps / totalSteps) * 100)
        : 0;

    const processAutos = automationsWithDots.filter(
      (a) => a.processId === p.id,
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
      id: p.id,
      name: p.name,
      automatedSteps,
      totalSteps,
      coveragePercentage: percentage,
      reliability,
      recommendationCount: p._count.recommendations,
    };
  });

  const systemLandscape =
    (companyProfile.systemLandscape as Array<{
      name: string;
      workflowCount: number;
    }>) ?? [];
  const aggregateEstimates = companyProfile.aggregateEstimates as {
    totalTimeSavings?: string;
    totalValueAtRisk?: string;
  } | null;

  return (
    <DashboardView
      deltaSummary={companyProfile.deltaSummary}
      nextMoveText={companyProfile.nextMoveText}
      workflowCount={automations.length}
      processCount={processes.length}
      systemCount={systemLandscape.length}
      activeCount={automations.filter((a) => a.status === "active").length}
      recommendationCount={totalRecommendations}
      aggregateEstimates={aggregateEstimates}
      attentionItems={attentionItems.map((a) => ({
        id: a.id,
        name: a.name,
        governanceDot: a.governanceDot,
        businessNarrative: a.businessNarrative,
      }))}
      topOpportunities={topRecommendations.map((r) => ({
        id: r.id,
        name: r.name,
        brief: r.brief ?? "",
        tier: r.tier as "act-now" | "investigate" | "explore",
        impactEstimate: r.impactEstimate ?? "",
      }))}
      processCoverage={processCoverage}
      systemLandscape={systemLandscape}
    />
  );
}
