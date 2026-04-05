// TODO: Epic 10 — R1 snapshot metrics trimmed. R2 dashboard will compute
// process-centric metrics from CompanyProfile.
import type { SnapshotAutomation, SnapshotMetrics } from "@/lib/snapshot-types";

export function computeSnapshotMetrics(
  automations: SnapshotAutomation[]
): SnapshotMetrics {
  let highImpactCount = 0;
  let highRiskCount = 0;

  for (const a of automations) {
    if (a.impactLevel === "critical" || a.impactLevel === "high") {
      highImpactCount++;
    }
    if (a.riskLevel === "high") {
      highRiskCount++;
    }
  }

  return {
    totalAutomations: automations.length,
    highImpactCount,
    highRiskCount,
  };
}

export function getRecentlyChanged(
  automations: SnapshotAutomation[],
  days = 7
): SnapshotAutomation[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return automations
    .filter(
      (a) => a.automationLastUpdated !== null && a.automationLastUpdated >= cutoff
    )
    .sort(
      (a, b) =>
        b.automationLastUpdated!.getTime() - a.automationLastUpdated!.getTime()
    );
}

/** @deprecated R1 multi-system relied on systemsTouched — removed in Epic 10 */
export function getMultiSystemAutomations(
  _automations: SnapshotAutomation[],
  _minSystems = 3
): SnapshotAutomation[] {
  return [];
}
