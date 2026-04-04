/**
 * Research Spike v3 — Full chain from first principles
 *
 * Includes structural feature extraction (Amendment E),
 * domain-agnostic method-based prompts (Amendment D),
 * rubric-based assessment (Amendments A, C),
 * reasoning-first field ordering (Amendment B).
 *
 * Usage:
 *   npx tsx scripts/research-spike-v3.ts                        # all steps, default model
 *   npx tsx scripts/research-spike-v3.ts --model anthropic/claude-opus-4  # specify model
 *   npx tsx scripts/research-spike-v3.ts --step 1               # per-automation only (3 test)
 *   npx tsx scripts/research-spike-v3.ts --step 1 --all         # per-automation all 8
 *   npx tsx scripts/research-spike-v3.ts --step 2               # Call 1 only
 *   npx tsx scripts/research-spike-v3.ts --step 3               # Call 2 only
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const REFERENCE_DIR = path.join(process.cwd(), "n8n-api-examples/fairtix/reference");
const RESULTS_DIR = path.join(process.cwd(), "specs/research-spike-results/v3");

// --- CLI args ---
const args = process.argv.slice(2);
const modelIdx = args.indexOf("--model");
const MODEL = modelIdx !== -1 ? args[modelIdx + 1] : (process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4");
const stepIdx = args.indexOf("--step");
const STEP = stepIdx !== -1 ? parseInt(args[stepIdx + 1]) : 0; // 0 = all
const ALL_WORKFLOWS = args.includes("--all");

const TEST_WORKFLOWS = [
  { workflow: "02-lotterywins.json", executions: "executions-02.json", label: "02-lotterywins" },
  { workflow: "03-support-classifier.json", executions: "executions-03.json", label: "03-support-classifier" },
  { workflow: "05-generic-error-workflow.json", executions: "executions-05-err.json", label: "05-generic-error-workflow" },
];

const ALL_WORKFLOW_LIST = [
  { workflow: "01-send-welcome-email.json", executions: "executions-01.json", label: "01-send-welcome-email" },
  ...TEST_WORKFLOWS.slice(0, 1),
  { workflow: "02b-lotterywins-error-handling.json", executions: "executions-02b.json", label: "02b-lotterywins-error-handling" },
  ...TEST_WORKFLOWS.slice(1, 2),
  { workflow: "04-switch-faq-manual.json", executions: "executions-04.json", label: "04-switch-faq-manual" },
  { workflow: "04-switch-faq-manual-sheet.json", executions: "executions-04-sheet.json", label: "04-switch-faq-manual-sheet" },
  { workflow: "05-lotterywins-published.json", executions: "executions-05-pub.json", label: "05-lotterywins-published" },
  ...TEST_WORKFLOWS.slice(2),
];

// ============================================================
// STRUCTURAL FEATURE EXTRACTION (Amendment E)
// ============================================================

interface StructuralFeatures {
  nodeCount: number;
  nodeTypes: string[];
  nodes: Array<{ name: string; type: string; hasRetryOnFail: boolean; hasCredentials: boolean; isDisabled: boolean }>;
  branchCount: number;
  hasErrorTrigger: boolean;
  errorWorkflowId: string | null;
  retryEnabledNodes: string[];
  noRetryNodes: string[];
  credentials: Array<{ node: string; name: string; type: string }>;
  disabledNodes: string[];
  systemsDetected: string[];
  triggerType: string;
  triggerConfig: string;
  callerIds: string[] | null;
  timeSavedPerExecution: number | null;
}

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

function extractStructuralFeatures(wf: any): StructuralFeatures {
  const allNodes = (wf.nodes || []) as any[];
  const functionalNodes = allNodes.filter((n: any) => n.type !== "n8n-nodes-base.stickyNote");

  const nodes = functionalNodes.map((n: any) => ({
    name: n.name,
    type: n.type,
    hasRetryOnFail: n.retryOnFail === true,
    hasCredentials: !!n.credentials && Object.keys(n.credentials).length > 0,
    isDisabled: n.disabled === true,
  }));

  // Count branches: connections where a node has multiple output paths
  let branchCount = 0;
  const connections = wf.connections || {};
  for (const nodeName of Object.keys(connections)) {
    for (const connType of Object.keys(connections[nodeName])) {
      const outputs = connections[nodeName][connType];
      if (Array.isArray(outputs) && outputs.length > 1) {
        branchCount += outputs.length - 1;
      }
    }
  }

  // Credentials
  const credentials: Array<{ node: string; name: string; type: string }> = [];
  for (const n of functionalNodes) {
    if (n.credentials) {
      for (const [credType, credRef] of Object.entries(n.credentials as Record<string, any>)) {
        credentials.push({ node: n.name, name: credRef.name || "unnamed", type: credType });
      }
    }
  }

  // Systems
  const systems = new Set<string>();
  for (const n of functionalNodes) {
    const sys = detectSystem(n.type);
    if (sys) systems.add(sys);
  }

  // Trigger
  const triggerNodes = functionalNodes.filter((n: any) =>
    n.type.toLowerCase().includes("trigger")
  );
  const triggerType = triggerNodes.length > 0 ? detectTriggerType(triggerNodes[0].type) : "manual";
  let triggerConfig = "manual execution";
  if (triggerNodes.length > 0) {
    const tp = triggerNodes[0].parameters || {};
    if (tp.pollTimes?.item?.[0]?.mode) triggerConfig = `polling: ${tp.pollTimes.item[0].mode}`;
    else if (tp.rule?.interval) triggerConfig = `schedule: ${JSON.stringify(tp.rule.interval[0])}`;
    else if (triggerType === "error") triggerConfig = "error trigger (fires on workflow failures)";
    else if (triggerType === "webhook") triggerConfig = "webhook";
  }

  return {
    nodeCount: functionalNodes.length,
    nodeTypes: [...new Set(functionalNodes.map((n: any) => n.type))],
    nodes,
    branchCount,
    hasErrorTrigger: triggerNodes.some((n: any) => n.type.toLowerCase().includes("errortrigger")),
    errorWorkflowId: wf.settings?.errorWorkflow || null,
    retryEnabledNodes: nodes.filter(n => n.hasRetryOnFail).map(n => n.name),
    noRetryNodes: nodes.filter(n => !n.hasRetryOnFail && n.hasCredentials).map(n => n.name),
    credentials,
    disabledNodes: nodes.filter(n => n.isDisabled).map(n => n.name),
    systemsDetected: [...systems],
    triggerType,
    triggerConfig,
    callerIds: wf.settings?.callerIds || null,
    timeSavedPerExecution: wf.settings?.timeSavedPerExecution ?? null,
  };
}

// ============================================================
// EXECUTION STATS
// ============================================================

function computeExecutionStats(data: { data: Array<{ status: string; mode: string; stoppedAt: string }> }) {
  const execs = data.data;
  const total = execs.length;
  const successful = execs.filter(e => e.status === "success").length;
  const failed = total - successful;
  const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : "N/A";
  const errorRate = total > 0 ? ((failed / total) * 100).toFixed(1) : "N/A";
  const sorted = [...execs].sort((a, b) => new Date(b.stoppedAt).getTime() - new Date(a.stoppedAt).getTime());
  const modes = [...new Set(execs.map(e => e.mode))];
  return { total, successful, failed, successRate, errorRate, lastRun: sorted[0]?.stoppedAt ?? "never", lastStatus: sorted[0]?.status ?? "unknown", modes };
}

// ============================================================
// PROMPTS (v3 — first principles)
// ============================================================

const PER_AUTOMATION_PROMPT = `<role>
You are an automation intelligence analyst. You read workflow definitions and their execution data to understand what each automation means for the business. Technical architecture reveals business strategy — every configuration choice has a business implication.
</role>

<instructions>
You receive pre-extracted structural features, the full workflow JSON, and execution statistics.

Use the structural features as your technical overview — they tell you the workflow's architecture at a glance. Then read the full JSON for business context: node parameters, email templates, API configurations, and AI prompts contain the richest business insight.

From the technical details, reason about what MUST be true about the connected systems and the business for this workflow to exist and function as configured.

IMPACT ASSESSMENT — apply this rubric consistently:
- critical: Directly revenue-generating OR blocks customer journey with no fallback OR single point of failure for multiple processes
- high: Customer-facing with degraded experience on failure OR supports a critical workflow's data pipeline OR affects multiple business processes
- medium: Internal operations OR single-process scope OR has manual fallback at current scale
- low: Utility/tooling OR development/test OR no downstream consumers

DETECTABILITY ASSESSMENT — apply this rubric:
- monitored: Error workflow linked AND active AND reliable (>90% success rate)
- partially-monitored: Error workflow linked but inactive or unreliable, or manual checks exist
- silent: No error workflow, no monitoring, no retry logic — failures invisible until business impact surfaces

CONFIDENCE CALIBRATION — apply consistently:
- "data-driven": Observed from the workflow JSON, node parameters, or execution stats. You can point to the specific field.
- "benchmark-based": General industry knowledge applied to their situation.
- "ai-suggested": Inferred from patterns. You might be wrong.
</instructions>

<output_format>
Return a JSON object. Every field required. Reasoning fields MUST precede their classification fields.

{
  "reasoning": "Step-by-step analysis: what you observe, what it means for the business, what must be true about connected systems.",
  "name": "Human-readable business name",
  "businessNarrative": "3-5 sentences: what this workflow does for the business, why it matters, what it reveals about the company's operations. Show deductive reasoning. Do not describe nodes — describe business meaning.",
  "trigger": "The business event that starts this workflow, in plain language",
  "triggerType": "webhook | schedule | manual | event | polling | other",
  "systemsTouched": ["external system names in lowercase"],
  "dataFlow": "What business data enters, what gets produced or modified, where it goes.",
  "impact": {
    "reasoning": "Why this level. Connect to revenue, customer experience, or operations. Be specific.",
    "level": "critical | high | medium | low",
    "failureScenario": "Cascading consequences when this workflow fails.",
    "revenueConnection": "Direct / Indirect / N/A — with reasoning. Confidence label."
  },
  "detectability": {
    "reasoning": "How would the team discover a failure?",
    "level": "monitored | partially-monitored | silent",
    "evidence": "Error workflow ID and reliability, alerting config, or absence."
  },
  "stepName": "Position label in its business process",
  "timeSavingsEstimate": "Range with reasoning and confidence label, or N/A.",
  "technicalEvidence": {
    "errorHandling": "Retry settings, onError behavior, error workflow link. Absent retryOnFail = false in n8n.",
    "credentials": ["credential name and type pairs"],
    "complexity": "Node count, branching, structural patterns",
    "keyFindings": ["Technical observations with business implications"]
  }
}
</output_format>

<anti_patterns>
- Do NOT describe the workflow mechanically. Describe business meaning.
- Do NOT use platform jargon in business-facing fields. Technical details belong in technicalEvidence.
- Do NOT give generic impact reasoning. Be specific about what breaks and why.
- Do NOT estimate without reasoning.
- Do NOT ignore node parameters — email templates, API configs, and AI prompts are the richest source of business insight.
</anti_patterns>`;

const CALL1_PROMPT = `<role>
You are a business analyst assessing an automation landscape. You receive individual workflow analyses and must synthesize them into a complete picture — patterns, dependencies, gaps, and the operational DNA of the organization.
</role>

<instructions>
You receive per-workflow summaries, execution statistics, and instance metadata. Apply these five analytical methods systematically:

1. CAPABILITY ENUMERATION: For each business function you can identify from the workflow data, enumerate all automations that serve it. When multiple automations serve the same function, assess whether this is intentional (variants, A/B tests) or drift (duplicates, abandoned versions).

2. DEPENDENCY GRAPH CONSTRUCTION: For each external system referenced in the automation data, count how many processes depend on it and through which credential. Assess what breaks if that system or credential becomes unavailable. Note systems touched by >50% of workflows.

3. DOMAIN-COVERAGE VERIFICATION: For each data type, business term, support category, CTA, and domain referenced anywhere in the automation data, check whether a corresponding automation or process exists. The automation data itself proves these domains are real — their absence from the workflow inventory is a verified gap, not speculation.

4. OPERATIONAL COHERENCE CHECK: For each automation, compare its declared status (active/inactive) against its execution patterns (frequency, recency, error rate) and its business importance. Flag contradictions.

5. LIFECYCLE COMPLETENESS TRACE: For each business process, trace the full lifecycle from initiating event to final outcome. For each step, check whether an automation handles it. Note every unhandled step — including follow-ups, confirmations, and complementary outcomes.

Group workflows into BUSINESS PROCESSES (end-to-end flows), not technical categories. Cross-cutting workflows (error handlers, monitoring) belong in an "Operations" process.

Confidence calibration:
- "data-driven": Computed from workflow data or execution stats
- "benchmark-based": Industry knowledge applied to their situation
- "ai-suggested": Inferred from patterns, may be wrong
</instructions>

<output_format>
Return a JSON object with reasoning first.

{
  "reasoning": "Step-by-step analysis applying the five methods. What does this company do? How do workflows relate? What patterns emerge?",
  "processes": [
    {
      "name": "Business process name",
      "summary": "One sentence: what this process accomplishes",
      "workflows": ["workflow names"],
      "steps": [
        { "name": "Step name", "workflowName": "name or null if gap", "isAutomated": true, "isGap": false }
      ],
      "coverage": "X of Y steps automated (N%)",
      "reliability": "X% success rate across N executions",
      "maturityReasoning": "Why this level",
      "maturityLevel": "Prototype | Emerging | Developing | Production | Optimized"
    }
  ],
  "suggestedProcesses": [
    {
      "name": "Process name",
      "summary": "What it would accomplish",
      "basedOn": "Specific evidence from existing workflows proving this domain exists",
      "suggestedSteps": ["Step 1", "Step 2"],
      "connectedSystems": ["systems"]
    }
  ],
  "systemLandscape": [
    {
      "name": "System name",
      "role": "Role in operations",
      "workflowCount": 0,
      "narrative": "What usage pattern reveals about the business",
      "insight": "Key risk or insight"
    }
  ],
  "connectedAutomations": [
    {
      "fromWorkflow": "name",
      "toWorkflow": "name",
      "connectionType": "errorWorkflow | callerIds | logical",
      "description": "Business meaning"
    }
  ],
  "crossWorkflowFindings": [
    {
      "finding": "Short name",
      "description": "What was detected",
      "affectedWorkflows": ["list"],
      "businessImplication": "Why it matters",
      "method": "Which analytical method surfaced this"
    }
  ]
}
</output_format>

<anti_patterns>
- Do NOT summarize each workflow independently. Synthesize ACROSS the collection.
- Do NOT create processes based on technical categories. Group by business function.
- Do NOT write system narratives as flat descriptions. Write what usage REVEALS.
- Do NOT stop after finding a few patterns. Apply all five methods systematically.
</anti_patterns>`;

const CALL2_PROMPT = `<role>
You are a business opportunity consultant. You receive a structured automation landscape assessment and must produce actionable recommendations ranked by business impact. Lead with the answer, follow with evidence. Be honest about what you know and what you're inferring.
</role>

<instructions>
You receive the landscape analysis and per-workflow summaries. Produce prioritized recommendations and an executive synthesis.

RECOMMENDATION TIERS:
- act_now: High business impact + high confidence. No-regret moves. Evidence is data-driven.
- investigate: High business impact + can't fully verify. May exist elsewhere. Use honest framing.
- explore: Valuable but lower urgency, or requires connecting additional platforms.

RECOMMENDATION TYPES:
- new_workflow: Should be built. Specify systems and purpose.
- technical_fix: Fix existing (error handling, consolidation, activation).
- platform_connection: Connect another platform for visibility.

HONEST FRAMING — for uncertain recommendations:
1. Clearly in automation domain → confident: "This is missing and should be built."
2. May be handled elsewhere → soft: "We don't see this in your automation workflows. If handled by your platform, consider connecting it for visibility."
3. Connect for visibility → growth: "Connect X for deeper insight into Y."

CONFIDENCE CALIBRATION:
- "data-driven": From user's own data. Cite specific evidence.
- "benchmark-based": Industry knowledge applied to their situation.
- "ai-suggested": Inferred. Might be wrong. Acknowledge blind spots.

"YOUR NEXT MOVE" — the first thing the user sees:
- Reference specific workflow names and cite numbers from the data
- Chain 2-3 actions with reasoning for the sequence
- Narrative paragraph, not bullets
</instructions>

<output_format>
Return a JSON object. Reasoning fields precede classification fields throughout.

{
  "reasoning": "Analysis of priorities, evidence strength, and uncertainties.",
  "recommendations": [
    {
      "id": "r1",
      "reasoning": "Full analysis: why this matters, what's at stake, evidence strength",
      "type": "new_workflow | technical_fix | platform_connection",
      "tier": "act_now | investigate | explore",
      "name": "Short title",
      "businessCase": "One-line impact",
      "confidence": "data-driven | benchmark-based | ai-suggested",
      "evidenceChain": ["Evidence point citing source"],
      "honestFraming": "For investigate/explore: framing text. For act_now: null",
      "keyAssumptions": ["What must be true"],
      "affectedScope": "Which process or workflows",
      "implementationNotes": "Brief technical guidance"
    }
  ],
  "processSuggestions": [
    {
      "name": "Process name",
      "description": "What it accomplishes",
      "businessCase": "Why — cite evidence",
      "basedOn": "Specific evidence",
      "connectedSystems": ["systems"],
      "childRecommendationIds": ["r5"]
    }
  ],
  "nextMove": {
    "text": "Narrative: specific, chained, reasoned.",
    "reasoning": "Why this sequence"
  },
  "visibilityExpansions": [
    {
      "platform": "Name",
      "reasoning": "Why connecting improves analysis",
      "whatItUnlocks": "Insights unlocked"
    }
  ]
}
</output_format>

<anti_patterns>
- Do NOT lead with technical findings. Lead with business impact.
- Do NOT recommend platform-level code. Recommend business process automation.
- Do NOT present all recommendations with equal confidence. Differentiate clearly.
- Do NOT write a generic "Your Next Move". Reference specific workflows and numbers.
- Do NOT ignore honest framing for uncertain recommendations.
</anti_patterns>`;

// ============================================================
// USER MESSAGE FORMATTERS
// ============================================================

function formatStep1Message(wfJson: any, features: StructuralFeatures, stats: ReturnType<typeof computeExecutionStats>) {
  return `<structural_features>
${JSON.stringify(features, null, 2)}
</structural_features>

<workflow_json>
${JSON.stringify(wfJson, null, 2)}
</workflow_json>

<execution_stats>
Total executions: ${stats.total}
Successful: ${stats.successful} (${stats.successRate}%)
Failed: ${stats.failed} (${stats.errorRate}%)
Last execution: ${stats.lastRun} (${stats.lastStatus})
Status: ${wfJson.active ? "active" : "inactive"}
Execution modes: ${stats.modes.join(", ")}
Version iterations: ${wfJson.versionCounter}
</execution_stats>

Analyze this workflow. Return only the JSON object.`;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("ERROR: OPENROUTER_API_KEY not set");
    process.exit(1);
  }

  console.log(`\n=== Research Spike v3 ===`);
  console.log(`Model: ${MODEL}`);
  console.log(`Step: ${STEP === 0 ? "all" : STEP}`);
  console.log(`Workflows: ${ALL_WORKFLOWS || STEP === 0 ? "all 8" : "3 test"}\n`);

  const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY });
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const modelShort = MODEL.split("/").pop() || MODEL;

  // --- STEP 1: Per-automation ---
  if (STEP === 0 || STEP === 1) {
    const workflows = (ALL_WORKFLOWS || STEP === 0) ? ALL_WORKFLOW_LIST : TEST_WORKFLOWS;
    console.log(`--- Step 1: Per-automation (${workflows.length} workflows) ---\n`);

    const results: Record<string, unknown> = {};
    let totalTokensIn = 0, totalTokensOut = 0;

    for (const wf of workflows) {
      const wfJson = JSON.parse(fs.readFileSync(path.join(REFERENCE_DIR, wf.workflow), "utf-8"));
      const execData = JSON.parse(fs.readFileSync(path.join(REFERENCE_DIR, wf.executions), "utf-8"));
      const features = extractStructuralFeatures(wfJson);
      const stats = computeExecutionStats(execData);

      console.log(`  ${wf.label}: ${features.nodeCount} nodes, ${features.systemsDetected.join("+")||"none"}, ${stats.total} execs`);

      const userMsg = formatStep1Message(wfJson, features, stats);
      const start = Date.now();

      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: "system", content: PER_AUTOMATION_PROMPT }, { role: "user", content: userMsg }],
        response_format: { type: "json_object" },
      });

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      const raw = response.choices[0]?.message?.content;
      if (!raw) { console.error(`    ERROR: empty response`); continue; }

      const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim());
      const tokIn = response.usage?.prompt_tokens ?? 0;
      const tokOut = response.usage?.completion_tokens ?? 0;
      totalTokensIn += tokIn; totalTokensOut += tokOut;

      console.log(`    ${elapsed}s | ${tokIn}/${tokOut} tok | ${parsed.impact?.level} | ${parsed.name}`);

      results[wf.label] = parsed;
      fs.writeFileSync(path.join(RESULTS_DIR, `step1-${wf.label}.json`), JSON.stringify(parsed, null, 2));
    }

    fs.writeFileSync(path.join(RESULTS_DIR, "step1-all.json"), JSON.stringify(results, null, 2));
    console.log(`\n  Step 1 total: ${totalTokensIn} in / ${totalTokensOut} out\n`);
  }

  // --- STEP 2: Call 1 "Understand" ---
  if (STEP === 0 || STEP === 2) {
    console.log(`--- Step 2: Call 1 "Understand" ---\n`);

    const allSummaries = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, "step1-all.json"), "utf-8"));
    const summariesArray = Object.values(allSummaries);

    // Build execution overview
    const execOverview = ALL_WORKFLOW_LIST.map(wf => {
      const execData = JSON.parse(fs.readFileSync(path.join(REFERENCE_DIR, wf.executions), "utf-8"));
      const stats = computeExecutionStats(execData);
      const wfJson = JSON.parse(fs.readFileSync(path.join(REFERENCE_DIR, wf.workflow), "utf-8"));
      const summary = allSummaries[wf.label] as any;
      return `- ${summary?.name || wf.label}: ${stats.total} runs, ${stats.errorRate}% error, last ${stats.lastRun}, ${wfJson.active ? "ACTIVE" : "inactive"}`;
    }).join("\n");

    // Collect tags and credentials
    const tags = new Set<string>();
    const creds = new Set<string>();
    for (const wf of ALL_WORKFLOW_LIST) {
      const wfJson = JSON.parse(fs.readFileSync(path.join(REFERENCE_DIR, wf.workflow), "utf-8"));
      for (const t of wfJson.tags || []) tags.add(t.name);
      const summary = allSummaries[wf.label] as any;
      for (const c of summary?.technicalEvidence?.credentials || []) creds.add(c);
    }

    const userMsg = `<workflow_summaries>
${JSON.stringify(summariesArray, null, 2)}
</workflow_summaries>

<execution_overview>
${execOverview}
</execution_overview>

<instance_metadata>
Tags: ${[...tags].join(", ")}
Total workflows analyzed: ${summariesArray.length}
Credentials: ${[...creds].join("; ")}
</instance_metadata>

Analyze this automation landscape. Return the JSON object.`;

    const start = Date.now();
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: CALL1_PROMPT }, { role: "user", content: userMsg }],
      response_format: { type: "json_object" },
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const raw = response.choices[0]?.message?.content;
    if (!raw) { console.error("ERROR: empty response"); process.exit(1); }

    const cleaned = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to extract JSON from mixed text+JSON response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        console.error("  ERROR: Could not extract JSON. Raw response saved.");
        fs.writeFileSync(path.join(RESULTS_DIR, "step2-raw.txt"), raw);
        process.exit(1);
      }
    }
    console.log(`  ${elapsed}s | ${response.usage?.prompt_tokens}/${response.usage?.completion_tokens} tok`);
    console.log(`  Processes: ${(parsed.processes || []).map((p: any) => p.name).join(", ")}`);
    console.log(`  Suggested: ${(parsed.suggestedProcesses || []).map((p: any) => p.name).join(", ")}`);
    console.log(`  Findings: ${(parsed.crossWorkflowFindings || []).length}`);

    fs.writeFileSync(path.join(RESULTS_DIR, "step2-understand.json"), JSON.stringify(parsed, null, 2));
    console.log();
  }

  // --- STEP 3: Call 2 "Advise" ---
  if (STEP === 0 || STEP === 3) {
    console.log(`--- Step 3: Call 2 "Advise" ---\n`);

    const landscape = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, "step2-understand.json"), "utf-8"));
    const allSummaries = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, "step1-all.json"), "utf-8"));

    const userMsg = `<landscape_analysis>
${JSON.stringify(landscape, null, 2)}
</landscape_analysis>

<workflow_summaries>
${JSON.stringify(Object.values(allSummaries), null, 2)}
</workflow_summaries>

Produce recommendations, synthesis, and visibility expansions. Return the JSON object.`;

    const start = Date.now();
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: CALL2_PROMPT }, { role: "user", content: userMsg }],
      response_format: { type: "json_object" },
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const raw = response.choices[0]?.message?.content;
    if (!raw) { console.error("ERROR: empty response"); process.exit(1); }

    const cleaned3 = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned3);
    } catch {
      const jsonMatch = cleaned3.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        console.error("  ERROR: Could not extract JSON. Raw response saved.");
        fs.writeFileSync(path.join(RESULTS_DIR, "step3-raw.txt"), raw);
        process.exit(1);
      }
    }
    console.log(`  ${elapsed}s | ${response.usage?.prompt_tokens}/${response.usage?.completion_tokens} tok`);

    const recs = parsed.recommendations || [];
    for (const r of recs) {
      const tier = r.tier === "act_now" ? "ACT NOW" : r.tier === "investigate" ? "INVESTIGATE" : "EXPLORE";
      console.log(`  [${tier}] ${r.id}: ${r.name} (${r.confidence})`);
    }
    console.log(`\n  Next Move: ${(parsed.nextMove?.text || "").substring(0, 150)}...`);

    fs.writeFileSync(path.join(RESULTS_DIR, "step3-advise.json"), JSON.stringify(parsed, null, 2));
  }

  console.log(`\n=== Done. Results in ${RESULTS_DIR}/ ===`);
}

main().catch(console.error);
