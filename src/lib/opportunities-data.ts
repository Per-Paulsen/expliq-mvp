import { prisma } from "@/lib/prisma";

// ── Types ───────────────────────────────────────────────

export interface OpportunityRecommendation {
  id: string;
  name: string;
  brief: string;
  tier: "act-now" | "investigate" | "explore";
  confidence: string | null;
  impactEstimate: string;
  affectedScope: string | null;
  processName: string | null;
  processId: string | null;
  automationId: string | null;
  type: string;
  // Detail fields for slide-over
  businessCase: string | null;
  evidenceChain: string | null;
  honestFraming: string | null;
  implementationNotes: string | null;
  systemSource: string | null;
  systemDestination: string | null;
  deployableJson: unknown;
}

export interface OpportunityProcessSuggestion {
  id: string;
  name: string;
  description: string | null;
  recommendations: OpportunityRecommendation[];
}

export interface OpportunitiesData {
  actNow: OpportunityRecommendation[];
  investigate: OpportunityRecommendation[];
  explore: OpportunityRecommendation[];
  processSuggestions: OpportunityProcessSuggestion[];
}

// ── Helpers ─────────────────────────────────────────────

function normalizeTier(tier: string): "act-now" | "investigate" | "explore" {
  return tier.toLowerCase().replace(/\s+/g, "-") as
    | "act-now"
    | "investigate"
    | "explore";
}

function extractEvidenceChain(evidence: unknown): string | null {
  return (evidence as { chain?: string } | null)?.chain ?? null;
}

function mapRecommendation(
  rec: {
    id: string;
    name: string;
    brief: string | null;
    tier: string;
    confidence: string | null;
    impactEstimate: string | null;
    affectedScope: string | null;
    processId: string | null;
    automationId: string | null;
    type: string;
    businessCase: string | null;
    evidence: unknown;
    honestFraming: string | null;
    implementationNotes: string | null;
    systemSource: string | null;
    systemDestination: string | null;
    deployableJson: unknown;
    process: { name: string } | null;
  },
): OpportunityRecommendation {
  return {
    id: rec.id,
    name: rec.name,
    brief: rec.brief ?? "",
    tier: normalizeTier(rec.tier),
    confidence: rec.confidence,
    impactEstimate: rec.impactEstimate ?? "",
    affectedScope: rec.affectedScope,
    processName: rec.process?.name ?? null,
    processId: rec.processId,
    automationId: rec.automationId,
    type: rec.type,
    businessCase: rec.businessCase,
    evidenceChain: extractEvidenceChain(rec.evidence),
    honestFraming: rec.honestFraming,
    implementationNotes: rec.implementationNotes,
    systemSource: rec.systemSource,
    systemDestination: rec.systemDestination,
    deployableJson: rec.deployableJson,
  };
}

// ── Main data function ──────────────────────────────────

export async function prepareOpportunitiesData(
  workspaceId: string,
): Promise<OpportunitiesData> {
  const [recommendations, processSuggestions] = await Promise.all([
    prisma.recommendation.findMany({
      where: { workspaceId },
      orderBy: { priorityOrder: "asc" },
      include: {
        process: { select: { name: true } },
      },
    }),
    prisma.processSuggestion.findMany({
      where: { workspaceId },
      include: {
        recommendations: {
          orderBy: { priorityOrder: "asc" },
          include: {
            process: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const mapped = recommendations.map(mapRecommendation);

  const actNow = mapped.filter((r) => r.tier === "act-now");
  const investigate = mapped.filter((r) => r.tier === "investigate");
  const explore = mapped.filter((r) => r.tier === "explore");

  const mappedSuggestions: OpportunityProcessSuggestion[] =
    processSuggestions.map((ps) => ({
      id: ps.id,
      name: ps.name,
      description: ps.description,
      recommendations: ps.recommendations.map(mapRecommendation),
    }));

  return {
    actNow,
    investigate,
    explore,
    processSuggestions: mappedSuggestions,
  };
}
