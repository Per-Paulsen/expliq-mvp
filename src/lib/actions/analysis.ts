"use server";

import { prisma } from "@/lib/prisma";
import {
  analyzeAutomation,
  analyzeWorkspace,
  type AutomationInput,
  type WorkspaceInput,
  type PerAutomationResult,
  type WorkspaceResult,
} from "@/lib/llm-pipeline";
import {
  resolveDeterministicConnections,
  mergeLlmConnections,
  mergeConnectionUpdates,
  type AutomationConnection,
} from "@/lib/connected-automations";
import {
  captureSnapshot,
  generateDeltaSummary,
  type Snapshot,
} from "@/lib/delta-generation";
import { Prisma } from "@/generated/prisma/client";

// ── Types ──────────────────────────────────────────────

interface PerAutomationSuccess {
  automationId: string;
  externalId: string;
  name: string | null;
  result: PerAutomationResult;
}

// ── Priority ordering ─────────��────────────────────────

const TIER_ORDER: Record<string, number> = {
  "act now": 0,
  immediate: 0,
  critical: 0,
  high: 0,
  investigate: 1,
  medium: 1,
  explore: 2,
  low: 2,
};

function tierPriority(tier: string): number {
  return TIER_ORDER[tier.toLowerCase()] ?? 3;
}

// ── Metadata extraction ────���───────────────────────────

interface WorkspaceMetadata {
  tags?: string[];
  credentials?: Array<{ name: string; type: string }>;
  users?: Array<{ email: string; role: string }>;
}

function extractMetadata(
  config: { selectedTags: string[]; discoveryData: unknown } | null,
): WorkspaceMetadata {
  const metadata: WorkspaceMetadata = {};
  if (!config) return metadata;

  if (config.selectedTags.length > 0) {
    metadata.tags = config.selectedTags;
  }

  if (
    config.discoveryData &&
    typeof config.discoveryData === "object" &&
    !Array.isArray(config.discoveryData)
  ) {
    const data = config.discoveryData as Record<string, unknown>;

    if (Array.isArray(data.credentials)) {
      metadata.credentials = data.credentials
        .filter(
          (c): c is { name: string; type: string } =>
            typeof c === "object" &&
            c !== null &&
            typeof (c as Record<string, unknown>).name === "string" &&
            typeof (c as Record<string, unknown>).type === "string",
        )
        .map((c) => ({ name: c.name, type: c.type }));
    }

    if (Array.isArray(data.users)) {
      metadata.users = data.users
        .filter(
          (u): u is { email: string; role: string } =>
            typeof u === "object" &&
            u !== null &&
            typeof (u as Record<string, unknown>).email === "string" &&
            typeof (u as Record<string, unknown>).role === "string",
        )
        .map((u) => ({ email: u.email, role: u.role }));
    }
  }

  return metadata;
}

// ── Main orchestration ─────────��───────────────────────

export async function runAnalysisPipeline(
  workspaceId: string,
): Promise<{ success: true } | { error: string }> {
  // Step 1: Upsert CompanyProfile, set status to pending
  let companyProfile = await prisma.companyProfile.findUnique({
    where: { workspaceId },
  });

  if (!companyProfile) {
    companyProfile = await prisma.companyProfile.create({
      data: {
        workspaceId,
        analysisStatus: "pending",
      },
    });
  } else {
    await prisma.companyProfile.update({
      where: { workspaceId },
      data: { analysisStatus: "pending" },
    });
  }

  try {
    // Step 2: If re-sync, capture snapshot of previous state
    let previousSnapshot: Snapshot | null = null;
    if (companyProfile.analyzedAt) {
      const existingAutomations = await prisma.automation.findMany({
        where: { workspaceId, isRemoved: false },
        select: {
          id: true,
          name: true,
          errorRate: true,
          isRemoved: true,
          runsPerWeek: true,
          updatedAt: true,
          status: true,
        },
      });
      const existingRecommendations = await prisma.recommendation.findMany({
        where: { workspaceId },
        select: { id: true, name: true, type: true, tier: true },
      });
      const existingProcessCount = await prisma.businessProcess.count({
        where: { workspaceId },
      });

      previousSnapshot = captureSnapshot({
        analyzedAt: companyProfile.analyzedAt,
        automations: existingAutomations.map((a) => ({
          ...a,
          isActive: a.status === "active",
        })),
        recommendations: existingRecommendations,
        processCount: existingProcessCount,
      });

      await prisma.companyProfile.update({
        where: { workspaceId },
        data: {
          previousSnapshot: previousSnapshot as unknown as Prisma.InputJsonValue,
        },
      });
    }

    // Step 3: Clean slate — delete existing workspace-level analysis data + clear processId
    await prisma.recommendation.deleteMany({ where: { workspaceId } });
    await prisma.processSuggestion.deleteMany({ where: { workspaceId } });
    await prisma.automation.updateMany({
      where: { workspaceId },
      data: { processId: null },
    });
    await prisma.businessProcess.deleteMany({ where: { workspaceId } });

    // Step 4: Set status to analyzing_workflows
    await prisma.companyProfile.update({
      where: { workspaceId },
      data: { analysisStatus: "analyzing_workflows" },
    });

    // Step 5: Load all non-removed automations and set each to pending
    const automations = await prisma.automation.findMany({
      where: { workspaceId, isRemoved: false },
    });

    for (const automation of automations) {
      await prisma.automation.update({
        where: { id: automation.id },
        data: { analysisStatus: "pending" },
      });
    }

    // Step 6: Run per-automation LLM calls in parallel with failure isolation
    const perAutomationResults = await Promise.allSettled(
      automations.map(async (automation) => {
        const input: AutomationInput = {
          id: automation.id,
          externalId: automation.externalId,
          name: automation.name,
          rawWorkflowJson: automation.rawWorkflowJson,
          runsPerWeek: automation.runsPerWeek,
          errorRate: automation.errorRate,
          lastExecutedAt: automation.lastExecutedAt,
          avgDurationMs: automation.avgDurationMs,
          isActive: automation.status === "active",
        };

        const result = await analyzeAutomation(input);
        return {
          automationId: automation.id,
          externalId: automation.externalId,
          name: automation.name,
          result,
        } satisfies PerAutomationSuccess;
      }),
    );

    // Step 7-8: Update automations with results or mark as failed
    const successful: PerAutomationSuccess[] = [];

    for (let i = 0; i < perAutomationResults.length; i++) {
      const settled = perAutomationResults[i];
      const automation = automations[i];

      if (settled.status === "fulfilled") {
        const { result } = settled.value;
        successful.push(settled.value);

        await prisma.automation.update({
          where: { id: automation.id },
          data: {
            businessNarrative: result.businessNarrative,
            trigger: result.trigger,
            triggerType: result.triggerType,
            systemsTouched: result.systemsTouched,
            dataFlow: result.dataFlow,
            stepName: result.stepName,
            impact: result.impact as unknown as Prisma.InputJsonValue,
            detectability: result.detectability as unknown as Prisma.InputJsonValue,
            timeSavingsEstimate: result.timeSavingsEstimate,
            revenueImpactEstimate: result.revenueImpactEstimate,
            technicalEvidence: result.technicalEvidence as unknown as Prisma.InputJsonValue,
            analysisStatus: "complete",
          },
        });
      } else {
        await prisma.automation.update({
          where: { id: automation.id },
          data: { analysisStatus: "failed" },
        });
      }
    }

    // If ALL per-automation calls failed, abort early
    if (automations.length > 0 && successful.length === 0) {
      await prisma.companyProfile.update({
        where: { workspaceId },
        data: { analysisStatus: "failed" },
      });
      return { error: "All per-automation analysis calls failed" };
    }

    // Step 9: Set status to analyzing_workspace
    await prisma.companyProfile.update({
      where: { workspaceId },
      data: { analysisStatus: "analyzing_workspace" },
    });

    // Step 10: Assemble workspace call input with metadata from ConnectorConfig
    const connectorConfig = await prisma.connectorConfig.findFirst({
      where: { workspaceId, platform: "n8n" },
      select: { selectedTags: true, discoveryData: true },
    });

    const workspaceInput: WorkspaceInput = {
      automationSummaries: successful.map((s) => ({
        id: s.automationId,
        externalId: s.externalId,
        name: s.name,
        businessNarrative: s.result.businessNarrative,
        trigger: s.result.trigger,
        triggerType: s.result.triggerType,
        systemsTouched: s.result.systemsTouched,
        stepName: s.result.stepName,
        impact: {
          level: s.result.impact.level,
          failureScenario: s.result.impact.failureScenario,
          revenueConnection: s.result.impact.revenueConnection,
        },
        detectability: { level: s.result.detectability.level },
        timeSavingsEstimate: s.result.timeSavingsEstimate,
        revenueImpactEstimate: s.result.revenueImpactEstimate,
        errorRate: automations.find((a) => a.id === s.automationId)?.errorRate ?? null,
        runsPerWeek: automations.find((a) => a.id === s.automationId)?.runsPerWeek ?? null,
        isActive: automations.find((a) => a.id === s.automationId)?.status === "active",
      })),
      workflowJsons: successful.map((s) => ({
        externalId: s.externalId,
        json: automations.find((a) => a.id === s.automationId)?.rawWorkflowJson,
      })),
      metadata: extractMetadata(connectorConfig),
    };

    // Step 11: Run workspace LLM call
    let wsResult: WorkspaceResult;
    try {
      wsResult = await analyzeWorkspace(workspaceInput);
    } catch (err) {
      await prisma.companyProfile.update({
        where: { workspaceId },
        data: { analysisStatus: "failed" },
      });
      return {
        error: `Workspace analysis failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    // Step 12: Create BusinessProcess records and link automations
    const processMap = new Map<string, string>(); // process name → process id
    for (let i = 0; i < wsResult.processes.length; i++) {
      const proc = wsResult.processes[i];
      const created = await prisma.businessProcess.create({
        data: {
          workspaceId,
          name: proc.name,
          summary: proc.summary,
          maturityLevel: proc.maturityLevel,
          valueAtStake: proc.valueAtStake,
          steps: proc.steps as unknown as Prisma.InputJsonValue,
          order: i,
        },
      });
      processMap.set(proc.name.toLowerCase(), created.id);

      // Link automations to this process via steps[].automationExternalId
      for (const step of proc.steps) {
        if (step.automationExternalId) {
          const matchingAuto = automations.find(
            (a) => a.externalId === step.automationExternalId,
          );
          if (matchingAuto) {
            await prisma.automation.update({
              where: { id: matchingAuto.id },
              data: { processId: created.id },
            });
          }
        }
      }
    }

    // Create ProcessSuggestion records
    const processSuggestionMap = new Map<string, string>(); // suggestion name → id
    for (const suggestion of wsResult.processSuggestions) {
      const created = await prisma.processSuggestion.create({
        data: {
          workspaceId,
          name: suggestion.name,
          description: suggestion.description,
          basedOn: suggestion.basedOn,
          businessCase: suggestion.businessCase,
          connectedSystems: suggestion.connectedSystems,
        },
      });
      processSuggestionMap.set(suggestion.name.toLowerCase(), created.id);
    }

    // Create Recommendation records with priority ordering and linkage
    // Build set of valid automation IDs for FK validation
    const validAutomationIds = new Set(automations.map((a) => a.id));

    // Sort: Act Now first, then Investigate, then Explore (preserving LLM order within tiers)
    const sortedRecs = [...wsResult.recommendations].sort(
      (a, b) => tierPriority(a.tier) - tierPriority(b.tier),
    );

    for (let i = 0; i < sortedRecs.length; i++) {
      const rec = sortedRecs[i];

      // Link to process via processName (primary), then affectedScope fallback, then automationId
      let processId: string | undefined;

      // Primary: match on processName (LLM should output exact process name)
      if (rec.processName) {
        processId = processMap.get(rec.processName.toLowerCase());

        // If processName doesn't match existing process, create a new one
        // (LLM recommends a new business process)
        if (!processId) {
          const newProcess = await prisma.businessProcess.create({
            data: {
              workspaceId,
              name: rec.processName,
              summary: `New process identified from recommendation: ${rec.name}`,
              order: processMap.size,
            },
          });
          processId = newProcess.id;
          processMap.set(rec.processName.toLowerCase(), newProcess.id);
        }
      }

      // Fallback: match on affectedScope
      if (!processId && rec.affectedScope) {
        processId = processMap.get(rec.affectedScope.toLowerCase());
        if (!processId) {
          const scopeLower = rec.affectedScope.toLowerCase();
          for (const [procName, procId] of processMap) {
            if (scopeLower.includes(procName) || procName.includes(scopeLower)) {
              processId = procId;
              break;
            }
          }
        }
      }

      // Last resort: derive from automationId's process
      if (!processId && rec.automationId && validAutomationIds.has(rec.automationId)) {
        const targetAuto = automations.find((a) => a.id === rec.automationId);
        if (targetAuto?.processId) {
          processId = targetAuto.processId;
        }
      }

      // Link to process suggestion by matching child recommendation names
      let processSuggestionId: string | undefined;
      for (const [sugName, sugId] of processSuggestionMap) {
        const suggestion = wsResult.processSuggestions.find(
          (s) => s.name.toLowerCase() === sugName,
        );
        if (
          suggestion?.childRecommendationNames.some(
            (n) => n.toLowerCase() === rec.name.toLowerCase(),
          )
        ) {
          processSuggestionId = sugId;
          break;
        }
      }

      await prisma.recommendation.create({
        data: {
          workspaceId,
          processId: processId ?? null,
          processSuggestionId: processSuggestionId ?? null,
          type: rec.type,
          tier: rec.tier,
          name: rec.name,
          brief: rec.brief,
          businessCase: rec.businessCase,
          evidence: {
            chain: rec.evidenceChain,
          } as unknown as Prisma.InputJsonValue,
          confidence: rec.confidence,
          honestFraming: rec.honestFraming,
          implementationNotes: rec.implementationNotes,
          impactEstimate: rec.impactEstimate,
          affectedScope: rec.affectedScope,
          suggestedPlatform: rec.systemSource ?? null,
          systemSource: rec.systemSource ?? null,
          systemDestination: rec.systemDestination ?? null,
          stepName: rec.stepName ?? null,
          automationId:
            rec.automationId && validAutomationIds.has(rec.automationId)
              ? rec.automationId
              : null,
          priorityOrder: i,
        },
      });
    }

    // Step 16: Resolve connected automations (deterministic + LLM merge)
    const automationConnections: AutomationConnection[] = automations.map((a) => ({
      automationId: a.id,
      externalId: a.externalId,
      rawWorkflowJson: a.rawWorkflowJson,
    }));

    const deterministicConnections = resolveDeterministicConnections(automationConnections);
    const llmConnections = mergeLlmConnections(
      automationConnections,
      wsResult.connectedAutomations,
    );
    const mergedConnections = mergeConnectionUpdates(deterministicConnections, llmConnections);

    for (const update of mergedConnections) {
      await prisma.automation.update({
        where: { id: update.automationId },
        data: {
          upstreamIds: update.upstreamIds,
          downstreamIds: update.downstreamIds,
        },
      });
    }

    // Step 17: Update CompanyProfile
    await prisma.companyProfile.update({
      where: { workspaceId },
      data: {
        systemLandscape: wsResult.systemLandscape as unknown as Prisma.InputJsonValue,
        nextMoveText: wsResult.nextMove.text,
        nextMoveReasoning: wsResult.nextMove.reasoning,
        aggregateEstimates: wsResult.aggregateEstimates as unknown as Prisma.InputJsonValue,
        analyzedAt: new Date(),
        analysisStatus: "complete",
      },
    });

    // Step 18: Generate delta summary if re-sync
    if (previousSnapshot) {
      const currentAutomations = await prisma.automation.findMany({
        where: { workspaceId, isRemoved: false },
        select: {
          id: true,
          name: true,
          errorRate: true,
          isRemoved: true,
          runsPerWeek: true,
          updatedAt: true,
          status: true,
        },
      });
      const currentRecommendations = await prisma.recommendation.findMany({
        where: { workspaceId },
        select: { id: true, name: true, type: true, tier: true },
      });
      const currentProcessCount = await prisma.businessProcess.count({
        where: { workspaceId },
      });

      const currentSnapshot = captureSnapshot({
        analyzedAt: new Date(),
        automations: currentAutomations.map((a) => ({
          ...a,
          isActive: a.status === "active",
        })),
        recommendations: currentRecommendations,
        processCount: currentProcessCount,
      });

      const deltaSummary = generateDeltaSummary(previousSnapshot, currentSnapshot);

      if (deltaSummary) {
        await prisma.companyProfile.update({
          where: { workspaceId },
          data: { deltaSummary },
        });
      }
    }

    return { success: true };
  } catch (error) {
    // On any unhandled error, set analysisStatus to failed
    await prisma.companyProfile.update({
      where: { workspaceId },
      data: { analysisStatus: "failed" },
    });
    return {
      error: `Analysis pipeline failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
