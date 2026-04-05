import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────

const {
  mockPrisma,
  mockAnalyzeAutomation,
  mockAnalyzeWorkspace,
  mockResolveDeterministicConnections,
  mockMergeLlmConnections,
  mockMergeConnectionUpdates,
  mockCaptureSnapshot,
  mockGenerateDeltaSummary,
} = vi.hoisted(() => {
  const mockPrisma = {
    companyProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    automation: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    recommendation: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    processSuggestion: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    businessProcess: {
      count: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    connectorConfig: {
      findFirst: vi.fn(),
    },
  };

  return {
    mockPrisma,
    mockAnalyzeAutomation: vi.fn(),
    mockAnalyzeWorkspace: vi.fn(),
    mockResolveDeterministicConnections: vi.fn().mockReturnValue([]),
    mockMergeLlmConnections: vi.fn().mockReturnValue([]),
    mockMergeConnectionUpdates: vi.fn().mockReturnValue([]),
    mockCaptureSnapshot: vi.fn().mockReturnValue({ analyzedAt: new Date(), automations: [], recommendations: [], automationCount: 0, activeCount: 0, recommendationCount: 0, processCount: 0 }),
    mockGenerateDeltaSummary: vi.fn().mockReturnValue(null),
  };
});

vi.mock("@/generated/prisma/client", () => ({
  PrismaClient: vi.fn(),
  Prisma: { InputJsonValue: {} },
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/llm-pipeline", () => ({
  analyzeAutomation: mockAnalyzeAutomation,
  analyzeWorkspace: mockAnalyzeWorkspace,
}));

vi.mock("@/lib/connected-automations", () => ({
  resolveDeterministicConnections: mockResolveDeterministicConnections,
  mergeLlmConnections: mockMergeLlmConnections,
  mergeConnectionUpdates: mockMergeConnectionUpdates,
}));

vi.mock("@/lib/delta-generation", () => ({
  captureSnapshot: mockCaptureSnapshot,
  generateDeltaSummary: mockGenerateDeltaSummary,
}));

import { runAnalysisPipeline } from "@/lib/actions/analysis";
import type { PerAutomationResult, WorkspaceResult } from "@/lib/llm-pipeline";

// ── Test data ─────────────────────────────────────────

function makeAutomation(id: string, externalId: string, name: string) {
  return {
    id,
    externalId,
    name,
    workspaceId: "ws-1",
    platform: "n8n",
    rawWorkflowJson: { nodes: [] },
    status: "active",
    isRemoved: false,
    runsPerWeek: 10,
    errorRate: 0.05,
    lastExecutedAt: new Date("2025-01-01"),
    avgDurationMs: 1500,
    automationLastUpdated: new Date("2025-01-01"),
    businessNarrative: null,
    trigger: null,
    triggerType: null,
    systemsTouched: [],
    dataFlow: null,
    stepName: null,
    impact: null,
    detectability: null,
    timeSavingsEstimate: null,
    revenueImpactEstimate: null,
    technicalEvidence: null,
    processId: null,
    upstreamIds: [],
    downstreamIds: [],
    analysisStatus: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makePerAutomationResult(name: string): PerAutomationResult {
  return {
    reasoning: "Test reasoning",
    businessNarrative: `${name} does something important`,
    trigger: "When triggered",
    triggerType: "webhook",
    systemsTouched: ["slack", "salesforce"],
    dataFlow: "Data flows in and out",
    stepName: "Step 1",
    impact: {
      reasoning: "Impact reasoning",
      level: "high",
      failureScenario: "Things break",
      revenueConnection: "Revenue impact",
    },
    detectability: {
      reasoning: "Detect reasoning",
      level: "monitored",
      evidence: "Has error handling",
    },
    timeSavingsEstimate: "5-10 hours/week",
    revenueImpactEstimate: "$10k-50k/month",
    technicalEvidence: {
      errorHandling: "Try-catch",
      credentials: ["slack-api"],
      complexity: "Medium",
      keyFindings: ["Uses webhook trigger"],
    },
  };
}

function makeWorkspaceResult(): WorkspaceResult {
  return {
    reasoning: "Workspace reasoning",
    processes: [
      {
        name: "Lead Management",
        summary: "Manages leads end to end",
        workflows: ["ext-1", "ext-2"],
        steps: [
          { name: "Capture", isAutomated: true, isGap: false, automationExternalId: "ext-1" },
          { name: "Qualify", isAutomated: true, isGap: false, automationExternalId: "ext-2" },
        ],
        maturityLevel: "Established",
        valueAtStake: "$100k/year",
      },
    ],
    systemLandscape: [
      { name: "slack", workflowCount: 2 },
      { name: "salesforce", workflowCount: 1 },
    ],
    connectedAutomations: [
      {
        fromExternalId: "ext-1",
        toExternalId: "ext-2",
        connectionType: "data-flow",
        description: "Lead data flows from capture to qualify",
      },
    ],
    recommendations: [
      {
        type: "fix",
        tier: "Investigate",
        name: "Add error monitoring",
        brief: "Setup alerting",
        businessCase: "Reduce downtime",
        confidence: "data-driven",
        evidenceChain: "Error rate is 5%",
        honestFraming: "Based on observed data",
        affectedScope: "Lead Management",
        impactEstimate: "Reduce errors by 50%",
        implementationNotes: "Add Slack alerts",
      },
      {
        type: "build",
        tier: "Act Now",
        name: "Critical fix",
        brief: "Fix urgent issue",
        businessCase: "Prevent revenue loss",
        confidence: "data-driven",
        evidenceChain: "Direct evidence",
        honestFraming: "High confidence",
        affectedScope: "Lead Management",
        impactEstimate: "Prevent $50k loss",
        implementationNotes: "Quick fix",
      },
      {
        type: "connect",
        tier: "Explore",
        name: "Explore CRM integration",
        brief: "Connect CRM",
        businessCase: "Better visibility",
        confidence: "ai-suggested",
        evidenceChain: "No direct evidence",
        honestFraming: "Speculative",
        affectedScope: "Lead Management",
        impactEstimate: "Unknown",
        implementationNotes: "Research needed",
      },
    ],
    processSuggestions: [
      {
        name: "Customer Onboarding",
        description: "Automate customer onboarding flow",
        basedOn: "Lead Management patterns",
        businessCase: "Reduce onboarding time",
        connectedSystems: ["slack", "salesforce"],
        childRecommendationNames: ["Explore CRM integration"],
      },
    ],
    aggregateEstimates: {
      totalTimeSavings: "15-25 hours/week",
      totalValueAtRisk: "$200k/year",
      totalOpportunityValue: "$500k/year",
    },
    nextMove: {
      text: "Fix the critical issue first",
      reasoning: "Highest ROI action",
    },
  };
}

// ── Tests ─────────────────────────────────────────────

describe("runAnalysisPipeline", () => {
  const WORKSPACE_ID = "ws-1";

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: no existing profile
    mockPrisma.companyProfile.findUnique.mockResolvedValue(null);
    mockPrisma.companyProfile.create.mockResolvedValue({
      id: "cp-1",
      workspaceId: WORKSPACE_ID,
      analysisStatus: "pending",
      analyzedAt: null,
    });
    mockPrisma.companyProfile.update.mockResolvedValue({});

    // Default: cleanup operations succeed
    mockPrisma.recommendation.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.processSuggestion.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.businessProcess.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.automation.updateMany.mockResolvedValue({ count: 0 });

    // Default: no connector config
    mockPrisma.connectorConfig.findFirst.mockResolvedValue(null);

    // Default: DB creates return ids
    let processCounter = 0;
    mockPrisma.businessProcess.create.mockImplementation(() => {
      processCounter++;
      return Promise.resolve({ id: `proc-${processCounter}` });
    });

    let recCounter = 0;
    mockPrisma.recommendation.create.mockImplementation(() => {
      recCounter++;
      return Promise.resolve({ id: `rec-${recCounter}` });
    });

    let psCounter = 0;
    mockPrisma.processSuggestion.create.mockImplementation(() => {
      psCounter++;
      return Promise.resolve({ id: `ps-${psCounter}` });
    });

    mockPrisma.automation.update.mockResolvedValue({});
  });

  it("runs full pipeline for 2 automations and creates all DB records", async () => {
    const auto1 = makeAutomation("auto-1", "ext-1", "Lead Capture");
    const auto2 = makeAutomation("auto-2", "ext-2", "Lead Qualify");

    mockPrisma.automation.findMany.mockResolvedValue([auto1, auto2]);

    const result1 = makePerAutomationResult("Lead Capture");
    const result2 = makePerAutomationResult("Lead Qualify");
    mockAnalyzeAutomation
      .mockResolvedValueOnce(result1)
      .mockResolvedValueOnce(result2);

    mockAnalyzeWorkspace.mockResolvedValue(makeWorkspaceResult());

    const result = await runAnalysisPipeline(WORKSPACE_ID);

    expect(result).toEqual({ success: true });

    // Should have called analyzeAutomation for each automation
    expect(mockAnalyzeAutomation).toHaveBeenCalledTimes(2);

    // Should have called analyzeWorkspace once
    expect(mockAnalyzeWorkspace).toHaveBeenCalledTimes(1);

    // Should have updated each automation with LLM results
    expect(mockPrisma.automation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "auto-1" },
        data: expect.objectContaining({
          businessNarrative: result1.businessNarrative,
          trigger: result1.trigger,
          triggerType: result1.triggerType,
          analysisStatus: "complete",
        }),
      }),
    );

    // Should have created BusinessProcess records
    expect(mockPrisma.businessProcess.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.businessProcess.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: WORKSPACE_ID,
          name: "Lead Management",
        }),
      }),
    );

    // Should have created Recommendation records (3)
    expect(mockPrisma.recommendation.create).toHaveBeenCalledTimes(3);

    // Should have created ProcessSuggestion records (1)
    expect(mockPrisma.processSuggestion.create).toHaveBeenCalledTimes(1);

    // Should have set CompanyProfile to complete
    expect(mockPrisma.companyProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: WORKSPACE_ID },
        data: expect.objectContaining({
          analysisStatus: "complete",
          nextMoveText: "Fix the critical issue first",
          nextMoveReasoning: "Highest ROI action",
        }),
      }),
    );
  });

  it("handles partial failure: 1 of 2 per-automation calls fails, pipeline continues", async () => {
    const auto1 = makeAutomation("auto-1", "ext-1", "Lead Capture");
    const auto2 = makeAutomation("auto-2", "ext-2", "Lead Qualify");

    mockPrisma.automation.findMany.mockResolvedValue([auto1, auto2]);

    const result1 = makePerAutomationResult("Lead Capture");
    mockAnalyzeAutomation
      .mockResolvedValueOnce(result1)
      .mockRejectedValueOnce(new Error("LLM timeout for ext-2"));

    mockAnalyzeWorkspace.mockResolvedValue(makeWorkspaceResult());

    const result = await runAnalysisPipeline(WORKSPACE_ID);

    expect(result).toEqual({ success: true });

    // auto-1 should be marked complete
    expect(mockPrisma.automation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "auto-1" },
        data: expect.objectContaining({
          analysisStatus: "complete",
          businessNarrative: result1.businessNarrative,
        }),
      }),
    );

    // auto-2 should be marked failed
    expect(mockPrisma.automation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "auto-2" },
        data: { analysisStatus: "failed" },
      }),
    );

    // Workspace call should still proceed with 1 successful result
    expect(mockAnalyzeWorkspace).toHaveBeenCalledTimes(1);
    const wsInput = mockAnalyzeWorkspace.mock.calls[0][0];
    expect(wsInput.automationSummaries).toHaveLength(1);
    expect(wsInput.automationSummaries[0].externalId).toBe("ext-1");
  });

  it("returns error when ALL per-automation calls fail", async () => {
    const auto1 = makeAutomation("auto-1", "ext-1", "Lead Capture");
    const auto2 = makeAutomation("auto-2", "ext-2", "Lead Qualify");

    mockPrisma.automation.findMany.mockResolvedValue([auto1, auto2]);

    mockAnalyzeAutomation
      .mockRejectedValueOnce(new Error("LLM timeout"))
      .mockRejectedValueOnce(new Error("LLM timeout"));

    const result = await runAnalysisPipeline(WORKSPACE_ID);

    expect(result).toEqual({ error: "All per-automation analysis calls failed" });

    // Should NOT have called workspace analysis
    expect(mockAnalyzeWorkspace).not.toHaveBeenCalled();

    // CompanyProfile should be set to failed
    expect(mockPrisma.companyProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: WORKSPACE_ID },
        data: expect.objectContaining({ analysisStatus: "failed" }),
      }),
    );
  });

  it("assigns priorityOrder: Act Now first, then Investigate, then Explore", async () => {
    const auto1 = makeAutomation("auto-1", "ext-1", "Workflow A");
    mockPrisma.automation.findMany.mockResolvedValue([auto1]);
    mockAnalyzeAutomation.mockResolvedValue(makePerAutomationResult("Workflow A"));
    mockAnalyzeWorkspace.mockResolvedValue(makeWorkspaceResult());

    await runAnalysisPipeline(WORKSPACE_ID);

    const recCalls = mockPrisma.recommendation.create.mock.calls;
    expect(recCalls).toHaveLength(3);

    // First recommendation should be "Act Now" (priorityOrder 0)
    expect(recCalls[0][0].data.tier).toBe("Act Now");
    expect(recCalls[0][0].data.priorityOrder).toBe(0);

    // Second should be "Investigate" (priorityOrder 1)
    expect(recCalls[1][0].data.tier).toBe("Investigate");
    expect(recCalls[1][0].data.priorityOrder).toBe(1);

    // Third should be "Explore" (priorityOrder 2)
    expect(recCalls[2][0].data.tier).toBe("Explore");
    expect(recCalls[2][0].data.priorityOrder).toBe(2);
  });

  it("links processSuggestion to child recommendations", async () => {
    const auto1 = makeAutomation("auto-1", "ext-1", "Workflow A");
    mockPrisma.automation.findMany.mockResolvedValue([auto1]);
    mockAnalyzeAutomation.mockResolvedValue(makePerAutomationResult("Workflow A"));
    mockAnalyzeWorkspace.mockResolvedValue(makeWorkspaceResult());

    await runAnalysisPipeline(WORKSPACE_ID);

    // The "Explore CRM integration" rec should be linked to the "Customer Onboarding" process suggestion
    const recCalls = mockPrisma.recommendation.create.mock.calls;
    const exploreRec = recCalls.find(
      (call) => call[0].data.name === "Explore CRM integration",
    );
    expect(exploreRec).toBeDefined();
    expect(exploreRec![0].data.processSuggestionId).toBe("ps-1");
  });

  it("links automations to processes via steps[].automationExternalId", async () => {
    const auto1 = makeAutomation("auto-1", "ext-1", "Lead Capture");
    const auto2 = makeAutomation("auto-2", "ext-2", "Lead Qualify");
    mockPrisma.automation.findMany.mockResolvedValue([auto1, auto2]);

    mockAnalyzeAutomation
      .mockResolvedValueOnce(makePerAutomationResult("Lead Capture"))
      .mockResolvedValueOnce(makePerAutomationResult("Lead Qualify"));
    mockAnalyzeWorkspace.mockResolvedValue(makeWorkspaceResult());

    await runAnalysisPipeline(WORKSPACE_ID);

    // Both automations should be linked to the process via processId
    expect(mockPrisma.automation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "auto-1" },
        data: { processId: "proc-1" },
      }),
    );
    expect(mockPrisma.automation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "auto-2" },
        data: { processId: "proc-1" },
      }),
    );
  });

  it("returns error on workspace call failure, per-automation data preserved", async () => {
    const auto1 = makeAutomation("auto-1", "ext-1", "Workflow A");
    mockPrisma.automation.findMany.mockResolvedValue([auto1]);
    mockAnalyzeAutomation.mockResolvedValue(makePerAutomationResult("Workflow A"));
    mockAnalyzeWorkspace.mockRejectedValue(new Error("Workspace LLM failed"));

    const result = await runAnalysisPipeline(WORKSPACE_ID);

    expect(result).toEqual({
      error: "Workspace analysis failed: Workspace LLM failed",
    });

    // Per-automation data should still be intact (already written before workspace call)
    expect(mockPrisma.automation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "auto-1" },
        data: expect.objectContaining({ analysisStatus: "complete" }),
      }),
    );

    // CompanyProfile should be set to failed
    expect(mockPrisma.companyProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: WORKSPACE_ID },
        data: expect.objectContaining({ analysisStatus: "failed" }),
      }),
    );
  });

  it("clears processId and deletes existing workspace-level data before re-analysis", async () => {
    mockPrisma.automation.findMany.mockResolvedValue([]);
    mockAnalyzeWorkspace.mockResolvedValue(makeWorkspaceResult());

    await runAnalysisPipeline(WORKSPACE_ID);

    expect(mockPrisma.recommendation.deleteMany).toHaveBeenCalledWith({
      where: { workspaceId: WORKSPACE_ID },
    });
    expect(mockPrisma.processSuggestion.deleteMany).toHaveBeenCalledWith({
      where: { workspaceId: WORKSPACE_ID },
    });
    expect(mockPrisma.automation.updateMany).toHaveBeenCalledWith({
      where: { workspaceId: WORKSPACE_ID },
      data: { processId: null },
    });
    expect(mockPrisma.businessProcess.deleteMany).toHaveBeenCalledWith({
      where: { workspaceId: WORKSPACE_ID },
    });
  });

  it("sets each automation to pending before LLM calls and progresses statuses", async () => {
    const auto1 = makeAutomation("auto-1", "ext-1", "Workflow A");
    mockPrisma.automation.findMany.mockResolvedValue([auto1]);
    mockAnalyzeAutomation.mockResolvedValue(makePerAutomationResult("Workflow A"));
    mockAnalyzeWorkspace.mockResolvedValue(makeWorkspaceResult());

    await runAnalysisPipeline(WORKSPACE_ID);

    // Automation should first be set to pending
    expect(mockPrisma.automation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "auto-1" },
        data: { analysisStatus: "pending" },
      }),
    );

    // "pending" is set on create (new profile), remaining on update
    expect(mockPrisma.companyProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ analysisStatus: "pending" }),
      }),
    );

    const statusUpdates = mockPrisma.companyProfile.update.mock.calls
      .filter((call) => call[0].data.analysisStatus)
      .map((call) => call[0].data.analysisStatus);

    expect(statusUpdates).toEqual([
      "analyzing_workflows",
      "analyzing_workspace",
      "complete",
    ]);
  });

  it("captures previous snapshot and generates delta on re-sync", async () => {
    // Simulate existing analyzed profile
    mockPrisma.companyProfile.findUnique.mockResolvedValue({
      id: "cp-1",
      workspaceId: WORKSPACE_ID,
      analysisStatus: "complete",
      analyzedAt: new Date("2025-01-01"),
    });

    mockPrisma.automation.findMany.mockResolvedValue([
      makeAutomation("auto-1", "ext-1", "Workflow A"),
    ]);
    mockPrisma.recommendation.findMany.mockResolvedValue([
      { id: "rec-old", name: "Old rec", type: "fix", tier: "Act Now", process: null },
    ]);
    mockPrisma.businessProcess.count.mockResolvedValue(1);
    mockPrisma.businessProcess.findMany.mockResolvedValue([
      { name: "Test Process", summary: "A test process", automations: [] },
    ]);

    mockAnalyzeAutomation.mockResolvedValue(makePerAutomationResult("Workflow A"));
    mockAnalyzeWorkspace.mockResolvedValue(makeWorkspaceResult());
    mockGenerateDeltaSummary.mockReturnValue("Since last analysis (30 days ago): +1 new recommendation.");

    await runAnalysisPipeline(WORKSPACE_ID);

    // Should have captured snapshot
    expect(mockCaptureSnapshot).toHaveBeenCalled();

    // Should have saved previous snapshot to CompanyProfile
    expect(mockPrisma.companyProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          previousSnapshot: expect.anything(),
        }),
      }),
    );

    // Should have generated delta summary
    expect(mockGenerateDeltaSummary).toHaveBeenCalled();

    // Should have saved delta summary
    expect(mockPrisma.companyProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deltaSummary: "Since last analysis (30 days ago): +1 new recommendation.",
        }),
      }),
    );
  });

  it("resolves connected automations with deterministic + LLM merge", async () => {
    const auto1 = makeAutomation("auto-1", "ext-1", "Lead Capture");
    const auto2 = makeAutomation("auto-2", "ext-2", "Lead Qualify");
    mockPrisma.automation.findMany.mockResolvedValue([auto1, auto2]);

    mockAnalyzeAutomation
      .mockResolvedValueOnce(makePerAutomationResult("Lead Capture"))
      .mockResolvedValueOnce(makePerAutomationResult("Lead Qualify"));
    mockAnalyzeWorkspace.mockResolvedValue(makeWorkspaceResult());

    mockMergeConnectionUpdates.mockReturnValue([
      { automationId: "auto-1", upstreamIds: [], downstreamIds: ["auto-2"] },
      { automationId: "auto-2", upstreamIds: ["auto-1"], downstreamIds: [] },
    ]);

    await runAnalysisPipeline(WORKSPACE_ID);

    expect(mockResolveDeterministicConnections).toHaveBeenCalledTimes(1);
    expect(mockMergeLlmConnections).toHaveBeenCalledTimes(1);
    expect(mockMergeConnectionUpdates).toHaveBeenCalledTimes(1);

    // Should update upstream/downstream on automations
    expect(mockPrisma.automation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "auto-1" },
        data: expect.objectContaining({
          upstreamIds: [],
          downstreamIds: ["auto-2"],
        }),
      }),
    );
    expect(mockPrisma.automation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "auto-2" },
        data: expect.objectContaining({
          upstreamIds: ["auto-1"],
          downstreamIds: [],
        }),
      }),
    );
  });

  it("extracts metadata from ConnectorConfig for workspace call", async () => {
    const auto1 = makeAutomation("auto-1", "ext-1", "Workflow A");
    mockPrisma.automation.findMany.mockResolvedValue([auto1]);
    mockAnalyzeAutomation.mockResolvedValue(makePerAutomationResult("Workflow A"));
    mockAnalyzeWorkspace.mockResolvedValue(makeWorkspaceResult());

    mockPrisma.connectorConfig.findFirst.mockResolvedValue({
      selectedTags: ["production", "staging"],
      discoveryData: {
        credentials: [{ name: "slack-api", type: "oAuth2Api" }],
        users: [{ email: "admin@test.com", role: "owner" }],
      },
    });

    await runAnalysisPipeline(WORKSPACE_ID);

    const wsInput = mockAnalyzeWorkspace.mock.calls[0][0];
    expect(wsInput.metadata).toEqual({
      tags: ["production", "staging"],
      credentials: [{ name: "slack-api", type: "oAuth2Api" }],
      users: [{ email: "admin@test.com", role: "owner" }],
    });
  });
});
