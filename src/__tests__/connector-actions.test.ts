import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockPrisma,
  mockEncrypt,
  mockDecrypt,
  mockTestConnection,
  mockListWorkflows,
  mockGetWorkflow,
  mockGetRequiredSession,
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
  const mockTestConnection = vi.fn();
  const mockListWorkflows = vi.fn();
  const mockGetWorkflow = vi.fn();
  const mockGetRequiredSession = vi.fn().mockResolvedValue({
    user: { id: "user-1", workspaceId: "ws-1" },
  });
  return {
    mockPrisma,
    mockEncrypt,
    mockDecrypt,
    mockTestConnection,
    mockListWorkflows,
    mockGetWorkflow,
    mockGetRequiredSession,
  };
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

vi.mock("@/lib/encryption", () => ({
  encrypt: mockEncrypt,
  decrypt: mockDecrypt,
}));

vi.mock("@/lib/n8n-client", () => ({
  createN8nClient: vi.fn(() => ({
    testConnection: mockTestConnection,
    listWorkflows: mockListWorkflows,
    getWorkflow: mockGetWorkflow,
  })),
}));

import {
  saveConnectorConfig,
  testConnection,
  syncWorkflows,
} from "@/lib/actions/connector";

function createFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
}

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
    const fd = createFormData({ instanceUrl: "https://n8n.example.com", apiKey: "" });
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

  it("updates existing connector config", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue({
      id: "cc-existing",
      workspaceId: "ws-1",
      platform: "n8n",
    });
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-existing" });

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
      },
    });
    expect(mockPrisma.connectorConfig.create).not.toHaveBeenCalled();
  });
});

describe("testConnection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequiredSession.mockResolvedValue({
      user: { id: "user-1", workspaceId: "ws-1" },
    });
  });

  it("returns error when fields are empty", async () => {
    const fd = createFormData({ instanceUrl: "", apiKey: "" });
    const result = await testConnection(fd);
    expect(result).toEqual({
      error: "Instance URL and API key are required",
    });
  });

  it("returns success when connection succeeds", async () => {
    mockTestConnection.mockResolvedValue({ ok: true });

    const fd = createFormData({
      instanceUrl: "https://n8n.example.com",
      apiKey: "key123",
    });
    const result = await testConnection(fd);
    expect(result).toEqual({ success: true });
  });

  it("returns error when connection fails", async () => {
    mockTestConnection.mockResolvedValue({
      ok: false,
      error: "Invalid API key",
    });

    const fd = createFormData({
      instanceUrl: "https://n8n.example.com",
      apiKey: "bad-key",
    });
    const result = await testConnection(fd);
    expect(result).toEqual({ error: "Invalid API key" });
  });
});

describe("syncWorkflows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequiredSession.mockResolvedValue({
      user: { id: "user-1", workspaceId: "ws-1" },
    });
  });

  it("returns error when no connector is configured", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(null);

    const result = await syncWorkflows();
    expect(result).toEqual({
      error: "No n8n connector configured. Please save your connection settings first.",
    });
  });

  it("creates new automations for new workflows", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue({
      id: "cc-1",
      workspaceId: "ws-1",
      instanceUrl: "https://n8n.example.com",
      apiKeyEncrypted: "enc_key",
    });
    mockListWorkflows.mockResolvedValue([
      { id: "wf-1", name: "Workflow 1", active: true, updatedAt: "2025-01-01T00:00:00Z" },
    ]);
    mockGetWorkflow.mockResolvedValue({
      id: "wf-1",
      name: "Workflow 1",
      active: true,
      updatedAt: "2025-01-01T00:00:00Z",
      nodes: [],
    });
    mockPrisma.automation.findUnique.mockResolvedValue(null);
    mockPrisma.automation.findMany.mockResolvedValue([]);
    mockPrisma.automation.create.mockResolvedValue({ id: "auto-1" });
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    const result = await syncWorkflows();

    expect(result).toEqual({
      success: true,
      summary: { created: 1, updated: 0, unchanged: 0, removed: 0, errors: [] },
    });
    expect(mockDecrypt).toHaveBeenCalledWith("enc_key");
    expect(mockPrisma.automation.create).toHaveBeenCalledWith({
      data: {
        workspaceId: "ws-1",
        externalId: "wf-1",
        platform: "n8n",
        rawWorkflowJson: {
          id: "wf-1",
          name: "Workflow 1",
          active: true,
          updatedAt: "2025-01-01T00:00:00Z",
          nodes: [],
        },
        status: "active",
        automationLastUpdated: new Date("2025-01-01T00:00:00Z"),
      },
    });
  });

  it("updates automations when n8n has newer data", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue({
      id: "cc-1",
      workspaceId: "ws-1",
      instanceUrl: "https://n8n.example.com",
      apiKeyEncrypted: "enc_key",
    });
    mockListWorkflows.mockResolvedValue([
      { id: "wf-1", name: "Workflow 1", active: false, updatedAt: "2025-06-01T00:00:00Z" },
    ]);
    mockGetWorkflow.mockResolvedValue({
      id: "wf-1",
      name: "Workflow 1",
      active: false,
      updatedAt: "2025-06-01T00:00:00Z",
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

    const result = await syncWorkflows();

    expect(result).toEqual({
      success: true,
      summary: { created: 0, updated: 1, unchanged: 0, removed: 0, errors: [] },
    });
    expect(mockPrisma.automation.update).toHaveBeenCalledWith({
      where: { id: "auto-1" },
      data: {
        rawWorkflowJson: {
          id: "wf-1",
          name: "Workflow 1",
          active: false,
          updatedAt: "2025-06-01T00:00:00Z",
        },
        status: "inactive",
        automationLastUpdated: new Date("2025-06-01T00:00:00Z"),
      },
    });
  });

  it("counts unchanged automations when data has not changed", async () => {
    const sameDate = new Date("2025-01-01T00:00:00Z");

    mockPrisma.connectorConfig.findFirst.mockResolvedValue({
      id: "cc-1",
      workspaceId: "ws-1",
      instanceUrl: "https://n8n.example.com",
      apiKeyEncrypted: "enc_key",
    });
    mockListWorkflows.mockResolvedValue([
      { id: "wf-1", name: "Workflow 1", active: true, updatedAt: "2025-01-01T00:00:00Z" },
    ]);
    mockGetWorkflow.mockResolvedValue({
      id: "wf-1",
      name: "Workflow 1",
      active: true,
      updatedAt: "2025-01-01T00:00:00Z",
    });
    mockPrisma.automation.findUnique.mockResolvedValue({
      id: "auto-1",
      workspaceId: "ws-1",
      externalId: "wf-1",
      automationLastUpdated: sameDate,
    });
    mockPrisma.automation.findMany.mockResolvedValue([]);
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    const result = await syncWorkflows();

    expect(result).toEqual({
      success: true,
      summary: { created: 0, updated: 0, unchanged: 1, removed: 0, errors: [] },
    });
    expect(mockPrisma.automation.create).not.toHaveBeenCalled();
    // The connectorConfig.update for automation should not have been called
    // (only the one for lastSyncAt)
    expect(mockPrisma.automation.update).not.toHaveBeenCalled();
  });

  it("soft-removes automations no longer in n8n", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue({
      id: "cc-1",
      workspaceId: "ws-1",
      instanceUrl: "https://n8n.example.com",
      apiKeyEncrypted: "enc_key",
    });
    mockListWorkflows.mockResolvedValue([]);
    mockPrisma.automation.findMany.mockResolvedValue([
      { id: "auto-old", workspaceId: "ws-1", externalId: "wf-gone", status: "active" },
    ]);
    mockPrisma.automation.update.mockResolvedValue({ id: "auto-old" });
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    const result = await syncWorkflows();

    expect(result).toEqual({
      success: true,
      summary: { created: 0, updated: 0, unchanged: 0, removed: 1, errors: [] },
    });
    expect(mockPrisma.automation.update).toHaveBeenCalledWith({
      where: { id: "auto-old" },
      data: { status: "removed" },
    });
  });

  it("updates lastSyncAt on ConnectorConfig after sync", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue({
      id: "cc-1",
      workspaceId: "ws-1",
      instanceUrl: "https://n8n.example.com",
      apiKeyEncrypted: "enc_key",
    });
    mockListWorkflows.mockResolvedValue([]);
    mockPrisma.automation.findMany.mockResolvedValue([]);
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    await syncWorkflows();

    expect(mockPrisma.connectorConfig.update).toHaveBeenCalledWith({
      where: { id: "cc-1" },
      data: { lastSyncAt: expect.any(Date) },
    });
  });

  it("collects per-workflow errors and continues", async () => {
    mockPrisma.connectorConfig.findFirst.mockResolvedValue({
      id: "cc-1",
      workspaceId: "ws-1",
      instanceUrl: "https://n8n.example.com",
      apiKeyEncrypted: "enc_key",
    });
    mockListWorkflows.mockResolvedValue([
      { id: "wf-ok", name: "OK", active: true, updatedAt: "2025-01-01T00:00:00Z" },
      { id: "wf-bad", name: "Bad", active: true, updatedAt: "2025-01-01T00:00:00Z" },
    ]);
    mockGetWorkflow
      .mockResolvedValueOnce({
        id: "wf-ok",
        name: "OK",
        active: true,
        updatedAt: "2025-01-01T00:00:00Z",
      })
      .mockRejectedValueOnce(new Error("Network timeout"));

    mockPrisma.automation.findUnique.mockResolvedValue(null);
    mockPrisma.automation.create.mockResolvedValue({ id: "auto-1" });
    mockPrisma.automation.findMany.mockResolvedValue([]);
    mockPrisma.connectorConfig.update.mockResolvedValue({ id: "cc-1" });

    const result = await syncWorkflows();

    expect(result).toEqual({
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
});
