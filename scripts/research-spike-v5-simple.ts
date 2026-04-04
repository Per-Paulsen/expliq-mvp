/**
 * Research Spike v5 — Simple prompt test
 *
 * Hypothesis: a simple "find missing business opportunities" instruction
 * with just output schema and rubrics produces comparable quality to
 * the elaborate v4 methods.
 *
 * Usage:
 *   npx tsx scripts/research-spike-v5-simple.ts --model anthropic/claude-opus-4
 *   npx tsx scripts/research-spike-v5-simple.ts --model anthropic/claude-sonnet-4
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const REFERENCE_DIR = path.join(process.cwd(), "n8n-api-examples/fairtix/reference");
const RESULTS_DIR = path.join(process.cwd(), "specs/research-spike-results/v5");

const args = process.argv.slice(2);
const modelIdx = args.indexOf("--model");
const MODEL = modelIdx !== -1 ? args[modelIdx + 1] : (process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4");

const ALL_WORKFLOW_LIST = [
  { workflow: "01-send-welcome-email.json", executions: "executions-01.json", label: "01-send-welcome-email" },
  { workflow: "02-lotterywins.json", executions: "executions-02.json", label: "02-lotterywins" },
  { workflow: "02b-lotterywins-error-handling.json", executions: "executions-02b.json", label: "02b-lotterywins-error-handling" },
  { workflow: "03-support-classifier.json", executions: "executions-03.json", label: "03-support-classifier" },
  { workflow: "04-switch-faq-manual.json", executions: "executions-04.json", label: "04-switch-faq-manual" },
  { workflow: "04-switch-faq-manual-sheet.json", executions: "executions-04-sheet.json", label: "04-switch-faq-manual-sheet" },
  { workflow: "05-lotterywins-published.json", executions: "executions-05-pub.json", label: "05-lotterywins-published" },
  { workflow: "05-generic-error-workflow.json", executions: "executions-05-err.json", label: "05-generic-error-workflow" },
];

// ============================================================
// SIMPLE PROMPTS
// ============================================================

// Per-automation: minimal framing, just the output schema
const PER_AUTOMATION_PROMPT = `You are an automation intelligence analyst. Analyze this n8n workflow and its execution data. Understand what it means for the business — not what nodes it contains, but what business capability it enables and what its technical configuration reveals about the company.

Return a JSON object:
{
  "reasoning": "Your analysis",
  "name": "Business name",
  "businessNarrative": "3-5 sentences: what it does, why it matters, what it reveals about the business",
  "trigger": "Business event that starts it",
  "triggerType": "webhook | schedule | manual | event | polling | other",
  "systemsTouched": ["systems"],
  "dataFlow": "What data enters and what gets produced",
  "impact": {
    "reasoning": "Why this level",
    "level": "critical | high | medium | low",
    "failureScenario": "What breaks",
    "revenueConnection": "Direct / Indirect / N/A"
  },
  "detectability": {
    "reasoning": "How would failures be noticed?",
    "level": "monitored | partially-monitored | silent"
  },
  "stepName": "Position in business process",
  "technicalEvidence": {
    "errorHandling": "Retry/error config summary",
    "keyFindings": ["Notable technical details with business implications"]
  }
}`;

// Workspace: just "find opportunities" with output schema
const WORKSPACE_PROMPT = `You are a business consultant analyzing an automation landscape. You receive per-workflow analyses and execution data for an entire automation instance.

Find every missing business opportunity. What should this company build, fix, or connect? Be thorough — examine every piece of data for evidence of gaps, risks, and untapped potential.

Return a JSON object:
{
  "reasoning": "Your complete analysis — think step by step about what this company does, what's working, what's broken, and what's missing",
  "processes": [
    {
      "name": "Business process name",
      "summary": "What it accomplishes",
      "workflows": ["workflow names"],
      "steps": [
        { "name": "Step", "workflowName": "name or null", "isAutomated": true, "isGap": false }
      ],
      "coverage": "X of Y (N%)",
      "maturityLevel": "Prototype | Emerging | Developing | Production | Optimized"
    }
  ],
  "opportunities": [
    {
      "id": "o1",
      "reasoning": "Why this matters and evidence",
      "type": "new_workflow | technical_fix | platform_connection",
      "tier": "act_now | investigate | explore",
      "name": "Title",
      "businessCase": "One-line impact",
      "confidence": "data-driven | benchmark-based | ai-suggested",
      "evidence": ["Specific evidence"],
      "honestFraming": "Uncertainty acknowledgment, or null if confident"
    }
  ],
  "nextMove": {
    "text": "Specific, chained narrative: what to do first and why",
    "reasoning": "Why this sequence"
  }
}

Confidence labels:
- data-driven: From the user's own data. Cite it.
- benchmark-based: Industry knowledge.
- ai-suggested: You're inferring. Say what you can't see.

For uncertain opportunities, be honest: "We don't see this in your workflows. If handled elsewhere, consider connecting it for visibility."`;

// ============================================================
// HELPERS
// ============================================================

function computeStats(data: { data: Array<{ status: string; mode: string; stoppedAt: string }> }) {
  const execs = data.data;
  const total = execs.length;
  const success = execs.filter(e => e.status === "success").length;
  const errorRate = total > 0 ? ((total - success) / total * 100).toFixed(1) : "N/A";
  const sorted = [...execs].sort((a, b) => new Date(b.stoppedAt).getTime() - new Date(a.stoppedAt).getTime());
  return { total, success, errorRate, lastRun: sorted[0]?.stoppedAt ?? "never", lastStatus: sorted[0]?.status ?? "unknown", modes: [...new Set(execs.map(e => e.mode))] };
}

function parseJSON(raw: string, fallback: string): any {
  const cleaned = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    fs.writeFileSync(fallback, raw);
    throw new Error(`JSON parse failed, raw saved to ${fallback}`);
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  if (!process.env.OPENROUTER_API_KEY) { console.error("ERROR: OPENROUTER_API_KEY not set"); process.exit(1); }

  console.log(`\n=== Research Spike v5 — Simple Prompt Test ===`);
  console.log(`Model: ${MODEL}\n`);

  const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY });
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  // --- STEP 1: Per-automation (all 8) ---
  console.log(`--- Step 1: Per-automation (8 workflows) ---\n`);
  const results: Record<string, any> = {};

  for (const wf of ALL_WORKFLOW_LIST) {
    const wfJson = JSON.parse(fs.readFileSync(path.join(REFERENCE_DIR, wf.workflow), "utf-8"));
    const execData = JSON.parse(fs.readFileSync(path.join(REFERENCE_DIR, wf.executions), "utf-8"));
    const stats = computeStats(execData);

    const userMsg = `<workflow_json>
${JSON.stringify(wfJson, null, 2)}
</workflow_json>

<execution_stats>
Executions: ${stats.total} total, ${stats.errorRate}% error rate, last: ${stats.lastRun} (${stats.lastStatus})
Status: ${wfJson.active ? "active" : "inactive"} | Versions: ${wfJson.versionCounter}
</execution_stats>

Analyze this workflow. Return only the JSON object.`;

    const start = Date.now();
    const resp = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: PER_AUTOMATION_PROMPT }, { role: "user", content: userMsg }],
      response_format: { type: "json_object" },
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const parsed = parseJSON(resp.choices[0]?.message?.content || "", path.join(RESULTS_DIR, `step1-${wf.label}-raw.txt`));
    console.log(`  ${wf.label}: ${elapsed}s | ${resp.usage?.prompt_tokens}/${resp.usage?.completion_tokens} tok | ${parsed.impact?.level} | ${parsed.name}`);
    results[wf.label] = parsed;
    fs.writeFileSync(path.join(RESULTS_DIR, `step1-${wf.label}.json`), JSON.stringify(parsed, null, 2));
  }
  fs.writeFileSync(path.join(RESULTS_DIR, "step1-all.json"), JSON.stringify(results, null, 2));

  // --- STEP 2+3 COMBINED: Single workspace call ---
  console.log(`\n--- Step 2+3: Single workspace call — "find every opportunity" ---\n`);

  const execOverview = ALL_WORKFLOW_LIST.map(wf => {
    const stats = computeStats(JSON.parse(fs.readFileSync(path.join(REFERENCE_DIR, wf.executions), "utf-8")));
    const wfJson = JSON.parse(fs.readFileSync(path.join(REFERENCE_DIR, wf.workflow), "utf-8"));
    return `- ${results[wf.label]?.name || wf.label}: ${stats.total} runs, ${stats.errorRate}% error, ${wfJson.active ? "ACTIVE" : "inactive"}`;
  }).join("\n");

  const userMsg = `<workflow_analyses>
${JSON.stringify(Object.values(results), null, 2)}
</workflow_analyses>

<execution_overview>
${execOverview}
</execution_overview>

Find every missing business opportunity. Return the JSON object.`;

  const start = Date.now();
  const resp = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "system", content: WORKSPACE_PROMPT }, { role: "user", content: userMsg }],
    response_format: { type: "json_object" },
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const parsed = parseJSON(resp.choices[0]?.message?.content || "", path.join(RESULTS_DIR, "workspace-raw.txt"));

  console.log(`  ${elapsed}s | ${resp.usage?.prompt_tokens}/${resp.usage?.completion_tokens} tok`);
  console.log(`  Processes: ${(parsed.processes || []).map((p: any) => p.name).join(", ")}`);
  console.log(`\n  Opportunities:`);
  for (const o of parsed.opportunities || []) {
    const tier = o.tier === "act_now" ? "ACT NOW" : o.tier === "investigate" ? "INVESTIGATE" : "EXPLORE";
    console.log(`    [${tier}] ${o.id}: ${o.name} (${o.confidence})`);
  }
  console.log(`\n  Next Move: ${(parsed.nextMove?.text || "").substring(0, 200)}...`);

  fs.writeFileSync(path.join(RESULTS_DIR, "workspace.json"), JSON.stringify(parsed, null, 2));
  console.log(`\n=== Done. Results in ${RESULTS_DIR}/ ===`);
}

main().catch(console.error);
