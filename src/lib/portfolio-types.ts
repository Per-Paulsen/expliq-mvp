// TODO: Epic 10 — R1 portfolio types trimmed. R2 portfolio/dashboard views
// will define new types based on process-centric data model.
import type { GovernanceSignals } from "@/lib/risk-engine";

export type { GovernanceSignals };

export interface PortfolioAutomation {
  id: string;
  name: string | null;
  platform: string;
  status: string;
  impactLevel: string | null;
  riskLevel: "high" | "medium" | "low";
  signals: GovernanceSignals;
  automationLastUpdated: string | null;
}

export interface PortfolioFilters {
  search: string;
  systems: string[];
  platforms: string[];
  owners: string[];
  attention: string[];
  impact: string[];
  risk: string[];
  sort: "automationLastUpdated" | "name";
  order: "asc" | "desc";
  updatedAfter: string | null;
  minSystems: number | null;
}

export interface GlobalCounts {
  systems: Map<string, number>;
  platforms: Map<string, number>;
  owners: Map<string, number>;
  attention: Map<string, number>;
  impact: Map<string, number>;
  risk: Map<string, number>;
}

export const ATTENTION_SIGNAL_MAP: Record<string, keyof GovernanceSignals> = {
  "no-owner": "noOwnerAssigned",
  "documentation-outdated": "documentationOutdated",
  "automation-stale": "automationStale",
  "overdue-review": "overdueReview",
};

export const ATTENTION_LABELS: Record<string, string> = {
  "no-owner": "No owner assigned",
  "documentation-outdated": "Documentation outdated",
  "automation-stale": "Automation stale",
  "overdue-review": "Overdue review",
};
