import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import type { ImpactLevel } from "@/generated/prisma/client";

function getOpenAIClient() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

const SYSTEM_PROMPT = `You are an expert automation analyst. You analyze n8n workflow JSON and extract structured business-readable metadata.

Given a raw n8n workflow JSON, return a JSON object with exactly these keys:

- "name": string — human-readable name (e.g., "CRM → Slack Escalation")
- "description": string — 1-2 sentence business summary
- "trigger": string — plain-language trigger description
- "triggerType": string — one of: "webhook", "schedule", "manual", "event", "other"
- "coreLogic": string — step-by-step bullet points describing what the workflow does
- "systemsTouched": string[] — array of external system names in lowercase (e.g., ["slack", "salesforce"])
- "dataTypes": string[] — array of data types flowing through the workflow
- "businessContext": string — why this automation matters; what breaks if it fails
- "sideEffects": string[] — array of what the automation writes/modifies in other systems
- "impactProposal": { "level": string, "reasoning": string } — impact classification where level is one of: "critical", "high", "medium", "low"; reasoning explains why

Return ONLY valid JSON. No markdown, no code fences, no extra text.`;

export interface LLMPipelineResult {
  name: string;
  description: string;
  trigger: string;
  triggerType: "webhook" | "schedule" | "manual" | "event" | "other";
  coreLogic: string;
  systemsTouched: string[];
  dataTypes: string[];
  businessContext: string;
  sideEffects: string[];
  impactProposal: {
    level: "critical" | "high" | "medium" | "low";
    reasoning: string;
  };
}

const VALID_TRIGGER_TYPES = ["webhook", "schedule", "manual", "event", "other"];
const VALID_IMPACT_LEVELS = ["critical", "high", "medium", "low"];

function validateResult(parsed: unknown): LLMPipelineResult {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("LLM response is not an object");
  }

  const obj = parsed as Record<string, unknown>;

  for (const key of [
    "name",
    "description",
    "trigger",
    "triggerType",
    "coreLogic",
    "businessContext",
  ]) {
    if (typeof obj[key] !== "string" || !obj[key]) {
      throw new Error(`Missing or invalid field: ${key}`);
    }
  }

  if (!VALID_TRIGGER_TYPES.includes(obj.triggerType as string)) {
    throw new Error(
      `Invalid triggerType: ${obj.triggerType}. Must be one of: ${VALID_TRIGGER_TYPES.join(", ")}`,
    );
  }

  for (const key of ["systemsTouched", "dataTypes", "sideEffects"]) {
    if (!Array.isArray(obj[key])) {
      throw new Error(`Missing or invalid field: ${key} (must be an array)`);
    }
  }

  if (
    !obj.impactProposal ||
    typeof obj.impactProposal !== "object" ||
    typeof (obj.impactProposal as Record<string, unknown>).level !== "string" ||
    typeof (obj.impactProposal as Record<string, unknown>).reasoning !==
      "string" ||
    !(obj.impactProposal as Record<string, unknown>).reasoning
  ) {
    throw new Error(
      "Missing or invalid field: impactProposal (must have level and reasoning)",
    );
  }

  const impact = obj.impactProposal as Record<string, unknown>;
  if (!VALID_IMPACT_LEVELS.includes(impact.level as string)) {
    throw new Error(
      `Invalid impactProposal.level: ${impact.level}. Must be one of: ${VALID_IMPACT_LEVELS.join(", ")}`,
    );
  }

  return {
    name: obj.name as string,
    description: obj.description as string,
    trigger: obj.trigger as string,
    triggerType: obj.triggerType as LLMPipelineResult["triggerType"],
    coreLogic: obj.coreLogic as string,
    systemsTouched: (obj.systemsTouched as string[]).map((s) =>
      s.toLowerCase(),
    ),
    dataTypes: obj.dataTypes as string[],
    businessContext: obj.businessContext as string,
    sideEffects: obj.sideEffects as string[],
    impactProposal: {
      level: impact.level as LLMPipelineResult["impactProposal"]["level"],
      reasoning: impact.reasoning as string,
    },
  };
}

export async function processAutomation(
  automationId: string,
  workspaceId: string,
): Promise<LLMPipelineResult> {
  const automation = await prisma.automation.findFirst({
    where: { id: automationId, workspaceId },
  });

  if (!automation) {
    throw new Error("Automation not found");
  }

  if (!automation.rawWorkflowJson) {
    throw new Error("Automation has no workflow JSON");
  }

  const workflowJson = JSON.stringify(automation.rawWorkflowJson);
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";

  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analyze this n8n workflow JSON and return the structured metadata:\n\n${workflowJson}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const rawContent = response.choices[0]?.message?.content;
  if (!rawContent) {
    throw new Error("LLM returned empty response");
  }

  // Strip markdown code fences if present (some models wrap JSON despite response_format)
  const content = rawContent.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("LLM response is not valid JSON");
  }

  const result = validateResult(parsed);

  await prisma.automation.update({
    where: { id: automationId },
    data: {
      name: result.name,
      description: result.description,
      trigger: result.trigger,
      triggerType: result.triggerType,
      coreLogic: result.coreLogic,
      systemsTouched: result.systemsTouched,
      dataTypes: result.dataTypes,
      businessContext: result.businessContext,
      sideEffects: result.sideEffects,
      impactProposal: result.impactProposal.level as ImpactLevel,
      impactReasoning: result.impactProposal.reasoning,
      documentationLastUpdated: new Date(),
    },
  });

  return result;
}
