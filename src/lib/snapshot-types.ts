import type { GovernanceSignals, RiskLevel, SystemExposure, OwnerExposure } from "@/lib/risk-engine";

export interface SnapshotMetrics {
  totalAutomations: number;
  highImpactCount: number;
  highRiskCount: number;
  missingOwnersCount: number;
  overdueReviewsCount: number;
}

export interface SnapshotAutomation {
  id: string;
  name: string | null;
  owner: string | null;
  systemsTouched: string[];
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
