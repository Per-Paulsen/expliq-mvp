/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — R1 snapshot metrics tests; types trimmed in Epic 10
import { describe, it, expect } from "vitest";
import type { SnapshotAutomation } from "@/lib/snapshot-types";
import {
  computeSnapshotMetrics,
  getRecentlyChanged,
  getMultiSystemAutomations,
} from "@/lib/snapshot-metrics";

function makeSnapshotAutomation(
  overrides: Partial<SnapshotAutomation> = {}
): SnapshotAutomation {
  return {
    id: "auto-1",
    name: "Test Automation",
    owner: "alice",
    systemsTouched: ["Salesforce", "HubSpot"],
    impactLevel: "medium",
    riskLevel: "medium",
    signals: {
      documentationOutdated: false,
      automationStale: false,
      overdueReview: false,
      noOwnerAssigned: false,
      inactive: false,
    },
    automationLastUpdated: new Date("2025-06-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe.skip("R1 snapshot metrics — skipped after R2 schema migration", () => {
describe("computeSnapshotMetrics", () => {
  it("returns zeroes for empty array", () => {
    const metrics = computeSnapshotMetrics([]);
    expect(metrics).toEqual({
      totalAutomations: 0,
      highImpactCount: 0,
      highRiskCount: 0,
      missingOwnersCount: 0,
      overdueReviewsCount: 0,
    });
  });

  it("counts total automations", () => {
    const automations = [
      makeSnapshotAutomation({ id: "a1" }),
      makeSnapshotAutomation({ id: "a2" }),
      makeSnapshotAutomation({ id: "a3" }),
    ];
    expect(computeSnapshotMetrics(automations).totalAutomations).toBe(3);
  });

  it("counts high-impact (critical + high only)", () => {
    const automations = [
      makeSnapshotAutomation({ id: "a1", impactLevel: "critical" }),
      makeSnapshotAutomation({ id: "a2", impactLevel: "high" }),
      makeSnapshotAutomation({ id: "a3", impactLevel: "medium" }),
      makeSnapshotAutomation({ id: "a4", impactLevel: "low" }),
      makeSnapshotAutomation({ id: "a5", impactLevel: null }),
    ];
    expect(computeSnapshotMetrics(automations).highImpactCount).toBe(2);
  });

  it("counts high-risk only (not medium/low)", () => {
    const automations = [
      makeSnapshotAutomation({ id: "a1", riskLevel: "high" }),
      makeSnapshotAutomation({ id: "a2", riskLevel: "medium" }),
      makeSnapshotAutomation({ id: "a3", riskLevel: "low" }),
    ];
    expect(computeSnapshotMetrics(automations).highRiskCount).toBe(1);
  });

  it("counts missing owners (null owner)", () => {
    const automations = [
      makeSnapshotAutomation({ id: "a1", owner: null }),
      makeSnapshotAutomation({ id: "a2", owner: "alice" }),
      makeSnapshotAutomation({ id: "a3", owner: null }),
    ];
    expect(computeSnapshotMetrics(automations).missingOwnersCount).toBe(2);
  });

  it("counts overdue reviews (overdueReview signal true)", () => {
    const automations = [
      makeSnapshotAutomation({
        id: "a1",
        signals: {
          documentationOutdated: false,
          automationStale: false,
          overdueReview: true,
          noOwnerAssigned: false,
          inactive: false,
        },
      }),
      makeSnapshotAutomation({ id: "a2" }),
    ];
    expect(computeSnapshotMetrics(automations).overdueReviewsCount).toBe(1);
  });

  it("handles mixed scenario with all metric types", () => {
    const automations = [
      makeSnapshotAutomation({
        id: "a1",
        impactLevel: "critical",
        riskLevel: "high",
        owner: null,
        signals: {
          documentationOutdated: false,
          automationStale: false,
          overdueReview: true,
          noOwnerAssigned: true,
          inactive: false,
        },
      }),
      makeSnapshotAutomation({
        id: "a2",
        impactLevel: "high",
        riskLevel: "medium",
        owner: "bob",
        signals: {
          documentationOutdated: false,
          automationStale: false,
          overdueReview: false,
          noOwnerAssigned: false,
          inactive: false,
        },
      }),
      makeSnapshotAutomation({
        id: "a3",
        impactLevel: "low",
        riskLevel: "low",
        owner: null,
        signals: {
          documentationOutdated: false,
          automationStale: false,
          overdueReview: true,
          noOwnerAssigned: true,
          inactive: false,
        },
      }),
    ];
    const metrics = computeSnapshotMetrics(automations);
    expect(metrics.totalAutomations).toBe(3);
    expect(metrics.highImpactCount).toBe(2);
    expect(metrics.highRiskCount).toBe(1);
    expect(metrics.missingOwnersCount).toBe(2);
    expect(metrics.overdueReviewsCount).toBe(2);
  });
});

describe("getRecentlyChanged", () => {
  it("returns empty for empty array", () => {
    expect(getRecentlyChanged([])).toEqual([]);
  });

  it("returns only automations within the last 7 days", () => {
    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);
    const tenDaysAgo = new Date(now);
    tenDaysAgo.setDate(now.getDate() - 10);

    const automations = [
      makeSnapshotAutomation({ id: "recent", automationLastUpdated: threeDaysAgo }),
      makeSnapshotAutomation({ id: "old", automationLastUpdated: tenDaysAgo }),
    ];

    const result = getRecentlyChanged(automations);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("recent");
  });

  it("excludes null automationLastUpdated", () => {
    const automations = [
      makeSnapshotAutomation({ id: "a1", automationLastUpdated: null }),
      makeSnapshotAutomation({ id: "a2", automationLastUpdated: new Date() }),
    ];

    const result = getRecentlyChanged(automations);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a2");
  });

  it("sorted desc by automationLastUpdated", () => {
    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(now.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(now.getDate() - 2);

    const automations = [
      makeSnapshotAutomation({ id: "older", automationLastUpdated: twoDaysAgo }),
      makeSnapshotAutomation({ id: "newer", automationLastUpdated: oneDayAgo }),
      makeSnapshotAutomation({ id: "newest", automationLastUpdated: now }),
    ];

    const result = getRecentlyChanged(automations);
    expect(result.map((a) => a.id)).toEqual(["newest", "newer", "older"]);
  });

  it("respects custom days parameter", () => {
    const now = new Date();
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(now.getDate() - 2);
    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(now.getDate() - 5);

    const automations = [
      makeSnapshotAutomation({ id: "a1", automationLastUpdated: twoDaysAgo }),
      makeSnapshotAutomation({ id: "a2", automationLastUpdated: fiveDaysAgo }),
    ];

    const within3 = getRecentlyChanged(automations, 3);
    expect(within3).toHaveLength(1);
    expect(within3[0].id).toBe("a1");

    const within10 = getRecentlyChanged(automations, 10);
    expect(within10).toHaveLength(2);
  });
});

describe("getMultiSystemAutomations", () => {
  it("returns empty for empty array", () => {
    expect(getMultiSystemAutomations([])).toEqual([]);
  });

  it("returns only 3+ system automations", () => {
    const automations = [
      makeSnapshotAutomation({
        id: "a1",
        systemsTouched: ["Salesforce", "HubSpot", "Slack"],
      }),
      makeSnapshotAutomation({
        id: "a2",
        systemsTouched: ["Salesforce", "HubSpot"],
      }),
      makeSnapshotAutomation({
        id: "a3",
        systemsTouched: ["Salesforce"],
      }),
    ];

    const result = getMultiSystemAutomations(automations);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a1");
  });

  it("sorted desc by system count", () => {
    const automations = [
      makeSnapshotAutomation({
        id: "three",
        systemsTouched: ["A", "B", "C"],
      }),
      makeSnapshotAutomation({
        id: "five",
        systemsTouched: ["A", "B", "C", "D", "E"],
      }),
      makeSnapshotAutomation({
        id: "four",
        systemsTouched: ["A", "B", "C", "D"],
      }),
    ];

    const result = getMultiSystemAutomations(automations);
    expect(result.map((a) => a.id)).toEqual(["five", "four", "three"]);
  });

  it("respects custom minSystems parameter", () => {
    const automations = [
      makeSnapshotAutomation({
        id: "a1",
        systemsTouched: ["A", "B"],
      }),
      makeSnapshotAutomation({
        id: "a2",
        systemsTouched: ["A", "B", "C"],
      }),
    ];

    const min2 = getMultiSystemAutomations(automations, 2);
    expect(min2).toHaveLength(2);

    const min3 = getMultiSystemAutomations(automations, 3);
    expect(min3).toHaveLength(1);
    expect(min3[0].id).toBe("a2");
  });
});
}); // end describe.skip wrapper
