// ── Types ───────────────────────────────────────────────

export interface AutomationSnapshot {
  id: string;
  name: string | null;
  errorRate: number | null;
  isActive: boolean;
  runsPerWeek: number | null;
  updatedAt: Date;
}

export interface RecommendationSnapshot {
  id: string;
  name: string;
  type: string;
  tier: string;
}

export interface Snapshot {
  analyzedAt: Date;
  automationCount: number;
  activeCount: number;
  automations: AutomationSnapshot[];
  recommendationCount: number;
  recommendations: RecommendationSnapshot[];
  processCount: number;
}

export interface SnapshotInput {
  analyzedAt: Date;
  automations: Array<{
    id: string;
    name: string | null;
    errorRate: number | null;
    isActive: boolean;
    isRemoved: boolean;
    runsPerWeek: number | null;
    updatedAt: Date;
  }>;
  recommendations: Array<{
    id: string;
    name: string;
    type: string;
    tier: string;
  }>;
  processCount: number;
}

// ── Helpers ─────────────────────────────────────────────

function formatRelativeTime(from: Date, to: Date): string {
  const diffMs = to.getTime() - from.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays > 0) return `${diffDays} day${diffDays === 1 ? "" : "s"}`;
  if (diffHours > 0) return `${diffHours} hour${diffHours === 1 ? "" : "s"}`;
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"}`;
  return "moments";
}

function displayName(name: string | null): string {
  return name ?? "Unnamed workflow";
}

// ── Public functions ────────────────────────────────────

export function captureSnapshot(data: SnapshotInput): Snapshot {
  const liveAutomations = data.automations.filter((a) => !a.isRemoved);

  return {
    analyzedAt: data.analyzedAt,
    automationCount: liveAutomations.length,
    activeCount: liveAutomations.filter((a) => a.isActive).length,
    automations: liveAutomations.map((a) => ({
      id: a.id,
      name: a.name,
      errorRate: a.errorRate,
      isActive: a.isActive,
      runsPerWeek: a.runsPerWeek,
      updatedAt: a.updatedAt,
    })),
    recommendationCount: data.recommendations.length,
    recommendations: data.recommendations.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      tier: r.tier,
    })),
    processCount: data.processCount,
  };
}

export function generateDeltaSummary(
  previous: Snapshot | null,
  current: Snapshot
): string | null {
  if (!previous) return null;

  const changes: string[] = [];

  const prevIds = new Set(previous.automations.map((a) => a.id));
  const currIds = new Set(current.automations.map((a) => a.id));

  // New workflows
  const newWorkflows = current.automations.filter((a) => !prevIds.has(a.id));
  if (newWorkflows.length > 0) {
    changes.push(
      `+${newWorkflows.length} new workflow${newWorkflows.length === 1 ? "" : "s"} detected`
    );
  }

  // Removed workflows
  const removedWorkflows = previous.automations.filter((a) => !currIds.has(a.id));
  if (removedWorkflows.length > 0) {
    changes.push(
      `${removedWorkflows.length} workflow${removedWorkflows.length === 1 ? "" : "s"} removed`
    );
  }

  // Metric changes on matching automations
  const prevMap = new Map(previous.automations.map((a) => [a.id, a]));
  for (const curr of current.automations) {
    const prev = prevMap.get(curr.id);
    if (!prev) continue;

    // Error rate changes (> 5 percentage points)
    if (
      prev.errorRate !== null &&
      curr.errorRate !== null &&
      Math.abs(curr.errorRate - prev.errorRate) > 5
    ) {
      const direction = curr.errorRate < prev.errorRate ? "improved" : "worsened";
      changes.push(
        `${displayName(curr.name)} error rate ${direction} ${Math.round(prev.errorRate)}% → ${Math.round(curr.errorRate)}%`
      );
    }

    // Active/inactive toggle
    if (prev.isActive !== curr.isActive) {
      changes.push(
        `${displayName(curr.name)} now ${curr.isActive ? "active" : "inactive"}`
      );
    }
  }

  // Recommendation changes
  const prevRecNames = new Set(previous.recommendations.map((r) => r.name));
  const currRecNames = new Set(current.recommendations.map((r) => r.name));

  const newRecs = current.recommendations.filter((r) => !prevRecNames.has(r.name));
  const resolvedRecs = previous.recommendations.filter((r) => !currRecNames.has(r.name));

  if (newRecs.length > 0) {
    changes.push(
      `${newRecs.length} new recommendation${newRecs.length === 1 ? "" : "s"}`
    );
  }
  if (resolvedRecs.length > 0) {
    changes.push(
      `${resolvedRecs.length} recommendation${resolvedRecs.length === 1 ? "" : "s"} resolved`
    );
  }

  if (changes.length === 0) {
    const elapsed = formatRelativeTime(previous.analyzedAt, current.analyzedAt);
    return `Since last analysis (${elapsed} ago): no changes detected.`;
  }

  const elapsed = formatRelativeTime(previous.analyzedAt, current.analyzedAt);
  return `Since last analysis (${elapsed} ago): ${changes.join(", ")}.`;
}
