/**
 * Research Spike — Step 2: Call 1 "Understand"
 *
 * Takes all 8 per-automation summaries from Step 1 and synthesizes
 * process clusters, system landscape, and cross-workflow patterns.
 *
 * Usage: npx tsx scripts/research-spike-step2.ts
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

const ALL_WORKFLOWS = [
  { label: "01-send-welcome-email", executionsFile: "executions-01.json" },
  { label: "02-lotterywins", executionsFile: "executions-02.json" },
  { label: "02b-lotterywins-error-handling", executionsFile: "executions-02b.json" },
  { label: "03-support-classifier", executionsFile: "executions-03.json" },
  { label: "04-switch-faq-manual", executionsFile: "executions-04.json" },
  { label: "04-switch-faq-manual-sheet", executionsFile: "executions-04-sheet.json" },
  { label: "05-lotterywins-published", executionsFile: "executions-05-pub.json" },
  { label: "05-generic-error-workflow", executionsFile: "executions-05-err.json" },
];

const SYSTEM_PROMPT = `<role>
You are a senior business analyst specializing in automation landscape assessment. You receive summaries of individual workflows from an n8n automation instance and must synthesize them into a complete picture of the company's automation landscape.

Your job is to see what no individual workflow analysis can reveal: patterns across the collection, shared dependencies, process gaps, and the operational DNA of the company.
</role>

<instructions>
You receive per-workflow summaries (produced by a prior analysis step), execution statistics, and available metadata. From this collection, produce a structured understanding of the automation landscape.

CRITICAL — Cross-workflow pattern detection:
You see the FULL collection. Look for patterns that no single workflow reveals:

1. DUPLICATION AND FRAGMENTATION: Multiple workflows doing the same thing? Which is canonical? Are variants intentional or drift?
2. SHARED DEPENDENCY RISKS: Which systems are touched by many workflows? If one credential or system goes down, how many processes break?
3. CROSS-REFERENCING DATA WITH INVENTORY: One workflow's output categories or data fields imply a domain. Does a corresponding workflow exist? If not, that's a gap PROVEN by the company's own data, not by your imagination.
4. EXECUTION ANOMALIES: Error clusters, inactive workflows that should be active, active workflows with high failure rates, naming that contradicts status.
5. COMPLETENESS OF PROCESS CHAINS: If workflow A sends a notification with a CTA, there should be workflows for the response to that CTA. Absence is a finding.
6. INVERSE OUTCOME GAPS: If a workflow handles one outcome (e.g., lottery winners), check whether the opposite outcome (e.g., non-winners) is handled by ANY workflow. If not, that's a gap — often a high-value one, because the unhandled population is usually larger.
7. EVIDENCE-BASED DOMAIN DETECTION: Every support category, email CTA, data field, and business term in the workflow data implies a business domain. For EACH implied domain, check whether a corresponding workflow exists. If not, add it to suggestedProcesses with the specific evidence that proves the domain exists. Be exhaustive — don't stop at 2-3 suggestions.

Process clustering rules:
- Group workflows into BUSINESS PROCESSES, not technical categories
- A process is an end-to-end business flow (e.g., "Order Fulfillment", "Customer Onboarding", not "Email Workflows")
- Cross-cutting workflows (error handlers, monitoring) belong in an "Operations" or "Infrastructure" process
- Suggest processes that SHOULD exist based on evidence from existing workflows (e.g., if support classifies "Payment/Billing" but no payment workflow exists → suggest a "Payment & Billing" process)

Confidence calibration — apply consistently:
- "data-driven": computed from the workflow data or execution stats
- "benchmark-based": general industry knowledge applied to their situation
- "ai-suggested": inferred from patterns, may be wrong
</instructions>

<output_format>
Return a JSON object matching this schema. Include a "reasoning" field at the top level with your analysis before the structured data.

{
  "reasoning": "Your analysis of what this company does, how the workflows relate, and what patterns you see. Think step by step.",
  "processes": [
    {
      "name": "Business process name",
      "summary": "One-sentence description of what this process accomplishes for the business",
      "workflows": ["list of workflow names that belong to this process"],
      "steps": [
        {
          "name": "Step name in the process flow",
          "workflowName": "Name of the workflow that handles this step, or null if gap",
          "isAutomated": true,
          "isGap": false
        }
      ],
      "coverage": "X of Y steps automated (N%)",
      "reliability": "X% success rate across N executions (or 'no execution data')",
      "maturityLevel": "Prototype | Emerging | Developing | Production | Optimized",
      "maturityReasoning": "Why this level — based on coverage, reliability, error handling quality, monitoring"
    }
  ],
  "suggestedProcesses": [
    {
      "name": "Process name",
      "summary": "What this process would accomplish",
      "basedOn": "Specific evidence from existing workflows that proves this process domain exists",
      "suggestedSteps": ["Step 1", "Step 2"],
      "connectedSystems": ["systems that would be involved"]
    }
  ],
  "systemLandscape": [
    {
      "name": "System name",
      "role": "What role this system plays in the company's operations",
      "workflowCount": 0,
      "narrative": "Deductive reasoning: what this system's usage reveals about the business.",
      "insight": "One key insight or risk about this system's role"
    }
  ],
  "connectedAutomations": [
    {
      "fromWorkflow": "workflow name",
      "toWorkflow": "workflow name",
      "connectionType": "errorWorkflow | callerIds | logical (same data source)",
      "description": "What this connection means in business terms"
    }
  ],
  "crossWorkflowPatterns": [
    {
      "pattern": "Short name (e.g., 'Duplication', 'Single point of failure')",
      "description": "What was detected",
      "affectedWorkflows": ["list"],
      "businessImplication": "Why this matters"
    }
  ]
}
</output_format>

<anti_patterns>
- Do NOT just summarize each workflow independently. Your job is SYNTHESIS across the collection.
- Do NOT create processes based on technical categories ("Email workflows", "Sheet workflows"). Group by BUSINESS function.
- Do NOT ignore suggested processes. If existing workflow data implies a business domain with no workflows, that's a key finding.
- Do NOT write system narratives as flat descriptions ("Gmail — used for email"). Write what the usage REVEALS about the business.
- Do NOT miss duplication. Multiple workflows doing the same thing is always a finding.
</anti_patterns>`;

function computeExecutionStats(executionsData: {
  data: Array<{ status: string; mode: string; stoppedAt: string }>;
}) {
  const execs = executionsData.data;
  const total = execs.length;
  const successful = execs.filter((e) => e.status === "success").length;
  const errorRate =
    total > 0 ? ((execs.filter((e) => e.status === "error").length / total) * 100).toFixed(1) : "0";

  const sorted = [...execs].sort(
    (a, b) => new Date(b.stoppedAt).getTime() - new Date(a.stoppedAt).getTime()
  );

  return {
    total,
    successful,
    errorRate,
    lastRun: sorted[0]?.stoppedAt ?? "never",
    lastStatus: sorted[0]?.status ?? "unknown",
  };
}

function formatExecutionOverview(
  allWorkflows: Array<{
    label: string;
    summary: { name: string; active?: boolean };
    stats: ReturnType<typeof computeExecutionStats>;
    active: boolean;
  }>
) {
  return allWorkflows
    .map(
      (w) =>
        `- ${w.summary.name}: ${w.stats.total} runs, ${w.stats.errorRate}% error rate, last run ${w.stats.lastRun}, ${w.active ? "ACTIVE" : "inactive"}`
    )
    .join("\n");
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("ERROR: OPENROUTER_API_KEY not set");
    process.exit(1);
  }

  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";
  console.log(`\n🔬 Research Spike — Step 2: Call 1 "Understand"`);
  console.log(`Model: ${model}\n`);

  // Load all per-automation summaries
  const allSummariesPath = path.join(RESULTS_DIR, "step1-all.json");
  if (!fs.existsSync(allSummariesPath)) {
    console.error("ERROR: step1-all.json not found. Run Step 1 first.");
    process.exit(1);
  }
  const allSummaries = JSON.parse(fs.readFileSync(allSummariesPath, "utf-8"));

  // Load execution stats and workflow metadata for overview
  const workflowOverviews = ALL_WORKFLOWS.map((w) => {
    const execPath = path.join(REFERENCE_DIR, w.executionsFile);
    const execData = JSON.parse(fs.readFileSync(execPath, "utf-8"));
    const stats = computeExecutionStats(execData);

    const wfPath = path.join(
      REFERENCE_DIR,
      w.label.replace(/^(\d+[a-z]?)-/, "$1-").replace(w.label, `${w.label.split("-").slice(0, 1)}`).length > 0
        ? `${w.label.match(/^\d+[a-z]?/)?.[0]}-${w.label.replace(/^\d+[a-z]?-/, "")}.json`
        : `${w.label}.json`
    );

    // Read the workflow JSON for active status
    const workflowFiles: Record<string, string> = {
      "01-send-welcome-email": "01-send-welcome-email.json",
      "02-lotterywins": "02-lotterywins.json",
      "02b-lotterywins-error-handling": "02b-lotterywins-error-handling.json",
      "03-support-classifier": "03-support-classifier.json",
      "04-switch-faq-manual": "04-switch-faq-manual.json",
      "04-switch-faq-manual-sheet": "04-switch-faq-manual-sheet.json",
      "05-lotterywins-published": "05-lotterywins-published.json",
      "05-generic-error-workflow": "05-generic-error-workflow.json",
    };

    const wfJson = JSON.parse(
      fs.readFileSync(
        path.join(REFERENCE_DIR, workflowFiles[w.label]!),
        "utf-8"
      )
    );

    return {
      label: w.label,
      summary: allSummaries[w.label],
      stats,
      active: wfJson.active as boolean,
    };
  });

  // Build the user message
  const summariesArray = Object.values(allSummaries);
  const executionOverview = formatExecutionOverview(workflowOverviews);

  // Collect all unique tags
  const tags = new Set<string>();
  for (const w of workflowOverviews) {
    // Tags from workflow JSONs
    const workflowFiles: Record<string, string> = {
      "01-send-welcome-email": "01-send-welcome-email.json",
      "02-lotterywins": "02-lotterywins.json",
      "02b-lotterywins-error-handling": "02b-lotterywins-error-handling.json",
      "03-support-classifier": "03-support-classifier.json",
      "04-switch-faq-manual": "04-switch-faq-manual.json",
      "04-switch-faq-manual-sheet": "04-switch-faq-manual-sheet.json",
      "05-lotterywins-published": "05-lotterywins-published.json",
      "05-generic-error-workflow": "05-generic-error-workflow.json",
    };
    const wfJson = JSON.parse(
      fs.readFileSync(
        path.join(REFERENCE_DIR, workflowFiles[w.label]!),
        "utf-8"
      )
    );
    if (wfJson.tags) {
      for (const t of wfJson.tags) tags.add(t.name);
    }
  }

  // Collect credentials from summaries
  const allCredentials = new Set<string>();
  for (const s of summariesArray as Array<{ technicalEvidence?: { credentials?: string[] } }>) {
    if (s.technicalEvidence?.credentials) {
      for (const c of s.technicalEvidence.credentials) allCredentials.add(c);
    }
  }

  const userMessage = `<workflow_summaries>
${JSON.stringify(summariesArray, null, 2)}
</workflow_summaries>

<execution_overview>
${executionOverview}
</execution_overview>

<instance_metadata>
Tags: ${[...tags].join(", ")} (all 8 workflows tagged)
Total workflows analyzed: 8
Credentials available: ${[...allCredentials].join("; ")}
Users: not accessible
</instance_metadata>

Analyze this automation landscape. Return the JSON object with your reasoning in the "reasoning" field.`;

  console.log(`Input tokens estimate: ~${Math.round(userMessage.length / 4)} tokens`);
  console.log(`Calling ${model}...\n`);

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const startTime = Date.now();

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
    console.error("ERROR: Empty response");
    process.exit(1);
  }

  const content = rawContent
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(content);

  console.log(`Done in ${elapsed}s`);
  console.log(
    `Tokens: ${response.usage?.prompt_tokens ?? "?"} in / ${response.usage?.completion_tokens ?? "?"} out`
  );

  // Print summary
  console.log(`\n--- Processes ---`);
  for (const p of parsed.processes ?? []) {
    console.log(`  ${p.name} (${p.coverage}, ${p.maturityLevel})`);
  }
  console.log(`\n--- Suggested Processes ---`);
  for (const p of parsed.suggestedProcesses ?? []) {
    console.log(`  ${p.name}: ${p.basedOn?.substring(0, 100)}...`);
  }
  console.log(`\n--- System Landscape ---`);
  for (const s of parsed.systemLandscape ?? []) {
    console.log(`  ${s.name}: ${s.insight}`);
  }
  console.log(`\n--- Cross-Workflow Patterns ---`);
  for (const p of parsed.crossWorkflowPatterns ?? []) {
    console.log(`  ${p.pattern}: ${p.businessImplication?.substring(0, 100)}`);
  }

  // Save
  fs.writeFileSync(
    path.join(RESULTS_DIR, "step2-understand.json"),
    JSON.stringify(parsed, null, 2)
  );

  console.log(`\n✅ Saved to step2-understand.json`);
}

main().catch(console.error);
