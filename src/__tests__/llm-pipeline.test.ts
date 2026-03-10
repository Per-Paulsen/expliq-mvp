import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockChatCompletionsCreate } = vi.hoisted(() => {
  const mockPrisma = {
    automation: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };
  const mockChatCompletionsCreate = vi.fn();
  return { mockPrisma, mockChatCompletionsCreate };
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

vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mockChatCompletionsCreate,
        },
      };
    },
  };
});

import { processAutomation } from "@/lib/llm-pipeline";

const VALID_LLM_RESPONSE = {
  name: "CRM → Slack Escalation",
  description: "Escalates CRM tickets to Slack when priority is high.",
  trigger: "When a CRM ticket is updated to high priority",
  triggerType: "webhook",
  coreLogic: "1. Check ticket priority\n2. Send Slack message",
  systemsTouched: ["Slack", "Salesforce"],
  dataTypes: ["ticket", "user"],
  businessContext: "Ensures high-priority tickets are escalated promptly.",
  sideEffects: ["Posts to #escalations Slack channel"],
  impactProposal: {
    level: "high",
    reasoning: "Directly impacts customer response time.",
  },
};

function makeLLMResponse(content: string) {
  return {
    choices: [{ message: { content } }],
  };
}

describe("processAutomation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENROUTER_API_KEY = "test-key";
  });

  it("throws when automation not found", async () => {
    mockPrisma.automation.findFirst.mockResolvedValue(null);

    await expect(
      processAutomation("auto-1", "ws-1"),
    ).rejects.toThrow("Automation not found");
  });

  it("throws when automation has no workflow JSON", async () => {
    mockPrisma.automation.findFirst.mockResolvedValue({
      id: "auto-1",
      workspaceId: "ws-1",
      rawWorkflowJson: null,
    });

    await expect(
      processAutomation("auto-1", "ws-1"),
    ).rejects.toThrow("Automation has no workflow JSON");
  });

  it("calls OpenAI with correct params", async () => {
    const rawWorkflowJson = { nodes: [{ type: "n8n-nodes-base.webhook" }] };
    mockPrisma.automation.findFirst.mockResolvedValue({
      id: "auto-1",
      workspaceId: "ws-1",
      rawWorkflowJson,
    });
    mockChatCompletionsCreate.mockResolvedValue(
      makeLLMResponse(JSON.stringify(VALID_LLM_RESPONSE)),
    );
    mockPrisma.automation.update.mockResolvedValue({});

    await processAutomation("auto-1", "ws-1");

    expect(mockChatCompletionsCreate).toHaveBeenCalledWith({
      model: expect.any(String),
      messages: [
        { role: "system", content: expect.stringContaining("expert automation analyst") },
        {
          role: "user",
          content: expect.stringContaining(JSON.stringify(rawWorkflowJson)),
        },
      ],
      response_format: { type: "json_object" },
    });
  });

  it("parses valid response and updates DB with all fields and documentationLastUpdated", async () => {
    mockPrisma.automation.findFirst.mockResolvedValue({
      id: "auto-1",
      workspaceId: "ws-1",
      rawWorkflowJson: { nodes: [] },
    });
    mockChatCompletionsCreate.mockResolvedValue(
      makeLLMResponse(JSON.stringify(VALID_LLM_RESPONSE)),
    );
    mockPrisma.automation.update.mockResolvedValue({});

    const result = await processAutomation("auto-1", "ws-1");

    expect(result).toEqual({
      ...VALID_LLM_RESPONSE,
      systemsTouched: ["slack", "salesforce"], // normalized to lowercase
    });

    expect(mockPrisma.automation.update).toHaveBeenCalledWith({
      where: { id: "auto-1" },
      data: {
        name: VALID_LLM_RESPONSE.name,
        description: VALID_LLM_RESPONSE.description,
        trigger: VALID_LLM_RESPONSE.trigger,
        triggerType: VALID_LLM_RESPONSE.triggerType,
        coreLogic: VALID_LLM_RESPONSE.coreLogic,
        systemsTouched: ["slack", "salesforce"],
        dataTypes: VALID_LLM_RESPONSE.dataTypes,
        businessContext: VALID_LLM_RESPONSE.businessContext,
        sideEffects: VALID_LLM_RESPONSE.sideEffects,
        impactProposal: VALID_LLM_RESPONSE.impactProposal.level,
        impactReasoning: VALID_LLM_RESPONSE.impactProposal.reasoning,
        documentationLastUpdated: expect.any(Date),
      },
    });
  });

  it("throws on unparseable JSON (no DB update)", async () => {
    mockPrisma.automation.findFirst.mockResolvedValue({
      id: "auto-1",
      workspaceId: "ws-1",
      rawWorkflowJson: { nodes: [] },
    });
    mockChatCompletionsCreate.mockResolvedValue(
      makeLLMResponse("not valid json {{{"),
    );

    await expect(
      processAutomation("auto-1", "ws-1"),
    ).rejects.toThrow("LLM response is not valid JSON");

    expect(mockPrisma.automation.update).not.toHaveBeenCalled();
  });

  it("throws on missing required fields (no DB update)", async () => {
    const incomplete = { name: "Test" }; // missing other required fields
    mockPrisma.automation.findFirst.mockResolvedValue({
      id: "auto-1",
      workspaceId: "ws-1",
      rawWorkflowJson: { nodes: [] },
    });
    mockChatCompletionsCreate.mockResolvedValue(
      makeLLMResponse(JSON.stringify(incomplete)),
    );

    await expect(
      processAutomation("auto-1", "ws-1"),
    ).rejects.toThrow("Missing or invalid field: description");

    expect(mockPrisma.automation.update).not.toHaveBeenCalled();
  });

  it("throws on invalid impactProposal level (no DB update)", async () => {
    const badImpact = {
      ...VALID_LLM_RESPONSE,
      impactProposal: { level: "extreme", reasoning: "because" },
    };
    mockPrisma.automation.findFirst.mockResolvedValue({
      id: "auto-1",
      workspaceId: "ws-1",
      rawWorkflowJson: { nodes: [] },
    });
    mockChatCompletionsCreate.mockResolvedValue(
      makeLLMResponse(JSON.stringify(badImpact)),
    );

    await expect(
      processAutomation("auto-1", "ws-1"),
    ).rejects.toThrow("Invalid impactProposal.level: extreme");

    expect(mockPrisma.automation.update).not.toHaveBeenCalled();
  });

  it("normalizes systemsTouched to lowercase", async () => {
    const response = {
      ...VALID_LLM_RESPONSE,
      systemsTouched: ["JIRA", "GitHub", "SlAcK"],
    };
    mockPrisma.automation.findFirst.mockResolvedValue({
      id: "auto-1",
      workspaceId: "ws-1",
      rawWorkflowJson: { nodes: [] },
    });
    mockChatCompletionsCreate.mockResolvedValue(
      makeLLMResponse(JSON.stringify(response)),
    );
    mockPrisma.automation.update.mockResolvedValue({});

    const result = await processAutomation("auto-1", "ws-1");

    expect(result.systemsTouched).toEqual(["jira", "github", "slack"]);
    expect(mockPrisma.automation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          systemsTouched: ["jira", "github", "slack"],
        }),
      }),
    );
  });

  it("does not update DB on API error", async () => {
    mockPrisma.automation.findFirst.mockResolvedValue({
      id: "auto-1",
      workspaceId: "ws-1",
      rawWorkflowJson: { nodes: [] },
    });
    mockChatCompletionsCreate.mockRejectedValue(new Error("API rate limit"));

    await expect(
      processAutomation("auto-1", "ws-1"),
    ).rejects.toThrow("API rate limit");

    expect(mockPrisma.automation.update).not.toHaveBeenCalled();
  });

  it("throws when LLM returns empty response", async () => {
    mockPrisma.automation.findFirst.mockResolvedValue({
      id: "auto-1",
      workspaceId: "ws-1",
      rawWorkflowJson: { nodes: [] },
    });
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    await expect(
      processAutomation("auto-1", "ws-1"),
    ).rejects.toThrow("LLM returned empty response");

    expect(mockPrisma.automation.update).not.toHaveBeenCalled();
  });
});
