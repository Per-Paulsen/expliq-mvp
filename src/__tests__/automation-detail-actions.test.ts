import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockGetRequiredSession } = vi.hoisted(() => {
  const mockPrisma = {
    automation: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };
  const mockGetRequiredSession = vi.fn().mockResolvedValue({
    user: { id: "user-1", workspaceId: "ws-1" },
  });
  return { mockPrisma, mockGetRequiredSession };
});

vi.mock("@/generated/prisma/client", () => ({
  PrismaClient: vi.fn(),
  ImpactLevel: {
    critical: "critical",
    high: "high",
    medium: "medium",
    low: "low",
  },
  StatusOverride: {
    active: "active",
    inactive: "inactive",
    deprecated: "deprecated",
  },
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/session", () => ({
  getRequiredSession: mockGetRequiredSession,
}));

import {
  saveAutomationEdits,
  markAsReviewed,
} from "@/lib/actions/automation";

describe("saveAutomationEdits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequiredSession.mockResolvedValue({
      user: { id: "user-1", workspaceId: "ws-1" },
    });
  });

  it("returns error when automation not found", async () => {
    mockPrisma.automation.findFirst.mockResolvedValue(null);

    const result = await saveAutomationEdits("auto-missing", {
      owner: "Alice",
      impactOverride: "high",
      reviewCadenceDays: 30,
      statusOverride: "",
    });

    expect(result).toEqual({ error: "Automation not found" });
    expect(mockPrisma.automation.update).not.toHaveBeenCalled();
  });

  it("returns error when automation belongs to different workspace", async () => {
    mockPrisma.automation.findFirst.mockResolvedValue(null);

    const result = await saveAutomationEdits("auto-other-ws", {
      owner: "Alice",
      impactOverride: "",
      reviewCadenceDays: 30,
      statusOverride: "",
    });

    expect(mockPrisma.automation.findFirst).toHaveBeenCalledWith({
      where: { id: "auto-other-ws", workspaceId: "ws-1" },
    });
    expect(result).toEqual({ error: "Automation not found" });
  });

  it("saves owner, impactOverride, reviewCadenceDays, statusOverride", async () => {
    mockPrisma.automation.findFirst.mockResolvedValue({ id: "auto-1", workspaceId: "ws-1" });
    mockPrisma.automation.update.mockResolvedValue({});

    const result = await saveAutomationEdits("auto-1", {
      owner: "Alice",
      impactOverride: "high",
      reviewCadenceDays: 14,
      statusOverride: "deprecated",
    });

    expect(result).toEqual({ success: true });
    expect(mockPrisma.automation.update).toHaveBeenCalledWith({
      where: { id: "auto-1" },
      data: {
        owner: "Alice",
        impactOverride: "high",
        reviewCadenceDays: 14,
        statusOverride: "deprecated",
      },
    });
  });

  it("sets owner to null when empty string provided", async () => {
    mockPrisma.automation.findFirst.mockResolvedValue({ id: "auto-1", workspaceId: "ws-1" });
    mockPrisma.automation.update.mockResolvedValue({});

    await saveAutomationEdits("auto-1", {
      owner: "  ",
      impactOverride: "",
      reviewCadenceDays: 30,
      statusOverride: "",
    });

    expect(mockPrisma.automation.update).toHaveBeenCalledWith({
      where: { id: "auto-1" },
      data: {
        owner: null,
        impactOverride: null,
        reviewCadenceDays: 30,
        statusOverride: null,
      },
    });
  });

  it("validates reviewCadenceDays (rounds and ensures positive)", async () => {
    mockPrisma.automation.findFirst.mockResolvedValue({ id: "auto-1", workspaceId: "ws-1" });
    mockPrisma.automation.update.mockResolvedValue({});

    await saveAutomationEdits("auto-1", {
      owner: "",
      impactOverride: "",
      reviewCadenceDays: 0.3,
      statusOverride: "",
    });

    expect(mockPrisma.automation.update).toHaveBeenCalledWith({
      where: { id: "auto-1" },
      data: expect.objectContaining({
        reviewCadenceDays: 1,
      }),
    });
  });
});

describe("markAsReviewed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequiredSession.mockResolvedValue({
      user: { id: "user-1", workspaceId: "ws-1" },
    });
  });

  it("returns error when automation not found", async () => {
    mockPrisma.automation.findFirst.mockResolvedValue(null);

    const result = await markAsReviewed("auto-missing");

    expect(result).toEqual({ error: "Automation not found" });
    expect(mockPrisma.automation.update).not.toHaveBeenCalled();
  });

  it("sets lastReviewDate to current time", async () => {
    mockPrisma.automation.findFirst.mockResolvedValue({ id: "auto-1", workspaceId: "ws-1" });
    mockPrisma.automation.update.mockResolvedValue({});

    const before = Date.now();
    await markAsReviewed("auto-1");
    const after = Date.now();

    const call = mockPrisma.automation.update.mock.calls[0][0];
    const reviewDate = call.data.lastReviewDate as Date;
    expect(reviewDate.getTime()).toBeGreaterThanOrEqual(before);
    expect(reviewDate.getTime()).toBeLessThanOrEqual(after);
  });

  it("returns success", async () => {
    mockPrisma.automation.findFirst.mockResolvedValue({ id: "auto-1", workspaceId: "ws-1" });
    mockPrisma.automation.update.mockResolvedValue({});

    const result = await markAsReviewed("auto-1");

    expect(result).toEqual({ success: true });
  });
});
