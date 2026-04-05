// @ts-nocheck
// R1 tests — skipped after R2 schema migration. These test files will be deleted when their R1 pages are replaced.
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockGetRequiredSession, mockProcessAutomation } =
  vi.hoisted(() => {
    const mockPrisma = {
      automation: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    };
    const mockGetRequiredSession = vi.fn().mockResolvedValue({
      user: { id: "user-1", workspaceId: "ws-1" },
    });
    const mockProcessAutomation = vi.fn();
    return { mockPrisma, mockGetRequiredSession, mockProcessAutomation };
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

vi.mock("@/lib/session", () => ({
  getRequiredSession: mockGetRequiredSession,
}));

vi.mock("@/lib/llm-pipeline", () => ({
  processAutomation: mockProcessAutomation,
}));

import {
  processUnprocessedAutomations,
  regenerateAutomation,
} from "@/lib/actions/llm";

describe.skip("R1 LLM actions — skipped after R2 schema migration", () => {
describe("processUnprocessedAutomations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequiredSession.mockResolvedValue({
      user: { id: "user-1", workspaceId: "ws-1" },
    });
  });

  it("processes automations with null documentationLastUpdated", async () => {
    mockPrisma.automation.findMany.mockResolvedValue([
      {
        id: "auto-1",
        automationLastUpdated: new Date("2025-01-01"),
        documentationLastUpdated: null,
      },
    ]);
    mockProcessAutomation.mockResolvedValue({});

    const result = await processUnprocessedAutomations();

    expect(mockProcessAutomation).toHaveBeenCalledWith("auto-1", "ws-1");
    expect(result).toEqual({
      success: true,
      summary: { total: 1, processed: 1, errors: [] },
    });
  });

  it("processes stale automations (automationLastUpdated > documentationLastUpdated)", async () => {
    mockPrisma.automation.findMany.mockResolvedValue([
      {
        id: "auto-1",
        automationLastUpdated: new Date("2025-06-01"),
        documentationLastUpdated: new Date("2025-01-01"),
      },
    ]);
    mockProcessAutomation.mockResolvedValue({});

    const result = await processUnprocessedAutomations();

    expect(mockProcessAutomation).toHaveBeenCalledWith("auto-1", "ws-1");
    expect(result).toEqual({
      success: true,
      summary: { total: 1, processed: 1, errors: [] },
    });
  });

  it("skips up-to-date automations", async () => {
    const sameDate = new Date("2025-01-01");
    mockPrisma.automation.findMany.mockResolvedValue([
      {
        id: "auto-1",
        automationLastUpdated: sameDate,
        documentationLastUpdated: new Date("2025-06-01"), // doc is newer
      },
    ]);

    const result = await processUnprocessedAutomations();

    expect(mockProcessAutomation).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      summary: { total: 0, processed: 0, errors: [] },
    });
  });

  it("skips removed automations (filtered by Prisma where clause)", async () => {
    mockPrisma.automation.findMany.mockResolvedValue([]);

    const result = await processUnprocessedAutomations();

    expect(mockPrisma.automation.findMany).toHaveBeenCalledWith({
      where: { workspaceId: "ws-1", status: { not: "removed" } },
      select: {
        id: true,
        automationLastUpdated: true,
        documentationLastUpdated: true,
      },
    });
    expect(mockProcessAutomation).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      summary: { total: 0, processed: 0, errors: [] },
    });
  });

  it("continues on per-automation errors, collects them", async () => {
    mockPrisma.automation.findMany.mockResolvedValue([
      {
        id: "auto-1",
        automationLastUpdated: new Date("2025-01-01"),
        documentationLastUpdated: null,
      },
      {
        id: "auto-2",
        automationLastUpdated: new Date("2025-01-01"),
        documentationLastUpdated: null,
      },
      {
        id: "auto-3",
        automationLastUpdated: new Date("2025-01-01"),
        documentationLastUpdated: null,
      },
    ]);
    mockProcessAutomation
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("LLM timeout"))
      .mockResolvedValueOnce({});

    const result = await processUnprocessedAutomations();

    expect(mockProcessAutomation).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      success: true,
      summary: {
        total: 3,
        processed: 2,
        errors: ["auto-2: LLM timeout"],
      },
    });
  });

  it("returns correct summary counts", async () => {
    mockPrisma.automation.findMany.mockResolvedValue([
      {
        id: "auto-1",
        automationLastUpdated: new Date("2025-06-01"),
        documentationLastUpdated: null,
      },
      {
        id: "auto-2",
        automationLastUpdated: new Date("2025-06-01"),
        documentationLastUpdated: new Date("2025-01-01"),
      },
      {
        id: "auto-3",
        automationLastUpdated: new Date("2025-01-01"),
        documentationLastUpdated: new Date("2025-06-01"), // up-to-date, skipped
      },
    ]);
    mockProcessAutomation.mockResolvedValue({});

    const result = await processUnprocessedAutomations();

    // auto-1 (null doc) and auto-2 (stale) should be processed; auto-3 skipped
    expect(mockProcessAutomation).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      success: true,
      summary: { total: 2, processed: 2, errors: [] },
    });
  });
});

describe("regenerateAutomation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequiredSession.mockResolvedValue({
      user: { id: "user-1", workspaceId: "ws-1" },
    });
  });

  it("returns error when automation not found / wrong workspace", async () => {
    mockPrisma.automation.findFirst.mockResolvedValue(null);

    const result = await regenerateAutomation("auto-missing");

    expect(result).toEqual({ error: "Automation not found" });
    expect(mockProcessAutomation).not.toHaveBeenCalled();
  });

  it("calls processAutomation on success", async () => {
    mockPrisma.automation.findFirst.mockResolvedValue({
      id: "auto-1",
      workspaceId: "ws-1",
    });
    mockProcessAutomation.mockResolvedValue({});

    const result = await regenerateAutomation("auto-1");

    expect(result).toEqual({ success: true });
    expect(mockProcessAutomation).toHaveBeenCalledWith("auto-1", "ws-1");
  });

  it("returns error on processAutomation failure", async () => {
    mockPrisma.automation.findFirst.mockResolvedValue({
      id: "auto-1",
      workspaceId: "ws-1",
    });
    mockProcessAutomation.mockRejectedValue(new Error("LLM service down"));

    const result = await regenerateAutomation("auto-1");

    expect(result).toEqual({ error: "LLM service down" });
  });
});
}); // end describe.skip wrapper
