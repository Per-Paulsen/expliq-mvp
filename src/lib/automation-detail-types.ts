// TODO: Epic 10 — R1 detail types trimmed. R2 detail view will define its own
// richer types based on new schema fields (businessNarrative, impact Json, etc.)
import type { GovernanceSignals, RiskLevel } from "@/lib/risk-engine";

export interface AutomationDetail {
  id: string;
  name: string | null;
  platform: string;
  status: string;
  effectiveStatus: string;
  effectiveImpact: string | null;
  riskLevel: RiskLevel;
  signals: GovernanceSignals;
  automationLastUpdated: string | null;
  externalId: string;
  n8nWorkflowUrl: string | null;
}

/** @deprecated R1 edit form — fields removed in Epic 10 */
export interface EditFormState {
  owner: string;
  impactOverride: string;
  reviewCadenceDays: number;
  statusOverride: string;
}
