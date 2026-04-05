import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────

const {
  mockPrisma,
  mockEncrypt,
  mockDecrypt,
  mockGetRequiredSession,
  mockListWorkflows,
  mockGetWorkflow,
  mockFetchDiscover,
  mockFetchTags,
  mockFetchExecutions,
  mockFetchCredentials,
  mockFetchUsers,
  mockFetchProjects,
  mockFetchVariables,
  mockComputeExecutionStats,
} = vi.hoisted(() => {
  const mockPrisma = {
    connectorConfig: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    automation: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
  const mockEncrypt = vi.fn().mockReturnValue("encrypted_key");
  const mockDecrypt = vi.fn().mockReturnValue("decrypted_key");
  const mockGetRequiredSession = vi.fn().mockResolvedValue({
    user: { id: "user-1", workspaceId: "ws-1" },
  });
  const mockListWorkflows = vi.fn().mockResolvedValue([]);
  const mockGetWorkflow = vi.fn();
  const mockFetchDiscover = vi.fn().mockResolvedValue(null);
  const mockFetchTags = vi.fn().mockResolvedValue([]);
  const mockFetchExecutions = vi.fn().mockResolvedValue([]);
  const mockFetchCredentials = vi.fn().mockResolvedValue(null);
  const mockFetchUsers = vi.fn().mockResolvedValue(null);
  const mockFetchProjects = vi.fn().mockResolvedValue(null);
  const mockFetchVariables = vi.fn().mockResolvedValue(null);
  const mockComputeExecutionStats = vi.fn().mockReturnValue({
    runsPerWeek: null,
    errorRate: null,
    lastExecutedAt: null,
    avgDurationMs: null,
  });

  return {
    mockPrisma,
    mockEncrypt,
    mockDecrypt,
    mockGetRequiredSession,
    mockListWorkflows,
    mockGetWorkflow,
    mockFetchDiscover,
    mockFetchTags,
    mockFetchExecutions,
    mockFetchCredentials,
    mockFetchUsers,
    mockFetchProjects,
    mockFetchVariables,
    mockComputeExecutionStats,
  };
});

// ── Module mocks ──────────────────────────────────────

vi.mock("@/generated/prisma/client", () => ({
  PrismaClient: vi.fn(),
  Prisma: { DbNull: "DbNull", InputJsonValue: {} },
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

vi.mock("@/lib/encryption", () => ({
  encrypt: mockEncrypt,
  decrypt: mockDecrypt,
}));

vi.mock("@/lib/n8n-client", () => ({
  createN8nClient: vi.fn(() => ({
    testConnection: vi.fn(),
    listWorkflows: mockListWorkflows,
    getWorkflow: mockGetWorkflow,
    fetchDiscover: mockFetchDiscover,
    fetchTags: mockFetchTags,
    fetchExecutions: mockFetchExecutions,
    fetchCredentials: mockFetchCredentials,
    fetchUsers: mockFetchUsers,
    fetchProjects: mockFetchProjects,
    fetchVariables: mockFetchVariables,
  })),
}));

vi.mock("@/lib/execution-stats", () => ({
  computeExecutionStats: mockComputeExecutionStats,
}));

// ── Imports ───────────────────────────────────────────

import {
  saveConnectorConfig,
  verifyAndDiscover,
  updateSelectedTags,
  syncAndAnalyze,
} from "@/lib/actions/connector";

// ── Helpers ───────────────────────────────────────────

function createFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
}

function makeConfig(overrides: Record<string, unknown> = {}) {
  return {
    id: "cc-1",
    workspaceId: "ws-1",
    platform: "n8n",
    instanceUrl: "https://n8n.example.com",
    apiKeyEncrypted: "enc_key",
    selectedTags: [],
    discoveryData: null,
    lastSyncAt: null,
    ...overrides,
  };
}

function makeWorkflow(
  id: string,
  name: string,
  tags: Array<{ id: string; name: string }> = [],
  active = true
) {
  return {
    id,
    name,
    active,
    updatedAt: "2025-01-01T00:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    tags,
  };
}

// ── Tests ─────────────────────────────────────────────

describe("saveConnectorConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequiredSession.mockResolvedValue({
      user: { id: "user-1", workspaceId: "ws-1" },
    });
  });

  it("returns error when instanceUrl is empty", async () => {
    const fd = createFormData({ instanceUrl: "", apiKey: "key123" });
    const result = await saveConnectorConfig(fd);
    expect(result).toEqual({
      error: "Instance URL and API key are required",
    });
  });

  it("returns error when apiKey is empty", async () => {
    const fd = createFormData({
      instanceUrl: "https://n8n.example.com",
      apiKey: "",
    });
    const result = await saveConnectorConfig(fd);
    expect(result).toEqual({
      error: "Instance URL and API key are required",
    });
  });

  it("creates a new connector config when none exists", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(null);
    mockPrisma.connectorConfig.create.mockResolvedValue({ id: "cc-1" });

    const fd = createFormData({
      instanceUrl: "https://n8n.example.com",
      apiKey: "my-api-key",
    });
    const result = await saveConnectorConfig(fd);

    expect(result).toEqual({ success: true });
    expect(mockEncrypt).toHaveBeenCalledWith("my-api-key");
    expect(mockPrisma.connectorConfig.create).toHaveBeenCalledWith({
      data: {
        workspaceId: "ws-1",
        platform: "n8n",
        instanceUrl: "https://n8n.example.com",
        apiKeyEncrypted: "encrypted_key",
      },
    });
  });

  it("updates existing config and clears discoveryData + selectedTags", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue({
      id: "cc-existing",
      workspaceId: "ws-1",
      platform: "n8n",
    });
    mockPrisma.connectorConfig.update.mockResolvedValue({
      id: "cc-existing",
    });

    const fd = createFormData({
      instanceUrl: "https://n8n-new.example.com",
      apiKey: "new-key",
    });
    const result = await saveConnectorConfig(fd);

    expect(result).toEqual({ success: true });
    expect(mockPrisma.connectorConfig.update).toHaveBeenCalledWith({
      where: { id: "cc-existing" },
      data: {
        instanceUrl: "https://n8n-new.example.com",
        apiKeyEncrypted: "encrypted_key",
        discoveryData: "DbNull",
        selectedTags: [],
      },
    });
    expect(mockPrisma.connectorConfig.create).not.toHaveBeenCalled();
  });
});

describe("verifyAndDiscover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequiredSession.mockResolvedValue({
      user: { id: "user-1", workspaceId: "ws-1" },
    });
  });

  it("returns error when no connector is configured", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(null);

    const result = await verifyAndDiscover();
    expect(result).toEqual({
      error:
        "No n8n connector configured. Please save your connection settings first.",
    });
  });

  it("groups workflows by tags correctly", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(makeConfig());
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    const workflows = [
      makeWorkflow("wf-1", "Lead Sync", [
        { id: "tag-1", name: "Sales" },
      ]),
      makeWorkflow("wf-2", "Deal Alert", [
        { id: "tag-1", name: "Sales" },
      ]),
      makeWorkflow("wf-3", "Invoice Gen", [
        { id: "tag-2", name: "Finance" },
      ]),
      makeWorkflow("wf-4", "Misc Task"),
    ];
    mockListWorkflows.mockResolvedValue(workflows);
    mockFetchDiscover.mockResolvedValue({ data: { scopes: [] } });
    mockFetchTags.mockResolvedValue([
      { id: "tag-1", name: "Sales" },
      { id: "tag-2", name: "Finance" },
    ]);

    const result = await verifyAndDiscover();

    expect(result).toEqual({
      success: true,
      totalWorkflows: 4,
      tags: expect.arrayContaining([
        {
          id: "tag-1",
          name: "Sales",
          workflowCount: 2,
          workflowNames: ["Lead Sync", "Deal Alert"],
        },
        {
          id: "tag-2",
          name: "Finance",
          workflowCount: 1,
          workflowNames: ["Invoice Gen"],
        },
        {
          id: null,
          name: "Untagged",
          workflowCount: 1,
          workflowNames: ["Misc Task"],
        },
      ]),
    });
  });

  it("handles workflows with no tags — all untagged", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(makeConfig());
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    mockListWorkflows.mockResolvedValue([
      makeWorkflow("wf-1", "Workflow A"),
      makeWorkflow("wf-2", "Workflow B"),
    ]);
    mockFetchTags.mockResolvedValue([]);

    const result = await verifyAndDiscover();

    expect(result).toMatchObject({
      success: true,
      totalWorkflows: 2,
      tags: [
        {
          id: null,
          name: "Untagged",
          workflowCount: 2,
          workflowNames: ["Workflow A", "Workflow B"],
        },
      ],
    });
  });

  it("limits workflowNames to first 5 for preview", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(makeConfig());
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    const workflows = Array.from({ length: 8 }, (_, i) =>
      makeWorkflow(`wf-${i}`, `Workflow ${i}`, [
        { id: "tag-1", name: "Ops" },
      ])
    );
    mockListWorkflows.mockResolvedValue(workflows);
    mockFetchTags.mockResolvedValue([{ id: "tag-1", name: "Ops" }]);

    const result = await verifyAndDiscover();

    const opsTag = (result as { tags: Array<{ name: string; workflowNames: string[] }> }).tags.find(
      (t) => t.name === "Ops"
    );
    expect(opsTag?.workflowNames).toHaveLength(5);
  });

  it("persists discoveryData to ConnectorConfig", async () => {
    const discovery = { data: { scopes: ["workflow:read"] } };
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(makeConfig());
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });
    mockFetchDiscover.mockResolvedValue(discovery);
    mockListWorkflows.mockResolvedValue([]);
    mockFetchTags.mockResolvedValue([]);

    await verifyAndDiscover();

    expect(mockPrisma.connectorConfig.update).toHaveBeenCalledWith({
      where: { id: "cc-1" },
      data: {
        discoveryData: {
          raw: discovery,
          tags: [],
          totalWorkflows: 0,
        },
      },
    });
  });

  it("handles null discoveryData gracefully", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(makeConfig());
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });
    mockFetchDiscover.mockResolvedValue(null);
    mockListWorkflows.mockResolvedValue([]);
    mockFetchTags.mockResolvedValue([]);

    const result = await verifyAndDiscover();

    expect(result).toMatchObject({ success: true, totalWorkflows: 0 });
    expect(mockPrisma.connectorConfig.update).toHaveBeenCalledWith({
      where: { id: "cc-1" },
      data: {
        discoveryData: {
          raw: null,
          tags: [],
          totalWorkflows: 0,
        },
      },
    });
  });
});

describe("updateSelectedTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequiredSession.mockResolvedValue({
      user: { id: "user-1", workspaceId: "ws-1" },
    });
  });

  it("returns error when no connector is configured", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(null);

    const result = await updateSelectedTags(["Sales"]);
    expect(result).toEqual({
      error:
        "No n8n connector configured. Please save your connection settings first.",
    });
  });

  it("persists tag selection", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(makeConfig());
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    const result = await updateSelectedTags(["Sales", "Finance"]);

    expect(result).toEqual({ success: true });
    expect(mockPrisma.connectorConfig.update).toHaveBeenCalledWith({
      where: { id: "cc-1" },
      data: { selectedTags: ["Sales", "Finance"] },
    });
  });

  it("persists untagged selection", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(makeConfig());
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    const result = await updateSelectedTags(["__untagged__", "Sales"]);

    expect(result).toEqual({ success: true });
    expect(mockPrisma.connectorConfig.update).toHaveBeenCalledWith({
      where: { id: "cc-1" },
      data: { selectedTags: ["__untagged__", "Sales"] },
    });
  });
});

describe("syncAndAnalyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequiredSession.mockResolvedValue({
      user: { id: "user-1", workspaceId: "ws-1" },
    });
    mockFetchCredentials.mockResolvedValue(null);
    mockFetchUsers.mockResolvedValue(null);
    mockFetchProjects.mockResolvedValue(null);
    mockFetchVariables.mockResolvedValue(null);
  });

  it("returns error when no connector is configured", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(null);

    const result = await syncAndAnalyze();
    expect(result).toEqual({
      error:
        "No n8n connector configured. Please save your connection settings first.",
    });
  });

  it("creates new automations with execution stats", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(makeConfig());
    mockListWorkflows.mockResolvedValue([
      makeWorkflow("wf-1", "Lead Sync"),
    ]);
    mockGetWorkflow.mockResolvedValue({
      id: "wf-1",
      name: "Lead Sync",
      active: true,
      updatedAt: "2025-01-01T00:00:00Z",
      nodes: [],
    });
    mockFetchExecutions.mockResolvedValue([
      {
        id: 1,
        status: "success",
        startedAt: "2025-01-01T00:00:00Z",
        stoppedAt: "2025-01-01T00:01:00Z",
        mode: "trigger",
      },
    ]);
    mockComputeExecutionStats.mockReturnValue({
      runsPerWeek: 7,
      errorRate: 0,
      lastExecutedAt: new Date("2025-01-01T00:00:00Z"),
      avgDurationMs: 60000,
    });
    mockPrisma.automation.findUnique.mockResolvedValue(null);
    mockPrisma.automation.findMany.mockResolvedValue([]);
    mockPrisma.automation.create.mockResolvedValue({ id: "auto-1" });
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    const result = await syncAndAnalyze();

    expect(result).toMatchObject({
      success: true,
      summary: {
        created: 1,
        updated: 0,
        unchanged: 0,
        removed: 0,
        errors: [],
      },
    });
    expect(mockPrisma.automation.create).toHaveBeenCalledWith({
      data: {
        workspaceId: "ws-1",
        externalId: "wf-1",
        platform: "n8n",
        name: "Lead Sync",
        rawWorkflowJson: {
          id: "wf-1",
          name: "Lead Sync",
          active: true,
          updatedAt: "2025-01-01T00:00:00Z",
          nodes: [],
        },
        status: "active",
        automationLastUpdated: new Date("2025-01-01T00:00:00Z"),
        isRemoved: false,
        analysisStatus: null,
        runsPerWeek: 7,
        errorRate: 0,
        lastExecutedAt: new Date("2025-01-01T00:00:00Z"),
        avgDurationMs: 60000,
      },
    });
  });

  it("updates automations when n8n has newer data", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(makeConfig());
    mockListWorkflows.mockResolvedValue([
      makeWorkflow("wf-1", "Lead Sync", [], false),
    ]);
    mockGetWorkflow.mockResolvedValue({
      id: "wf-1",
      name: "Lead Sync Updated",
      active: false,
      updatedAt: "2025-06-01T00:00:00Z",
    });
    mockFetchExecutions.mockResolvedValue([]);
    mockComputeExecutionStats.mockReturnValue({
      runsPerWeek: null,
      errorRate: null,
      lastExecutedAt: null,
      avgDurationMs: null,
    });
    mockPrisma.automation.findUnique.mockResolvedValue({
      id: "auto-1",
      workspaceId: "ws-1",
      externalId: "wf-1",
      automationLastUpdated: new Date("2025-01-01T00:00:00Z"),
    });
    mockPrisma.automation.findMany.mockResolvedValue([]);
    mockPrisma.automation.update.mockResolvedValue({ id: "auto-1" });
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    const result = await syncAndAnalyze();

    expect(result).toMatchObject({
      success: true,
      summary: { created: 0, updated: 1, unchanged: 0, removed: 0 },
    });
    expect(mockPrisma.automation.update).toHaveBeenCalledWith({
      where: { id: "auto-1" },
      data: {
        rawWorkflowJson: {
          id: "wf-1",
          name: "Lead Sync Updated",
          active: false,
          updatedAt: "2025-06-01T00:00:00Z",
        },
        name: "Lead Sync Updated",
        status: "inactive",
        automationLastUpdated: new Date("2025-06-01T00:00:00Z"),
        isRemoved: false,
        analysisStatus: null,
        runsPerWeek: null,
        errorRate: null,
        lastExecutedAt: null,
        avgDurationMs: null,
      },
    });
  });

  it("updates execution stats even for unchanged workflows", async () => {
    const sameDate = new Date("2025-01-01T00:00:00Z");

    mockPrisma.connectorConfig.findFirst.mockResolvedValue(makeConfig());
    mockListWorkflows.mockResolvedValue([
      makeWorkflow("wf-1", "Lead Sync"),
    ]);
    mockGetWorkflow.mockResolvedValue({
      id: "wf-1",
      name: "Lead Sync",
      active: true,
      updatedAt: "2025-01-01T00:00:00Z",
    });
    mockFetchExecutions.mockResolvedValue([]);
    mockComputeExecutionStats.mockReturnValue({
      runsPerWeek: 14,
      errorRate: 0.1,
      lastExecutedAt: new Date("2025-01-15T00:00:00Z"),
      avgDurationMs: 5000,
    });
    mockPrisma.automation.findUnique.mockResolvedValue({
      id: "auto-1",
      workspaceId: "ws-1",
      externalId: "wf-1",
      automationLastUpdated: sameDate,
    });
    mockPrisma.automation.findMany.mockResolvedValue([]);
    mockPrisma.automation.update.mockResolvedValue({ id: "auto-1" });
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    const result = await syncAndAnalyze();

    expect(result).toMatchObject({
      success: true,
      summary: { created: 0, updated: 0, unchanged: 1, removed: 0 },
    });
    // Still updates execution stats
    expect(mockPrisma.automation.update).toHaveBeenCalledWith({
      where: { id: "auto-1" },
      data: {
        isRemoved: false,
        runsPerWeek: 14,
        errorRate: 0.1,
        lastExecutedAt: new Date("2025-01-15T00:00:00Z"),
        avgDurationMs: 5000,
      },
    });
  });

  it("flags removed workflows with isRemoved: true", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(makeConfig());
    mockListWorkflows.mockResolvedValue([]);
    mockPrisma.automation.findMany.mockResolvedValue([
      {
        id: "auto-old",
        workspaceId: "ws-1",
        externalId: "wf-gone",
        isRemoved: false,
      },
    ]);
    mockPrisma.automation.update.mockResolvedValue({ id: "auto-old" });
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    const result = await syncAndAnalyze();

    expect(result).toMatchObject({
      success: true,
      summary: { created: 0, updated: 0, unchanged: 0, removed: 1 },
    });
    expect(mockPrisma.automation.update).toHaveBeenCalledWith({
      where: { id: "auto-old" },
      data: { isRemoved: true },
    });
  });

  it("updates lastSyncAt after sync", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(makeConfig());
    mockListWorkflows.mockResolvedValue([]);
    mockPrisma.automation.findMany.mockResolvedValue([]);
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    await syncAndAnalyze();

    expect(mockPrisma.connectorConfig.update).toHaveBeenCalledWith({
      where: { id: "cc-1" },
      data: { lastSyncAt: expect.any(Date) },
    });
  });

  it("collects per-workflow errors and continues", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(makeConfig());
    mockListWorkflows.mockResolvedValue([
      makeWorkflow("wf-ok", "OK Workflow"),
      makeWorkflow("wf-bad", "Bad Workflow"),
    ]);
    mockGetWorkflow
      .mockResolvedValueOnce({
        id: "wf-ok",
        name: "OK Workflow",
        active: true,
        updatedAt: "2025-01-01T00:00:00Z",
      })
      .mockRejectedValueOnce(new Error("Network timeout"));
    mockFetchExecutions.mockResolvedValue([]);
    mockComputeExecutionStats.mockReturnValue({
      runsPerWeek: null,
      errorRate: null,
      lastExecutedAt: null,
      avgDurationMs: null,
    });
    mockPrisma.automation.findUnique.mockResolvedValue(null);
    mockPrisma.automation.create.mockResolvedValue({ id: "auto-1" });
    mockPrisma.automation.findMany.mockResolvedValue([]);
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    const result = await syncAndAnalyze();

    expect(result).toMatchObject({
      success: true,
      summary: {
        created: 1,
        updated: 0,
        unchanged: 0,
        removed: 0,
        errors: ["Workflow wf-bad: Network timeout"],
      },
    });
  });

  it("reports enrichment endpoint availability", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(makeConfig());
    mockListWorkflows.mockResolvedValue([]);
    mockPrisma.automation.findMany.mockResolvedValue([]);
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    // Credentials and users succeed; projects and variables return null (403)
    mockFetchCredentials.mockResolvedValue([{ id: "cred-1" }]);
    mockFetchUsers.mockResolvedValue([{ id: "user-1" }]);
    mockFetchProjects.mockResolvedValue(null);
    mockFetchVariables.mockResolvedValue(null);

    const result = await syncAndAnalyze();

    expect(result).toMatchObject({
      success: true,
      summary: {
        enrichment: {
          credentials: true,
          users: true,
          projects: false,
          variables: false,
        },
      },
    });
  });

  it("sync succeeds even when all enrichment endpoints return 403", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(makeConfig());
    mockListWorkflows.mockResolvedValue([]);
    mockPrisma.automation.findMany.mockResolvedValue([]);
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    mockFetchCredentials.mockResolvedValue(null);
    mockFetchUsers.mockResolvedValue(null);
    mockFetchProjects.mockResolvedValue(null);
    mockFetchVariables.mockResolvedValue(null);

    const result = await syncAndAnalyze();

    expect(result).toMatchObject({
      success: true,
      summary: {
        enrichment: {
          credentials: false,
          users: false,
          projects: false,
          variables: false,
        },
      },
    });
  });

  it("filters workflows by selected tags (server-side)", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(
      makeConfig({ selectedTags: ["Sales"] })
    );
    mockListWorkflows.mockResolvedValue([]);
    mockPrisma.automation.findMany.mockResolvedValue([]);
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    await syncAndAnalyze();

    // listWorkflows should be called with tag names
    expect(mockListWorkflows).toHaveBeenCalledWith(["Sales"]);
  });

  it("fetches all workflows when __untagged__ is selected alongside tags", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(
      makeConfig({ selectedTags: ["__untagged__", "Sales"] })
    );

    const allWorkflows = [
      makeWorkflow("wf-1", "Lead Sync", [
        { id: "tag-1", name: "Sales" },
      ]),
      makeWorkflow("wf-2", "Misc", []),
      makeWorkflow("wf-3", "Finance Op", [
        { id: "tag-2", name: "Finance" },
      ]),
    ];
    mockListWorkflows.mockResolvedValue(allWorkflows);

    // Mock getWorkflow for included workflows (wf-1 = Sales, wf-2 = untagged)
    mockGetWorkflow
      .mockResolvedValueOnce({
        id: "wf-1",
        name: "Lead Sync",
        active: true,
        updatedAt: "2025-01-01T00:00:00Z",
      })
      .mockResolvedValueOnce({
        id: "wf-2",
        name: "Misc",
        active: true,
        updatedAt: "2025-01-01T00:00:00Z",
      });
    mockFetchExecutions.mockResolvedValue([]);
    mockComputeExecutionStats.mockReturnValue({
      runsPerWeek: null,
      errorRate: null,
      lastExecutedAt: null,
      avgDurationMs: null,
    });
    mockPrisma.automation.findUnique.mockResolvedValue(null);
    mockPrisma.automation.create.mockResolvedValue({ id: "auto-new" });
    mockPrisma.automation.findMany.mockResolvedValue([]);
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    const result = await syncAndAnalyze();

    // listWorkflows should be called without tags (fetch all for client-side filter)
    expect(mockListWorkflows).toHaveBeenCalledWith();

    // wf-3 (Finance) should be excluded — only wf-1 (Sales) and wf-2 (untagged) included
    expect(result).toMatchObject({
      success: true,
      summary: { created: 2, updated: 0, unchanged: 0, removed: 0 },
    });
    expect(mockGetWorkflow).toHaveBeenCalledTimes(2);
    expect(mockGetWorkflow).toHaveBeenCalledWith("wf-1");
    expect(mockGetWorkflow).toHaveBeenCalledWith("wf-2");
  });

  it("passes execution data to computeExecutionStats", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(makeConfig());
    mockListWorkflows.mockResolvedValue([
      makeWorkflow("wf-1", "Test"),
    ]);
    mockGetWorkflow.mockResolvedValue({
      id: "wf-1",
      name: "Test",
      active: true,
      updatedAt: "2025-01-01T00:00:00Z",
    });
    const executions = [
      {
        id: 1,
        status: "success",
        startedAt: "2025-01-01T00:00:00Z",
        stoppedAt: "2025-01-01T00:01:00Z",
        mode: "trigger",
      },
      {
        id: 2,
        status: "error",
        startedAt: "2025-01-02T00:00:00Z",
        stoppedAt: "2025-01-02T00:00:30Z",
        mode: "trigger",
      },
    ];
    mockFetchExecutions.mockResolvedValue(executions);
    mockComputeExecutionStats.mockReturnValue({
      runsPerWeek: 2,
      errorRate: 0.5,
      lastExecutedAt: new Date("2025-01-02T00:00:00Z"),
      avgDurationMs: 45000,
    });
    mockPrisma.automation.findUnique.mockResolvedValue(null);
    mockPrisma.automation.create.mockResolvedValue({ id: "auto-1" });
    mockPrisma.automation.findMany.mockResolvedValue([]);
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    await syncAndAnalyze();

    expect(mockComputeExecutionStats).toHaveBeenCalledWith(executions);
    expect(mockFetchExecutions).toHaveBeenCalledWith("wf-1", 250);
  });

  it("fetches all workflows when selectedTags is empty", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(
      makeConfig({ selectedTags: [] })
    );
    mockListWorkflows.mockResolvedValue([]);
    mockPrisma.automation.findMany.mockResolvedValue([]);
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    await syncAndAnalyze();

    // No tags → fetch all
    expect(mockListWorkflows).toHaveBeenCalledWith();
  });
});
