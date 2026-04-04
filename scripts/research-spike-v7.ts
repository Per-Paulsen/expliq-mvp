/**
 * Research Spike v7 — Simple prompts everywhere, full data everywhere
 *
 * Hypothesis: simple prompts + full data + output schemas = best results.
 * No rubrics, no structural features, no methods, no state machines.
 * Just: "analyze this" and "find every opportunity."
 *
 * Usage:
 *   npx tsx scripts/research-spike-v7.ts --model anthropic/claude-opus-4
 *   npx tsx scripts/research-spike-v7.ts --model anthropic/claude-sonnet-4
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const REFERENCE_DIR = path.join(process.cwd(), "n8n-api-examples/fairtix/reference");
const RESULTS_DIR = path.join(process.cwd(), "specs/research-spike-results/v7");

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
// SIMPLE PROMPTS — output schemas only, minimal instructions
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
  "impact": {
    "reasoning": "Why this level — connect to revenue, customer experience, or operations",
    "level": "critical | high | medium | low",
    "failureScenario": "What breaks when this fails — cascading consequences",
    "revenueConnection": "Direct / Indirect / N/A with reasoning"
  },
  "detectability": {
    "reasoning": "How would the team discover a failure?",
    "level": "monitored | partially-monitored | silent",
    "evidence": "What monitoring exists or doesn't"
  },
  "stepName": "Position label in its business process",
  "timeSavingsEstimate": "Range with reasoning, or N/A",
  "technicalEvidence": {
    "errorHandling": "Retry settings, error workflow config, what's missing",
    "credentials": ["credential name and type pairs"],
    "complexity": "Node count, branching, notable patterns",
    "keyFindings": ["Specific technical observations with business implications"]
  }
}`;

const CALL1_PROMPT = `You are a business analyst assessing a company's full automation landscape. You receive analyses of each individual workflow plus the raw workflow JSONs.

Your job: synthesize everything into a complete picture. What does this company do? How do the automations relate? What business processes exist? What's missing? What patterns and risks emerge when you look at the full collection?

Be thorough and creative. Look at every detail — support categories, email content, data fields, CTAs, system dependencies. Every piece of data is evidence about the business.

Return a JSON object:

{
  "reasoning": "Your complete analysis — what this company does, how workflows relate, patterns you see, gaps you find",
  "processes": [
    {
      "name": "Business process name",
      "summary": "One sentence: what this process accomplishes",
      "workflows": ["workflow names that belong to this process"],
      "steps": [
        { "name": "Step name", "workflowName": "name of handling workflow, or null if gap", "isAutomated": true, "isGap": false }
      ],
      "coverage": "X of Y steps automated (N%)",
      "reliability": "Success rate across executions",
      "maturityReasoning": "Why this maturity level",
      "maturityLevel": "Prototype | Emerging | Developing | Production | Optimized"
    }
  ],
  "suggestedProcesses": [
    {
      "name": "Process that should exist",
      "summary": "What it would accomplish",
      "basedOn": "Specific evidence from the automation data proving this domain exists",
      "suggestedSteps": ["Step 1", "Step 2"],
      "connectedSystems": ["systems that would be involved"]
    }
  ],
  "systemLandscape": [
    {
      "name": "System name",
      "role": "What role this system plays",
      "workflowCount": 0,
      "narrative": "What the usage pattern reveals about the business",
      "insight": "Key risk or insight"
    }
  ],
  "connectedAutomations": [
    { "fromWorkflow": "name", "toWorkflow": "name", "connectionType": "errorWorkflow | callerIds | logical", "description": "Business meaning" }
  ],
  "crossWorkflowFindings": [
    { "finding": "Short name", "description": "What was detected", "affectedWorkflows": ["list"], "businessImplication": "Why it matters" }
  ]
}`;

const CALL2_PROMPT = `You are a business opportunity consultant. You receive a full automation landscape assessment plus all the raw workflow JSONs.

Find every missing business opportunity — what should this company build, fix, or connect? Be extensive and creative. Leave no stone unturned. Think about:
- What's broken and needs fixing (cite specific technical details — node names, config values, error rates)
- What's missing and should be built (cite the evidence that proves this gap exists)
- What could be connected for better visibility
- What participants in existing processes are being forgotten
- What data is being collected but never used
- What time-sensitive operations lack follow-ups or reminders

For technical fixes, be SPECIFIC: name the node, cite the config value, describe exactly what to change. Don't say "add retry logic" — say "enable retryOnFail on the 'Send a message' Gmail node with 3 retries and exponential backoff."

Tiers: act_now (high impact + confident), investigate (high impact + can't fully verify), explore (lower urgency).
Types: new_workflow, technical_fix, platform_connection.
For uncertain recommendations: "We don't see this in your workflows. If handled elsewhere, consider connecting for visibility."
Confidence: "data-driven" (cite evidence), "benchmark-based" (industry knowledge), "ai-suggested" (inference).

"Your Next Move": reference specific workflow names and numbers, chain 2-3 actions, explain why this sequence.

Return a JSON object:

{
  "reasoning": "Your analysis of priorities, evidence, and what you're uncertain about",
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
  "nextMove": { "text": "Specific, chained narrative with workflow names and numbers", "reasoning": "Why this sequence" },
  "visibilityExpansions": [
    { "platform": "Name", "reasoning": "Why connecting helps", "whatItUnlocks": "What insights become possible" }
  ]
}`;

// ============================================================
// MAIN
// ============================================================

async function main() {
  if (!process.env.OPENROUTER_API_KEY) { console.error("ERROR: OPENROUTER_API_KEY not set"); process.exit(1); }

  console.log(`\n=== Research Spike v7 — Simple Everywhere ===`);
  console.log(`Model: ${MODEL}\n`);

  const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY });
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  // Load all workflow JSONs and execution data upfront
  const allWorkflowData: Record<string, { wfJson: any; execData: any; stats: ReturnType<typeof computeStats> }> = {};
  for (const wf of ALL_WORKFLOW_LIST) {
    const wfJson = JSON.parse(fs.readFileSync(path.join(REFERENCE_DIR, wf.workflow), "utf-8"));
    const execData = JSON.parse(fs.readFileSync(path.join(REFERENCE_DIR, wf.executions), "utf-8"));
    allWorkflowData[wf.label] = { wfJson, execData, stats: computeStats(execData) };
  }

  // --- STEP 1: Per-automation ---
  if (STEP === 0 || STEP === 1) {
    console.log(`--- Step 1: Per-automation (8 workflows) ---\n`);
    const results: Record<string, any> = {};
    let totalIn = 0, totalOut = 0;

    for (const wf of ALL_WORKFLOW_LIST) {
      const { wfJson, stats } = allWorkflowData[wf.label];

      const userMsg = `<workflow_json>
${JSON.stringify(wfJson, null, 2)}
</workflow_json>

<execution_stats>
Executions: ${stats.total} total, ${stats.errorRate}% error rate
Last: ${stats.lastRun} (${stats.lastStatus})
Status: ${wfJson.active ? "active" : "inactive"} | Versions: ${wfJson.versionCounter}
Modes: ${stats.modes.join(", ")}
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
      const tIn = resp.usage?.prompt_tokens ?? 0, tOut = resp.usage?.completion_tokens ?? 0;
      totalIn += tIn; totalOut += tOut;
      console.log(`  ${wf.label}: ${elapsed}s | ${tIn}/${tOut} tok | ${parsed.impact?.level} | ${parsed.name}`);
      results[wf.label] = parsed;
      fs.writeFileSync(path.join(RESULTS_DIR, `step1-${wf.label}.json`), JSON.stringify(parsed, null, 2));
    }
    fs.writeFileSync(path.join(RESULTS_DIR, "step1-all.json"), JSON.stringify(results, null, 2));
    console.log(`\n  Step 1 total: ${totalIn} in / ${totalOut} out\n`);
  }

  // --- STEP 2: Call 1 "Understand" — gets summaries + full JSONs ---
  if (STEP === 0 || STEP === 2) {
    console.log(`--- Step 2: Call 1 "Understand" (with full JSONs) ---\n`);
    const allSummaries = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, "step1-all.json"), "utf-8"));

    // Build execution overview
    const execOverview = ALL_WORKFLOW_LIST.map(wf => {
      const { stats, wfJson } = allWorkflowData[wf.label];
      const s = allSummaries[wf.label] as any;
      return `- ${s?.name || wf.label}: ${stats.total} runs, ${stats.errorRate}% error, ${wfJson.active ? "ACTIVE" : "inactive"}`;
    }).join("\n");

    // Collect all raw workflow JSONs (compact — no pretty print to save tokens)
    const allRawJsons = ALL_WORKFLOW_LIST.map(wf => ({
      label: wf.label,
      json: allWorkflowData[wf.label].wfJson,
    }));

    const userMsg = `<workflow_analyses>
${JSON.stringify(Object.values(allSummaries), null, 2)}
</workflow_analyses>

<raw_workflow_jsons>
${JSON.stringify(allRawJsons)}
</raw_workflow_jsons>

<execution_overview>
${execOverview}
</execution_overview>

Analyze this automation landscape. Return the JSON object.`;

    const start = Date.now();
    const resp = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: CALL1_PROMPT }, { role: "user", content: userMsg }],
      response_format: { type: "json_object" },
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const parsed = parseJSON(resp.choices[0]?.message?.content || "", path.join(RESULTS_DIR, "step2-raw.txt"));
    console.log(`  ${elapsed}s | ${resp.usage?.prompt_tokens}/${resp.usage?.completion_tokens} tok`);
    console.log(`  Processes: ${(parsed.processes || []).map((p: any) => p.name).join(", ")}`);
    console.log(`  Suggested: ${(parsed.suggestedProcesses || []).map((p: any) => p.name).join(", ")}`);
    console.log(`  Findings: ${(parsed.crossWorkflowFindings || []).length}`);
    fs.writeFileSync(path.join(RESULTS_DIR, "step2-understand.json"), JSON.stringify(parsed, null, 2));
    console.log();
  }

  // --- STEP 3: Call 2 "Advise" — gets landscape + summaries + full JSONs ---
  if (STEP === 0 || STEP === 3) {
    console.log(`--- Step 3: Call 2 "Advise" (with full JSONs) ---\n`);
    const landscape = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, "step2-understand.json"), "utf-8"));
    const allSummaries = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, "step1-all.json"), "utf-8"));

    const allRawJsons = ALL_WORKFLOW_LIST.map(wf => ({
      label: wf.label,
      json: allWorkflowData[wf.label].wfJson,
    }));

    const userMsg = `<landscape_analysis>
${JSON.stringify(landscape, null, 2)}
</landscape_analysis>

<workflow_analyses>
${JSON.stringify(Object.values(allSummaries), null, 2)}
</workflow_analyses>

<raw_workflow_jsons>
${JSON.stringify(allRawJsons)}
</raw_workflow_jsons>

Find every missing business opportunity. Be extensive and creative. Return the JSON object.`;

    const start = Date.now();
    const resp = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: CALL2_PROMPT }, { role: "user", content: userMsg }],
      response_format: { type: "json_object" },
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const parsed = parseJSON(resp.choices[0]?.message?.content || "", path.join(RESULTS_DIR, "step3-raw.txt"));
    console.log(`  ${elapsed}s | ${resp.usage?.prompt_tokens}/${resp.usage?.completion_tokens} tok`);
    for (const r of parsed.recommendations || []) {
      const tier = r.tier === "act_now" ? "ACT NOW" : r.tier === "investigate" ? "INVESTIGATE" : "EXPLORE";
      console.log(`  [${tier}] ${r.id}: ${r.name} (${r.confidence})`);
    }
    console.log(`\n  Next Move: ${(parsed.nextMove?.text || "").substring(0, 200)}...`);
    fs.writeFileSync(path.join(RESULTS_DIR, "step3-advise.json"), JSON.stringify(parsed, null, 2));
  }

  console.log(`\n=== Done. Results in ${RESULTS_DIR}/ ===`);
}

main().catch(console.error);
