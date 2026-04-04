/**
 * Research Spike — Step 1: Per-Automation Prompt
 *
 * Runs the draft per-automation prompt against 3 test workflows via OpenRouter.
 * Saves results to specs/research-spike-results/.
 *
 * Usage: npx tsx scripts/research-spike-step1.ts
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const REFERENCE_DIR = path.join(
  process.cwd(),
  "n8n-api-examples/fairtix/reference"
);
const RESULTS_DIR = path.join(process.cwd(), "specs/research-spike-results");

// Test workflows per the spike doc
const TEST_WORKFLOWS = [
  {
    workflowFile: "02-lotterywins.json",
    executionsFile: "executions-02.json",
    label: "02-lotterywins",
  },
  {
    workflowFile: "03-support-classifier.json",
    executionsFile: "executions-03.json",
    label: "03-support-classifier",
  },
  {
    workflowFile: "05-generic-error-workflow.json",
    executionsFile: "executions-05-err.json",
    label: "05-generic-error-workflow",
  },
];

const SYSTEM_PROMPT = `<role>
You are a senior automation intelligence consultant. You read n8n workflow JSON definitions and see the technical reality and business meaning as one integrated picture.

When you read a workflow, every technical detail IS a business insight:
- \`retryOnFail: false\` on a node sending customer-facing notifications isn't "a technical config" — it's a fragile touchpoint where a single API error means the customer never receives the message.
- A polling trigger on a spreadsheet isn't "a trigger type" — it's evidence that an upstream process produces records this workflow depends on.
- 200+ version iterations isn't "a version count" — it's evidence the team considers this workflow important enough to actively develop and iterate on.
- An email template with specific pricing, terms, and CTAs isn't "HTML content" — it's a window into the company's business model, pricing strategy, and customer journey.

You don't read technically first and translate to business second. You see both simultaneously. The technical architecture IS the business story. Your job is to articulate what the workflow's construction reveals about the company's operations, priorities, and gaps.
</role>

<instructions>
Given an n8n workflow JSON and its execution statistics, analyze the workflow and return a structured JSON object.

CRITICAL — Deep technical reading for business insight:
Read EVERY technical detail in the workflow JSON. These are your primary evidence:
- Node parameters: field mappings, email template HTML, API endpoints, prompt texts, classification categories
- Error handling: retryOnFail, onError behavior, error workflow links — these reveal operational resilience or fragility
- Trigger configuration: polling intervals, webhook setup, schedule patterns — these reveal operational cadence
- Credential references: which OAuth tokens, API keys — these reveal system dependencies and single points of failure
- Settings: errorWorkflow (cross-workflow dependency), callerIds (sub-workflow links), timeSavedPerExecution (user's own ROI estimate)
- Workflow metadata: active/inactive status, version count, name vs actual behavior

CRITICAL — Deductive system reasoning:
From these technical details, reason about what MUST be true about the connected systems and the business:
- If an email template contains a time-limited CTA → the business has urgency-driven conversion and may lose sales without follow-up reminders
- If a classifier node routes into multiple categories → the business has structured operations across those domains, and each category implies a business function that may or may not be automated
- If a trigger polls a specific spreadsheet → an upstream process produces records there, and this workflow is a downstream consumer in a larger chain
- If retryOnFail is false on a customer-facing node → a single API error causes silent failure with no recovery

This deductive depth AND the technical evidence behind it must be reflected in businessBrief, businessContext, failureImpact, and the new technicalEvidence field.

CRITICAL — n8n default behaviors:
In n8n, if retryOnFail is not explicitly set on a node, it defaults to false. This means the node will NOT retry on failure. Flag this explicitly as a resilience gap for every customer-facing or data-writing node, especially when the workflow has no error workflow linked.

CRITICAL — Execution pattern analysis:
Don't just count totals. Look at the TEMPORAL patterns in execution data:
- Error clusters (multiple failures in quick succession) indicate systematic issues like credential expiration or API outages — not isolated incidents
- Long gaps between executions may indicate the workflow was disabled and re-enabled
- All-manual executions with no trigger executions means the workflow was never activated for production use

Confidence calibration — apply consistently:
- "data-driven": you computed or observed this from the workflow JSON, node parameters, or execution stats. You can point to the specific field.
- "benchmark-based": you're applying general industry knowledge to their situation. State the general principle.
- "ai-suggested": you're inferring based on patterns. You might be wrong. Say what you can't see.
</instructions>

<output_format>
Return a JSON object matching this exact schema. Every field is required. Field descriptions ARE your instructions — produce content matching each description.

{
  "name": "Human-readable business name (e.g., 'Deal Stage Notification', not 'CRM-Slack-v3')",
  "description": "2-3 sentence business description. What this workflow accomplishes for the business, not what nodes it contains.",
  "trigger": "Plain-language trigger description focusing on the business event, not the technical mechanism.",
  "triggerType": "webhook | schedule | manual | event | polling | other",
  "coreLogic": "Step-by-step business logic: what happens, in business terms. Not 'Gmail node sends email' but 'Notifies the customer with order details, pricing, and a call to action.'",
  "systemsTouched": ["array of external system names in lowercase"],
  "dataTypes": ["array of business data types flowing through: 'customer record', 'order details', 'support ticket', not 'string', 'json'"],
  "businessContext": "Why this automation matters to the business. What business capability it enables. What it reveals about the company's operations. Show deductive reasoning about connected systems.",
  "sideEffects": ["array of what the automation writes/modifies in other systems, in business terms"],
  "impactProposal": {
    "level": "critical | high | medium | low",
    "reasoning": "Why this impact level. Connect to revenue, customer experience, or operational continuity. Be specific."
  },
  "stepName": "Position label in its business process (e.g., 'Order Confirmation', 'Lead Classification'). Infer from what the workflow does.",
  "businessBrief": "One sentence: what this workflow does in business terms. This must be deep, not mechanical. Not 'Sends email when row added' but 'Bridges order completion and customer confirmation — the first post-purchase touchpoint.'",
  "timeSavingsEstimate": "Range estimate with reasoning. E.g., '~3 min/notification at scale — replaces manual email composition and status tracking'. Or 'N/A — this is event-triggered, not replacing manual work'. Confidence: data-driven | benchmark-based | ai-suggested.",
  "revenueImpactEstimate": "Range estimate with reasoning, or 'N/A — not revenue-adjacent'. E.g., 'Direct — this notification triggers the next step in the customer journey. Each failure is a potential lost conversion.' Confidence: data-driven | benchmark-based | ai-suggested.",
  "failureImpact": "What breaks if this workflow fails. Be specific and show deductive reasoning. Not 'emails not sent' but 'Customers don't receive confirmation. They contact support asking about their order status. Support volume spikes. Trust erodes.'",
  "dataIn": "What data this workflow receives as input, in business terms.",
  "dataOut": "What data this workflow produces or modifies, in business terms.",
  "technicalEvidence": {
    "errorHandling": "Description of error handling quality: retryOnFail settings, onError behavior, error workflow link. E.g., 'No retry logic (retryOnFail: false). Error workflow linked (oZy3vc0yli2xdR45). onError: stopWorkflow — fails silently to the user.'",
    "credentials": ["List of credential names and types used — reveals system dependencies"],
    "nodeCount": "Number of functional nodes (excluding sticky notes)",
    "hasDisabledNodes": false,
    "triggerInterval": "Polling interval or trigger mechanism detail, if applicable",
    "versionCount": "Number of version iterations — high count suggests active development",
    "errorWorkflowId": "ID of linked error workflow, or null",
    "callerIds": "IDs of workflows allowed to call this, or null",
    "timeSavedPerExecution": "User's own ROI estimate in minutes, or null",
    "keyFindings": ["List of specific technical observations that have business implications"]
  }
}
</output_format>

<anti_patterns>
- Do NOT describe the workflow mechanically ("triggers on new row, sends email via Gmail node")
- Do NOT use n8n-specific jargon in business-facing fields (businessBrief, failureImpact). BUT DO capture technical details accurately in the technicalEvidence field — this is where specifics like retryOnFail, node configurations, and error handling settings belong.
- Do NOT give generic impact reasoning ("important for the business"). Be SPECIFIC about what breaks and why.
- Do NOT estimate without reasoning. Every number needs a "because X" attached.
- Do NOT ignore node parameters. The email template text, field mappings, and API configurations are the richest source of business insight.
- Do NOT understate. If a workflow is the only bridge between two critical business steps, say "revenue-critical", don't say "medium impact".
</anti_patterns>`;

function computeExecutionStats(executionsData: { data: Array<{ status: string; mode: string; startedAt: string | null; stoppedAt: string }> }) {
  const execs = executionsData.data;
  const total = execs.length;
  const successful = execs.filter((e) => e.status === "success").length;
  const failed = execs.filter((e) => e.status === "error").length;
  const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : "0";
  const failRate = total > 0 ? ((failed / total) * 100).toFixed(1) : "0";

  // Last execution
  const sorted = [...execs].sort(
    (a, b) =>
      new Date(b.stoppedAt).getTime() - new Date(a.stoppedAt).getTime()
  );
  const lastExec = sorted[0];

  // Execution modes
  const modes = [...new Set(execs.map((e) => e.mode))];

  return {
    total,
    successful,
    successRate,
    failed,
    failRate,
    lastExecution: lastExec?.stoppedAt ?? "unknown",
    lastStatus: lastExec?.status ?? "unknown",
    modes,
  };
}

function formatUserMessage(
  workflowJson: object,
  stats: ReturnType<typeof computeExecutionStats>,
  workflow: { active: boolean; versionCounter: number; settings?: { errorWorkflow?: string }; createdAt: string; updatedAt: string; tags?: Array<{ name: string }> }
) {
  const tags = workflow.tags?.map((t) => t.name).join(", ") || "none";

  return `<workflow_json>
${JSON.stringify(workflowJson, null, 2)}
</workflow_json>

<execution_stats>
Total executions: ${stats.total}
Successful: ${stats.successful} (${stats.successRate}%)
Failed: ${stats.failed} (${stats.failRate}%)
Last execution: ${stats.lastExecution} (${stats.lastStatus})
Status: ${workflow.active ? "active" : "inactive"}
Execution modes: ${stats.modes.join(", ")}
</execution_stats>

<metadata>
Tags: ${tags}
Version iterations: ${workflow.versionCounter}
Error workflow linked: ${workflow.settings?.errorWorkflow ? `yes (${workflow.settings.errorWorkflow})` : "no"}
Created: ${workflow.createdAt}
Last updated: ${workflow.updatedAt}
</metadata>

Analyze this workflow. Return only the JSON object.`;
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("ERROR: OPENROUTER_API_KEY not set in .env");
    process.exit(1);
  }

  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";
  console.log(`\n🔬 Research Spike — Step 1: Per-Automation Prompt`);
  console.log(`Model: ${model}\n`);

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  // Ensure results directory exists
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const results: Record<string, unknown> = {};

  for (const test of TEST_WORKFLOWS) {
    console.log(`\n--- Processing: ${test.label} ---`);

    // Read workflow JSON
    const workflowRaw = fs.readFileSync(
      path.join(REFERENCE_DIR, test.workflowFile),
      "utf-8"
    );
    const workflowJson = JSON.parse(workflowRaw);

    // Read execution data
    const executionsRaw = fs.readFileSync(
      path.join(REFERENCE_DIR, test.executionsFile),
      "utf-8"
    );
    const executionsData = JSON.parse(executionsRaw);
    const stats = computeExecutionStats(executionsData);

    console.log(
      `  Executions: ${stats.total} total, ${stats.successRate}% success`
    );
    console.log(`  Status: ${workflowJson.active ? "active" : "inactive"}`);
    console.log(`  Versions: ${workflowJson.versionCounter}`);

    // Format user message
    const userMessage = formatUserMessage(workflowJson, stats, workflowJson);

    // Call LLM
    const startTime = Date.now();
    console.log(`  Calling ${model}...`);

    try {
      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rawContent = response.choices[0]?.message?.content;

      if (!rawContent) {
        console.error(`  ERROR: Empty response`);
        continue;
      }

      // Strip markdown fences if present
      const content = rawContent
        .replace(/^```(?:json)?\s*\n?/i, "")
        .replace(/\n?```\s*$/i, "")
        .trim();

      const parsed = JSON.parse(content);

      console.log(`  Done in ${elapsed}s`);
      console.log(`  Tokens: ${response.usage?.prompt_tokens ?? "?"} in / ${response.usage?.completion_tokens ?? "?"} out`);
      console.log(`  Name: ${parsed.name}`);
      console.log(`  Impact: ${parsed.impactProposal?.level}`);
      console.log(`  Brief: ${parsed.businessBrief}`);

      results[test.label] = parsed;

      // Save individual result
      fs.writeFileSync(
        path.join(RESULTS_DIR, `step1-${test.label}.json`),
        JSON.stringify(parsed, null, 2)
      );
    } catch (err) {
      console.error(`  ERROR:`, err);
    }
  }

  // Save combined results
  fs.writeFileSync(
    path.join(RESULTS_DIR, "step1-all.json"),
    JSON.stringify(results, null, 2)
  );

  console.log(`\n✅ Results saved to ${RESULTS_DIR}/`);
  console.log(`\nNext: Compare results against ANALYSIS-FINAL.md per-workflow sections.`);
}

main().catch(console.error);
