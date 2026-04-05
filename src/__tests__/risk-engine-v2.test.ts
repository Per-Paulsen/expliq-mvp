import { describe, it, expect, vi, afterEach } from "vitest";
import {
  computeGovernanceDot,
  type GovernanceDotInput,
} from "@/lib/risk-engine";

function makeInput(overrides: Partial<GovernanceDotInput> = {}): GovernanceDotInput {
  return {
    errorRate: null,
    isActive: true,
    impact: null,
    detectability: null,
    lastExecutedAt: null,
    rawWorkflowJson: {},
    ...overrides,
  };
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

describe("computeGovernanceDot", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Critical cases ──────────────────────────────────

  describe("critical", () => {
    it("active workflow with errorRate > 0.20", () => {
      const input = makeInput({ isActive: true, errorRate: 0.25 });
      expect(computeGovernanceDot(input)).toBe("critical");
    });

    it("active workflow with errorRate exactly 0.21", () => {
      const input = makeInput({ isActive: true, errorRate: 0.21 });
      expect(computeGovernanceDot(input)).toBe("critical");
    });

    it("critical impact + silent detectability", () => {
      const input = makeInput({
        impact: { level: "critical" },
        detectability: { level: "silent" },
      });
      expect(computeGovernanceDot(input)).toBe("critical");
    });

    it("both critical conditions met — still critical (not double-counted)", () => {
      const input = makeInput({
        isActive: true,
        errorRate: 0.30,
        impact: { level: "critical" },
        detectability: { level: "silent" },
      });
      expect(computeGovernanceDot(input)).toBe("critical");
    });

    it("inactive workflow with high errorRate is NOT critical (isActive required)", () => {
      const input = makeInput({ isActive: false, errorRate: 0.50 });
      // errorRate rule requires isActive — should not be critical from errorRate alone
      expect(computeGovernanceDot(input)).not.toBe("critical");
    });
  });

  // ── Attention cases ─────────────────────────────────

  describe("attention", () => {
    it("active workflow with errorRate 0.05", () => {
      const input = makeInput({ isActive: true, errorRate: 0.05 });
      expect(computeGovernanceDot(input)).toBe("attention");
    });

    it("active workflow with errorRate 0.19", () => {
      const input = makeInput({ isActive: true, errorRate: 0.19 });
      expect(computeGovernanceDot(input)).toBe("attention");
    });

    it("active workflow with errorRate exactly 0.20", () => {
      const input = makeInput({ isActive: true, errorRate: 0.20 });
      expect(computeGovernanceDot(input)).toBe("attention");
    });

    it("inactive workflow with recent execution (within 30 days)", () => {
      const input = makeInput({
        isActive: false,
        lastExecutedAt: daysAgo(10),
      });
      expect(computeGovernanceDot(input)).toBe("attention");
    });

    it("inactive workflow with lastExecutedAt exactly 30 days ago", () => {
      vi.useFakeTimers();
      const now = new Date("2026-04-05T12:00:00.000Z");
      vi.setSystemTime(now);
      // Compute the threshold the same way the implementation does
      const threshold = new Date(now);
      threshold.setDate(threshold.getDate() - 30);
      const input = makeInput({
        isActive: false,
        lastExecutedAt: new Date(threshold.getTime()),
      });
      expect(computeGovernanceDot(input)).toBe("attention");
    });

    it("critical impact without error workflow", () => {
      const input = makeInput({
        impact: { level: "critical" },
        detectability: { level: "monitored" },
        rawWorkflowJson: {},
      });
      expect(computeGovernanceDot(input)).toBe("attention");
    });

    it("high impact without error workflow", () => {
      const input = makeInput({
        impact: { level: "high" },
        rawWorkflowJson: {},
      });
      expect(computeGovernanceDot(input)).toBe("attention");
    });

    it("critical impact WITH error workflow — not attention from impact rule", () => {
      const input = makeInput({
        impact: { level: "critical" },
        detectability: { level: "monitored" },
        rawWorkflowJson: { settings: { errorWorkflow: "wf-123" } },
      });
      // Has error workflow, detectability is not "silent" → healthy
      expect(computeGovernanceDot(input)).toBe("healthy");
    });
  });

  // ── Healthy cases ───────────────────────────────────

  describe("healthy", () => {
    it("active workflow with errorRate 0.04", () => {
      const input = makeInput({ isActive: true, errorRate: 0.04 });
      expect(computeGovernanceDot(input)).toBe("healthy");
    });

    it("active workflow with errorRate null (unknown = ok)", () => {
      const input = makeInput({ isActive: true, errorRate: null });
      expect(computeGovernanceDot(input)).toBe("healthy");
    });

    it("active workflow with low impact + monitored", () => {
      const input = makeInput({
        isActive: true,
        errorRate: 0.01,
        impact: { level: "low" },
        detectability: { level: "monitored" },
        rawWorkflowJson: { settings: { errorWorkflow: "wf-100" } },
      });
      expect(computeGovernanceDot(input)).toBe("healthy");
    });

    it("inactive workflow with no recent execution", () => {
      const input = makeInput({
        isActive: false,
        lastExecutedAt: daysAgo(60),
      });
      expect(computeGovernanceDot(input)).toBe("healthy");
    });

    it("inactive workflow with lastExecutedAt 31 days ago", () => {
      vi.useFakeTimers();
      const now = new Date("2026-04-05T12:00:00.000Z");
      vi.setSystemTime(now);
      const threshold = new Date(now);
      threshold.setDate(threshold.getDate() - 30);
      // 1 ms before the threshold → just outside the 30-day window
      const input = makeInput({
        isActive: false,
        lastExecutedAt: new Date(threshold.getTime() - 1),
      });
      expect(computeGovernanceDot(input)).toBe("healthy");
    });

    it("all null fields → healthy", () => {
      const input = makeInput({
        errorRate: null,
        isActive: true,
        impact: null,
        detectability: null,
        lastExecutedAt: null,
        rawWorkflowJson: null,
      });
      expect(computeGovernanceDot(input)).toBe("healthy");
    });

    it("medium impact without error workflow is not flagged", () => {
      const input = makeInput({
        impact: { level: "medium" },
        rawWorkflowJson: {},
      });
      expect(computeGovernanceDot(input)).toBe("healthy");
    });

    it("low impact without error workflow is not flagged", () => {
      const input = makeInput({
        impact: { level: "low" },
        rawWorkflowJson: {},
      });
      expect(computeGovernanceDot(input)).toBe("healthy");
    });
  });

  // ── Edge cases ──────────────────────────────────────

  describe("edge cases", () => {
    it("null impact → not flagged for impact-related rules", () => {
      const input = makeInput({
        impact: null,
        detectability: { level: "silent" },
      });
      // impact is null so "critical impact + silent detect" rule doesn't trigger
      expect(computeGovernanceDot(input)).toBe("healthy");
    });

    it("null detectability → not flagged for detectability rules", () => {
      const input = makeInput({
        impact: { level: "critical" },
        detectability: null,
        rawWorkflowJson: { settings: { errorWorkflow: "wf-1" } },
      });
      // detectability is null → "critical impact + silent detect" doesn't trigger
      // Has error workflow → impact-without-error-workflow doesn't trigger
      expect(computeGovernanceDot(input)).toBe("healthy");
    });

    it("errorRate exactly 0.0 → healthy", () => {
      const input = makeInput({ isActive: true, errorRate: 0.0 });
      expect(computeGovernanceDot(input)).toBe("healthy");
    });

    it("errorRate exactly 1.0 → critical", () => {
      const input = makeInput({ isActive: true, errorRate: 1.0 });
      expect(computeGovernanceDot(input)).toBe("critical");
    });

    it("inactive workflow with null lastExecutedAt → healthy (not attention)", () => {
      const input = makeInput({
        isActive: false,
        lastExecutedAt: null,
      });
      expect(computeGovernanceDot(input)).toBe("healthy");
    });

    it("rawWorkflowJson with nested settings but empty errorWorkflow string", () => {
      const input = makeInput({
        impact: { level: "high" },
        rawWorkflowJson: { settings: { errorWorkflow: "" } },
      });
      // Empty string → hasErrorWorkflow returns false → attention
      expect(computeGovernanceDot(input)).toBe("attention");
    });

    it("rawWorkflowJson with no settings key", () => {
      const input = makeInput({
        impact: { level: "high" },
        rawWorkflowJson: { nodes: [] },
      });
      expect(computeGovernanceDot(input)).toBe("attention");
    });

    it("rawWorkflowJson is null", () => {
      const input = makeInput({
        impact: { level: "high" },
        rawWorkflowJson: null,
      });
      expect(computeGovernanceDot(input)).toBe("attention");
    });

    it("rawWorkflowJson is a string (malformed)", () => {
      const input = makeInput({
        impact: { level: "critical" },
        detectability: { level: "monitored" },
        rawWorkflowJson: "not an object",
      });
      // hasErrorWorkflow returns false → critical/high impact without error workflow → attention
      expect(computeGovernanceDot(input)).toBe("attention");
    });
  });

  // ── Priority tests ──────────────────────────────────

  describe("priority: critical wins over attention", () => {
    it("errorRate triggers both critical and attention thresholds → critical wins", () => {
      // errorRate 0.25 > 0.20 → critical; also >= 0.05 but critical checked first
      const input = makeInput({ isActive: true, errorRate: 0.25 });
      expect(computeGovernanceDot(input)).toBe("critical");
    });

    it("critical impact + silent detect + recently inactive → critical wins", () => {
      const input = makeInput({
        isActive: false,
        lastExecutedAt: daysAgo(5),
        impact: { level: "critical" },
        detectability: { level: "silent" },
      });
      // Would be attention (recently inactive) but critical (impact+detect) takes priority
      expect(computeGovernanceDot(input)).toBe("critical");
    });

    it("high error rate + high impact without error workflow → critical wins", () => {
      const input = makeInput({
        isActive: true,
        errorRate: 0.30,
        impact: { level: "high" },
        rawWorkflowJson: {},
      });
      // errorRate > 0.20 → critical; high impact + no error workflow → attention
      // Critical wins
      expect(computeGovernanceDot(input)).toBe("critical");
    });
  });
});
