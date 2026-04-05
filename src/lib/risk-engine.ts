// TODO: Epic 10 — R1 risk engine stubbed out. R2 replaces governance with
// process-centric analysis (CompanyProfile, BusinessProcess, Recommendation).
// These stubs preserve the module's public API so existing pages compile.

import type { Automation } from "@/generated/prisma/client";

// ── Constants (kept for backwards compat) ──────────────

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

// ── Stubbed Pure Functions (R1 fields removed from schema) ──

export function getEffectiveStatus(automation: Automation): string {
  return automation.status;
}

export function getEffectiveImpact(
  _automation: Automation,
): string | null {
  // R2 stores impact as Json — will be handled by new detail views
  return null;
}

export function getActiveSignalCount(signals: GovernanceSignals): number {
  return Object.values(signals).filter(Boolean).length;
}

export function getGovernanceSignals(_automation: Automation): GovernanceSignals {
  // R1 governance signals no longer computable — fields removed.
  // Returns all-false so downstream code (snapshot, portfolio) won't crash.
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

// ── Stubbed Data-Loading Functions ──────────────────────

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
