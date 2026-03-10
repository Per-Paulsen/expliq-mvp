import type { GovernanceSignals, RiskLevel } from "@/lib/risk-engine";

export interface AutomationDetail {
  id: string;
  name: string | null;
  description: string | null;
  platform: string;
  status: string;
  statusOverride: string | null;
  effectiveStatus: string;
  owner: string | null;
  systemsTouched: string[];
  trigger: string | null;
  triggerType: string | null;
  coreLogic: string | null;
  dataTypes: string[];
  sideEffects: string[];
  businessContext: string | null;
  impactProposal: string | null;
  impactOverride: string | null;
  effectiveImpact: string | null;
  impactReasoning: string | null;
  riskLevel: RiskLevel;
  signals: GovernanceSignals;
  reviewCadenceDays: number;
  lastReviewDate: string | null;
  automationLastUpdated: string | null;
  documentationLastUpdated: string | null;
  externalId: string;
  n8nWorkflowUrl: string | null;
}

export interface EditFormState {
  owner: string;
  impactOverride: string;
  reviewCadenceDays: number;
  statusOverride: string;
}
