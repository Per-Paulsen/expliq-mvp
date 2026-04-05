import {
  computeExecutionStats,
  type ExecutionRecord,
} from "@/lib/execution-stats";

// Fixed reference point to avoid flaky date-relative tests
const REF = new Date("2026-03-15T12:00:00.000Z");

function daysAgo(days: number): string {
  return new Date(REF.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function makeExecution(
  overrides: Partial<ExecutionRecord> & { id: number }
): ExecutionRecord {
  return {
    status: "success",
    startedAt: REF.toISOString(),
    stoppedAt: new Date(REF.getTime() + 5000).toISOString(),
    mode: "trigger",
    ...overrides,
  };
}

describe("computeExecutionStats", () => {
  it("returns all null for an empty array", () => {
    const result = computeExecutionStats([]);
    expect(result).toEqual({
      runsPerWeek: null,
      errorRate: null,
      lastExecutedAt: null,
      avgDurationMs: null,
    });
  });

  it("computes stats for a single successful execution", () => {
    const started = REF.toISOString();
    const stopped = new Date(REF.getTime() + 3000).toISOString();

    const result = computeExecutionStats([
      makeExecution({ id: 1, startedAt: started, stoppedAt: stopped }),
    ]);

    expect(result.runsPerWeek).toBe(1);
    expect(result.errorRate).toBe(0);
    expect(result.lastExecutedAt).toEqual(REF);
    expect(result.avgDurationMs).toBe(3000);
  });

  it("computes correct errorRate for mixed success/error", () => {
    const executions: ExecutionRecord[] = [
      makeExecution({ id: 1, status: "success", startedAt: daysAgo(0) }),
      makeExecution({ id: 2, status: "success", startedAt: daysAgo(1) }),
      makeExecution({ id: 3, status: "success", startedAt: daysAgo(2) }),
      makeExecution({ id: 4, status: "error", startedAt: daysAgo(3) }),
    ];

    const result = computeExecutionStats(executions);
    expect(result.errorRate).toBe(0.25);
  });

  it("returns errorRate = 1.0 when all executions are errors", () => {
    const executions: ExecutionRecord[] = [
      makeExecution({ id: 1, status: "error", startedAt: daysAgo(0) }),
      makeExecution({ id: 2, status: "crashed", startedAt: daysAgo(1) }),
      makeExecution({ id: 3, status: "canceled", startedAt: daysAgo(2) }),
    ];

    const result = computeExecutionStats(executions);
    expect(result.errorRate).toBe(1.0);
  });

  it("only counts last 7 days from most recent for runsPerWeek", () => {
    const executions: ExecutionRecord[] = [
      makeExecution({ id: 1, startedAt: daysAgo(0) }), // within window
      makeExecution({ id: 2, startedAt: daysAgo(3) }), // within window
      makeExecution({ id: 3, startedAt: daysAgo(6) }), // within window
      makeExecution({ id: 4, startedAt: daysAgo(10) }), // outside window
      makeExecution({ id: 5, startedAt: daysAgo(20) }), // outside window
    ];

    const result = computeExecutionStats(executions);
    expect(result.runsPerWeek).toBe(3);
    expect(result.lastExecutedAt).toEqual(new Date(daysAgo(0)));
  });

  it("excludes executions with null stoppedAt from avgDurationMs", () => {
    const executions: ExecutionRecord[] = [
      makeExecution({
        id: 1,
        startedAt: daysAgo(0),
        stoppedAt: new Date(
          new Date(daysAgo(0)).getTime() + 4000
        ).toISOString(),
      }),
      makeExecution({
        id: 2,
        startedAt: daysAgo(1),
        stoppedAt: null, // still running
        status: "running",
      }),
      makeExecution({
        id: 3,
        startedAt: daysAgo(2),
        stoppedAt: new Date(
          new Date(daysAgo(2)).getTime() + 6000
        ).toISOString(),
      }),
    ];

    const result = computeExecutionStats(executions);
    // avgDurationMs should only include id=1 (4000ms) and id=3 (6000ms)
    expect(result.avgDurationMs).toBe(5000);
    // runsPerWeek still counts all 3
    expect(result.runsPerWeek).toBe(3);
    // lastExecutedAt is the most recent
    expect(result.lastExecutedAt).toEqual(new Date(daysAgo(0)));
  });

  it("returns errorRate null when only non-terminal statuses present", () => {
    const executions: ExecutionRecord[] = [
      makeExecution({
        id: 1,
        status: "running",
        startedAt: daysAgo(0),
        stoppedAt: null,
      }),
      makeExecution({
        id: 2,
        status: "waiting",
        startedAt: daysAgo(1),
        stoppedAt: null,
      }),
    ];

    const result = computeExecutionStats(executions);
    expect(result.errorRate).toBeNull();
    // Other stats still computed
    expect(result.runsPerWeek).toBe(2);
    expect(result.lastExecutedAt).toEqual(new Date(daysAgo(0)));
    expect(result.avgDurationMs).toBeNull();
  });

  it("computes duration in milliseconds correctly", () => {
    const start = "2026-03-15T10:00:00.000Z";
    const stop = "2026-03-15T10:02:30.500Z"; // 2 min 30.5 sec = 150500ms

    const result = computeExecutionStats([
      makeExecution({ id: 1, startedAt: start, stoppedAt: stop }),
    ]);

    expect(result.avgDurationMs).toBe(150500);
  });

  it("averages varied durations correctly", () => {
    const executions: ExecutionRecord[] = [
      makeExecution({
        id: 1,
        startedAt: "2026-03-15T10:00:00.000Z",
        stoppedAt: "2026-03-15T10:00:01.000Z", // 1000ms
      }),
      makeExecution({
        id: 2,
        startedAt: "2026-03-15T10:00:00.000Z",
        stoppedAt: "2026-03-15T10:00:05.000Z", // 5000ms
      }),
      makeExecution({
        id: 3,
        startedAt: "2026-03-15T10:00:00.000Z",
        stoppedAt: "2026-03-15T10:00:09.000Z", // 9000ms
      }),
    ];

    const result = computeExecutionStats(executions);
    // (1000 + 5000 + 9000) / 3 = 5000
    expect(result.avgDurationMs).toBe(5000);
  });

  it("returns avgDurationMs null when all stoppedAt are null", () => {
    const executions: ExecutionRecord[] = [
      makeExecution({ id: 1, stoppedAt: null, status: "running" }),
      makeExecution({ id: 2, stoppedAt: null, status: "running" }),
    ];

    const result = computeExecutionStats(executions);
    expect(result.avgDurationMs).toBeNull();
  });

  it("handles exactly-7-day boundary as inclusive", () => {
    // Execution at exactly 7 days ago from most recent should be included
    // (>= windowStart)
    const executions: ExecutionRecord[] = [
      makeExecution({ id: 1, startedAt: daysAgo(0) }),
      makeExecution({ id: 2, startedAt: daysAgo(7) }), // exactly at boundary
    ];

    const result = computeExecutionStats(executions);
    expect(result.runsPerWeek).toBe(2);
  });

  it("handles mixed terminal and non-terminal for errorRate", () => {
    const executions: ExecutionRecord[] = [
      makeExecution({ id: 1, status: "success" }),
      makeExecution({ id: 2, status: "error" }),
      makeExecution({ id: 3, status: "running", stoppedAt: null }),
      makeExecution({ id: 4, status: "success" }),
      makeExecution({ id: 5, status: "waiting", stoppedAt: null }),
    ];

    const result = computeExecutionStats(executions);
    // Terminal: success(1), error(2), success(4) = 3 terminal, 1 failed
    expect(result.errorRate).toBeCloseTo(1 / 3);
  });
});
