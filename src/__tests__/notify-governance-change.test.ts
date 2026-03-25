import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
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
  toSignalArray,
  computeChanges,
  notifyGovernanceChange,
} from "@/lib/actions/notify-governance-change";
import type { GovernanceSignals } from "@/lib/risk-engine";

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

// ── toSignalArray ──────────────────────────────────────

describe("toSignalArray", () => {
  it("returns empty array when no signals are active", () => {
    const signals: GovernanceSignals = {
      documentationOutdated: false,
      automationStale: false,
      overdueReview: false,
      noOwnerAssigned: false,
      inactive: false,
    };
    expect(toSignalArray(signals)).toEqual([]);
  });

  it("returns all signal names when all are active", () => {
    const signals: GovernanceSignals = {
      documentationOutdated: true,
      automationStale: true,
      overdueReview: true,
      noOwnerAssigned: true,
      inactive: true,
    };
    const result = toSignalArray(signals);
    expect(result).toHaveLength(5);
    expect(result).toContain("documentationOutdated");
    expect(result).toContain("automationStale");
    expect(result).toContain("overdueReview");
    expect(result).toContain("noOwnerAssigned");
    expect(result).toContain("inactive");
  });

  it("returns only active signal names", () => {
    const signals: GovernanceSignals = {
      documentationOutdated: true,
      automationStale: false,
      overdueReview: false,
      noOwnerAssigned: true,
      inactive: false,
    };
    const result = toSignalArray(signals);
    expect(result).toEqual(
      expect.arrayContaining(["documentationOutdated", "noOwnerAssigned"]),
    );
    expect(result).toHaveLength(2);
  });
});

// ── computeChanges ─────────────────────────────────────

describe("computeChanges", () => {
  it("returns empty array when nothing changed", () => {
    const before = makeAutomation({ owner: "Alice" });
    const after = makeAutomation({ owner: "Alice" });
    expect(computeChanges(before, after)).toEqual([]);
  });

  it("detects owner change", () => {
    const before = makeAutomation({ owner: null });
    const after = makeAutomation({ owner: "Alice Chen" });
    const changes = computeChanges(before, after);
    expect(changes).toEqual([
      { field: "owner", oldValue: null, newValue: "Alice Chen" },
    ]);
  });

  it("detects impactOverride change", () => {
    const before = makeAutomation({ impactOverride: null });
    const after = makeAutomation({
      impactOverride: "critical" as Automation["impactOverride"],
    });
    const changes = computeChanges(before, after);
    expect(changes).toEqual([
      { field: "impactOverride", oldValue: null, newValue: "critical" },
    ]);
  });

  it("detects reviewCadenceDays change", () => {
    const before = makeAutomation({ reviewCadenceDays: 30 });
    const after = makeAutomation({ reviewCadenceDays: 14 });
    const changes = computeChanges(before, after);
    expect(changes).toEqual([
      { field: "reviewCadenceDays", oldValue: 30, newValue: 14 },
    ]);
  });

  it("detects statusOverride change", () => {
    const before = makeAutomation({ statusOverride: null });
    const after = makeAutomation({
      statusOverride: "deprecated" as Automation["statusOverride"],
    });
    const changes = computeChanges(before, after);
    expect(changes).toEqual([
      { field: "statusOverride", oldValue: null, newValue: "deprecated" },
    ]);
  });

  it("detects lastReviewDate change", () => {
    const oldDate = new Date("2025-01-01");
    const newDate = new Date("2026-03-25");
    const before = makeAutomation({ lastReviewDate: oldDate });
    const after = makeAutomation({ lastReviewDate: newDate });
    const changes = computeChanges(before, after);
    expect(changes).toEqual([
      {
        field: "lastReviewDate",
        oldValue: oldDate.toISOString(),
        newValue: newDate.toISOString(),
      },
    ]);
  });

  it("detects multiple changes at once", () => {
    const before = makeAutomation({
      owner: null,
      impactOverride: null,
      reviewCadenceDays: 30,
    });
    const after = makeAutomation({
      owner: "Bob",
      impactOverride: "high" as Automation["impactOverride"],
      reviewCadenceDays: 7,
    });
    const changes = computeChanges(before, after);
    expect(changes).toHaveLength(3);
    expect(changes).toEqual(
      expect.arrayContaining([
        { field: "owner", oldValue: null, newValue: "Bob" },
        { field: "impactOverride", oldValue: null, newValue: "high" },
        { field: "reviewCadenceDays", oldValue: 30, newValue: 7 },
      ]),
    );
  });

  it("ignores fields that are not governance fields", () => {
    const before = makeAutomation({ name: "Old Name" });
    const after = makeAutomation({ name: "New Name" });
    expect(computeChanges(before, after)).toEqual([]);
  });
});

// ── notifyGovernanceChange ─────────────────────────────

describe("notifyGovernanceChange", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("skips silently when N8N_GOVERNANCE_WEBHOOK_URL is not set", async () => {
    vi.stubEnv("N8N_GOVERNANCE_WEBHOOK_URL", "");
    const before = makeAutomation();
    const after = makeAutomation({ owner: "Bob" });
    await notifyGovernanceChange(before, after, "user-1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends webhook with correct payload shape", async () => {
    vi.stubEnv(
      "N8N_GOVERNANCE_WEBHOOK_URL",
      "https://n8n.example.com/webhook/gov",
    );
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "ops-lead@acme.com",
    });

    const before = makeAutomation({
      owner: null,
      lastReviewDate: new Date(),
    });
    const after = makeAutomation({
      owner: "Alice Chen",
      lastReviewDate: new Date(),
    });

    await notifyGovernanceChange(before, after, "user-1");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://n8n.example.com/webhook/gov");
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");

    const payload = JSON.parse(options.body);
    expect(payload.event).toBe("automation.governance_changed");
    expect(payload.automation.id).toBe("auto-1");
    expect(payload.automation.name).toBe("Test Automation");
    expect(payload.automation.riskLevel).toBeDefined();
    expect(payload.automation.previousRiskLevel).toBeDefined();
    expect(typeof payload.automation.riskLevelChanged).toBe("boolean");
    expect(payload.automation.impactLevel).toBeDefined();
    expect(payload.automation.systemsTouched).toEqual([
      "slack",
      "salesforce",
    ]);
    expect(Array.isArray(payload.automation.activeSignals)).toBe(true);
    expect(Array.isArray(payload.automation.resolvedSignals)).toBe(true);
    expect(Array.isArray(payload.changes)).toBe(true);
    expect(payload.changedBy).toBe("ops-lead@acme.com");
    expect(payload.workspaceId).toBe("ws-1");
    expect(payload.timestamp).toBeDefined();
  });

  it("includes riskLevelChanged: true when risk level changes", async () => {
    vi.stubEnv(
      "N8N_GOVERNANCE_WEBHOOK_URL",
      "https://n8n.example.com/webhook/gov",
    );
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "ops-lead@acme.com",
    });

    // Before: no owner + no docs = high risk
    const before = makeAutomation({
      owner: null,
      documentationLastUpdated: null,
    });
    // After: owner assigned + docs present = low risk (healthy)
    const after = makeAutomation({
      owner: "Alice",
      documentationLastUpdated: new Date(),
    });

    await notifyGovernanceChange(before, after, "user-1");

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.automation.riskLevelChanged).toBe(true);
    expect(payload.automation.previousRiskLevel).toBe("high");
  });

  it("includes riskLevelChanged: false when risk level stays the same", async () => {
    vi.stubEnv(
      "N8N_GOVERNANCE_WEBHOOK_URL",
      "https://n8n.example.com/webhook/gov",
    );
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@acme.com",
    });

    // Both healthy — low risk
    const before = makeAutomation({ owner: "Alice" });
    const after = makeAutomation({ owner: "Bob" });

    await notifyGovernanceChange(before, after, "user-1");

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.automation.riskLevelChanged).toBe(false);
  });

  it("computes resolvedSignals correctly", async () => {
    vi.stubEnv(
      "N8N_GOVERNANCE_WEBHOOK_URL",
      "https://n8n.example.com/webhook/gov",
    );
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@acme.com",
    });

    // Before: no owner (noOwnerAssigned = true)
    const before = makeAutomation({ owner: null });
    // After: owner set (noOwnerAssigned = false) — signal resolved
    const after = makeAutomation({ owner: "Alice" });

    await notifyGovernanceChange(before, after, "user-1");

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.automation.resolvedSignals).toContain("noOwnerAssigned");
    expect(payload.automation.activeSignals).not.toContain("noOwnerAssigned");
  });

  it("fetches user email from DB", async () => {
    vi.stubEnv(
      "N8N_GOVERNANCE_WEBHOOK_URL",
      "https://n8n.example.com/webhook/gov",
    );
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-42",
      email: "specific-user@acme.com",
    });

    const before = makeAutomation();
    const after = makeAutomation({ owner: "Bob" });

    await notifyGovernanceChange(before, after, "user-42");

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-42" },
      select: { email: true },
    });
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.changedBy).toBe("specific-user@acme.com");
  });

  it("swallows fetch errors without throwing", async () => {
    vi.stubEnv(
      "N8N_GOVERNANCE_WEBHOOK_URL",
      "https://n8n.example.com/webhook/gov",
    );
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@acme.com",
    });
    fetchMock.mockRejectedValue(new Error("Network error"));

    const before = makeAutomation();
    const after = makeAutomation({ owner: "Bob" });

    // Should not throw
    await expect(
      notifyGovernanceChange(before, after, "user-1"),
    ).resolves.toBeUndefined();
  });

  it("swallows DB lookup errors without throwing", async () => {
    vi.stubEnv(
      "N8N_GOVERNANCE_WEBHOOK_URL",
      "https://n8n.example.com/webhook/gov",
    );
    mockPrisma.user.findUnique.mockRejectedValue(
      new Error("DB connection lost"),
    );

    const before = makeAutomation();
    const after = makeAutomation({ owner: "Bob" });

    await expect(
      notifyGovernanceChange(before, after, "user-1"),
    ).resolves.toBeUndefined();
  });

  it("uses unknown email fallback when user not found", async () => {
    vi.stubEnv(
      "N8N_GOVERNANCE_WEBHOOK_URL",
      "https://n8n.example.com/webhook/gov",
    );
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const before = makeAutomation();
    const after = makeAutomation({ owner: "Bob" });

    await notifyGovernanceChange(before, after, "user-1");

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.changedBy).toBe("unknown");
  });
});
