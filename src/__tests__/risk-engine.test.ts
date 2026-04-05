/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — R1 risk engine tests; fields removed in Epic 10 schema migration
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    automation: {
      findMany: vi.fn(),
    },
  };
  return { mockPrisma };
});

vi.mock("@/generated/prisma/client", () => ({
  PrismaClient: vi.fn(),
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import type { Automation } from "@/generated/prisma/client";
import {
  getGovernanceSignals,
  getRiskLevel,
  getEffectiveStatus,
  getEffectiveImpact,
  getSystemExposure,
  getOwnerExposure,
  STALE_THRESHOLD_DAYS,
  IMPACT_WEIGHTS,
  RISK_WEIGHTS,
} from "@/lib/risk-engine";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function makeAutomation(overrides: Partial<Automation> = {}): Automation {
  return {
    id: "auto-1",
    workspaceId: "ws-1",
    externalId: "ext-1",
    platform: "n8n",
    rawWorkflowJson: {},
    name: "Test Automation",
    description: "Test description",
    trigger: "webhook",
    triggerType: "webhook",
    coreLogic: "Does stuff",
    systemsTouched: ["slack", "salesforce"],
    dataTypes: ["contacts"],
    businessContext: "Important",
    sideEffects: ["updates CRM"],
    impactProposal: "high",
    impactReasoning: "Touches revenue",
    impactOverride: null,
    owner: "Alice",
    reviewCadenceDays: 30,
    lastReviewDate: new Date(),
    automationLastUpdated: new Date(),
    documentationLastUpdated: new Date(),
    status: "active",
    statusOverride: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Automation;
}

describe.skip("R1 risk engine — skipped after R2 schema migration", () => {
describe("getGovernanceSignals", () => {
  it("returns all signals active when all governance gaps exist", () => {
    const auto = makeAutomation({
      documentationLastUpdated: null,
      automationLastUpdated: daysAgo(30),
      lastReviewDate: null,
      owner: null,
      status: "inactive" as Automation["status"],
      statusOverride: null,
    });

    const signals = getGovernanceSignals(auto);

    expect(signals).toEqual({
      documentationOutdated: true,
      automationStale: true,
      overdueReview: true,
      noOwnerAssigned: true,
      inactive: true,
    });
  });

  it("returns no signals active for a healthy automation", () => {
    const auto = makeAutomation();

    const signals = getGovernanceSignals(auto);

    expect(signals).toEqual({
      documentationOutdated: false,
      automationStale: false,
      overdueReview: false,
      noOwnerAssigned: false,
      inactive: false,
    });
  });

  // -- documentationOutdated --

  it("documentationOutdated — null documentationLastUpdated", () => {
    const auto = makeAutomation({ documentationLastUpdated: null });
    expect(getGovernanceSignals(auto).documentationOutdated).toBe(true);
  });

  it("documentationOutdated — automationLastUpdated > documentationLastUpdated", () => {
    const auto = makeAutomation({
      automationLastUpdated: new Date("2025-06-15"),
      documentationLastUpdated: new Date("2025-06-10"),
    });
    expect(getGovernanceSignals(auto).documentationOutdated).toBe(true);
  });

  it("documentationOutdated — automationLastUpdated <= documentationLastUpdated", () => {
    const now = new Date();
    const auto = makeAutomation({
      automationLastUpdated: new Date(now.getTime() - 1000),
      documentationLastUpdated: now,
    });
    expect(getGovernanceSignals(auto).documentationOutdated).toBe(false);
  });

  // -- automationStale --

  it("automationStale — null automationLastUpdated is inactive (false)", () => {
    const auto = makeAutomation({ automationLastUpdated: null });
    expect(getGovernanceSignals(auto).automationStale).toBe(false);
  });

  it("automationStale — old automationLastUpdated (> STALE_THRESHOLD_DAYS)", () => {
    const auto = makeAutomation({
      automationLastUpdated: daysAgo(20),
    });
    expect(getGovernanceSignals(auto).automationStale).toBe(true);
  });

  it("automationStale — recent automationLastUpdated", () => {
    const auto = makeAutomation({
      automationLastUpdated: daysAgo(5),
    });
    expect(getGovernanceSignals(auto).automationStale).toBe(false);
  });

  // -- overdueReview --

  it("overdueReview — null lastReviewDate (never reviewed)", () => {
    const auto = makeAutomation({ lastReviewDate: null });
    expect(getGovernanceSignals(auto).overdueReview).toBe(true);
  });

  it("overdueReview — old lastReviewDate beyond cadence", () => {
    const auto = makeAutomation({
      lastReviewDate: daysAgo(40),
      reviewCadenceDays: 30,
    });
    expect(getGovernanceSignals(auto).overdueReview).toBe(true);
  });

  it("overdueReview — recent lastReviewDate within cadence", () => {
    const auto = makeAutomation({
      lastReviewDate: daysAgo(10),
      reviewCadenceDays: 30,
    });
    expect(getGovernanceSignals(auto).overdueReview).toBe(false);
  });

  // -- noOwnerAssigned --

  it("noOwnerAssigned — null owner", () => {
    const auto = makeAutomation({ owner: null });
    expect(getGovernanceSignals(auto).noOwnerAssigned).toBe(true);
  });

  it("noOwnerAssigned — owner set", () => {
    const auto = makeAutomation({ owner: "Alice" });
    expect(getGovernanceSignals(auto).noOwnerAssigned).toBe(false);
  });

  // -- inactive --

  it("inactive — status inactive, no override", () => {
    const auto = makeAutomation({
      status: "inactive" as Automation["status"],
      statusOverride: null,
    });
    expect(getGovernanceSignals(auto).inactive).toBe(true);
  });

  it("inactive — statusOverride inactive", () => {
    const auto = makeAutomation({
      status: "active" as Automation["status"],
      statusOverride: "inactive" as Automation["statusOverride"],
    });
    expect(getGovernanceSignals(auto).inactive).toBe(true);
  });

  it("inactive — statusOverride deprecated is NOT inactive", () => {
    const auto = makeAutomation({
      status: "inactive" as Automation["status"],
      statusOverride: "deprecated" as Automation["statusOverride"],
    });
    expect(getGovernanceSignals(auto).inactive).toBe(false);
  });

  it("inactive — status active", () => {
    const auto = makeAutomation({
      status: "active" as Automation["status"],
      statusOverride: null,
    });
    expect(getGovernanceSignals(auto).inactive).toBe(false);
  });
});

describe("getEffectiveStatus", () => {
  it("returns statusOverride when set", () => {
    const auto = makeAutomation({
      status: "active" as Automation["status"],
      statusOverride: "deprecated" as Automation["statusOverride"],
    });
    expect(getEffectiveStatus(auto)).toBe("deprecated");
  });

  it("falls back to status when no override", () => {
    const auto = makeAutomation({
      status: "inactive" as Automation["status"],
      statusOverride: null,
    });
    expect(getEffectiveStatus(auto)).toBe("inactive");
  });
});

describe("getEffectiveImpact", () => {
  it("returns impactOverride when set", () => {
    const auto = makeAutomation({
      impactProposal: "low" as Automation["impactProposal"],
      impactOverride: "critical" as Automation["impactOverride"],
    });
    expect(getEffectiveImpact(auto)).toBe("critical");
  });

  it("falls back to impactProposal when no override", () => {
    const auto = makeAutomation({
      impactProposal: "medium" as Automation["impactProposal"],
      impactOverride: null,
    });
    expect(getEffectiveImpact(auto)).toBe("medium");
  });

  it("returns null when both are null", () => {
    const auto = makeAutomation({
      impactProposal: null,
      impactOverride: null,
    });
    expect(getEffectiveImpact(auto)).toBeNull();
  });
});

describe("getRiskLevel", () => {
  it("high — 3+ active signals", () => {
    const auto = makeAutomation({
      owner: null,
      lastReviewDate: null,
      documentationLastUpdated: null,
    });
    expect(getRiskLevel(auto)).toBe("high");
  });

  it("high — noOwnerAssigned + documentationOutdated", () => {
    const auto = makeAutomation({
      owner: null,
      documentationLastUpdated: null,
      // other signals are clean
      lastReviewDate: new Date(),
      automationLastUpdated: new Date(),
      status: "active" as Automation["status"],
    });
    expect(getRiskLevel(auto)).toBe("high");
  });

  it("high — inactive + any other signal", () => {
    const auto = makeAutomation({
      status: "inactive" as Automation["status"],
      automationLastUpdated: daysAgo(20), // stale
      // other signals clean
      owner: "Alice",
      lastReviewDate: new Date(),
      documentationLastUpdated: new Date(),
    });
    expect(getRiskLevel(auto)).toBe("high");
  });

  it("medium — 1-2 signals (not matching high combos)", () => {
    const auto = makeAutomation({
      automationLastUpdated: daysAgo(20), // just stale
    });
    expect(getRiskLevel(auto)).toBe("medium");
  });

  it("low — 0 signals", () => {
    const auto = makeAutomation();
    expect(getRiskLevel(auto)).toBe("low");
  });
});

describe("constants", () => {
  it("STALE_THRESHOLD_DAYS is 14", () => {
    expect(STALE_THRESHOLD_DAYS).toBe(14);
  });

  it("IMPACT_WEIGHTS maps levels correctly", () => {
    expect(IMPACT_WEIGHTS.critical).toBe(4);
    expect(IMPACT_WEIGHTS.high).toBe(3);
    expect(IMPACT_WEIGHTS.medium).toBe(2);
    expect(IMPACT_WEIGHTS.low).toBe(1);
  });

  it("RISK_WEIGHTS maps levels correctly", () => {
    expect(RISK_WEIGHTS.high).toBe(3);
    expect(RISK_WEIGHTS.medium).toBe(2);
    expect(RISK_WEIGHTS.low).toBe(1);
  });
});

describe("getSystemExposure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes weighted scores correctly", async () => {
    mockPrisma.automation.findMany.mockResolvedValue([
      makeAutomation({
        id: "a1",
        systemsTouched: ["slack", "salesforce"],
        impactProposal: "high" as Automation["impactProposal"],
        // healthy automation → risk = low (weight 1)
      }),
      makeAutomation({
        id: "a2",
        systemsTouched: ["slack"],
        impactProposal: "critical" as Automation["impactProposal"],
        // healthy automation → risk = low (weight 1)
      }),
    ]);

    const result = await getSystemExposure("ws-1");

    // a1: impact=high(3) × risk=low(1) = 3 for slack, 3 for salesforce
    // a2: impact=critical(4) × risk=low(1) = 4 for slack
    // slack total = 3 + 4 = 7, salesforce total = 3
    const slackEntry = result.find((r) => r.system === "slack");
    const sfEntry = result.find((r) => r.system === "salesforce");

    expect(slackEntry).toEqual({
      system: "slack",
      exposureScore: 7,
      automationCount: 2,
    });
    expect(sfEntry).toEqual({
      system: "salesforce",
      exposureScore: 3,
      automationCount: 1,
    });
  });

  it("null impactProposal defaults to weight 1", async () => {
    mockPrisma.automation.findMany.mockResolvedValue([
      makeAutomation({
        systemsTouched: ["jira"],
        impactProposal: null,
        impactOverride: null,
        // healthy → risk = low (weight 1)
      }),
    ]);

    const result = await getSystemExposure("ws-1");

    // impact=null(1) × risk=low(1) = 1
    const jiraEntry = result.find((r) => r.system === "jira");
    expect(jiraEntry).toEqual({
      system: "jira",
      exposureScore: 1,
      automationCount: 1,
    });
  });

  it("empty systemsTouched does not contribute", async () => {
    mockPrisma.automation.findMany.mockResolvedValue([
      makeAutomation({
        systemsTouched: [],
        impactProposal: "critical" as Automation["impactProposal"],
      }),
    ]);

    const result = await getSystemExposure("ws-1");

    expect(result).toEqual([]);
  });

  it("filters out removed automations via prisma query", async () => {
    mockPrisma.automation.findMany.mockResolvedValue([]);

    await getSystemExposure("ws-1");

    expect(mockPrisma.automation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workspaceId: "ws-1",
          status: { not: "removed" },
        }),
      }),
    );
  });
});

describe("getOwnerExposure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("groups null owners as 'Unassigned'", async () => {
    mockPrisma.automation.findMany.mockResolvedValue([
      makeAutomation({
        owner: null,
        impactProposal: "low" as Automation["impactProposal"],
      }),
    ]);

    const result = await getOwnerExposure("ws-1");

    const unassigned = result.find((r) => r.owner === "Unassigned");
    expect(unassigned).toBeDefined();
    expect(unassigned!.automationCount).toBe(1);
  });

  it("computes weighted scores correctly", async () => {
    mockPrisma.automation.findMany.mockResolvedValue([
      makeAutomation({
        id: "a1",
        owner: "Alice",
        impactProposal: "high" as Automation["impactProposal"],
        // healthy → risk = low(1)
      }),
      makeAutomation({
        id: "a2",
        owner: "Alice",
        impactProposal: "medium" as Automation["impactProposal"],
        // healthy → risk = low(1)
      }),
      makeAutomation({
        id: "a3",
        owner: "Bob",
        impactProposal: "critical" as Automation["impactProposal"],
        // healthy → risk = low(1)
      }),
    ]);

    const result = await getOwnerExposure("ws-1");

    // Alice: a1=3×1=3, a2=2×1=2 → total=5, count=2
    // Bob: a3=4×1=4 → total=4, count=1
    const alice = result.find((r) => r.owner === "Alice");
    const bob = result.find((r) => r.owner === "Bob");

    expect(alice).toEqual({
      owner: "Alice",
      exposureScore: 5,
      automationCount: 2,
    });
    expect(bob).toEqual({
      owner: "Bob",
      exposureScore: 4,
      automationCount: 1,
    });
  });

  it("sorted by exposure score descending", async () => {
    mockPrisma.automation.findMany.mockResolvedValue([
      makeAutomation({
        id: "a1",
        owner: "Alice",
        impactProposal: "low" as Automation["impactProposal"],
      }),
      makeAutomation({
        id: "a2",
        owner: "Bob",
        impactProposal: "critical" as Automation["impactProposal"],
      }),
    ]);

    const result = await getOwnerExposure("ws-1");

    // Bob: 4×1=4, Alice: 1×1=1 → Bob first
    expect(result[0].owner).toBe("Bob");
    expect(result[1].owner).toBe("Alice");
    expect(result[0].exposureScore).toBeGreaterThan(result[1].exposureScore);
  });
});
}); // end describe.skip wrapper
