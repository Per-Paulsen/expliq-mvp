import { describe, it, expect } from "vitest";
import {
  captureSnapshot,
  generateDeltaSummary,
} from "@/lib/delta-generation";
import type {
  Snapshot,
  SnapshotInput,
  AutomationSnapshot,
  RecommendationSnapshot,
} from "@/lib/delta-generation";

function makeSnapshotInput(overrides: Partial<SnapshotInput> = {}): SnapshotInput {
  return {
    analyzedAt: new Date("2026-04-01T12:00:00Z"),
    automations: [],
    recommendations: [],
    processCount: 0,
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    analyzedAt: new Date("2026-04-01T12:00:00Z"),
    automationCount: 0,
    activeCount: 0,
    automations: [],
    recommendationCount: 0,
    recommendations: [],
    processCount: 0,
    ...overrides,
  };
}

function makeAutomationSnapshot(
  overrides: Partial<AutomationSnapshot> & { id: string }
): AutomationSnapshot {
  return {
    name: "Test Workflow",
    errorRate: null,
    isActive: true,
    runsPerWeek: null,
    updatedAt: new Date("2026-04-01T12:00:00Z"),
    ...overrides,
  };
}

function makeRecSnapshot(
  overrides: Partial<RecommendationSnapshot> & { id: string; name: string }
): RecommendationSnapshot {
  return {
    type: "optimization",
    tier: "quick-win",
    ...overrides,
  };
}

// ── captureSnapshot ─────────────────────────────────────

describe("captureSnapshot", () => {
  it("maps normal data to correct counts", () => {
    const input = makeSnapshotInput({
      automations: [
        { id: "a1", name: "WF1", errorRate: 5, isActive: true, isRemoved: false, runsPerWeek: 10, updatedAt: new Date() },
        { id: "a2", name: "WF2", errorRate: null, isActive: false, isRemoved: false, runsPerWeek: null, updatedAt: new Date() },
      ],
      recommendations: [
        { id: "r1", name: "Fix errors", type: "fix", tier: "critical" },
      ],
      processCount: 3,
    });
    const snap = captureSnapshot(input);
    expect(snap.automationCount).toBe(2);
    expect(snap.activeCount).toBe(1);
    expect(snap.automations).toHaveLength(2);
    expect(snap.recommendationCount).toBe(1);
    expect(snap.processCount).toBe(3);
  });

  it("filters out removed automations", () => {
    const input = makeSnapshotInput({
      automations: [
        { id: "a1", name: "Live", errorRate: null, isActive: true, isRemoved: false, runsPerWeek: null, updatedAt: new Date() },
        { id: "a2", name: "Gone", errorRate: null, isActive: true, isRemoved: true, runsPerWeek: null, updatedAt: new Date() },
      ],
    });
    const snap = captureSnapshot(input);
    expect(snap.automationCount).toBe(1);
    expect(snap.automations.map((a) => a.id)).toEqual(["a1"]);
  });
});

// ── generateDeltaSummary ────────────────────────────────

describe("generateDeltaSummary", () => {
  const baseDate = new Date("2026-04-01T12:00:00Z");
  const laterDate = new Date("2026-04-02T12:00:00Z"); // 1 day later

  it("returns null for first sync (previous null)", () => {
    const current = makeSnapshot();
    expect(generateDeltaSummary(null, current)).toBeNull();
  });

  it("reports new workflows added", () => {
    const previous = makeSnapshot({ analyzedAt: baseDate, automations: [] });
    const current = makeSnapshot({
      analyzedAt: laterDate,
      automations: [
        makeAutomationSnapshot({ id: "a1" }),
        makeAutomationSnapshot({ id: "a2" }),
      ],
    });
    const result = generateDeltaSummary(previous, current)!;
    expect(result).toContain("+2 new workflows detected");
  });

  it("reports workflows removed", () => {
    const previous = makeSnapshot({
      analyzedAt: baseDate,
      automations: [makeAutomationSnapshot({ id: "a1" })],
    });
    const current = makeSnapshot({ analyzedAt: laterDate, automations: [] });
    const result = generateDeltaSummary(previous, current)!;
    expect(result).toContain("1 workflow removed");
  });

  it("reports error rate improved", () => {
    const previous = makeSnapshot({
      analyzedAt: baseDate,
      automations: [makeAutomationSnapshot({ id: "a1", name: "lottery-win", errorRate: 31 })],
    });
    const current = makeSnapshot({
      analyzedAt: laterDate,
      automations: [makeAutomationSnapshot({ id: "a1", name: "lottery-win", errorRate: 12 })],
    });
    const result = generateDeltaSummary(previous, current)!;
    expect(result).toContain("lottery-win error rate improved 31% → 12%");
  });

  it("reports error rate worsened", () => {
    const previous = makeSnapshot({
      analyzedAt: baseDate,
      automations: [makeAutomationSnapshot({ id: "a1", name: "sync-job", errorRate: 5 })],
    });
    const current = makeSnapshot({
      analyzedAt: laterDate,
      automations: [makeAutomationSnapshot({ id: "a1", name: "sync-job", errorRate: 25 })],
    });
    const result = generateDeltaSummary(previous, current)!;
    expect(result).toContain("sync-job error rate worsened 5% → 25%");
  });

  it("ignores small error rate changes (<=5 points)", () => {
    const previous = makeSnapshot({
      analyzedAt: baseDate,
      automations: [makeAutomationSnapshot({ id: "a1", errorRate: 10 })],
    });
    const current = makeSnapshot({
      analyzedAt: laterDate,
      automations: [makeAutomationSnapshot({ id: "a1", errorRate: 13 })],
    });
    const result = generateDeltaSummary(previous, current)!;
    expect(result).toContain("no changes detected");
  });

  it("reports workflow activated", () => {
    const previous = makeSnapshot({
      analyzedAt: baseDate,
      automations: [makeAutomationSnapshot({ id: "a1", name: "Support classifier", isActive: false })],
    });
    const current = makeSnapshot({
      analyzedAt: laterDate,
      automations: [makeAutomationSnapshot({ id: "a1", name: "Support classifier", isActive: true })],
    });
    const result = generateDeltaSummary(previous, current)!;
    expect(result).toContain("Support classifier now active");
  });

  it("reports workflow deactivated", () => {
    const previous = makeSnapshot({
      analyzedAt: baseDate,
      automations: [makeAutomationSnapshot({ id: "a1", name: "Old job", isActive: true })],
    });
    const current = makeSnapshot({
      analyzedAt: laterDate,
      automations: [makeAutomationSnapshot({ id: "a1", name: "Old job", isActive: false })],
    });
    const result = generateDeltaSummary(previous, current)!;
    expect(result).toContain("Old job now inactive");
  });

  it("reports new recommendations", () => {
    const previous = makeSnapshot({ analyzedAt: baseDate, recommendations: [] });
    const current = makeSnapshot({
      analyzedAt: laterDate,
      recommendations: [
        makeRecSnapshot({ id: "r1", name: "Add monitoring" }),
        makeRecSnapshot({ id: "r2", name: "Fix retries" }),
      ],
    });
    const result = generateDeltaSummary(previous, current)!;
    expect(result).toContain("2 new recommendations");
  });

  it("reports resolved recommendations", () => {
    const previous = makeSnapshot({
      analyzedAt: baseDate,
      recommendations: [makeRecSnapshot({ id: "r1", name: "Add monitoring" })],
    });
    const current = makeSnapshot({ analyzedAt: laterDate, recommendations: [] });
    const result = generateDeltaSummary(previous, current)!;
    expect(result).toContain("1 recommendation resolved");
  });

  it("combines multiple changes into one sentence", () => {
    const previous = makeSnapshot({
      analyzedAt: baseDate,
      automations: [makeAutomationSnapshot({ id: "a1", name: "WF1", errorRate: 30 })],
      recommendations: [],
    });
    const current = makeSnapshot({
      analyzedAt: laterDate,
      automations: [
        makeAutomationSnapshot({ id: "a1", name: "WF1", errorRate: 10 }),
        makeAutomationSnapshot({ id: "a2", name: "WF2" }),
      ],
      recommendations: [makeRecSnapshot({ id: "r1", name: "New rec" })],
    });
    const result = generateDeltaSummary(previous, current)!;
    expect(result).toMatch(/^Since last analysis \(1 day ago\): /);
    expect(result).toContain("+1 new workflow detected");
    expect(result).toContain("WF1 error rate improved 30% → 10%");
    expect(result).toContain("1 new recommendation");
    expect(result).toMatch(/\.$/); // ends with period
  });

  it("reports no changes when snapshots are identical", () => {
    const automations = [makeAutomationSnapshot({ id: "a1" })];
    const recs = [makeRecSnapshot({ id: "r1", name: "Rec1" })];
    const previous = makeSnapshot({ analyzedAt: baseDate, automations, recommendations: recs });
    const current = makeSnapshot({ analyzedAt: laterDate, automations, recommendations: recs });
    const result = generateDeltaSummary(previous, current)!;
    expect(result).toContain("no changes detected");
  });
});
