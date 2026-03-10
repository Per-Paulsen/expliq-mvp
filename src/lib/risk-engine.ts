import { prisma } from "@/lib/prisma";
import type { Automation } from "@/generated/prisma/client";

// ── Constants ───────────────────────────────────────────

export const STALE_THRESHOLD_DAYS = 14;

export const IMPACT_WEIGHTS: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const RISK_WEIGHTS: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

// ── Types ───────────────────────────────────────────────

export interface GovernanceSignals {
  documentationOutdated: boolean;
  automationStale: boolean;
  overdueReview: boolean;
  noOwnerAssigned: boolean;
  inactive: boolean;
}

export type RiskLevel = "high" | "medium" | "low";

export interface SystemExposure {
  system: string;
  exposureScore: number;
  automationCount: number;
}

export interface OwnerExposure {
  owner: string;
  exposureScore: number;
  automationCount: number;
}

// ── Pure Functions ──────────────────────────────────────

export function getEffectiveStatus(automation: Automation): string {
  return automation.statusOverride ?? automation.status;
}

export function getEffectiveImpact(
  automation: Automation,
): string | null {
  return automation.impactOverride ?? automation.impactProposal ?? null;
}

export function getActiveSignalCount(signals: GovernanceSignals): number {
  return Object.values(signals).filter(Boolean).length;
}

export function getGovernanceSignals(automation: Automation): GovernanceSignals {
  const now = new Date();

  const documentationOutdated =
    automation.documentationLastUpdated === null ||
    (automation.automationLastUpdated !== null &&
      automation.automationLastUpdated > automation.documentationLastUpdated);

  const automationStale =
    automation.automationLastUpdated !== null &&
    automation.automationLastUpdated.getTime() <
      now.getTime() - STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

  const overdueReview =
    automation.lastReviewDate === null ||
    automation.lastReviewDate.getTime() +
      automation.reviewCadenceDays * 24 * 60 * 60 * 1000 <
      now.getTime();

  const noOwnerAssigned = automation.owner === null;

  const effectiveStatus = getEffectiveStatus(automation);
  const inactive = effectiveStatus === "inactive";

  return {
    documentationOutdated,
    automationStale,
    overdueReview,
    noOwnerAssigned,
    inactive,
  };
}

export function getRiskLevel(automation: Automation): RiskLevel {
  const signals = getGovernanceSignals(automation);
  const count = getActiveSignalCount(signals);

  // High: 3+ signals, OR (noOwner AND docOutdated), OR (inactive AND any other signal)
  if (count >= 3) return "high";
  if (signals.noOwnerAssigned && signals.documentationOutdated) return "high";
  if (signals.inactive && count > 1) return "high";

  // Medium: 1-2 active signals
  if (count >= 1) return "medium";

  // Low: 0 active signals
  return "low";
}

// ── Data-Loading Functions ──────────────────────────────

function computeExposure(automation: Automation): number {
  const effectiveImpact = getEffectiveImpact(automation);
  const impactWeight = effectiveImpact
    ? (IMPACT_WEIGHTS[effectiveImpact] ?? 1)
    : 1;
  const riskLevel = getRiskLevel(automation);
  const riskWeight = RISK_WEIGHTS[riskLevel];
  return impactWeight * riskWeight;
}

export async function getSystemExposure(
  workspaceId: string,
): Promise<SystemExposure[]> {
  const automations = await prisma.automation.findMany({
    where: { workspaceId, status: { not: "removed" } },
  });

  const systemMap = new Map<string, { exposureScore: number; automationCount: number }>();

  for (const automation of automations) {
    const exposure = computeExposure(automation);
    for (const system of automation.systemsTouched) {
      const existing = systemMap.get(system);
      if (existing) {
        existing.exposureScore += exposure;
        existing.automationCount += 1;
      } else {
        systemMap.set(system, { exposureScore: exposure, automationCount: 1 });
      }
    }
  }

  return Array.from(systemMap.entries())
    .map(([system, data]) => ({ system, ...data }))
    .sort((a, b) => b.exposureScore - a.exposureScore);
}

export async function getOwnerExposure(
  workspaceId: string,
): Promise<OwnerExposure[]> {
  const automations = await prisma.automation.findMany({
    where: { workspaceId, status: { not: "removed" } },
  });

  const ownerMap = new Map<string, { exposureScore: number; automationCount: number }>();

  for (const automation of automations) {
    const owner = automation.owner ?? "Unassigned";
    const exposure = computeExposure(automation);
    const existing = ownerMap.get(owner);
    if (existing) {
      existing.exposureScore += exposure;
      existing.automationCount += 1;
    } else {
      ownerMap.set(owner, { exposureScore: exposure, automationCount: 1 });
    }
  }

  return Array.from(ownerMap.entries())
    .map(([owner, data]) => ({ owner, ...data }))
    .sort((a, b) => b.exposureScore - a.exposureScore);
}
