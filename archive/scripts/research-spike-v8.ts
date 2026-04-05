/**
 * Research Spike v8 — Two calls, simple prompts, full data, PRD-complete schema
 *
 * Call 1: Per-automation (parallel) — Detail page data
 * Call 2: Single workspace — landscape + recommendations + next move
 *
 * Usage:
 *   npx tsx scripts/research-spike-v8.ts --model anthropic/claude-opus-4
 *   npx tsx scripts/research-spike-v8.ts --model anthropic/claude-sonnet-4
 *   npx tsx scripts/research-spike-v8.ts --step 1   # per-automation only
 *   npx tsx scripts/research-spike-v8.ts --step 2   # workspace only (needs step 1 results)
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const REFERENCE_DIR = path.join(process.cwd(), "n8n-api-examples/fairtix/reference");
const RESULTS_DIR = path.join(process.cwd(), "specs/research-spike-results/v8");

const args = process.argv.slice(2);
const modelIdx = args.indexOf("--model");
const MODEL = modelIdx !== -1 ? args[modelIdx + 1] : (process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4");
const stepIdx = args.indexOf("--step");
const STEP = stepIdx !== -1 ? parseInt(args[stepIdx + 1]) : 0;

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
// CALL 1: PER-AUTOMATION — PRD-complete schema for Detail page
// ============================================================

const PER_AUTOMATION_PROMPT = `You are an automation intelligence analyst. Analyze this n8n workflow JSON and its execution data.

Understand what it means for the business — what capability it enables, what its technical configuration reveals about the company's operations, and what happens when it fails. Read node parameters, email templates, AI prompts, and API configs carefully — they contain the richest business insight.

Return a JSON object:

{
  "reasoning": "Your step-by-step analysis",
  "name": "Human-readable business name",
  "businessNarrative": "3-5 sentences: what this workflow does for the business, why it matters, what it reveals about the company. Show deductive reasoning about connected systems.",
  "trigger": "Business event that starts this, in plain language",
  "triggerType": "webhook | schedule | manual | event | polling | other",
  "systemsTouched": ["external systems in lowercase"],
  "dataFlow": "What business data enters, what gets produced or modified, where it goes",
  "stepName": "Position label in its business process",
  "impact": {
    "reasoning": "Why this level — connect to revenue, customer experience, or operations",
    "level": "critical | high | medium | low",
    "failureScenario": "What breaks when this fails — cascading consequences, not just 'emails not sent' but the downstream business effects",
    "revenueConnection": "Direct / Indirect / N/A with specific reasoning"
  },
  "detectability": {
    "reasoning": "How would the team discover a failure?",
    "level": "monitored | partially-monitored | silent",
    "evidence": "What monitoring exists or doesn't"
  },
  "timeSavingsEstimate": "Range with reasoning (e.g., '5-10 min per occurrence, ~200 occurrences/month = 15-30 hrs/month'). Or 'N/A — infrastructure, not replacing manual work'. Include confidence: data-driven, benchmark-based, or ai-suggested.",
  "revenueImpactEstimate": "Range with reasoning (e.g., 'Each failure loses one ticket sale at €15-200. At 36% failure rate across ~50 winners/event = €270-3,600 lost per event'). Or 'N/A — not revenue-adjacent'. Include confidence label.",
  "technicalEvidence": {
    "errorHandling": "Retry settings, error workflow config, what's missing. Be specific — name nodes, cite config values.",
    "credentials": ["credential name and type pairs — reveals system dependencies"],
    "complexity": "Node count, branching, notable patterns",
    "keyFindings": ["Specific technical observations with business implications — cite node names and config values"]
  }
}`;

// ============================================================
// CALL 2: WORKSPACE — landscape + recommendations + next move (single call)
// ============================================================

const WORKSPACE_PROMPT = `You are a senior automation consultant. You receive per-workflow analyses and the raw workflow JSONs for an entire automation instance.

Do two things in one analysis:

FIRST — UNDERSTAND the landscape:
- What does this company do? What business processes exist?
- How do the workflows relate to each other?
- What systems are involved and what are the dependency risks?
- What cross-workflow patterns and issues exist?

THEN — RECOMMEND opportunities:
- What should this company build, fix, or connect?
- Be extensive and creative. Leave no stone unturned.
- Think about: broken things, missing things, forgotten participants, unused data, time-sensitive operations lacking follow-ups
- For technical fixes: be SPECIFIC — name nodes, cite config values, describe exact changes

Confidence labels: "data-driven" (cite evidence), "benchmark-based" (industry knowledge), "ai-suggested" (inference — say what you can't see).
For uncertain recommendations: "We don't see this in your workflows. If handled elsewhere, consider connecting for visibility."

Return a JSON object:

{
  "reasoning": "Your complete analysis: what this company does, patterns, gaps, priorities",
  "processes": [
    {
      "name": "Business process name",
      "summary": "One sentence",
      "workflows": ["workflow names"],
      "steps": [
        { "name": "Step name", "workflowName": "handling workflow or null if gap", "isAutomated": true, "isGap": false }
      ],
      "coverage": "X of Y steps automated (N%)",
      "reliability": "Success rate across executions",
      "maturityReasoning": "Why this maturity level",
      "maturityLevel": "Prototype | Emerging | Developing | Production | Optimized"
    }
  ],
  "systemLandscape": [
    {
      "name": "System name",
      "role": "What role this system plays",
      "workflowCount": 0,
      "narrative": "What usage pattern reveals about the business",
      "insight": "Key risk or insight"
    }
  ],
  "connectedAutomations": [
    { "fromWorkflow": "name", "toWorkflow": "name", "connectionType": "errorWorkflow | callerIds | logical", "description": "Business meaning" }
  ],
  "crossWorkflowFindings": [
    { "finding": "Short name", "description": "What was detected", "affectedWorkflows": ["list"], "businessImplication": "Why it matters" }
  ],
  "recommendations": [
    {
      "id": "r1",
      "reasoning": "Why this matters and evidence strength",
      "type": "new_workflow | technical_fix | platform_connection",
      "tier": "act_now | investigate | explore",
      "name": "Short title",
      "businessCase": "One-line impact",
      "confidence": "data-driven | benchmark-based | ai-suggested",
      "evidenceChain": ["Specific evidence citing source"],
      "honestFraming": "Uncertainty acknowledgment, or null if confident",
      "affectedScope": "Which process or workflows",
      "implementationNotes": "Specific technical guidance — name nodes, cite configs, describe exact changes"
    }
  ],
  "processSuggestions": [
    { "name": "Name", "description": "What it accomplishes", "businessCase": "Why — cite evidence", "basedOn": "Specific evidence", "connectedSystems": ["systems"], "childRecommendationIds": ["r1"] }
  ],
  "nextMove": {
    "text": "Specific narrative: reference workflow names and numbers, chain 2-3 actions, explain why this sequence. This is the first thing the user sees.",
    "reasoning": "Why this sequence of actions"
  },
  "visibilityExpansions": [
    { "platform": "Name", "reasoning": "Why connecting helps", "whatItUnlocks": "What insights become possible" }
  ]
}`;

// ============================================================
// MAIN
// ============================================================

async function main() {
  if (!process.env.OPENROUTER_API_KEY) { console.error("ERROR: OPENROUTER_API_KEY not set"); process.exit(1); }

  console.log(`\n=== Research Spike v8 — Two Calls, PRD-Complete ===`);
  console.log(`Model: ${MODEL}\n`);

  const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY });
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  // Load all data upfront
  const allData: Record<string, { wfJson: any; stats: ReturnType<typeof computeStats> }> = {};
  for (const wf of ALL_WORKFLOW_LIST) {
    const wfJson = JSON.parse(fs.readFileSync(path.join(REFERENCE_DIR, wf.workflow), "utf-8"));
    const execData = JSON.parse(fs.readFileSync(path.join(REFERENCE_DIR, wf.executions), "utf-8"));
    allData[wf.label] = { wfJson, stats: computeStats(execData) };
  }

  // --- CALL 1: Per-automation ---
  if (STEP === 0 || STEP === 1) {
    console.log(`--- Call 1: Per-automation (8 workflows) ---\n`);
    const results: Record<string, any> = {};
    let totalIn = 0, totalOut = 0;

    for (const wf of ALL_WORKFLOW_LIST) {
      const { wfJson, stats } = allData[wf.label];
      const userMsg = `<workflow_json>\n${JSON.stringify(wfJson, null, 2)}\n</workflow_json>\n\n<execution_stats>\nExecutions: ${stats.total} total, ${stats.errorRate}% error rate\nLast: ${stats.lastRun} (${stats.lastStatus})\nStatus: ${wfJson.active ? "active" : "inactive"} | Versions: ${wfJson.versionCounter}\nModes: ${stats.modes.join(", ")}\n</execution_stats>\n\nAnalyze this workflow. Return only the JSON object.`;

      const start = Date.now();
      const resp = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: "system", content: PER_AUTOMATION_PROMPT }, { role: "user", content: userMsg }],
        response_format: { type: "json_object" },
      });
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      const parsed = parseJSON(resp.choices[0]?.message?.content || "", path.join(RESULTS_DIR, `call1-${wf.label}-raw.txt`));
      const tIn = resp.usage?.prompt_tokens ?? 0, tOut = resp.usage?.completion_tokens ?? 0;
      totalIn += tIn; totalOut += tOut;
      console.log(`  ${wf.label}: ${elapsed}s | ${tIn}/${tOut} tok | ${parsed.impact?.level} | ${parsed.name}`);
      results[wf.label] = parsed;
      fs.writeFileSync(path.join(RESULTS_DIR, `call1-${wf.label}.json`), JSON.stringify(parsed, null, 2));
    }
    fs.writeFileSync(path.join(RESULTS_DIR, "call1-all.json"), JSON.stringify(results, null, 2));
    console.log(`\n  Call 1 total: ${totalIn} in / ${totalOut} out\n`);
  }

  // --- CALL 2: Single workspace ---
  if (STEP === 0 || STEP === 2) {
    console.log(`--- Call 2: Workspace (landscape + recommendations) ---\n`);
    const allSummaries = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, "call1-all.json"), "utf-8"));

    const execOverview = ALL_WORKFLOW_LIST.map(wf => {
      const { stats, wfJson } = allData[wf.label];
      const s = allSummaries[wf.label] as any;
      return `- ${s?.name || wf.label}: ${stats.total} runs, ${stats.errorRate}% error, ${wfJson.active ? "ACTIVE" : "inactive"}`;
    }).join("\n");

    const allRawJsons = ALL_WORKFLOW_LIST.map(wf => ({
      label: wf.label,
      json: allData[wf.label].wfJson,
    }));

    const userMsg = `<workflow_analyses>\n${JSON.stringify(Object.values(allSummaries), null, 2)}\n</workflow_analyses>\n\n<raw_workflow_jsons>\n${JSON.stringify(allRawJsons)}\n</raw_workflow_jsons>\n\n<execution_overview>\n${execOverview}\n</execution_overview>\n\nAnalyze this automation landscape and find every business opportunity. Be extensive and creative. Return the JSON object.`;

    const start = Date.now();
    const resp = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: WORKSPACE_PROMPT }, { role: "user", content: userMsg }],
      response_format: { type: "json_object" },
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const parsed = parseJSON(resp.choices[0]?.message?.content || "", path.join(RESULTS_DIR, "call2-raw.txt"));
    console.log(`  ${elapsed}s | ${resp.usage?.prompt_tokens}/${resp.usage?.completion_tokens} tok`);
    console.log(`  Processes: ${(parsed.processes || []).map((p: any) => p.name).join(", ")}`);
    console.log(`  Systems: ${(parsed.systemLandscape || []).map((s: any) => s.name).join(", ")}`);
    console.log(`  Findings: ${(parsed.crossWorkflowFindings || []).length}`);
    console.log(`\n  Recommendations:`);
    for (const r of parsed.recommendations || []) {
      const tier = r.tier === "act_now" ? "ACT NOW" : r.tier === "investigate" ? "INVESTIGATE" : "EXPLORE";
      console.log(`    [${tier}] ${r.id}: ${r.name} (${r.confidence})`);
    }
    console.log(`\n  Suggested processes: ${(parsed.processSuggestions || []).map((p: any) => p.name).join(", ")}`);
    console.log(`\n  Next Move: ${(parsed.nextMove?.text || "").substring(0, 200)}...`);
    fs.writeFileSync(path.join(RESULTS_DIR, "call2-workspace.json"), JSON.stringify(parsed, null, 2));
  }

  console.log(`\n=== Done. Results in ${RESULTS_DIR}/ ===`);
}

main().catch(console.error);
