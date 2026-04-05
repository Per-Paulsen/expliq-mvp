import OpenAI from "openai";

// ── Types ─────────────────────────────────────────────

export interface AutomationInput {
  id: string;
  externalId: string;
  name: string | null;
  rawWorkflowJson: unknown;
  runsPerWeek: number | null;
  errorRate: number | null;
  lastExecutedAt: Date | null;
  avgDurationMs: number | null;
  isActive: boolean;
}

export interface PerAutomationImpact {
  reasoning: string;
  level: "critical" | "high" | "medium" | "low";
  failureScenario: string;
  revenueConnection: string;
}

export interface PerAutomationDetectability {
  reasoning: string;
  level: "monitored" | "partially-monitored" | "silent";
  evidence: string;
}

export interface PerAutomationTechnicalEvidence {
  errorHandling: string;
  credentials: string[];
  complexity: string;
  keyFindings: string[];
}

export interface PerAutomationResult {
  reasoning: string;
  businessNarrative: string;
  trigger: string;
  triggerType: "webhook" | "schedule" | "manual" | "event" | "polling" | "other";
  systemsTouched: string[];
  dataFlow: string;
  stepName: string;
  impact: PerAutomationImpact;
  detectability: PerAutomationDetectability;
  timeSavingsEstimate: string;
  revenueImpactEstimate: string;
  technicalEvidence: PerAutomationTechnicalEvidence;
}

export interface WorkspaceInput {
  automationSummaries: Array<{
    id: string;
    externalId: string;
    name: string | null;
    businessNarrative: string;
    trigger: string;
    triggerType: string;
    systemsTouched: string[];
    stepName: string;
    impact: { level: string; failureScenario: string; revenueConnection: string };
    detectability: { level: string };
    timeSavingsEstimate: string;
    revenueImpactEstimate: string;
    errorRate: number | null;
    runsPerWeek: number | null;
    isActive: boolean;
  }>;
  workflowJsons: Array<{ externalId: string; json: unknown }>;
  metadata: {
    tags?: string[];
    credentials?: Array<{ name: string; type: string }>;
    users?: Array<{ email: string; role: string }>;
  };
}

export interface WorkspaceProcessStep {
  name: string;
  isAutomated: boolean;
  isGap: boolean;
  automationExternalId?: string;
}

export interface WorkspaceProcess {
  name: string;
  summary: string;
  workflows: string[];
  steps: WorkspaceProcessStep[];
  maturityLevel: string;
  valueAtStake: string;
}

export interface WorkspaceSystemLandscape {
  name: string;
  workflowCount: number;
}

export interface WorkspaceConnectedAutomation {
  fromExternalId: string;
  toExternalId: string;
  connectionType: string;
  description: string;
}

export interface WorkspaceRecommendation {
  type: string;
  tier: string;
  name: string;
  brief: string;
  businessCase: string;
  confidence: string;
  evidenceChain: string;
  honestFraming: string;
  processName?: string;
  affectedScope: string;
  impactEstimate: string;
  implementationNotes: string;
  systemSource?: string;
  systemDestination?: string;
  stepName?: string;
  automationId?: string | null;
}

export interface WorkspaceProcessSuggestion {
  name: string;
  description: string;
  basedOn: string;
  businessCase: string;
  connectedSystems: string[];
  childRecommendationNames: string[];
}

export interface WorkspaceAggregateEstimates {
  totalTimeSavings: string;
  totalValueAtRisk: string;
  totalOpportunityValue: string;
}

export interface WorkspaceNextMove {
  text: string;
  reasoning: string;
}

export interface WorkspaceResult {
  reasoning: string;
  processes: WorkspaceProcess[];
  systemLandscape: WorkspaceSystemLandscape[];
  connectedAutomations: WorkspaceConnectedAutomation[];
  recommendations: WorkspaceRecommendation[];
  processSuggestions: WorkspaceProcessSuggestion[];
  aggregateEstimates: WorkspaceAggregateEstimates;
  nextMove: WorkspaceNextMove;
}

// ── Utilities ─────────────────────────────────────────

export function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return trimmed;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

function getModel(): string {
  return process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";
}

function getPerAutomationModel(): string {
  return process.env.OPENROUTER_PER_AUTOMATION_MODEL || "anthropic/claude-haiku-4-5-20251001";
}

function getClient(): OpenAI {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

// ── Per-Automation Analysis ───────────────────────────

const PER_AUTOMATION_SYSTEM_PROMPT = `You are an automation intelligence analyst. Analyze this n8n workflow JSON and its execution data. Understand what it means for the business — what capability it enables, what its technical configuration reveals about the company's operations, and what happens when it fails. Read node parameters, email templates, AI prompts, and API configs carefully — they contain the richest business insight. Return a JSON object matching the schema below.

Schema:
{
  "reasoning": "string — step-by-step analysis before conclusions",
  "businessNarrative": "string — 3-5 sentences about business meaning",
  "trigger": "string — business event description",
  "triggerType": "webhook | schedule | manual | event | polling | other",
  "systemsTouched": ["string — lowercase system names"],
  "dataFlow": "string — what data enters, gets produced, where it goes",
  "stepName": "string — position label in business process",
  "impact": {
    "reasoning": "string",
    "level": "critical | high | medium | low",
    "failureScenario": "string",
    "revenueConnection": "string"
  },
  "detectability": {
    "reasoning": "string",
    "level": "monitored | partially-monitored | silent",
    "evidence": "string"
  },
  "timeSavingsEstimate": "string — range with reasoning and confidence label",
  "revenueImpactEstimate": "string — range with reasoning, or N/A",
  "technicalEvidence": {
    "errorHandling": "string",
    "credentials": ["string"],
    "complexity": "string",
    "keyFindings": ["string"]
  }
}`;

export async function analyzeAutomation(
  automation: AutomationInput,
): Promise<PerAutomationResult> {
  const client = getClient();
  const model = getPerAutomationModel();

  const userMessage = JSON.stringify({
    name: automation.name,
    externalId: automation.externalId,
    isActive: automation.isActive,
    runsPerWeek: automation.runsPerWeek,
    errorRate: automation.errorRate,
    lastExecutedAt: automation.lastExecutedAt,
    avgDurationMs: automation.avgDurationMs,
    workflow: automation.rawWorkflowJson,
  });

  const raw = await retryWithBackoff(async () => {
    const response = await client.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: PER_AUTOMATION_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
      },
      { timeout: 120_000 },
    );
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("LLM returned empty response for automation analysis");
    }
    return content;
  });

  const cleaned = stripJsonFences(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Failed to parse LLM JSON response for automation ${automation.externalId}: ${cleaned.slice(0, 200)}`,
    );
  }

  return parsed as PerAutomationResult;
}

// ── Workspace Analysis ────────────────────────────────

const WORKSPACE_SYSTEM_PROMPT = `You are a senior automation consultant. You receive per-workflow analyses and the raw workflow JSONs for an entire automation instance.

Do two things in one analysis:

FIRST — UNDERSTAND the landscape: What does this company do? What business processes exist? How do the workflows relate? What systems are involved and what are the dependency risks? What cross-workflow patterns exist?

THEN — RECOMMEND opportunities: What should this company build, fix, or connect? Be extensive and creative. Think about: broken things, missing things, forgotten participants, unused data, time-sensitive operations lacking follow-ups. For technical fixes: be SPECIFIC — name nodes, cite config values, describe exact changes.

IMPORTANT — Every recommendation MUST have a processName that either:
(a) matches EXACTLY one of the process names from your "processes" array above, OR
(b) is a NEW process name if the recommendation creates or belongs to a process that doesn't exist yet

Confidence labels: 'data-driven' (cite evidence), 'benchmark-based' (industry knowledge), 'ai-suggested' (inference).
For uncertain recommendations: 'We don't see this in your workflows. If handled elsewhere, consider connecting for visibility.'

Return a JSON object matching the schema below.

Schema:
{
  "reasoning": "string — step-by-step analysis of the full landscape",
  "processes": [
    {
      "name": "string",
      "summary": "string",
      "workflows": ["string — externalIds"],
      "steps": [
        {
          "name": "string",
          "isAutomated": true,
          "isGap": false,
          "automationExternalId": "string (optional)"
        }
      ],
      "maturityLevel": "string",
      "valueAtStake": "string"
    }
  ],
  "systemLandscape": [
    {
      "name": "string",
      "workflowCount": 0
    }
  ],
  "connectedAutomations": [
    {
      "fromExternalId": "string",
      "toExternalId": "string",
      "connectionType": "string",
      "description": "string"
    }
  ],
  "recommendations": [
    {
      "type": "string",
      "tier": "act now | investigate | explore",
      "name": "string",
      "brief": "string",
      "businessCase": "string",
      "confidence": "string",
      "evidenceChain": "string",
      "honestFraming": "string",
      "processName": "string — MUST match exactly one of the process names from your 'processes' array, OR be a new process name if this recommendation creates a new process",
      "affectedScope": "string — for technical fixes: the specific workflow name (e.g., 'HubSpot → Gmail Cold Outreach'). For new automations: a description like '3 workflows affected'",
      "impactEstimate": "string",
      "implementationNotes": "string",
      "systemSource": "string (optional)",
      "systemDestination": "string (optional)",
      "stepName": "string (optional)",
      "automationId": "string or null — the ID of the specific automation this recommendation targets, from the input summaries. null if recommendation is process-level (e.g., 'add a new workflow')"
    }
  ],
  "processSuggestions": [
    {
      "name": "string",
      "description": "string",
      "basedOn": "string",
      "businessCase": "string",
      "connectedSystems": ["string"],
      "childRecommendationNames": ["string"]
    }
  ],
  "aggregateEstimates": {
    "totalTimeSavings": "string",
    "totalValueAtRisk": "string",
    "totalOpportunityValue": "string"
  },
  "nextMove": {
    "text": "string",
    "reasoning": "string"
  }
}`;

export async function analyzeWorkspace(
  input: WorkspaceInput,
): Promise<WorkspaceResult> {
  const client = getClient();
  const model = getModel();

  const userMessage = JSON.stringify({
    automationSummaries: input.automationSummaries,
    workflowJsons: input.workflowJsons,
    metadata: input.metadata,
  });

  const raw = await retryWithBackoff(async () => {
    const response = await client.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: WORKSPACE_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
      },
      { timeout: 300_000 },
    );
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("LLM returned empty response for workspace analysis");
    }
    return content;
  });

  const cleaned = stripJsonFences(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Failed to parse LLM JSON response for workspace analysis: ${cleaned.slice(0, 200)}`,
    );
  }

  return parsed as WorkspaceResult;
}
