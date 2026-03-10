import type { SnapshotAutomation, SnapshotMetrics } from "@/lib/snapshot-types";

export function computeSnapshotMetrics(
  automations: SnapshotAutomation[]
): SnapshotMetrics {
  let highImpactCount = 0;
  let highRiskCount = 0;
  let missingOwnersCount = 0;
  let overdueReviewsCount = 0;

  for (const a of automations) {
    if (a.impactLevel === "critical" || a.impactLevel === "high") {
      highImpactCount++;
    }
    if (a.riskLevel === "high") {
      highRiskCount++;
    }
    if (a.owner === null) {
      missingOwnersCount++;
    }
    if (a.signals.overdueReview) {
      overdueReviewsCount++;
    }
  }

  return {
    totalAutomations: automations.length,
    highImpactCount,
    highRiskCount,
    missingOwnersCount,
    overdueReviewsCount,
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

export function getMultiSystemAutomations(
  automations: SnapshotAutomation[],
  minSystems = 3
): SnapshotAutomation[] {
  return automations
    .filter((a) => a.systemsTouched.length >= minSystems)
    .sort((a, b) => b.systemsTouched.length - a.systemsTouched.length);
}
