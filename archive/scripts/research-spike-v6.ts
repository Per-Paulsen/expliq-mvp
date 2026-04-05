/**
 * Research Spike v6 — Hybrid: lean instructions + structured output + targeted methods
 *
 * Takes: v5's instruction simplicity + v4's output schema/rubrics + v4's structural
 * methods ONLY where proven needed (state machine for lifecycle, two-phase for domain coverage).
 *
 * Key changes from v4:
 * - Per-automation: lean instructions (v5-style), but keeps rubrics + detectability + structural features
 * - Call 1: lean framing, but keeps two-phase for Method 3 (domain coverage) and state machine for Method 5 (lifecycle)
 *   Methods 1, 2, 4 are simplified to natural language (no forced phases)
 * - Call 2: single simple instruction + output schema (v5-style simplicity)
 * - Keeps taxonomy extraction and structural features from v4
 *
 * Usage:
 *   npx tsx scripts/research-spike-v6.ts --model anthropic/claude-opus-4
 *   npx tsx scripts/research-spike-v6.ts --model anthropic/claude-sonnet-4
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const REFERENCE_DIR = path.join(process.cwd(), "n8n-api-examples/fairtix/reference");
const RESULTS_DIR = path.join(process.cwd(), "specs/research-spike-results/v6");

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
// STRUCTURAL FEATURES + TAXONOMY EXTRACTION (from v4)
// ============================================================

const SYSTEM_MAP: Record<string, string> = {
  gmail: "gmail", google_sheets: "google sheets", googlesheets: "google sheets",
  googlesheetstrigger: "google sheets", googledocs: "google docs",
  slack: "slack", anthropic: "anthropic claude", openai: "openai",
  hubspot: "hubspot", salesforce: "salesforce", airtable: "airtable",
  notion: "notion", jira: "jira", github: "github", stripe: "stripe",
  twilio: "twilio", sendgrid: "sendgrid", mailchimp: "mailchimp",
  postgres: "postgresql", mysql: "mysql", mongodb: "mongodb",
  webhook: "webhook", httprequest: "http api",
};

function detectSystem(nodeType: string): string | null {
  const lower = nodeType.toLowerCase();
  for (const [key, system] of Object.entries(SYSTEM_MAP)) {
    if (lower.includes(key)) return system;
  }
  if (lower.includes("langchain") && lower.includes("anthropic")) return "anthropic claude";
  if (lower.includes("langchain")) return "langchain";
  return null;
}

function detectTriggerType(nodeType: string): string {
  const lower = nodeType.toLowerCase();
  if (lower.includes("webhook")) return "webhook";
  if (lower.includes("scheduletrigger") || lower.includes("cron")) return "schedule";
  if (lower.includes("manualtrigger")) return "manual";
  if (lower.includes("errortrigger")) return "error";
  if (lower.includes("trigger")) return "polling";
  return "other";
}

function extractTaxonomies(nodes: any[]): Array<{ source: string; name: string; values: string[] }> {
  const taxonomies: Array<{ source: string; name: string; values: string[] }> = [];
  for (const node of nodes) {
    if (node.parameters?.inputSchema) {
      try {
        const schema = typeof node.parameters.inputSchema === "string"
          ? JSON.parse(node.parameters.inputSchema) : node.parameters.inputSchema;
        if (schema.properties) {
          for (const [field, def] of Object.entries(schema.properties as Record<string, any>)) {
            if (def.enum && Array.isArray(def.enum) && def.enum.length > 1) {
              taxonomies.push({ source: `${node.name} → ${field}`, name: field, values: def.enum });
            }
          }
        }
      } catch { /* ignore */ }
    }
    if (node.parameters?.messages?.messageValues) {
      for (const msg of node.parameters.messages.messageValues) {
        if (typeof msg.message === "string" && msg.message.length > 200) {
          const categoryMatches = msg.message.match(/\*\*([A-Z][^*]+)\*\*\s*—/g);
          if (categoryMatches && categoryMatches.length >= 3) {
            const categories = categoryMatches.map((m: string) => m.replace(/\*\*/g, "").replace(/\s*—.*/, "").trim());
            taxonomies.push({ source: `${node.name} (AI prompt)`, name: "classification categories", values: categories });
          }
        }
      }
    }
  }
  return taxonomies;
}

function extractStructuralFeatures(wf: any) {
  const allNodes = (wf.nodes || []) as any[];
  const functional = allNodes.filter((n: any) => n.type !== "n8n-nodes-base.stickyNote");
  const nodes = functional.map((n: any) => ({
    name: n.name, type: n.type,
    hasRetryOnFail: n.retryOnFail === true,
    hasCredentials: !!n.credentials && Object.keys(n.credentials).length > 0,
    isDisabled: n.disabled === true,
  }));
  let branchCount = 0;
  for (const nodeName of Object.keys(wf.connections || {})) {
    for (const connType of Object.keys(wf.connections[nodeName])) {
      const outputs = wf.connections[nodeName][connType];
      if (Array.isArray(outputs) && outputs.length > 1) branchCount += outputs.length - 1;
    }
  }
  const credentials: Array<{ node: string; name: string; type: string }> = [];
  for (const n of functional) {
    if (n.credentials) {
      for (const [t, r] of Object.entries(n.credentials as Record<string, any>)) {
        credentials.push({ node: n.name, name: (r as any).name || "unnamed", type: t });
      }
    }
  }
  const systems = new Set<string>();
  for (const n of functional) { const s = detectSystem(n.type); if (s) systems.add(s); }
  const triggers = functional.filter((n: any) => n.type.toLowerCase().includes("trigger"));
  const triggerType = triggers.length > 0 ? detectTriggerType(triggers[0].type) : "manual";
  let triggerConfig = "manual execution";
  if (triggers.length > 0) {
    const tp = triggers[0].parameters || {};
    if (tp.pollTimes?.item?.[0]?.mode) triggerConfig = `polling: ${tp.pollTimes.item[0].mode}`;
    else if (tp.rule?.interval) triggerConfig = `schedule: ${JSON.stringify(tp.rule.interval[0])}`;
    else if (triggerType === "error") triggerConfig = "error trigger";
    else if (triggerType === "webhook") triggerConfig = "webhook";
  }
  return {
    nodeCount: functional.length, nodeTypes: [...new Set(functional.map((n: any) => n.type))],
    nodes, branchCount,
    hasErrorTrigger: triggers.some((n: any) => n.type.toLowerCase().includes("errortrigger")),
    errorWorkflowId: wf.settings?.errorWorkflow || null,
    retryEnabledNodes: nodes.filter(n => n.hasRetryOnFail).map(n => n.name),
    noRetryNodes: nodes.filter(n => !n.hasRetryOnFail && n.hasCredentials).map(n => n.name),
    credentials, disabledNodes: nodes.filter(n => n.isDisabled).map(n => n.name),
    systemsDetected: [...systems], triggerType, triggerConfig,
    callerIds: wf.settings?.callerIds || null,
    timeSavedPerExecution: wf.settings?.timeSavedPerExecution ?? null,
    taxonomies: extractTaxonomies(functional),
  };
}

function computeStats(data: { data: Array<{ status: string; mode: string; stoppedAt: string }> }) {
  const execs = data.data;
  const total = execs.length;
  const success = execs.filter(e => e.status === "success").length;
  const failed = total - success;
  const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : "N/A";
  const errorRate = total > 0 ? ((failed / total) * 100).toFixed(1) : "N/A";
  const sorted = [...execs].sort((a, b) => new Date(b.stoppedAt).getTime() - new Date(a.stoppedAt).getTime());
  return { total, success, failed, successRate, errorRate, lastRun: sorted[0]?.stoppedAt ?? "never", lastStatus: sorted[0]?.status ?? "unknown", modes: [...new Set(execs.map(e => e.mode))] };
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
// v6 PROMPTS — lean instructions, structured output, targeted methods
// ============================================================

const PER_AUTOMATION_PROMPT = `You are an automation intelligence analyst. Analyze this n8n workflow and its execution data. Understand what it means for the business — what capability it enables, what its configuration reveals about the company, and what happens when it fails.

You receive pre-extracted structural features (your technical overview) and the full workflow JSON (read node parameters, email templates, AI prompts, and API configs for business context).

Impact rubric — apply consistently:
- critical: Directly revenue-generating OR blocks customer journey with no fallback OR single point of failure for multiple processes
- high: Customer-facing with degraded experience on failure OR supports critical data pipeline OR affects multiple processes
- medium: Internal operations OR single-process scope OR has manual fallback at current scale
- low: Utility/tooling OR development/test OR no downstream consumers

Detectability rubric:
- monitored: Error workflow linked AND active AND reliable (>90%)
- partially-monitored: Error workflow linked but inactive/unreliable, or manual checks
- silent: No error workflow, no monitoring, no retry — failures invisible

Confidence: "data-driven" (cite specific field), "benchmark-based" (industry knowledge), "ai-suggested" (inference, might be wrong).

Return a JSON object. Reasoning fields MUST precede classification fields.

{
  "reasoning": "Your analysis",
  "name": "Business name",
  "businessNarrative": "3-5 sentences: what it does for the business, why it matters, what it reveals. Deductive reasoning, not node descriptions.",
  "trigger": "Business event in plain language",
  "triggerType": "webhook | schedule | manual | event | polling | other",
  "systemsTouched": ["systems"],
  "dataFlow": "What business data enters, what gets produced, where it goes",
  "impact": {
    "reasoning": "Why this level — be specific",
    "level": "critical | high | medium | low",
    "failureScenario": "Cascading consequences",
    "revenueConnection": "Direct / Indirect / N/A with reasoning and confidence"
  },
  "detectability": {
    "reasoning": "How would failures be noticed?",
    "level": "monitored | partially-monitored | silent",
    "evidence": "Error workflow ID/reliability, or absence"
  },
  "stepName": "Position in business process",
  "timeSavingsEstimate": "Range with reasoning and confidence, or N/A",
  "technicalEvidence": {
    "errorHandling": "Retry settings, error workflow. Absent retryOnFail = false in n8n.",
    "credentials": ["name and type"],
    "complexity": "Node count, branching, patterns",
    "keyFindings": ["Technical details with business implications"]
  }
}`;

const CALL1_PROMPT = `You are a business analyst assessing an automation landscape. Synthesize individual workflow analyses into a complete picture of what this company automates, what's working, and what's missing.

Find patterns across the collection: duplicates, shared dependencies, gaps in business processes, operational inconsistencies. Group workflows into business processes and identify what should exist but doesn't.

Two specific analytical techniques to apply thoroughly:

DOMAIN-COVERAGE VERIFICATION — two-phase:
Phase A: Extract a complete numbered list of every business domain referenced in the data (support categories, email CTAs, data fields, business terms, and especially any values from the pre-extracted taxonomies below).
Phase B: For each numbered item, state whether a corresponding automation exists or is a GAP. Every item must receive a verdict.

LIFECYCLE COMPLETENESS — state machine:
For each business process, model it as a state machine. Identify ALL participants (including those who receive non-outcomes — rejected, unselected, unsuccessful). Define ALL states and transitions. A participant who enters the process but reaches no terminal state is a SILENT DROP-OFF.

Confidence: "data-driven", "benchmark-based", "ai-suggested".

Return a JSON object:

{
  "reasoning": "Step-by-step analysis. Show domain-coverage census and lifecycle state machines.",
  "processes": [
    {
      "name": "Business process name",
      "summary": "One sentence",
      "workflows": ["names"],
      "steps": [{ "name": "Step", "workflowName": "name or null", "isAutomated": true, "isGap": false }],
      "coverage": "X of Y (N%)",
      "reliability": "X% across N executions",
      "maturityReasoning": "Why this level",
      "maturityLevel": "Prototype | Emerging | Developing | Production | Optimized"
    }
  ],
  "suggestedProcesses": [
    {
      "name": "Name",
      "summary": "What it would accomplish",
      "basedOn": "Specific evidence proving this domain exists",
      "suggestedSteps": ["Step 1", "Step 2"],
      "connectedSystems": ["systems"]
    }
  ],
  "systemLandscape": [
    { "name": "System", "role": "Role", "workflowCount": 0, "narrative": "What usage reveals", "insight": "Key risk" }
  ],
  "connectedAutomations": [
    { "fromWorkflow": "name", "toWorkflow": "name", "connectionType": "errorWorkflow | callerIds | logical", "description": "Business meaning" }
  ],
  "crossWorkflowFindings": [
    { "finding": "Name", "description": "What", "affectedWorkflows": ["list"], "businessImplication": "Why it matters" }
  ]
}`;

const CALL2_PROMPT = `You are a business opportunity consultant. You receive an automation landscape assessment. Find every missing business opportunity — what should this company build, fix, or connect? Be thorough.

Every gap from the landscape analysis should become a recommendation. Don't leave identified gaps unaddressed.

Tiers: act_now (high impact + high confidence), investigate (high impact + can't fully verify), explore (lower urgency or needs platform expansion).
Types: new_workflow, technical_fix, platform_connection.
For uncertain recommendations, be honest: "We don't see this in your workflows. If handled elsewhere, consider connecting for visibility."
Confidence: "data-driven" (cite evidence), "benchmark-based" (industry knowledge), "ai-suggested" (inference).

"Your Next Move": reference specific workflow names and numbers, chain 2-3 actions with reasoning, narrative paragraph.

Return a JSON object:

{
  "reasoning": "Analysis of priorities and evidence strength",
  "recommendations": [
    {
      "id": "r1",
      "reasoning": "Why this matters, evidence strength",
      "type": "new_workflow | technical_fix | platform_connection",
      "tier": "act_now | investigate | explore",
      "name": "Title",
      "businessCase": "One-line impact",
      "confidence": "data-driven | benchmark-based | ai-suggested",
      "evidenceChain": ["Evidence citing source"],
      "honestFraming": "Uncertainty text, or null",
      "affectedScope": "Which process or workflows",
      "implementationNotes": "Brief guidance"
    }
  ],
  "processSuggestions": [
    { "name": "Name", "description": "What", "businessCase": "Why", "basedOn": "Evidence", "connectedSystems": ["systems"], "childRecommendationIds": ["r1"] }
  ],
  "nextMove": { "text": "Specific chained narrative", "reasoning": "Why this sequence" },
  "visibilityExpansions": [
    { "platform": "Name", "reasoning": "Why", "whatItUnlocks": "Insights" }
  ]
}`;

// ============================================================
// MAIN
// ============================================================

async function main() {
  if (!process.env.OPENROUTER_API_KEY) { console.error("ERROR: OPENROUTER_API_KEY not set"); process.exit(1); }

  console.log(`\n=== Research Spike v6 — Hybrid ===`);
  console.log(`Model: ${MODEL}\n`);

  const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY });
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  // --- STEP 1 ---
  if (STEP === 0 || STEP === 1) {
    console.log(`--- Step 1: Per-automation (8 workflows) ---\n`);
    const results: Record<string, any> = {};
    let totalIn = 0, totalOut = 0;

    for (const wf of ALL_WORKFLOW_LIST) {
      const wfJson = JSON.parse(fs.readFileSync(path.join(REFERENCE_DIR, wf.workflow), "utf-8"));
      const execData = JSON.parse(fs.readFileSync(path.join(REFERENCE_DIR, wf.executions), "utf-8"));
      const features = extractStructuralFeatures(wfJson);
      const stats = computeStats(execData);

      const userMsg = `<structural_features>\n${JSON.stringify(features, null, 2)}\n</structural_features>\n\n<workflow_json>\n${JSON.stringify(wfJson, null, 2)}\n</workflow_json>\n\n<execution_stats>\nExecutions: ${stats.total} total, ${stats.errorRate}% error rate, last: ${stats.lastRun} (${stats.lastStatus})\nStatus: ${wfJson.active ? "active" : "inactive"} | Versions: ${wfJson.versionCounter}\n</execution_stats>\n\nAnalyze this workflow. Return only the JSON object.`;

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

  // --- STEP 2 ---
  if (STEP === 0 || STEP === 2) {
    console.log(`--- Step 2: Call 1 "Understand" ---\n`);
    const allSummaries = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, "step1-all.json"), "utf-8"));

    const execOverview = ALL_WORKFLOW_LIST.map(wf => {
      const stats = computeStats(JSON.parse(fs.readFileSync(path.join(REFERENCE_DIR, wf.executions), "utf-8")));
      const wfJson = JSON.parse(fs.readFileSync(path.join(REFERENCE_DIR, wf.workflow), "utf-8"));
      const s = allSummaries[wf.label] as any;
      return `- ${s?.name || wf.label}: ${stats.total} runs, ${stats.errorRate}% error, ${wfJson.active ? "ACTIVE" : "inactive"}`;
    }).join("\n");

    const tags = new Set<string>(), creds = new Set<string>();
    const allTax: Array<{ source: string; name: string; values: string[] }> = [];
    for (const wf of ALL_WORKFLOW_LIST) {
      const wfJson = JSON.parse(fs.readFileSync(path.join(REFERENCE_DIR, wf.workflow), "utf-8"));
      for (const t of wfJson.tags || []) tags.add(t.name);
      const s = allSummaries[wf.label] as any;
      for (const c of s?.technicalEvidence?.credentials || []) creds.add(typeof c === "string" ? c : `${c.name} (${c.type})`);
      allTax.push(...extractStructuralFeatures(wfJson).taxonomies);
    }
    const uniqueTax = allTax.filter((t, i) => allTax.findIndex(u => u.name === t.name && JSON.stringify(u.values) === JSON.stringify(t.values)) === i);

    const taxSection = uniqueTax.length > 0
      ? `\n<extracted_taxonomies>\nCategorical lists extracted from automation data. Your domain-coverage Phase A must include ALL values from these taxonomies.\n${uniqueTax.map((t, i) => `${i + 1}. ${t.source}: ${t.values.join(", ")} (${t.values.length} values)`).join("\n")}\n</extracted_taxonomies>` : "";

    const userMsg = `<workflow_summaries>\n${JSON.stringify(Object.values(allSummaries), null, 2)}\n</workflow_summaries>\n\n<execution_overview>\n${execOverview}\n</execution_overview>\n\n<instance_metadata>\nTags: ${[...tags].join(", ")}\nTotal workflows: ${Object.keys(allSummaries).length}\nCredentials: ${[...creds].join("; ")}\n</instance_metadata>${taxSection}\n\nAnalyze this automation landscape. Return the JSON object.`;

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

  // --- STEP 3 ---
  if (STEP === 0 || STEP === 3) {
    console.log(`--- Step 3: Call 2 "Advise" ---\n`);
    const landscape = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, "step2-understand.json"), "utf-8"));
    const allSummaries = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, "step1-all.json"), "utf-8"));

    const userMsg = `<landscape_analysis>\n${JSON.stringify(landscape, null, 2)}\n</landscape_analysis>\n\n<workflow_summaries>\n${JSON.stringify(Object.values(allSummaries), null, 2)}\n</workflow_summaries>\n\nFind every missing business opportunity. Return the JSON object.`;

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
