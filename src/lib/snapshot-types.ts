// TODO: Epic 10 — R1 snapshot types trimmed. R2 dashboard will define new types.
import type { GovernanceSignals, RiskLevel, SystemExposure, OwnerExposure } from "@/lib/risk-engine";

export interface SnapshotMetrics {
  totalAutomations: number;
  highImpactCount: number;
  highRiskCount: number;
}

export interface SnapshotAutomation {
  id: string;
  name: string | null;
  impactLevel: string | null;
  riskLevel: RiskLevel;
  signals: GovernanceSignals;
  automationLastUpdated: Date | null;
}

export interface SnapshotData {
  metrics: SnapshotMetrics;
  systemExposure: SystemExposure[];
  ownerExposure: OwnerExposure[];
  recentlyChanged: SnapshotAutomation[];
  multiSystem: SnapshotAutomation[];
  hasMoreRecentlyChanged: boolean;
  hasMoreMultiSystem: boolean;
}
