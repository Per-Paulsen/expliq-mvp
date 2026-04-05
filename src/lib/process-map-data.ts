import { prisma } from "@/lib/prisma";
import { computeGovernanceDot } from "@/lib/risk-engine";
import type { GovernanceDotInput } from "@/lib/risk-engine";
import {
  buildProcessCoverage,
  formatAttentionMetric,
  resolveStepScope,
} from "@/lib/dashboard-data";

// ── Types ───────────────────────────────────────────────

export interface ProcessMapWorkflow {
  id: string;
  name: string;
  governanceDot: "healthy" | "attention" | "critical";
  businessNarrative: string;
  metric: string | null;
  scope: string | null;
  processName: string;
}

export interface ProcessMapGap {
  stepName: string;
  processId: string;
  recommendationCount: number;
}

export interface ProcessMapProcess {
  id: string;
  name: string;
  automatedSteps: number;
  totalSteps: number;
  coveragePercentage: number;
  reliability: number | null;
  recommendationCount: number;
  maturityLevel: string | null;
  valueAtStake: string | null;
  workflows: ProcessMapWorkflow[];
  gaps: ProcessMapGap[];
}

export interface ProcessMapData {
  processes: ProcessMapProcess[];
}

// ── Main data function ──────────────────────────────────

export async function prepareProcessMapData(
  workspaceId: string,
): Promise<ProcessMapData> {
  const [processes, automations] = await Promise.all([
    prisma.businessProcess.findMany({
      where: { workspaceId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        steps: true,
        maturityLevel: true,
        valueAtStake: true,
        order: true,
        _count: { select: { recommendations: true } },
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
      },
    }),
  ]);

  // Compute governance dots for all automations
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
  const processStepsMap = new Map(
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

  // Build result for each process
  const result: ProcessMapProcess[] = processes.map((p) => {
    const coverage = buildProcessCoverage(p, automationsWithDots);

    const stepsJson = p.steps as Array<{
      name: string;
      isGap: boolean;
      isAutomated: boolean;
    }> | null;

    // Workflows linked to this process
    const workflows: ProcessMapWorkflow[] = automationsWithDots
      .filter((a) => a.processId === p.id)
      .map((a) => {
        const proc = processStepsMap.get(p.id);
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
          processName: p.name,
        };
      });

    // Gap steps (isGap === true)
    const gaps: ProcessMapGap[] = (stepsJson ?? [])
      .filter((s) => s.isGap)
      .map((s) => ({
        stepName: s.name,
        processId: p.id,
        recommendationCount: p._count.recommendations,
      }));

    return {
      ...coverage,
      workflows,
      gaps,
    };
  });

  return { processes: result };
}
