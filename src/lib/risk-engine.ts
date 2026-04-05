// Risk Engine V2 — Governance Dot computation (Epic 11)
// Pure functions only — no DB calls, no Prisma imports.

import type { Automation } from "@/generated/prisma/client";

// ── R2 Governance Dot ──────────────────────────────────

export type GovernanceDot = "healthy" | "attention" | "critical";

export interface GovernanceDotInput {
  errorRate: number | null;
  isActive: boolean;
  impact: { level: string } | null;
  detectability: { level: string } | null;
  lastExecutedAt: Date | null;
  rawWorkflowJson: unknown;
}

function hasErrorWorkflow(rawWorkflowJson: unknown): boolean {
  if (
    rawWorkflowJson != null &&
    typeof rawWorkflowJson === "object" &&
    "settings" in rawWorkflowJson
  ) {
    const settings = (rawWorkflowJson as Record<string, unknown>).settings;
    if (
      settings != null &&
      typeof settings === "object" &&
      "errorWorkflow" in settings
    ) {
      const val = (settings as Record<string, unknown>).errorWorkflow;
      return typeof val === "string" && val.length > 0;
    }
  }
  return false;
}

export function computeGovernanceDot(input: GovernanceDotInput): GovernanceDot {
  // ── Critical (red) — check first, highest priority ──
  if (input.isActive && input.errorRate != null && input.errorRate > 0.20) {
    return "critical";
  }
  if (
    input.impact?.level === "critical" &&
    input.detectability?.level === "silent"
  ) {
    return "critical";
  }

  // ── Attention (amber) ──
  if (
    input.isActive &&
    input.errorRate != null &&
    input.errorRate >= 0.05 &&
    input.errorRate <= 0.20
  ) {
    return "attention";
  }
  if (!input.isActive && input.lastExecutedAt != null) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (input.lastExecutedAt >= thirtyDaysAgo) {
      return "attention";
    }
  }
  if (
    (input.impact?.level === "critical" || input.impact?.level === "high") &&
    !hasErrorWorkflow(input.rawWorkflowJson)
  ) {
    return "attention";
  }

  // ── Healthy (green) — everything else ──
  return "healthy";
}

// ── R1 Stubs (preserved for backward compatibility) ────

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

export function getEffectiveStatus(automation: Automation): string {
  return automation.status;
}

export function getEffectiveImpact(
  _automation: Automation,
): string | null {
  return null;
}

export function getActiveSignalCount(signals: GovernanceSignals): number {
  return Object.values(signals).filter(Boolean).length;
}

export function getGovernanceSignals(_automation: Automation): GovernanceSignals {
  return {
    documentationOutdated: false,
    automationStale: false,
    overdueReview: false,
    noOwnerAssigned: false,
    inactive: false,
  };
}

export function getRiskLevel(_automation: Automation): RiskLevel {
  return "low";
}

export async function getSystemExposure(
  _workspaceId: string,
): Promise<SystemExposure[]> {
  return [];
}

export async function getOwnerExposure(
  _workspaceId: string,
): Promise<OwnerExposure[]> {
  return [];
}
