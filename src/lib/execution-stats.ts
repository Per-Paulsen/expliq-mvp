export interface ExecutionRecord {
  id: number;
  status: string;
  startedAt: string;
  stoppedAt: string | null;
  mode: string;
}

export interface ExecutionStats {
  runsPerWeek: number | null;
  errorRate: number | null;
  lastExecutedAt: Date | null;
  avgDurationMs: number | null;
}

const FAILED_STATUSES = new Set(["error", "crashed", "canceled"]);
const TERMINAL_STATUSES = new Set(["success", "error", "crashed", "canceled"]);
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function computeExecutionStats(
  executions: ExecutionRecord[]
): ExecutionStats {
  if (executions.length === 0) {
    return {
      runsPerWeek: null,
      errorRate: null,
      lastExecutedAt: null,
      avgDurationMs: null,
    };
  }

  // Sort by startedAt descending to find the most recent first
  const sorted = [...executions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  const mostRecentDate = new Date(sorted[0].startedAt);
  const windowStart = new Date(mostRecentDate.getTime() - SEVEN_DAYS_MS);

  // runsPerWeek: count executions within the 7-day window from the most recent
  const runsPerWeek = sorted.filter(
    (e) => new Date(e.startedAt) >= windowStart
  ).length;

  // lastExecutedAt: the most recent startedAt
  const lastExecutedAt = mostRecentDate;

  // errorRate: ratio of failed to terminal executions
  const terminalExecutions = executions.filter((e) =>
    TERMINAL_STATUSES.has(e.status)
  );
  const errorRate =
    terminalExecutions.length === 0
      ? null
      : terminalExecutions.filter((e) => FAILED_STATUSES.has(e.status)).length /
        terminalExecutions.length;

  // avgDurationMs: average duration of executions with both startedAt and stoppedAt
  const durableExecutions = executions.filter((e) => e.stoppedAt !== null);
  let avgDurationMs: number | null = null;
  if (durableExecutions.length > 0) {
    const totalMs = durableExecutions.reduce((sum, e) => {
      return (
        sum +
        (new Date(e.stoppedAt!).getTime() - new Date(e.startedAt).getTime())
      );
    }, 0);
    avgDurationMs = totalMs / durableExecutions.length;
  }

  return {
    runsPerWeek,
    errorRate,
    lastExecutedAt,
    avgDurationMs,
  };
}
