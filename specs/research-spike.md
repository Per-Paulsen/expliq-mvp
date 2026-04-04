# Research Spike — LLM Prompt Validation Against FairTix Data

> Phase 0 of PRD 2.0. Proves that the prompt architecture produces ANALYSIS-FINAL.md quality on the first shot.
> Results from this spike are the foundation for Epic 10 spec derivation.

---

## Goal

Test the three-call prompt chain (per-automation → Call 1 "Understand" → Call 2 "Advise") against real FairTix workflow JSONs. Iterate until one-shot output matches `n8n-api-examples/fairtix/reference/ANALYSIS-FINAL.md` quality.

## Inputs

| File | What it contains |
|------|-----------------|
| `n8n-api-examples/fairtix/reference/01-send-welcome-email.json` | Welcome email workflow JSON |
| `n8n-api-examples/fairtix/reference/02-lotterywins.json` | Lottery winner notification (base) |
| `n8n-api-examples/fairtix/reference/02b-lotterywins-error-handling.json` | Lottery winner notification (error handling variant) |
| `n8n-api-examples/fairtix/reference/03-support-classifier.json` | AI support classifier |
| `n8n-api-examples/fairtix/reference/04-switch-faq-manual.json` | FAQ auto-response (Gmail-based) |
| `n8n-api-examples/fairtix/reference/04-switch-faq-manual-sheet.json` | FAQ auto-response (Sheet-based) |
| `n8n-api-examples/fairtix/reference/05-lotterywins-published.json` | Lottery winner notification ("Published") |
| `n8n-api-examples/fairtix/reference/05-generic-error-workflow.json` | Centralized error handler |
| `n8n-api-examples/fairtix/reference/executions-*.json` | Per-workflow execution data |
| `n8n-api-examples/fairtix/reference/ANALYSIS-FINAL.md` | Target output quality |
| `prd-2.0-decisions.md` section 10 | Prompt architecture requirements |

## Quality Target

ANALYSIS-FINAL.md demonstrates:
- **Per-workflow:** Business narrative (not mechanical), revenue connection, failure impact, deductive reasoning about connected systems
- **Process clustering:** 4 existing + 4 suggested processes, with coverage/reliability/maturity
- **System narratives:** Per-system deductive reasoning (Gmail backbone, Sheets as data store, Claude AI brain)
- **Recommendations:** 13 ranked (4 Act Now, 4 Investigate, 5 Explore), each with evidence chain and honest framing
- **"Your Next Move":** Specific narrative chaining multiple recommendations, citing workflow names and numbers

## Workflow

### Step 1: Per-Automation Prompt (test with 3 diverse workflows)

**Test workflows:**
- `02-lotterywins.json` — revenue-critical, has errors, has execution data
- `03-support-classifier.json` — AI architecture, multi-system, complex nodes
- `05-generic-error-workflow.json` — infrastructure/cross-cutting, active

**Process:**
1. Draft the per-automation prompt following section 10 (persona, schema-first output, deductive reasoning mandate, anti-patterns)
2. Define the output JSON schema (all fields from section 10 + existing fields)
3. Feed one workflow JSON + its execution data to the LLM via OpenRouter
4. Compare output to the corresponding section in ANALYSIS-FINAL.md
5. Evaluate: Is `businessBrief` deep or mechanical? Does `failureImpact` show deductive reasoning? Are estimates transparent?
6. Iterate on prompt until quality matches
7. Run the proven prompt on all 8 workflows (excluding the reference node-types sheet)
8. Record all per-automation summaries — these become input to Step 2

**Pass criteria:** Per-automation output matches ANALYSIS-FINAL.md's per-workflow business cases in depth, tone, and deductive reasoning. No mechanical descriptions.

### Step 2: Call 1 "Understand" (process clustering + system landscape)

**Input:** All 8 per-automation summaries from Step 1 + execution stats + tag data

**Process:**
1. Draft Call 1 prompt following section 10 (business analyst persona, cross-workflow pattern detection mandate, XML-tagged sections, chain-of-thought)
2. Define output JSON schema (processes, system landscape, connected automations, process metrics)
3. Feed all summaries to the LLM
4. Compare output to ANALYSIS-FINAL.md's "Business Processes" and "System Narratives" sections
5. Evaluate: Are processes clustered correctly? Are cross-workflow patterns detected (3 duplicate LotteryWins, Gmail single point of failure, support categories proving gaps)? Are system narratives deductive, not descriptive?
6. Iterate on prompt until quality matches

**Pass criteria:** Process clustering matches ANALYSIS-FINAL's 4 existing + 4 suggested processes. Cross-workflow patterns detected. System narratives show deductive reasoning.

### Step 3: Call 2 "Advise" (recommendations + synthesis)

**Input:** Call 1 output + per-automation summaries

**Process:**
1. Draft Call 2 prompt following section 10 (business opportunity consultant persona, few-shot example, anti-patterns, honest framing rules, schema-first)
2. Define output JSON schema (recommendations with tier/confidence/evidence, process suggestions, "Your Next Move", visibility expansions)
3. Feed Call 1 output + summaries to the LLM
4. Compare output to ANALYSIS-FINAL.md's "Recommendations" and "Your Next Move" sections
5. Evaluate: Are recommendations business-first (not governance-first)? Is honest framing applied to uncertain ones? Does "Your Next Move" chain specific recommendations with workflow names? Are evidence chains specific (not generic)?
6. Iterate on prompt until quality matches

**Pass criteria:** Recommendations match ANALYSIS-FINAL's tiers and evidence quality. "Your Next Move" is specific and actionable. Honest framing applied correctly.

### Step 4: Model Selection

After prompts are proven with the best model (Opus):
1. Run the full chain with Sonnet
2. Compare quality — does Sonnet match Opus?
3. Measure response times for both
4. Decision: which model for per-automation, which for workspace-level?

## Output

Record everything in this file as results are produced:

### Proven Prompts
- Per-automation prompt template (exact text)
- Call 1 "Understand" prompt template (exact text)
- Call 2 "Advise" prompt template (exact text)

### Output Schemas
- Per-automation JSON schema (what the LLM returns)
- Call 1 JSON schema
- Call 2 JSON schema

### FairTix Worked Example
- All 8 per-automation outputs
- Call 1 output (processes, systems, patterns)
- Call 2 output (recommendations, next move)

### Model Comparison
- Opus quality + latency
- Sonnet quality + latency
- Recommendation

### Discoveries
- Anything that affects PRD or epic specs
- Prompt patterns that worked unexpectedly well
- Anti-patterns that needed to be added

---

---

## Draft Prompts (v1 — to be iterated during spike)

### Per-Automation Prompt

**System prompt:**

```
<role>
You are a senior automation intelligence consultant. You read n8n workflow JSON definitions and see the technical reality and business meaning as one integrated picture.

When you read a workflow, every technical detail IS a business insight:
- `retryOnFail: false` on a node sending customer-facing notifications isn't "a technical config" — it's a fragile touchpoint where a single API error means the customer never receives the message.
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
    "hasDisabledNodes": true/false,
    "triggerInterval": "Polling interval or trigger mechanism detail, if applicable",
    "versionCount": "Number of version iterations — high count suggests active development",
    "errorWorkflowId": "ID of linked error workflow, or null",
    "callerIds": "IDs of workflows allowed to call this, or null",
    "timeSavedPerExecution": "User's own ROI estimate in minutes, or null",
    "keyFindings": ["List of specific technical observations that have business implications. E.g., 'retryOnFail: false on customer-facing notification node', 'Multiple duplicate versions with no canonical workflow identified', 'timeSavedPerExecution set to 1 min — user estimates minimal savings per run'"]
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
</anti_patterns>
```

**User message format:**

```
<workflow_json>
{full workflow JSON here}
</workflow_json>

<execution_stats>
Total executions: {N}
Successful: {N} ({%})
Failed: {N} ({%})
Last execution: {date}
Status: {active/inactive}
Execution modes: {list}
</execution_stats>

<metadata>
Tags: {list}
Version iterations: {N}
Error workflow linked: {yes/no, ID if yes}
Created: {date}
Last updated: {date}
</metadata>

Analyze this workflow. Return only the JSON object.
```

---

### Call 1 "Understand" Prompt

**System prompt:**

```
<role>
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
First, reason in <analysis> tags about what this company does, how the workflows relate, and what patterns you see. Then produce the JSON.

{
  "processes": [
    {
      "name": "Business process name",
      "summary": "One-sentence description of what this process accomplishes for the business",
      "workflows": ["list of workflow names that belong to this process"],
      "steps": [
        {
          "name": "Step name in the process flow",
          "workflowName": "Name of the workflow that handles this step, or null if gap",
          "isAutomated": true/false,
          "isGap": true/false
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
      "basedOn": "Specific evidence from existing workflows that proves this process domain exists (e.g., 'Checkout CTA in notification email + Payment-related support category in classifier')",
      "suggestedSteps": ["Step 1", "Step 2", "..."],
      "connectedSystems": ["systems that would be involved"]
    }
  ],
  "systemLandscape": [
    {
      "name": "System name",
      "role": "What role this system plays in the company's operations",
      "workflowCount": N,
      "narrative": "Deductive reasoning: what this system's usage reveals about the business. What MUST be true for this system to be used this way. What risks or insights emerge from its position in the landscape.",
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
</anti_patterns>
```

**User message format:**

```
<workflow_summaries>
{JSON array of all per-automation outputs from Step 1}
</workflow_summaries>

<execution_overview>
{Per-workflow: name, total runs, error rate, last run, active/inactive}
</execution_overview>

<instance_metadata>
Tags: {list with workflow counts}
Total workflows analyzed: {N}
Credentials available: {list or "not accessible"}
Users: {list or "not accessible"}
</instance_metadata>

Analyze this automation landscape. Reason in <analysis> tags first, then produce the JSON.
```

---

### Call 2 "Advise" Prompt

**System prompt:**

```
<role>
You are a senior business opportunity consultant specializing in automation strategy. You receive a structured understanding of a company's automation landscape (processes, systems, patterns) and must produce actionable recommendations ranked by business impact.

You think like McKinsey: answer first, evidence second. You think like Celonis: every gap has a value at stake. You are honest about what you know and what you're guessing.
</role>

<instructions>
You receive the landscape analysis (processes, systems, patterns, gaps) and per-workflow summaries. Produce prioritized recommendations, process suggestions, and an executive synthesis.

Recommendation tiers — assign based on these criteria:
- ACT NOW: High business impact + high confidence. No-regret moves. Evidence is data-driven (from the user's own n8n data). These should be done regardless of other decisions.
- INVESTIGATE: High business impact + Expliq can't fully verify. The capability may exist in another system Expliq doesn't see. Use honest framing.
- EXPLORE: Valuable but lower urgency, or requires connecting additional platforms for visibility.

Recommendation types:
- new_workflow: A workflow that should be built. Include which systems it connects and what it does.
- technical_fix: A fix to an existing workflow (error handling, retry logic, consolidation).
- platform_connection: A suggestion to connect another platform for deeper visibility.

Honest framing — use these three frames for uncertain recommendations:
1. CLEARLY N8N DOMAIN: "This is missing from your automation layer and should be built." Confident language.
2. MAY BE HANDLED ELSEWHERE: "We don't see this in your n8n workflows. If handled by your platform, consider connecting it for visibility. If not, here's what we'd suggest."
3. CONNECT FOR VISIBILITY: "Connect X platform for deeper insight into Y." Growth suggestion, not a fix.

Confidence calibration — apply consistently:
- "data-driven": computed from the user's actual workflow data or execution stats. Cite the specific evidence.
- "benchmark-based": general industry knowledge applied to their situation. State the principle.
- "ai-suggested": inferred from patterns. Might be wrong. Acknowledge what you can't see.

"Your Next Move" synthesis:
This is the FIRST thing the user sees on the Dashboard. It must be:
- Specific: reference workflow names, cite numbers
- Chained: connect 2-3 actions in sequence ("Fix X first. Then build Y. This unlocks Z.")
- Reasoned: explain WHY this sequence, not just WHAT to do
- Written as a narrative paragraph, not bullet points
</instructions>

<output_format>
First, reason in <analysis> tags about priorities, evidence strength, and what you're uncertain about. Then produce the JSON.

{
  "recommendations": [
    {
      "id": "r1",
      "type": "new_workflow | technical_fix | platform_connection",
      "tier": "act_now | investigate | explore",
      "name": "Short title",
      "businessCase": "One-line business impact — the 'so what'",
      "fullBusinessCase": "Full reasoning: why this matters, what's at stake, what changes if implemented",
      "confidence": "data-driven | benchmark-based | ai-suggested",
      "evidenceChain": [
        "Specific evidence point 1 (cite source: workflow inventory, execution stats, node parameters, etc.)",
        "Specific evidence point 2"
      ],
      "honestFraming": "For investigate/explore: honest framing text. For act_now: null",
      "keyAssumptions": ["What must be true for this recommendation to be valid"],
      "affectedScope": "Which process or workflows this affects",
      "systemSource": "Source system (for new_workflow type)",
      "systemDestination": "Destination system (for new_workflow type)",
      "implementationNotes": "Brief technical guidance for implementation"
    }
  ],
  "processSuggestions": [
    {
      "name": "Suggested process name",
      "description": "What this process would accomplish",
      "businessCase": "Why this process should exist — cite evidence from existing workflow data",
      "basedOn": "Specific evidence: which existing workflow data proves this domain exists",
      "connectedSystems": ["systems involved"],
      "childRecommendationIds": ["r5", "r6", "r7"]
    }
  ],
  "nextMove": {
    "text": "Narrative paragraph: specific, chained, reasoned. Reference workflow names and numbers. This is the CEO slide.",
    "reasoning": "Why this sequence of actions, not another"
  },
  "visibilityExpansions": [
    {
      "platform": "Platform name",
      "reasoning": "Why connecting this platform would improve Expliq's analysis",
      "whatItUnlocks": "What insights become possible with this connection"
    }
  ]
}
</output_format>

<anti_patterns>
- Do NOT lead with governance/technical findings. Lead with business impact.
- Do NOT recommend things that are clearly platform-level code (user authentication, payment processing internals). Recommend AUTOMATION of business processes around those systems.
- Do NOT estimate impact without showing the reasoning chain.
- Do NOT present all recommendations with equal confidence. Some you're sure about (data-driven), some you're guessing (ai-suggested). Show the difference.
- Do NOT write a generic "Your Next Move". It must reference SPECIFIC workflows by name and cite SPECIFIC numbers from the data.
- Do NOT ignore the honest framing rules. If you can't see whether a capability exists outside n8n, say so.
- Do NOT sort by confidence. Sort by business impact. Confidence is shown per recommendation but doesn't determine order.
</anti_patterns>
```

**User message format:**

```
<landscape_analysis>
{Full JSON output from Call 1}
</landscape_analysis>

<workflow_summaries>
{JSON array of all per-automation outputs}
</workflow_summaries>

Produce recommendations, synthesis, and visibility expansions. Reason in <analysis> tags first, then produce the JSON.
```

---

## Status

- [x] Step 1: Per-automation prompt proven (v8)
- [x] Step 2: Call 1 "Understand" proven (merged into single workspace call at v8)
- [x] Step 3: Call 2 "Advise" proven (merged into single workspace call at v8)
- [x] Step 4: Model comparison done (Opus vs Sonnet, v3–v8)
- [x] Full chain validated end-to-end (v8, Sonnet + Opus)

---

## Spike Results

> Appended during spike execution. Original document above is unchanged.

### Test Scripts

| Script | Purpose |
|--------|---------|
| `scripts/research-spike-step1.ts` | Per-automation prompt on 3 test workflows |
| `scripts/research-spike-step1-remaining.ts` | Per-automation prompt on remaining 5 + combine all 8 |
| `scripts/research-spike-step2.ts` | Call 1 "Understand" — landscape synthesis |
| `scripts/research-spike-step3.ts` | Call 2 "Advise" — recommendations + next move |

Run order: `step1` → `step1-remaining` → `step2` → `step3`. All use `npx tsx`.

### v1 Results (2026-04-04, Sonnet 4)

Ran the full v1 chain against all 8 FairTix workflows. Model: `anthropic/claude-sonnet-4` via OpenRouter.

**Step 1 — Per-automation (3 test workflows then all 8):**

Evaluated against ANALYSIS-FINAL.md per-workflow sections:

| Dimension | 02-lotterywins | 03-support-classifier | 05-generic-error-workflow |
|-----------|---------------|----------------------|--------------------------|
| Business narrative | Match — "bridge between selection and sale" | Match — all 6 categories extracted | Match — "central nervous system" |
| Impact level | Critical (correct) | High (correct) | Critical (correct) |
| Deductive reasoning | Present in failureImpact | Present but slightly generic | Meta-insight captured ("no error handler for the error handler") |
| retryOnFail flagging | "No retry logic visible" (vague) | "No error workflow linked" (correct) | "No explicit retry logic visible" (vague) |
| Temporal exec patterns | Not analyzed | Not analyzed | Not analyzed |

**Step 2 — Call 1 "Understand":**
- 4 existing processes detected (matches reference)
- 3 suggested processes (reference has 4 — missed "Non-Winner Communication")
- 5 cross-workflow patterns detected (duplication, support fragmentation, universal inactivity, Gmail dependency, error monitoring failure)
- **Key miss:** No inverse outcome gap detected (winners notified, non-winners not)

**Step 3 — Call 2 "Advise":**
- 7 recommendations (reference has 13)
- 3 ACT NOW, 3 INVESTIGATE, 1 EXPLORE
- **Key misses:** Lottery-loss notification (R2), purchase window reminders (R3), payment failure recovery (R7), resale notifications (R8), event announcements (R6), post-event follow-up (R11), weekly digest (R13)
- Gaps detected as process suggestions but NOT converted into specific workflow recommendations
- "Your Next Move" was specific and chained — acceptable quality

**v1 Verdict:** Business briefs and deductive reasoning are strong. Two systematic gaps: (1) retryOnFail defaults not flagged, (2) cross-referencing gaps not converted into recommendations.

---

### v1 → v2 Changes

**Per-Automation Prompt — added 2 sections:**

1. `CRITICAL — n8n default behaviors`: "In n8n, if retryOnFail is not explicitly set on a node, it defaults to false. Flag this explicitly as a resilience gap for every customer-facing or data-writing node."

2. `CRITICAL — Execution pattern analysis`: "Don't just count totals. Look at the TEMPORAL patterns in execution data: error clusters, long gaps, all-manual executions."

**Call 1 "Understand" — added 2 patterns to the cross-workflow detection list:**

6. `INVERSE OUTCOME GAPS`: "If a workflow handles one outcome (e.g., lottery winners), check whether the opposite outcome (e.g., non-winners) is handled by ANY workflow."

7. `EVIDENCE-BASED DOMAIN DETECTION`: "Every support category, email CTA, data field, and business term implies a business domain. For EACH implied domain, check whether a corresponding workflow exists. Be exhaustive."

**Call 2 "Advise" — added 3 CRITICAL sections:**

1. `Comprehensive recommendation generation`: "For every business domain identified in suggestedProcesses that has no corresponding workflow, generate a SPECIFIC recommendation."

2. `Inverse outcome gaps`: "If a workflow handles one side of an interaction, check: is the OTHER side handled? Non-communication is a communication."

3. `Cross-reference evidence exhaustively`: "Support categories, email CTAs, data fields all imply business domains. Each domain without a workflow is a recommendation. Generate at minimum 10 recommendations across all tiers."

**Also changed in v2:** Replaced `<analysis>` tags with `"reasoning"` JSON field (compatible with `response_format: { type: "json_object" }`).

---

### v2 Results (2026-04-04, Sonnet 4)

**Step 1 — Per-automation (all 8):**
- retryOnFail now explicitly flagged: "Gmail node has default retryOnFail: false"
- Temporal patterns noted in execution analysis

| Workflow | Name | Impact | Brief |
|----------|------|--------|-------|
| 01 | User Welcome Onboarding | high | Delivers FairTix's value proposition and drives verification completion |
| 02 | Lottery Winner Notification | critical | Bridges lottery selection and purchase completion — the revenue conversion moment |
| 02b | FairTix Lottery Winner Notification | critical | Same purpose as 02 — duplicate with error handling variant |
| 03 | Support Ticket Classifier | high | Routes support requests to the right specialist team |
| 04 | FairTix Smart Support Triage | high | Auto-resolves FAQ questions, escalates complex issues |
| 04-sheet | Support Message Classification & FAQ Response | high | Sheet-triggered variant of the support triage |
| 05-pub | Lottery Winner Notification System | high | "Published" version of winner notification — never activated |
| 05-err | Central Error Monitoring & Alerting | critical | Operational safety net — the only active workflow |

**Step 2 — Call 1 "Understand":**
- 4 existing processes: Customer Onboarding (33%), Fair Queue Lottery (20%), Customer Support (33%), Operations & Monitoring (33%)
- 4 suggested processes: Account Verification, Payment & Billing, Resale & Transfer, **Non-Winner Communication** (was missing in v1)
- 5 cross-workflow patterns including **Winner-Focused Communication Gap** (new in v2)

**Step 3 — Call 2 "Advise":**
- 12 recommendations (up from 7): 5 ACT NOW, 4 INVESTIGATE, 3 EXPLORE
- **New in v2:** Lottery non-winner notification, payment failure recovery, resale price validation, event lifecycle management, support resolution workflows, activate production workflows, customer feedback loop
- 2 remaining misses vs reference (purchase window reminders, weekly digest) — acceptable

**"Your Next Move" (v2):**
> Fix the 'Lottery Winner Notification' workflow first — its 36.1% failure rate (13 failures out of 36 executions) is causing direct revenue loss with each undelivered winner notification. Add retry logic to the Gmail node and consolidate the 3 duplicate winner workflows into one reliable system. Then activate the 7 inactive workflows that represent massive development investment with zero production value — 362 version iterations on support classification workflows alone prove they're functionally complete but deployment-blocked. This immediately unlocks customer onboarding automation, AI-powered support triage, and lottery communications. Finally, build the 'Lottery Non-Winner Notification' workflow to communicate with the majority of participants who currently receive silence instead of guidance about waitlists or alternative events.

**Sonnet 4 latency (v2):**

| Step | Tokens In | Tokens Out | Latency |
|------|-----------|------------|---------|
| Per-automation (per workflow) | 3.6K–18.5K | 890–1,340 | 27–44s |
| Call 1 "Understand" | 10,946 | 3,552 | 64s |
| Call 2 "Advise" | 14,267 | 5,949 | 123s |
| **Full chain total** | ~95K in | ~17K out | ~6 min |

---

### v2 Proven Prompts

The v2 prompts are the v1 prompts above with the following additions. See the test scripts for the exact executable text.

**Per-Automation additions** (inserted after "Deductive system reasoning" section):

```
CRITICAL — n8n default behaviors:
In n8n, if retryOnFail is not explicitly set on a node, it defaults to false. This means the node will NOT retry on failure. Flag this explicitly as a resilience gap for every customer-facing or data-writing node, especially when the workflow has no error workflow linked.

CRITICAL — Execution pattern analysis:
Don't just count totals. Look at the TEMPORAL patterns in execution data:
- Error clusters (multiple failures in quick succession) indicate systematic issues like credential expiration or API outages — not isolated incidents
- Long gaps between executions may indicate the workflow was disabled and re-enabled
- All-manual executions with no trigger executions means the workflow was never activated for production use
```

**Call 1 "Understand" additions** (appended to cross-workflow pattern list):

```
6. INVERSE OUTCOME GAPS: If a workflow handles one outcome (e.g., lottery winners), check whether the opposite outcome (e.g., non-winners) is handled by ANY workflow. If not, that's a gap — often a high-value one, because the unhandled population is usually larger.
7. EVIDENCE-BASED DOMAIN DETECTION: Every support category, email CTA, data field, and business term in the workflow data implies a business domain. For EACH implied domain, check whether a corresponding workflow exists. If not, add it to suggestedProcesses with the specific evidence that proves the domain exists. Be exhaustive — don't stop at 2-3 suggestions.
```

**Call 2 "Advise" additions** (inserted before "Your Next Move" section):

```
CRITICAL — Comprehensive recommendation generation:
For every business domain identified in suggestedProcesses or crossWorkflowPatterns that has no corresponding workflow, generate a SPECIFIC recommendation. Don't just note the gap in processSuggestions — turn it into an actionable recommendation with a concrete workflow description.

CRITICAL — Inverse outcome gaps:
If a workflow handles one side of an interaction (e.g., notifying winners), always check: is the OTHER side handled (e.g., notifying non-winners)? The unhandled population is often larger and the gap is often high-impact. Non-communication is a communication — silence tells your users you forgot about them.

CRITICAL — Cross-reference evidence exhaustively:
Support categories, email CTAs, data fields, and business terms in workflows all imply business domains. Each domain without a workflow is a recommendation. For example:
- Support has "Payment/Billing" category → no payment workflow → recommend payment failure/confirmation workflows
- Email contains resale pricing rules → support has "Resale/Transfer" → no resale workflow → recommend resale notification workflows
- Workflows reference events → no event lifecycle management → recommend event announcement/reminder workflows
Generate at minimum 10 recommendations across all tiers.
```

**Also changed:** `<analysis>` tags → `"reasoning"` JSON field. `<output_format>` updated to include `"reasoning"` at top level.

---

### v2 Result Files

All in `specs/research-spike-results/`:

| File | Contents |
|------|----------|
| `step1-01-send-welcome-email.json` | Per-automation: Welcome email |
| `step1-02-lotterywins.json` | Per-automation: Lottery winner (base) |
| `step1-02b-lotterywins-error-handling.json` | Per-automation: Lottery winner (error handling) |
| `step1-03-support-classifier.json` | Per-automation: Support classifier |
| `step1-04-switch-faq-manual.json` | Per-automation: FAQ auto-response (Gmail) |
| `step1-04-switch-faq-manual-sheet.json` | Per-automation: FAQ auto-response (Sheet) |
| `step1-05-lotterywins-published.json` | Per-automation: Lottery winner (published) |
| `step1-05-generic-error-workflow.json` | Per-automation: Error handler |
| `step1-all.json` | Combined 8 per-automation outputs |
| `step2-understand.json` | Call 1 landscape analysis |
| `step3-advise.json` | Call 2 recommendations + next move |

---

### Discoveries

**What affects PRD / epic specs:**
1. **`response_format: { type: "json_object" }` replaces `<analysis>` tags.** v1 prompts used `<analysis>` reasoning tags + JSON output. This is fragile with `response_format`. v2 uses a `"reasoning"` field inside the JSON instead — more reliable, parseable, and compatible.
2. **Per-automation schema has redundant fields.** `description`, `businessBrief`, and `businessContext` overlap. `impactProposal`, `failureImpact`, and `revenueImpactEstimate` overlap. Consider consolidating in the epic spec — fewer, more distinct fields produce deeper output per field.
3. **Chain latency is ~6 min total for 8 workflows.** Acceptable for async batch processing. Not suitable for real-time UI.
4. **Largest input is 04-switch-faq-manual at 18.5K tokens.** Complex workflows with embedded AI prompts (full classifier prompt text) dominate token usage. This will matter at scale (50+ workflows).

**Prompt patterns that worked well:**
1. **"The technical architecture IS the business story"** — this framing consistently produces deep, non-mechanical output.
2. **Confidence calibration (data-driven / benchmark-based / ai-suggested)** — produces honest, differentiated recommendations.
3. **Anti-patterns sections** — listing what NOT to do is as effective as listing what to do.
4. **Inverse outcome gaps** — powerful general pattern for any paired outcome.
5. **Evidence-based domain detection** — highest-value prompt instruction. Produces the cross-referencing recommendations that are Expliq's core differentiator.

**Anti-patterns added during iteration:**
1. **n8n defaults** — must explicitly instruct that absent `retryOnFail` means `false`.
2. **Temporal execution analysis** — "don't just count totals, look at when errors cluster."
3. **Minimum recommendation count** — without "generate at minimum 10", the model stops at 5-7.
4. **Gap → recommendation conversion** — the model notes gaps but won't generate recommendations unless explicitly told to.

---

### Step 4: Model Comparison (v2)

**Not done for v2.** v1 and v2 both ran on Sonnet 4. The spike workflow specifies proving with Opus first, then comparing Sonnet. This was done in the wrong order — Opus baseline still needed. Addressed in v3 below.

---

## v3 — Rewrite from First Principles (2026-04-04)

### v3 Design Rationale

After v2 testing, critical review revealed that the v2 prompt improvements were **overfitted to FairTix** — we added "check inverse outcomes" because we knew lottery-loss was missing, "cross-reference support categories" because we knew Payment/Billing had no workflow. These are answers disguised as instructions.

**Framework research** (UiPath assessment algorithm, FMEA, Gartner TIME, van der Aalst process mining, TOGAF capability mapping, meta-prompting, LLM-RUBRIC, Focused Chain-of-Thought) identified generalizable principles. Combined with the user's key observation — that Claude produced consulting-grade analysis conversationally without prompt engineering — the v3 approach is:

1. **Lean prompts** — trust the model's existing analytical capabilities, don't over-instruct
2. **Rubric-based assessment** (Amendment A) — explicit criteria for impact levels (critical/high/medium/low)
3. **Detectability dimension** (Amendment C, from FMEA) — monitored / partially-monitored / silent
4. **Reasoning-first field ordering** (Amendment B) — every classification preceded by its reasoning in the JSON schema
5. **Pre-structured input** (Amendment E, from F-CoT) — extract structural features from workflow JSON programmatically, send alongside raw JSON as a "reading guide"
6. **Analytical methods, not pattern checklists** (Amendment D) — five domain-agnostic reasoning procedures replace the v1/v2 bullet-point checklist
7. **Reasoning as JSON field** (Amendment F) — `"reasoning"` field replaces `<analysis>` tags
8. **No domain-specific examples** (Amendment G) — zero FairTix patterns in prompts
9. **Fewer, deeper output fields** — consolidated from ~20 to ~12 per-automation fields

Full amendments documented in `prd-2.0-decisions.md` (Amendments A–G).

### v3 Test Script

Single consolidated script: `scripts/research-spike-v3.ts`

Features:
- `extractStructuralFeatures(workflowJson)` — programmatic extraction of node count, types, branching, error handling, credentials, systems, trigger config
- `--model` flag for Opus/Sonnet comparison
- `--step 1|2|3` for running individual steps
- `--all` flag for all 8 workflows vs 3 test workflows
- Results saved to `specs/research-spike-results/v3/`

### v3 Prompts

#### Per-Automation Prompt (v3)

```
<role>
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
</anti_patterns>
```

**User message format:**

```
<structural_features>
{programmatically extracted JSON — see extractStructuralFeatures() in test script}
</structural_features>

<workflow_json>
{full workflow JSON}
</workflow_json>

<execution_stats>
Total executions: {N}
Successful: {N} ({%})
Failed: {N} ({%})
Last execution: {date} ({status})
Status: {active/inactive}
Execution modes: {list}
Version iterations: {N}
</execution_stats>

Analyze this workflow. Return only the JSON object.
```

---

#### Call 1 "Understand" Prompt (v3)

```
<role>
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
</anti_patterns>
```

**User message format:**

```
<workflow_summaries>
{JSON array of all per-automation outputs from Step 1}
</workflow_summaries>

<execution_overview>
{Per-workflow: name, total runs, error rate, last run, active/inactive}
</execution_overview>

<instance_metadata>
Tags: {list}
Total workflows analyzed: {N}
Credentials: {list}
</instance_metadata>

Analyze this automation landscape. Return the JSON object.
```

---

#### Call 2 "Advise" Prompt (v3)

```
<role>
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
</anti_patterns>
```

**User message format:**

```
<landscape_analysis>
{Full JSON output from Call 1}
</landscape_analysis>

<workflow_summaries>
{JSON array of all per-automation outputs}
</workflow_summaries>

Produce recommendations, synthesis, and visibility expansions. Return the JSON object.
```

---

### v3 Results — Opus 4 (2026-04-04)

**Step 1 — Per-automation (all 8 workflows):**

| Workflow | Name | Impact | Detectability | Latency | Tokens |
|----------|------|--------|---------------|---------|--------|
| 01 | New User Welcome Email Template | low | silent | 38s | 6645/892 |
| 02 | FairTix Lottery Winner Notification | critical | partially-monitored | 39s | 6645/946 |
| 02b | FairTix Lottery Winner Notification System | critical | silent | 44s | 7554/954 |
| 03 | Support Email AI Classifier | high | silent | 47s | 8961/1019 |
| 04 | Customer Support Email Classifier and FAQ Responder | high | silent | 40s | 19272/955 |
| 04-sheet | Customer Support AI Triage System | medium | silent | 45s | 12045/1026 |
| 05-pub | FairTix Lottery Winner Notification | critical | silent | 39s | 6642/945 |
| 05-err | Automation Error Alert System | critical | silent | 33s | 3453/839 |
| **Total** | | | | **~5 min** | **67,722 / 7,576** |

**Step 2 — Call 1 "Understand" (Opus):**
- Latency: 112s | Tokens: 9,454 / 4,127
- 4 existing processes: Fair Queue Lottery Sales, Customer Support, User Onboarding, Operations Monitoring
- 4 suggested processes: Payment Processing Pipeline, Fair Queue Algorithm Execution, Account Verification Flow, **Resale and Transfer Management**
- 5 cross-workflow findings (each labeled with originating method):
  - Production-Ready but Inactive System (operational coherence)
  - Critical Revenue Path Reliability (operational coherence)
  - Duplicate Support Automation (capability enumeration)
  - Gmail Single Point of Failure (dependency graph)
  - Missing Core Business Logic (lifecycle completeness)

**Step 3 — Call 2 "Advise" (Opus):**
- Latency: 102s | Tokens: 13,094 / 3,025
- 6 recommendations: 3 ACT NOW, 3 INVESTIGATE
- ACT NOW: Fix lottery notification reliability, Build payment processing automation, Consolidate duplicate workflows
- INVESTIGATE: Connect Fair Queue algorithm platform, Automate ticket delivery, Investigate inactive workflow status
- 2 process suggestions: End-to-End Lottery Sales Pipeline, Account Verification Pipeline
- 3 visibility expansions: Fair Queue Algorithm, Payment Gateway, Ticketing Platform

**"Your Next Move" (Opus v3):**
> Your immediate priority is fixing the FairTix Lottery Winner Notification System's 36% failure rate — this directly costs you revenue every time a winner doesn't receive their email within the 24-hour purchase window. Add retry logic to the Gmail node and ensure the error workflow (oZy3vc0yli2xdR45) is actually active and alerting your team. Simultaneously, begin building payment processing automation to capture purchases within those 24-hour windows — your current manual process creates a bottleneck exactly when customers are most motivated to buy. Once these revenue-critical fixes are in place, consolidate your duplicate workflows (you have 3 lottery notifications and 3 support systems) to reduce confusion about which version is production. This sequence prioritizes immediate revenue recovery, then scales your capacity to handle demand, then reduces operational overhead.

---

### v3 Results — Sonnet 4 (2026-04-04)

**Step 1 — Per-automation (all 8 workflows):**

| Workflow | Name | Impact | Detectability | Latency | Tokens |
|----------|------|--------|---------------|---------|--------|
| 01 | FairTix Welcome Email Template | low | silent | 22s | 3150/810 |
| 02 | FairTix Lottery Winner Notification System | critical | partially-monitored | 29s | 6645/1033 |
| 02b | FairTix Lottery Winner Email Notifications | high | silent | 27s | 7554/952 |
| 03 | FairTix Support Message Auto-Classification | high | silent | 27s | 8961/902 |
| 04 | FairTix AI Support Triage System | high | silent | 30s | 19272/1059 |
| 04-sheet | AI-Powered Customer Support Triage and Auto-Response | high | silent | 31s | 12045/1064 |
| 05-pub | FairTix Lottery Winner Notification System | high | silent | 26s | 6642/933 |
| 05-err | Automation Error Alerting System | critical | silent | 23s | 3453/811 |
| **Total** | | | | **~4 min** | **67,722 / 7,564** |

**Step 2 — Call 1 "Understand" (Sonnet):**
- Latency: 61s | Tokens: 9,454 / 3,304
- 4 existing processes: Fair Queue Lottery, Customer Support, User Onboarding, Operations Monitoring
- 3 suggested processes: Queue Algorithm, Payment Completion, Human Support Agent
- 6 cross-workflow findings

**Step 3 — Call 2 "Advise" (Sonnet):**
- Latency: 58s | Tokens: 12,309 / 2,584
- 5 recommendations: 2 ACT NOW, 2 INVESTIGATE, 1 EXPLORE
- ACT NOW: Fix lottery reliability, Fix error monitoring reliability
- INVESTIGATE: Activate production workflows, Consolidate support systems
- EXPLORE: Eliminate Gmail SPOF

---

### Step 4: Opus vs Sonnet Comparison (v3)

| Dimension | Opus 4 | Sonnet 4 |
|---|---|---|
| **Per-automation latency** | 33–47s | 22–31s |
| **Full chain latency** | ~8 min | ~5 min |
| **Full chain tokens (in/out)** | ~90K / ~15K | ~90K / ~13K |
| **Impact rubric consistency** | More differentiated (low/critical/high/medium) | Slightly more uniform (most = high) |
| **Detectability accuracy** | Correct across all 8 | Correct across all 8 |
| **Step 2 suggested processes** | 4 (incl. Resale/Transfer) | 3 (missed Resale/Transfer) |
| **Step 3 recommendation count** | 6 | 5 |
| **Payment processing found?** | Yes (ACT NOW) | Yes (suggested only) |
| **Resale/Transfer found?** | Yes (Step 2) | No |
| **Non-winner gap found?** | No | No |
| **Evidence depth** | Cites specific values (€15, error workflow ID) | Good but less granular |
| **Next Move quality** | Excellent — causal chaining, specific IDs | Good — chains 3 actions |

**Recommendation:**
- **Per-automation calls:** Sonnet sufficient — quality comparable, 40% faster, 50% cheaper
- **Workspace-level calls (Call 1 + Call 2):** Opus preferred — deeper cross-referencing, more suggested processes, better evidence chains
- **Hybrid approach for production:** Sonnet for per-automation (parallel, cost-sensitive), Opus for workspace-level (2 calls only, quality-sensitive)

---

### v3 Discoveries

**What v3 validated:**
1. **Lean prompts work.** ~40% less prompt text than v2, comparable or better output quality. The model already knows how to analyze automations.
2. **Rubric-based impact assessment** produces more honest, differentiated classifications. Welcome email correctly at "low" (prototype), support classifier at "medium" (has manual fallback).
3. **Detectability** is a genuinely valuable new dimension. Distinguishing "silent" from "partially-monitored" adds actionable insight.
4. **Structural feature extraction** works as a reading guide. The model references pre-extracted features in its reasoning.
5. **Analytical methods** produce labeled findings (each attributed to its originating method). This is better for transparency.
6. **Reasoning-first field ordering** produces more substantive reasoning fields.

**What v3 revealed as a gap:**
1. **Non-winner notification gap NOT discovered** by either model with either prompt version. The lifecycle completeness method traces the primary path but doesn't reliably check all participant outcomes. This specific reasoning pattern ("for each process participant, check whether ALL outcomes are communicated") may need explicit method guidance — but framed as a general principle, not a FairTix-specific instruction.
2. **Domain-coverage verification not exhaustive** — Opus found Resale/Transfer from support categories, Sonnet didn't. The method is correct but application is inconsistent. May need: "enumerate every domain reference explicitly in your reasoning before assessing coverage."
3. **Recommendation count lower** (5-6 vs v2's 12). Without "generate at minimum 10," the model produces only what it's highly confident about. This is more honest but may under-serve the product's value proposition of comprehensive opportunity discovery.

**Open question for product decision:**
The trade-off between comprehensiveness (v2: 12 recs, some lower-confidence) and precision (v3: 5-6 recs, all well-evidenced) is a product decision, not a prompt engineering one. The v3 prompts could be nudged toward comprehensiveness with a single instruction ("ensure every suggested process has at least one corresponding recommendation"), but this should be a deliberate choice.

---

### v3 Result Files

All in `specs/research-spike-results/v3/`:

| File | Contents | Model |
|------|----------|-------|
| `step1-*.json` | 8 per-automation outputs | Opus (also ran Sonnet, overwritten) |
| `step1-all.json` | Combined per-automation outputs | Opus |
| `step2-understand.json` | Call 1 landscape analysis | Opus |
| `step3-advise.json` | Call 2 recommendations + next move | Opus |

Note: Sonnet results were overwritten when Opus ran (same output directory). Sonnet results are captured in the comparison tables above.

---

## v4 — Exhaustive Reasoning via Two-Phase Methods (2026-04-04)

### v4 Design Rationale

v3's lean, method-based approach produced higher quality per item but missed key findings: the non-winner notification gap and exhaustive domain coverage. Research into LLM reasoning patterns identified the root cause: **LLMs reason depth-first** (follow one thread deeply) instead of breadth-first (enumerate all possibilities, then analyze each).

Three techniques address this structurally:

1. **Enumerate-then-evaluate (T1)** — Split each analytical method into Phase A (produce complete census) and Phase B (analyze every census item). The census becomes a contract the model must iterate over. Based on Decomposed Prompting (Khot et al., ICLR 2023) and Chain of Verification (Dhuliawala et al., ACL 2024).

2. **State machine framing (T4)** — Model each process as a state machine: states, transitions for ALL possible inputs, terminal states. After "lottery draw" there are exactly two transitions: "selected" and "not selected." Both must lead somewhere. Missing transitions = gaps. Based on SMoT (Liu & Shuai, 2023) and classical CS completeness.

3. **Taxonomy pre-extraction (T6)** — Move enumeration from the LLM (unreliable) to TypeScript (deterministic). Extract categorical values from AI prompt nodes (support categories from structured output parsers), switch node conditions, and schema enums. Inject as completeness constraints: "Your domain-coverage verification must produce a verdict for EVERY value in EVERY taxonomy."

4. **Completeness verification (T3)** — Self-check step after all methods: count census items vs verdicts, check complementary outcomes for every automated workflow, confirm every taxonomy value received a coverage verdict. Based on Chain of Verification (Meta, ACL 2024).

### v4 Changes from v3

**Per-automation prompt:** Unchanged (v3 was already effective for Step 1).

**Call 1 "Understand" — methods rewritten:**
- Method 3 (Domain-coverage): Two-phase — Phase A produces numbered domain census from all sources including pre-extracted taxonomies, Phase B checks coverage for every numbered item
- Method 5 (Lifecycle trace): Three-phase — Phase A participant census (including non-outcome recipients), Phase B state machine with ALL transitions, Phase C complementary outcome check
- Added: Completeness verification step (mandatory after all methods) — census reconciliation, complementary outcome audit, taxonomy exhaustion check
- Anti-pattern added: "Do NOT skip Phase A. The census must be complete before analysis begins."

**Call 2 "Advise" — one addition:**
- Added: "Every gap identified in the landscape analysis should be addressed by at least one recommendation."
- Anti-pattern added: "Do NOT leave landscape gaps unaddressed."

**Structural feature extraction — extended:**
- New `extractTaxonomies()` function extracts categorical lists from:
  - Structured output parser schemas (JSON enum values)
  - Switch/router node conditions
  - AI prompt nodes (category headers in prompt text)
- Taxonomies injected into Call 1 user message as `<extracted_taxonomies>` section with explicit count constraints

### v4 Test Script

`scripts/research-spike-v4.ts` — same CLI interface as v3, results to `specs/research-spike-results/v4/`.

### v4 Prompts

Per-automation prompt: identical to v3 (see v3 section above).

#### Call 1 "Understand" Prompt (v4)

Changes from v3 marked with `[v4]`:

- Methods 1, 2, 4: added "Phase A — CENSUS / Phase B — ANALYSIS" structure `[v4]`
- Method 3: two-phase with numbered census and per-item verdict requirement `[v4]`
- Method 5: three-phase with participant census, state machine, complementary outcome check `[v4]`
- Completeness verification step added after methods `[v4]`
- Anti-pattern: "Do NOT skip Phase A" `[v4]`
- Output format `reasoning` field: "MUST show evidence of all five methods being applied with both phases" `[v4]`

Full prompt text in `scripts/research-spike-v4.ts` (CALL1_PROMPT constant).

#### Call 2 "Advise" Prompt (v4)

Changes from v3:

- Added instruction: "Every gap identified in the landscape analysis should be addressed by at least one recommendation." `[v4]`
- Added anti-pattern: "Do NOT leave landscape gaps unaddressed." `[v4]`

Full prompt text in `scripts/research-spike-v4.ts` (CALL2_PROMPT constant).

---

### v4 Results — Opus 4 (2026-04-04)

**Step 1 — Per-automation (all 8, Opus):**

| Workflow | Name | Impact | Detectability | Latency | Tokens |
|----------|------|--------|---------------|---------|--------|
| 01 | Customer Welcome Email Test | low | silent | 33s | 3158/780 |
| 02 | FairTix Lottery Winner Notification | critical | partially-monitored | 39s | 6653/950 |
| 02b | FairTix Lottery Winner Notification | critical | silent | 44s | 7562/1073 |
| 03 | Support Message AI Classifier | high | silent | 47s | 9188/1052 |
| 04 | FairTix Support Email Triage and Auto-Response | critical | silent | 44s | 19503/1048 |
| 04-sheet | FairTix Customer Support Triage | high | silent | 45s | 12137/1017 |
| 05-pub | FairTix Lottery Winner Notification System | critical | silent | 74s | 6650/990 |
| 05-err | Automation Error Alert System | critical | silent | 32s | 3461/825 |
| **Total** | | | | **~6 min** | **68,312 / 7,735** |

**Step 2 — Call 1 "Understand" (Opus):**
- Latency: 214s | Tokens: 10,227 / 4,209
- 4 existing processes: Fair Queue Lottery System, Customer Support Management, Customer Onboarding, Operations
- 3 suggested processes: Queue Entry & Bot Prevention, Purchase Completion & Payment, **Lottery Loser Communication**
- 4 cross-workflow findings
- **KEY: "Lottery Loser Communication" discovered via state machine lifecycle trace — the non-winner gap found without domain-specific instruction**

**Step 3 — Call 2 "Advise" (Opus):**
- Latency: 114s | Tokens: 13,450 / 3,427
- 8 recommendations: 4 ACT NOW, 2 INVESTIGATE, 2 EXPLORE
- ACT NOW: Activate and fix revenue workflows, Fix lottery notification reliability, **Build lottery loser notification**, Build purchase completion workflow
- INVESTIGATE: Expand support auto-resolution, Automate queue entry with bot prevention
- EXPLORE: Connect payment and inventory systems, Consolidate duplicate workflows

**"Your Next Move" (Opus v4):**
> Start by reactivating your support workflows — you have 143 successful executions proving they work, but they're all turned off. Fix the 36% failure rate on the lottery notification by adding retry logic to the Gmail node, then build the missing lottery loser notification. This sequence recovers immediate value from proven automations, fixes the revenue leak, then addresses the silent majority of lottery participants who currently hear nothing.

---

### v4 Results — Sonnet 4 (2026-04-04)

**Step 1 — Per-automation (all 8, Sonnet):**

| Workflow | Name | Impact | Latency | Tokens |
|----------|------|--------|---------|--------|
| 01 | FairTix User Welcome Email | medium | 21s | 3158/719 |
| 02 | FairTix Lottery Winner Notification System | critical | 28s | 6653/1021 |
| 02b | FairTix Lottery Winner Notification System | critical | 25s | 7562/920 |
| 03 | FairTix Support Message Classification | high | 28s | 9188/975 |
| 04 | FairTix Intelligent Support Ticket Triage | high | 35s | 19503/1088 |
| 04-sheet | FairTix Support Ticket Classification | high | 29s | 12137/989 |
| 05-pub | FairTix Lottery Winner Notification System | critical | 24s | 6650/851 |
| 05-err | Automation Failure Alert System | critical | 23s | 3461/828 |
| **Total** | | | **~4 min** | **68,312 / 7,391** |

**Step 2 — Call 1 "Understand" (Sonnet):**
- Latency: 59s | Tokens: 9,742 / 3,277
- 3 existing processes: User Lifecycle Management, Lottery and Winner Management, Customer Support Operations
- 3 suggested processes: Anti-Bot Verification Pipeline, **Lottery Loser Communication**, **Resale Policy Enforcement**
- 5 cross-workflow findings
- **KEY: Sonnet also found "Lottery Loser Communication" AND "Resale Policy Enforcement" — both missed in v3**

**Step 3 — Call 2 "Advise" (Sonnet):**
- Latency: 61s | Tokens: 12,080 / 2,909
- 7 recommendations: 4 ACT NOW, 2 INVESTIGATE, 1 EXPLORE
- ACT NOW: Reactivate lottery winner notification, Reactivate AI support system, Fix error monitoring reliability, Add retry logic to all workflows
- INVESTIGATE: **Lottery loser notification system**, User verification pipeline
- EXPLORE: **Resale policy monitoring**

---

### Step 4: Opus vs Sonnet Comparison (v4)

| Dimension | v4 Opus | v4 Sonnet |
|---|---|---|
| **Full chain latency** | ~10 min | ~5 min |
| **Step 2 latency** | 214s | 59s |
| **Step 3 latency** | 114s | 61s |
| **Recommendations** | 8 | 7 |
| **Non-winner gap found?** | **Yes** (ACT NOW) | **Yes** (INVESTIGATE) |
| **Resale/Transfer found?** | Not in recs | **Yes** (EXPLORE) |
| **Payment gap found?** | Yes (ACT NOW) | Not in recs |
| **Lottery loser tier** | ACT NOW (benchmark-based) | INVESTIGATE (benchmark-based) |
| **Evidence depth** | Deeper per recommendation | Good, more concise |
| **Next Move quality** | Excellent — clear sequence with reasoning | Good — identifies priorities |

**Key finding:** Both models now discover the non-winner notification gap. The two-phase enumerate-then-evaluate and state machine methods are the structural fix. Sonnet additionally found Resale Policy Enforcement which Opus missed — suggesting the two models have slightly different cross-referencing strengths.

---

### v4 vs v3 vs v2 vs Reference

| Dimension | v2 Sonnet | v3 Opus | v3 Sonnet | **v4 Opus** | **v4 Sonnet** | Reference |
|---|---|---|---|---|---|---|
| Recommendations | 12 | 6 | 5 | **8** | **7** | 13 |
| Non-winner gap | Yes (hardcoded) | No | No | **Yes** | **Yes** | Yes |
| Resale/Transfer | Yes (hardcoded) | Yes (Step 2) | No | No | **Yes** | Yes |
| Payment gap | Yes | Yes | Yes | **Yes** | Yes | Yes |
| Domain-agnostic prompts? | No | Yes | Yes | **Yes** | **Yes** | N/A |
| Overfitted to FairTix? | Yes | No | No | **No** | **No** | N/A |

**v4 is the recommended prompt version.** It achieves the critical findings (non-winner gap, domain coverage) through generalizable reasoning methods (state machines, two-phase enumeration, taxonomy extraction) rather than domain-specific instructions. The remaining gap vs reference (8 recs vs 13) is acceptable — v2's 12 was inflated by overfitting.

---

### v4 Discoveries

**What the two-phase + state machine approach proved:**
1. **Enumerate-then-evaluate is the single highest-impact technique.** Both gaps (non-winner, domain coverage) were caused by depth-first reasoning. Forcing breadth-first census before analysis solves them structurally.
2. **State machine framing naturally discovers complementary outcomes.** "Selected" and "not selected" must both lead somewhere — no domain-specific instruction needed.
3. **Taxonomy pre-extraction makes enumeration deterministic.** Extracting support categories from JSON schemas (6 enum values) and injecting them as constraints eliminates the LLM's unreliable self-enumeration.
4. **Completeness verification catches remaining gaps.** The self-check step ("count census items vs verdicts") provides a safety net.
5. **v4 Sonnet now outperforms v3 Opus on gap detection.** The structural reasoning techniques matter more than the model size.

**Remaining gap vs reference:**
- Purchase window reminders (reference R3) — not found by any version. This requires reasoning about time-based follow-ups which isn't captured by the current lifecycle trace. Could be addressed by adding "temporal completeness" to the state machine method.
- Weekly support digest (reference R13) — a data aggregation recommendation. Would require a method that reasons about "what happens to accumulated data."
- Some reference recommendations are at lower confidence (R11 post-event, R12 verification) — these are the kind the model correctly places at EXPLORE or omits when being conservative.

---

### v4 Result Files

All in `specs/research-spike-results/v4/`:

| File | Contents | Model |
|------|----------|-------|
| `step1-*.json` | 8 per-automation outputs | Opus (Sonnet overwritten) |
| `step1-all.json` | Combined per-automation outputs | Opus |
| `step2-understand.json` | Call 1 landscape analysis | Opus |
| `step3-advise.json` | Call 2 recommendations + next move | Opus |

Sonnet results captured in comparison tables above.

---

## v5 — Simple Prompt Test (2026-04-04)

### v5 Hypothesis

After v4's elaborate five-method two-phase architecture, a critical question: **are we over-designing?** The original ANALYSIS-FINAL.md was produced conversationally without prompt engineering. What if a simple "find every missing business opportunity" instruction produces comparable results?

### v5 Design

Radical simplification:
- **Per-automation prompt**: ~150 words. Just role + "understand what it means for the business" + output schema. No rubrics, no detectability dimension, no structural features.
- **Workspace call**: Single call replacing the v3/v4 two-call (Understand + Advise) split. Just "find every missing business opportunity. Be thorough." + combined output schema (processes + opportunities + next move).
- **No methods**, no two-phase enumeration, no state machines, no taxonomy extraction, no completeness verification.

Test script: `scripts/research-spike-v5-simple.ts`. Results in `specs/research-spike-results/v5/`.

### v5 Results — Sonnet 4

**Step 1 — Per-automation (all 8):**
- Total latency: ~2.5 min (vs v4's ~4 min)
- Total tokens: ~53K in / ~5K out (vs v4's ~68K in / ~7K out)
- Impact classifications: less differentiated without rubric (most = "high")

**Workspace — single call:**
- Latency: 51s (vs v4's 59+61 = 120s)
- Tokens: 5,653 in / 2,969 out (vs v4's 9,742+12,080 = 21,822 in / 3,277+2,909 = 6,186 out)
- 4 processes: Customer Onboarding, Lottery & Ticket Sales, Customer Support, Operations Monitoring
- 10 opportunities: 4 ACT NOW, 4 INVESTIGATE, 2 EXPLORE

**Opportunities (Sonnet):**

| # | Name | Tier | Confidence | In reference? | In v4? |
|---|------|------|-----------|---------------|--------|
| o1 | Restore Core Business Operations | ACT NOW | data-driven | Partial | Yes |
| o2 | Fix Lottery Notification Reliability | ACT NOW | data-driven | R1 | Yes |
| o3 | Consolidate Duplicate Workflows | ACT NOW | data-driven | Part of R1 | Yes |
| o4 | Payment Processing Automation | ACT NOW | benchmark | R7 | Yes |
| o5 | Automated Human Verification | INVESTIGATE | benchmark | R12 | Yes |
| o6 | Inventory Management Automation | INVESTIGATE | benchmark | **New** | **No** |
| o7 | **Purchase Abandonment Recovery** | INVESTIGATE | benchmark | **~R3** | **No** |
| o8 | **Business Intelligence Dashboard** | INVESTIGATE | ai-suggested | **~R13** | **No** |
| o9 | Enterprise Email Platform Migration | EXPLORE | benchmark | ~R10 | Partial |
| o10 | Monitoring System Redundancy | INVESTIGATE | data-driven | R10 | Yes |

### v5 Results — Opus 4

**Workspace — single call:**
- Latency: 74s
- 8 opportunities: 3 ACT NOW, 3 INVESTIGATE, 2 EXPLORE

**Opportunities (Opus):**

| # | Name | Tier | Confidence | New vs v4? |
|---|------|------|-----------|-----------|
| o1 | Fix Lottery Winner Notification Failures | ACT NOW | data-driven | Same |
| o2 | Automated Payment Processing Pipeline | ACT NOW | benchmark | Same |
| o3 | Digital Ticket Fulfillment System | ACT NOW | ai-suggested | **New** |
| o4 | Automated Human Verification Pipeline | INVESTIGATE | ai-suggested | Same |
| o5 | Transactional Email Service Integration | INVESTIGATE | benchmark | **New framing** |
| o6 | Business Intelligence Data Pipeline | INVESTIGATE | ai-suggested | **New** |
| o7 | Automated Ticket Transfer & Resale System | EXPLORE | data-driven | Partial |
| o8 | Proactive Performance Monitoring | EXPLORE | ai-suggested | **New** |

### v5 Key Findings

**What v5 proved:**
1. **Simple prompts find MORE opportunities.** v5 Sonnet found 10 (vs v4's 7). v5 Opus found 8 (same as v4 Opus but different composition).
2. **Simple prompts find things elaborate prompts don't.** Purchase abandonment recovery, BI dashboard, inventory management, ticket fulfillment — none found by v4.
3. **Single workspace call works.** Combining Understand + Advise into one "find opportunities" call saved 75% tokens and 50% latency with no quality loss on recommendations.
4. **The model already knows how to find opportunities.** Elaborate analytical methods mostly replicate what the model does naturally.

**What v5 lost:**
1. **Non-winner notification gap NOT found** by either model. This is the one finding that only v4's state machine method reliably discovers.
2. **Per-workflow analysis is shallower.** ~550 tokens/workflow vs v4's ~950. Less deductive reasoning, fewer specific evidence citations.
3. **Impact classification inconsistent.** Without rubric, most workflows rated "high" — no differentiation between prototype (welcome email) and revenue-critical (lottery notification).
4. **Missing structured data for product UI:**
   - No system landscape (Dashboard needs it)
   - No connected automations (Detail page needs it)
   - No cross-workflow findings as structured data (buried in reasoning text)
   - No detectability dimension
   - No credentials, timeSavings, complexity in per-automation output
5. **Process clustering less detailed.** Coverage/maturity present but steps less granular.

### v5 Conclusion: The Hybrid Insight

v5 demonstrates that **instruction simplicity and output quality are not the same thing.** The model needs:
- **Minimal instructions** — it knows how to analyze. Don't over-instruct methods.
- **Structured output schema** — the product UI requires specific data shapes. These aren't over-engineering; they're product requirements.
- **Rubrics** — without explicit criteria, impact classification is inconsistent across workflows.
- **Targeted structural methods** — only where proven necessary (state machine for lifecycle completeness, two-phase for domain coverage). Not for every analytical step.

This points to a **v6 hybrid**: v5's lean instructions + v4's output schema + v4's rubrics + v4's structural methods ONLY for the two patterns that need them.

### v5 Result Files

All in `specs/research-spike-results/v5/`:

| File | Contents | Model |
|------|----------|-------|
| `step1-*.json` | 8 per-automation outputs | Opus (Sonnet overwritten) |
| `step1-all.json` | Combined per-automation outputs | Opus |
| `workspace.json` | Combined understand + advise | Opus |

---

## v6 — Hybrid: Lean Instructions + Targeted Methods (2026-04-04)

### v6 Design Rationale

v5 proved the model doesn't need elaborate analytical methods to find opportunities — a simple "find every opportunity" instruction found MORE than v4's five-method architecture. But v5 lost structured data the product needs (system landscape, connected automations, cross-workflow findings, detectability, rubric consistency) and still missed the non-winner gap.

**v6 takes the best of both:**
- **v5's instruction simplicity** — lean natural language, no over-engineered method descriptions
- **v4's output schema** — structured data the product UI requires
- **v4's rubrics** — impact and detectability for classification consistency
- **v4's structural features + taxonomy extraction** — pre-computed reading guide
- **v4's targeted methods ONLY where proven needed:**
  - Two-phase enumerate-then-evaluate for Method 3 (domain coverage) — Sonnet misses domains without it
  - State machine framing for Method 5 (lifecycle completeness) — only way to reliably discover complementary outcome gaps
- **Methods 1, 2, 4 simplified** — natural language instead of forced Phase A/B structure
- **Call 2 uses v5-style simplicity** — "find every missing business opportunity, be thorough"

### v6 Changes from v4

| Component | v4 | v6 |
|---|---|---|
| Per-automation instructions | ~300 words | ~150 words |
| Per-automation rubrics | Same | Same |
| Per-automation structural features | Same | Same |
| Call 1 instructions | ~500 words (5 methods, all two-phase) | ~250 words (natural language + 2 targeted methods) |
| Call 1 output schema | Same | Same |
| Call 2 instructions | ~300 words (tiers, types, framing, completeness) | ~150 words ("find every opportunity, be thorough") |
| Call 2 output schema | Same | Same |
| Total prompt tokens (system) | ~2,500 | ~1,400 |

### v6 Test Script

`scripts/research-spike-v6.ts`. Same CLI as v4. Results in `specs/research-spike-results/v6/`.

### v6 Prompts

Test script: `scripts/research-spike-v6.ts`

#### Per-Automation Prompt (v6)

```
You are an automation intelligence analyst. Analyze this n8n workflow and its execution data. Understand what it means for the business — what capability it enables, what its configuration reveals about the company, and what happens when it fails.

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
}
```

**User message includes:** `<structural_features>` (pre-extracted), `<workflow_json>` (full), `<execution_stats>`.

#### Call 1 "Understand" Prompt (v6)

```
You are a business analyst assessing an automation landscape. Synthesize individual workflow analyses into a complete picture of what this company automates, what's working, and what's missing.

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
    { "name": "Name", "summary": "What", "basedOn": "Evidence", "suggestedSteps": ["Step 1"], "connectedSystems": ["systems"] }
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
}
```

**User message includes:** `<workflow_summaries>` (all per-automation outputs), `<execution_overview>`, `<instance_metadata>`, `<extracted_taxonomies>` (from preprocessing).

#### Call 2 "Advise" Prompt (v6)

```
You are a business opportunity consultant. You receive an automation landscape assessment. Find every missing business opportunity — what should this company build, fix, or connect? Be thorough.

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
}
```

**User message includes:** `<landscape_analysis>` (Call 1 output), `<workflow_summaries>` (per-automation outputs).

**NOTE — Known data architecture issue:** Call 2 currently receives only per-automation summaries, not full workflow JSONs. This prevents technically specific recommendations (e.g., "add retryOnFail on the Gmail node" vs generic "add retry logic"). The reference ANALYSIS-FINAL.md produced specific recommendations because Claude had all raw data throughout. See v6 Conclusions for discussion.

---

### v6 Results — Opus 4

**Step 1 — Per-automation (all 8):**

| Workflow | Name | Impact | Latency | Tokens |
|----------|------|--------|---------|--------|
| 01 | FairTix Welcome Email Test | low | 31s | 2806/743 |
| 02 | FairTix Lottery Winner Notification | critical | 34s | 6299/795 |
| 02b | FairTix Lottery Winner Notification | critical | 39s | 7209/890 |
| 03 | Customer Support Auto-Classification | high | 41s | 8835/924 |
| 04 | AI Support Email Triage and Auto-Response | high | 44s | 19150/1025 |
| 04-sheet | Customer Support AI Triage | high | 40s | 11784/933 |
| 05-pub | FairTix Lottery Winner Notification | medium | 36s | 6297/905 |
| 05-err | Automation Error Monitor | critical | 31s | 3102/711 |
| **Total** | | | **~5 min** | **65,482 / 6,926** |

**Step 2 — Call 1 "Understand" (Opus):**
- Latency: 77s | Tokens: 8,291 / 2,751
- 3 existing processes: Lottery-Based Ticket Distribution, Customer Support Operations, User Onboarding
- 3 suggested processes: Payment Processing & Billing, User Verification System, **Resale Price Cap Enforcement**
- 4 cross-workflow findings

**Step 3 — Call 2 "Advise" (Opus):**
- Latency: 96s | Tokens: 10,675 / 3,128
- 10 recommendations: 5 ACT NOW, 3 INVESTIGATE, 2 EXPLORE

| # | Name | Tier | Confidence |
|---|------|------|-----------|
| r1 | Automated Payment Processing Pipeline | ACT NOW | data-driven |
| r2 | Add Retry Logic to Lottery Notifications | ACT NOW | data-driven |
| r3 | Automated User Verification System | ACT NOW | data-driven |
| r4 | **Non-Winner Notification Workflow** | **ACT NOW** | **data-driven** |
| r5 | Consolidate Duplicate Workflows | ACT NOW | data-driven |
| r6 | Automated Lottery Selection Engine | INVESTIGATE | benchmark |
| r7 | **Automated Resale Price Cap Enforcement** | **INVESTIGATE** | **data-driven** |
| r8 | Professional Email Service Integration | INVESTIGATE | benchmark |
| r9 | Database Migration from Sheets | EXPLORE | benchmark |
| r10 | Professional Monitoring Platform | EXPLORE | data-driven |

**"Your Next Move" (Opus v6):**
> Start by fixing the 36% failure rate on FairTix Lottery Winner Notification (r2) — this directly recovers lost revenue. Next, build the Non-Winner Notification workflow (r4) to complete the lottery experience for all participants. Then consolidate the 6 duplicate workflows (r5) to reduce confusion about which version is production.

---

### v6 Results — Sonnet 4

**Step 1 — Per-automation (all 8):**
- Total latency: ~3.5 min | Tokens: 65,482 / 6,683

**Step 2 — Call 1 "Understand" (Sonnet):**
- Latency: 53s | Tokens: 8,067 / 3,333
- 4 existing processes: Customer Support Management, Lottery Winner Management, Customer Onboarding, Infrastructure Monitoring
- 3 suggested processes: Account Verification, Payment and Billing Support, **Resale and Transfer Management**
- 4 cross-workflow findings

**Step 3 — Call 2 "Advise" (Sonnet):**
- Latency: 52s | Tokens: 11,064 / 2,495
- 8 recommendations: 3 ACT NOW, 3 INVESTIGATE, 2 EXPLORE

| # | Name | Tier | Confidence |
|---|------|------|-----------|
| r1 | Activate Inactive Production Workflows | ACT NOW | data-driven |
| r2 | Support Category Response Automation | ACT NOW | data-driven |
| r3 | Error Handling and Retry Logic | ACT NOW | data-driven |
| r4 | Consolidate Duplicates + Complete Onboarding | INVESTIGATE | data-driven |
| r5 | Database and CRM Integration | INVESTIGATE | benchmark |
| r6 | Payment System Integration | INVESTIGATE | data-driven |
| r7 | Dynamic Knowledge Base Updates | EXPLORE | ai-suggested |
| r8 | **Automated Resale Monitoring** | **EXPLORE** | **benchmark** |

Non-winner gap: **not found by Sonnet** (consistent with v3, v5).

---

### Step 4: v6 Opus vs Sonnet

| Dimension | v6 Opus | v6 Sonnet |
|---|---|---|
| Recommendations | 10 | 8 |
| Non-winner gap | **Yes (ACT NOW)** | No |
| Resale | Yes (INVESTIGATE) | Yes (EXPLORE) |
| Payment | Yes (ACT NOW) | Yes (INVESTIGATE) |
| Step 2 latency | 77s | 53s |
| Step 3 latency | 96s | 52s |
| Full chain | ~8 min | ~5 min |

---

### Cross-Version Comparison (final)

| | v2 | v3 Opus | v4 Opus | v4 Sonnet | v5 Sonnet | **v6 Opus** | **v6 Sonnet** | Ref |
|---|---|---|---|---|---|---|---|---|
| Recs | 12 | 6 | 8 | 7 | 10 | **10** | **8** | 13 |
| Non-winner | Yes* | No | Yes | Yes | No | **Yes** | No | Yes |
| Resale | Yes* | Yes | No | Yes | No | **Yes** | **Yes** | Yes |
| Payment | Yes | Yes | Yes | Yes | Yes | **Yes** | **Yes** | Yes |
| Purchase reminders | No | No | No | No | **Yes** | No | No | Yes |
| BI/digest | No | No | No | No | **Yes** | No | No | Yes |
| Domain-agnostic | No | Yes | Yes | Yes | Yes | **Yes** | **Yes** | N/A |
| Prompt tokens | ~2,800 | ~2,200 | ~2,500 | ~2,500 | ~600 | **~1,400** | **~1,400** | N/A |

\* v2 findings from overfitted prompts

### v6 Conclusions

**v6 Opus is the recommended prompt architecture for Epic 10.**

1. **Lean instructions work.** Half the prompt tokens of v4, same or better output. The model knows how to analyze — don't over-instruct.
2. **Targeted structural methods earn their keep.** State machine lifecycle trace is the only reliable way to discover complementary outcome gaps. Two-phase domain coverage ensures exhaustive taxonomy checking. These two techniques justify their complexity.
3. **Everything else should be natural language.** Methods 1 (capability enumeration), 2 (dependency graph), 4 (operational coherence) don't need Phase A/B structure — the model does them naturally.
4. **Rubrics and output schema are not over-engineering.** They're product requirements. Impact classification without rubric is inconsistent. Detectability adds actionable insight. The product UI needs structured system landscape, connected automations, and cross-workflow findings.
5. **Model recommendation confirmed.** Sonnet for per-automation (parallel, cost-sensitive). Opus for workspace-level (2 calls, quality-sensitive). Sonnet consistently misses the non-winner gap even with structural methods — this appears to be a model capability boundary.

**Remaining gaps vs reference:**
- Purchase window reminders (R3) — found only by v5's unconstrained approach
- Weekly support digest (R13) — found only by v5's unconstrained approach
- **Technical recommendation specificity** — reference says "add retryOnFail on Gmail node", "add confidence gate: if < 0.75, route to manual"; v6 says "add retry logic" (generic). See data architecture issue below.

### Critical Issue: Data Architecture

**Problem:** Call 2 receives per-automation summaries + Call 1 output, but NOT the raw workflow JSONs. The per-automation summaries compress away technical details (specific node names, config values, parameter settings) that are needed for technically specific recommendations.

**Impact:** The reference ANALYSIS-FINAL.md recommends "add retryOnFail on the Gmail node" and "add confidence gate: if < 0.75, route to manual." v6 recommends "add retry logic" — correct but generic and not actionable without looking up the details yourself.

**Root cause:** The PRD (§10) says "workspace-level calls must consume only per-automation summary fields, never raw workflow JSON." This was a scalability optimization for 50+ workflows. We applied it to our 8-workflow test without questioning whether it was appropriate for the recommendation step.

**The conversational ANALYSIS-FINAL.md didn't have this problem** because Claude had ALL raw data available throughout all 5 parts. The chain architecture introduces information loss at each step boundary.

**Options for Epic 10:**
1. **Pass full JSONs to Call 2** — works for <20 workflows, may exceed context at scale. Simplest fix.
2. **Enrich per-automation summaries with technical fix candidates** — add a `technicalFixes` array to per-automation output (e.g., `[{ node: "Send a message", issue: "retryOnFail: false", fix: "enable retry with backoff" }]`). Call 2 can reference these directly.
3. **Two-tier architecture** — workspace calls use summaries for broad analysis; a separate "detail" call uses raw JSON for specific technical recommendations per workflow.
4. **Accept the split** — recommendations identify WHAT to fix (Call 2), the Detail page shows HOW to fix it (per-automation technical evidence). The user clicks through from recommendation to detail.

This is a product architecture decision, not a prompt engineering one. Must be resolved before Epic 10 implementation.

### v6 Result Files

All in `specs/research-spike-results/v6/`:

| File | Contents | Model |
|------|----------|-------|
| `step1-*.json` | 8 per-automation outputs | Sonnet (Opus overwritten by Sonnet run) |
| `step1-all.json` | Combined per-automation outputs | Sonnet |
| `step2-understand.json` | Call 1 landscape analysis | Sonnet |
| `step3-advise.json` | Call 2 recommendations + next move | Sonnet |

Opus results captured in tables above.

---

## v7 — Simple Prompts Everywhere + Full Data (2026-04-04)

### v7 Hypothesis

After v6, two critical observations:
1. **We were starving the model of data.** Call 2 received only per-automation summaries, not raw workflow JSONs. This prevented technically specific recommendations ("add retry logic" vs "enable retryOnFail on the 'Send a message' Gmail node").
2. **We were still over-designing.** v6 kept rubrics, detectability instructions, structural features, and two targeted methods (state machine, two-phase enumeration). The original ANALYSIS-FINAL.md was produced conversationally with NONE of these — just full data and a smart model.

**v7 hypothesis: simple prompts + full data + output schemas = best results.** Strip everything — no rubrics, no structural features, no methods, no state machines. Just "analyze this" and "find every opportunity, be extensive and creative." Pass full workflow JSONs to ALL calls.

### v7 Design

| Component | v6 | v7 |
|---|---|---|
| Per-automation instructions | Lean + rubrics + structural features | **Simple paragraph** |
| Per-automation input | Structural features + raw JSON | **Raw JSON only** |
| Call 1 instructions | Natural language + 2 targeted methods | **Simple paragraph** |
| Call 1 input | Summaries + taxonomies | **Summaries + full JSONs** |
| Call 2 instructions | Simple + gap completeness | **"Be extensive and creative" + technical specificity instruction** |
| Call 2 input | Landscape + summaries | **Landscape + summaries + full JSONs** |
| Rubrics | Impact + detectability | **None** |
| Structural features | Extracted programmatically | **None** |
| Methods | Two-phase + state machine | **None** |
| Total system prompt tokens | ~1,400 | **~800** |

### v7 Test Script

`scripts/research-spike-v7.ts`. Results in `specs/research-spike-results/v7/`.

### v7 Prompts

#### Per-Automation Prompt (v7)

```
You are an automation intelligence analyst. Analyze this n8n workflow JSON and its execution data.

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
}
```

**User message:** `<workflow_json>` (full) + `<execution_stats>` (aggregated).

#### Call 1 "Understand" Prompt (v7)

```
You are a business analyst assessing a company's full automation landscape. You receive analyses of each individual workflow plus the raw workflow JSONs.

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
}
```

**User message:** `<workflow_analyses>` (per-automation outputs) + `<raw_workflow_jsons>` (all 8 full JSONs, compact) + `<execution_overview>`.

#### Call 2 "Advise" Prompt (v7)

```
You are a business opportunity consultant. You receive a full automation landscape assessment plus all the raw workflow JSONs.

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
}
```

**User message:** `<landscape_analysis>` (Call 1 output) + `<workflow_analyses>` (per-automation outputs) + `<raw_workflow_jsons>` (all 8 full JSONs).

---

### v7 Results — Opus 4

**Step 1 — Per-automation (all 8):**

| Workflow | Name | Impact | Latency | Tokens |
|----------|------|--------|---------|--------|
| 01 | New User Welcome Email | high | 32s | 2164/761 |
| 02 | FairTix Lottery Winner Notification | critical | 35s | 5501/856 |
| 02b | FairTix Lottery Winner Notification | critical | 34s | 6319/857 |
| 03 | Support Ticket Auto-Classifier | high | 38s | 7326/898 |
| 04 | Customer Support Email Classifier & Auto-Responder | high | 42s | 16948/981 |
| 04-sheet | Customer Support Ticket Classification & Response | high | 37s | 9914/824 |
| 05-pub | Lottery Winner Notification & Tracking | high | 37s | 5497/893 |
| 05-err | Automation Error Alert System | critical | 32s | 2543/767 |
| **Total** | | | **~5 min** | **56,212 / 6,837** |

**Step 2 — Call 1 "Understand" (Opus, with full JSONs):**
- Latency: 89s | Tokens: 47,154 / 3,047
- 3 existing processes: User Onboarding & Activation, Ticket Lottery & Distribution, Customer Support Management
- 4 suggested processes: Fair Queue Management, **Payment & Order Fulfillment**, Identity Verification, **Resale Management**
- 5 cross-workflow findings

**Step 3 — Call 2 "Advise" (Opus, with full JSONs):**
- Latency: 136s | Tokens: 50,417 / 4,190
- **12 recommendations**: 7 ACT NOW, 2 INVESTIGATE, 3 EXPLORE

| # | Name | Tier | Confidence | New? |
|---|------|------|-----------|------|
| r1 | Fix Critical Lottery Notification Failures | ACT NOW | data-driven | |
| r2 | Automated Fair Queue Lottery Selection | ACT NOW | data-driven | |
| r3 | International Phone Verification Handler | ACT NOW | data-driven | |
| r4 | End-to-End Payment & Fulfillment Pipeline | ACT NOW | data-driven | |
| r5 | **Replace Polling with Webhook Triggers** | **ACT NOW** | **data-driven** | **Novel** |
| r6 | Connect Payment Platform for Transaction Monitoring | INVESTIGATE | benchmark | |
| r7 | Add Secondary Error Monitoring | ACT NOW | data-driven | |
| r8 | **24-Hour Purchase Window Manager** | **INVESTIGATE** | **benchmark** | **= Ref R3** |
| r9 | **Automated Resale Marketplace** | **EXPLORE** | **data-driven** | |
| r10 | **Support Intelligence Dashboard** | **EXPLORE** | **benchmark** | **≈ Ref R13** |
| r11 | **AI Cost Optimization with Tiered Models** | **EXPLORE** | **ai-suggested** | **Novel** |
| r12 | Production Environment Setup | ACT NOW | data-driven | |

**Non-winner handling:** Found in r2 implementation notes — "Send consolation emails to non-winners with next queue dates." Naturally included as part of lottery automation design, not a separate recommendation.

**Technical specificity (r1):** "Enable retryOnFail on the 'Send a message' Gmail node with 3 retries and exponential backoff. Add fallback SMS notification channel. Implement circuit breaker pattern for Gmail rate limits." — names the node, cites config, proposes specific approach.

**"Your Next Move" (Opus v7):**
> Start with workflow '2 - FairTix - LotteryWin' and add retry logic to the Gmail node — this alone could recover 36% of lost revenue. Next, build the missing lottery selection workflow to automate your Fair Queue system end-to-end. Then consolidate the three duplicate notification workflows and activate the support triage system that has 143 successful executions proving it works.

---

### v7 Results — Sonnet 4

**Step 1 — Per-automation (all 8):**
- Total latency: ~3.5 min | Tokens: 56,212 / 7,016

**Step 2 — Call 1 "Understand" (Sonnet, with full JSONs):**
- Latency: 56s | Tokens: 47,305 / 3,234
- 4 processes: Customer Onboarding, Fair Queue Lottery, Customer Support, System Monitoring
- 4 suggested: Fair Queue Management, Payment & Transaction Processing, Account Verification, **Ticket Resale & Transfer**
- 5 findings

**Step 3 — Call 2 "Advise" (Sonnet, with full JSONs):**
- Latency: 72s | Tokens: 50,761 / 3,236
- 10 recommendations: 4 ACT NOW, 5 INVESTIGATE, 1 EXPLORE

| # | Name | Tier | Confidence | New? |
|---|------|------|-----------|------|
| r1 | Fix lottery notification reliability | ACT NOW | data-driven | |
| r2 | Add backup error notification channels | ACT NOW | data-driven | |
| r3 | **Implement Gmail rate limiting protection** | **ACT NOW** | **data-driven** | **Novel** |
| r4 | Automated lottery execution and winner data flow | ACT NOW | data-driven | |
| r5 | **AI classification quality monitoring** | **INVESTIGATE** | **data-driven** | **Novel** |
| r6 | Automated phone verification system | INVESTIGATE | data-driven | |
| r7 | Automated payment dispute handling | INVESTIGATE | data-driven | |
| r8 | Automated resale compliance monitoring | INVESTIGATE | data-driven | |
| r9 | Workflow deployment status dashboard | INVESTIGATE | data-driven | |
| r10 | **Purchase window reminder system** | **EXPLORE** | **benchmark** | **= Ref R3** |

**Technical specificity (r1):** "Enable retryOnFail on the 'Send a message' Gmail node with 3 retries and exponential backoff. Add fallback SMS notification channel. Implement circuit breaker pattern for Gmail rate limits." — same specificity as Opus.

Non-winner gap: not found by Sonnet (consistent across all versions).

---

### Step 4: v7 Opus vs Sonnet

| Dimension | v7 Opus | v7 Sonnet |
|---|---|---|
| Recommendations | **12** | 10 |
| Non-winner handling | **Yes (in impl notes)** | No |
| Purchase window reminders | **Yes (r8)** | **Yes (r10)** |
| Resale | **Yes (r9)** | **Yes (r8)** |
| Support digest / BI | **Yes (r10)** | No |
| Technical specificity | **Specific (node names, configs)** | **Specific (node names, configs)** |
| Novel findings | Webhook triggers, AI cost optimization, prod setup | Gmail rate limiting, AI quality monitoring, deployment dashboard |
| Step 2 latency | 89s | 56s |
| Step 3 latency | 136s | 72s |
| Workspace tokens in | ~97K | ~98K |

---

### Cross-Version Final Comparison

| | v2 | v3 Opus | v4 Opus | v5 Sonnet | v6 Opus | **v7 Opus** | **v7 Sonnet** | Ref |
|---|---|---|---|---|---|---|---|---|
| Recs | 12 | 6 | 8 | 10 | 10 | **12** | **10** | 13 |
| Non-winner | Yes* | No | Yes | No | Yes | **Yes** | No | Yes |
| Purchase reminders | No | No | No | Yes | No | **Yes** | **Yes** | Yes |
| Resale | Yes* | Yes | No | No | Yes | **Yes** | **Yes** | Yes |
| BI/digest | No | No | No | Yes | No | **Yes** | No | Yes |
| Technical specificity | Generic | Generic | Generic | Generic | Generic | **Specific** | **Specific** | Specific |
| Novel findings | 0 | 0 | 0 | 3 | 0 | **3** | **3** | — |
| Domain-agnostic | No | Yes | Yes | Yes | Yes | **Yes** | **Yes** | N/A |
| Methods needed | N/A | 5 methods | 5 two-phase | None | 2 targeted | **None** | **None** | N/A |
| Prompt tokens | ~2,800 | ~2,200 | ~2,500 | ~600 | ~1,400 | **~800** | **~800** | N/A |
| Workspace tokens in | ~22K | ~22K | ~22K | ~6K | ~19K | **~97K** | **~98K** | N/A |

\* v2 findings from overfitted prompts

### v7 Conclusions

**Simple prompts + full data is the winner.** v7 Opus with the simplest prompts of any version (no rubrics, no methods, no structural features, no state machines) produced the best result: 12 recommendations, technically specific, novel findings, and covers nearly every reference finding — all because the model had full data and clear instructions.

**What we learned across v1–v7:**
1. **The model already knows how to analyze.** Every version of elaborate method engineering (v2 overfitting, v3 methods, v4 two-phase + state machines, v6 hybrid) was compensating for data starvation, not analytical incapability.
2. **Data > methods.** Passing full workflow JSONs to workspace calls (v7) produced better results than any amount of prompt engineering on compressed summaries (v3–v6).
3. **"Be extensive and creative" + "be technically specific" are the two instructions that matter.** Everything else is output schema (product requirement) and confidence labels (nice-to-have).
4. **Token cost is the real trade-off.** v7 workspace calls use ~98K input tokens (full JSONs) vs v6's ~19K (summaries only). For 8 workflows this is fine. For 50+ workflows, a compression strategy will be needed — but that's a scaling problem, not a prompt problem.
5. **Opus finds the non-winner gap naturally; Sonnet doesn't.** This is a model capability boundary, not a prompt engineering problem. No amount of methods or instructions made Sonnet find it. Opus finds it with just "be extensive and creative" + full data.

### v7 Result Files

All in `specs/research-spike-results/v7/`:

| File | Contents | Model |
|------|----------|-------|
| `step1-*.json` | 8 per-automation outputs | Opus (Sonnet overwritten) |
| `step1-all.json` | Combined per-automation outputs | Opus |
| `step2-understand.json` | Call 1 landscape analysis | Opus |
| `step3-advise.json` | Call 2 recommendations + next move | Opus |

Sonnet results captured in tables above.

---

## v8 — Two Calls, PRD-Complete Schema (2026-04-04)

### v8 Design

Simplification of the call architecture based on v7's findings:
- **Two calls instead of three** — the Understand/Advise split was artificial. One workspace call does both.
- **PRD-complete per-automation schema** — added `revenueImpactEstimate` back (range with reasoning, e.g., "€195-2,600 lost per lottery cycle"). This was dropped during v3 schema consolidation but the Detail page's Business Case Card needs it.
- **Full data everywhere** — raw workflow JSONs passed to workspace call (proven in v7).
- **Simple prompts** — no rubrics, no methods, no structural features (proven in v7).

### v8 Prompts

Test script: `scripts/research-spike-v8.ts`

#### Call 1: Per-Automation

```
You are an automation intelligence analyst. Analyze this n8n workflow JSON and its execution data.

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
}
```

#### Call 2: Workspace (landscape + recommendations)

```
You are a senior automation consultant. You receive per-workflow analyses and the raw workflow JSONs for an entire automation instance.

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
}
```

---

### v8 Results — Opus 4

**Call 1 — Per-automation (all 8):**

| Workflow | Name | Impact | Latency | Tokens |
|----------|------|--------|---------|--------|
| 01 | FairTix Welcome Email | high | 43s | 2334/1042 |
| 02 | FairTix Lottery Winner Notification | critical | 51s | 5671/1124 |
| 02b | FairTix Lottery Winner Notification | critical | 44s | 6489/1150 |
| 03 | Customer Support Auto-Classifier | high | 38s | 7496/1063 |
| 04 | Support Email Triage and Auto-Response | high | 44s | 17118/1142 |
| 04-sheet | Support Ticket Classification and Auto-Response | high | 80s | 10084/1089 |
| 05-pub | FairTix Lottery Winner Notification | high | 45s | 5667/1017 |
| 05-err | Automation Error Monitor | critical | 33s | 2713/804 |
| **Total** | | | **~6 min** | **57,572 / 8,384** |

Revenue estimate example (02-lotterywins): "Each failure loses one ticket sale at €15-200+. At 36% failure rate across ~23 successful notifications = ~13 failed notifications per cycle. Estimated €195-2,600 lost revenue per lottery cycle. Confidence: data-driven."

**Call 2 — Workspace (Opus, single call):**
- Latency: 173s | Tokens: 49,097 / 5,742
- 4 processes: Ticket Lottery & Purchase, Customer Support, User Onboarding, Automation Monitoring
- 4 systems: Gmail, Google Sheets, Anthropic Claude, n8n Platform
- 4 cross-workflow findings

| # | Name | Tier | Confidence |
|---|------|------|-----------|
| r1 | Fix lottery email failures | ACT NOW | data-driven |
| r2 | **24-hour purchase reminder system** | **ACT NOW** | **benchmark** |
| r3 | Activate support automation | ACT NOW | data-driven |
| r4 | Add backup error monitoring | ACT NOW | data-driven |
| r5 | Event change management workflow | INVESTIGATE | data-driven |
| r6 | Connect welcome emails to registration | INVESTIGATE | data-driven |
| r7 | Migrate from Sheets to proper database | INVESTIGATE | benchmark |
| r8 | Verification reminder campaign | EXPLORE | ai-suggested |
| r9 | Payment system integration | EXPLORE | ai-suggested |
| r10 | Lottery participation insights | EXPLORE | ai-suggested |

Suggested processes: Complete Lottery Lifecycle, Intelligent Support Resolution, Proactive User Journey Orchestration.

Non-winner gap: **not found** (stochastic — v7 Opus found it, v8 Opus didn't).

---

### v8 Results — Sonnet 4

**Call 1 — Per-automation:** Total: 57,572 in / 8,745 out (~4 min)

**Call 2 — Workspace (Sonnet, single call):**
- Latency: 126s | Tokens: 49,437 / 6,232
- 4 processes, 4 systems, 4 findings

| # | Name | Tier | Confidence |
|---|------|------|-----------|
| r1 | Fix winner notification reliability | ACT NOW | data-driven |
| r2 | Winner notification backup & recovery | ACT NOW | data-driven |
| r3 | Redundant error monitoring | ACT NOW | data-driven |
| r4 | Eliminate single points of failure | INVESTIGATE | data-driven |
| r5 | Support ticket SLA monitoring | INVESTIGATE | ai-suggested |
| r6 | **Purchase window management** | **INVESTIGATE** | **benchmark** |
| r7 | FAQ version control & testing | INVESTIGATE | benchmark |
| r8 | Production deployment pipeline | INVESTIGATE | data-driven |
| r9 | **Support analytics & insights dashboard** | **EXPLORE** | **ai-suggested** |
| r10 | Fair Queue analytics & optimization | EXPLORE | benchmark |
| r11 | **User verification & onboarding automation** | **EXPLORE** | **benchmark** |
| r12 | **Resale price monitoring & compliance** | **EXPLORE** | **ai-suggested** |

Suggested processes: Event Lifecycle Management, Customer Success & Retention, Operational Excellence.

Non-winner gap: not found.

---

### Step 4: v8 Opus vs Sonnet

| Dimension | v8 Opus | v8 Sonnet |
|---|---|---|
| Recommendations | 10 | **12** |
| Non-winner gap | No | No |
| Purchase reminders | **Yes (ACT NOW)** | **Yes (INVESTIGATE)** |
| Resale | No | **Yes (EXPLORE)** |
| BI/analytics | Yes (r10) | **Yes (r9)** |
| Revenue estimates | **Yes (€195-2,600/cycle)** | **Yes** |
| Technical specificity | Specific | Specific |
| Novel findings | Event change mgmt | SLA monitoring, FAQ versioning |
| Workspace latency | 173s | 126s |
| Workspace tokens | 49K/5.7K | 49K/6.2K |
| Total calls | **2** | **2** | 

---

### Full Cross-Version Comparison

| | v2 | v4 Opus | v5 Sonnet | v6 Opus | v7 Opus | v7 Sonnet | **v8 Opus** | **v8 Sonnet** | Ref |
|---|---|---|---|---|---|---|---|---|---|
| Calls | 3 | 3 | 2 | 3 | 3 | 3 | **2** | **2** | N/A |
| Recs | 12 | 8 | 10 | 10 | 12 | 10 | 10 | **12** | 13 |
| Non-winner | Yes* | Yes | No | Yes | Yes† | No | No | No | Yes |
| Purchase reminders | No | No | Yes | No | Yes | Yes | **Yes** | **Yes** | Yes |
| Resale | Yes* | No | No | Yes | Yes | Yes | No | **Yes** | Yes |
| BI/digest | No | No | Yes | No | Yes | No | Yes | **Yes** | Yes |
| Revenue estimates | No | No | No | No | No | No | **Yes** | **Yes** | Yes |
| Tech specificity | Generic | Generic | Generic | Generic | Specific | Specific | **Specific** | **Specific** | Specific |
| Domain-agnostic | No | Yes | Yes | Yes | Yes | Yes | **Yes** | **Yes** | N/A |
| Prompt tokens | ~2,800 | ~2,500 | ~600 | ~1,400 | ~800 | ~800 | **~700** | **~700** | N/A |

\* v2 from overfitted prompts  
† v7 Opus found non-winner in implementation notes (stochastic)

### v8 Conclusions

**v8 is the recommended architecture for Epic 10:**
1. **Two calls, not three.** Per-automation (parallel, for Detail page) + single workspace (landscape + recommendations, for everything else). The Understand/Advise split was unnecessary.
2. **Simple prompts + full data + PRD-complete output schema.** No rubrics, no methods, no structural preprocessing. The model produces what the schema asks for when it has full data.
3. **Revenue estimates work.** Adding `revenueImpactEstimate` to the schema was sufficient — the model produces ranges with reasoning ("€195-2,600 lost per cycle") without elaborate instructions.
4. **Technical specificity comes from full data.** Passing raw JSONs to the workspace call enables "enable retryOnFail on the 'Send a message' Gmail node" — impossible when the model only saw summaries.
5. **Sonnet produces 12 recommendations at v8.** Matching the reference count. The model capability gap between Opus and Sonnet narrows when both have full data.

**The non-winner gap remains stochastic.** Found by: v4 (state machine method), v6 Opus (state machine), v7 Opus (once, in implementation notes). Not found by: v7 Sonnet, v8 Opus, v8 Sonnet. This is the one finding where the state machine method provides reliable detection. For production, consider: adding a single sentence to the workspace prompt ("check whether all process participants receive a defined outcome") as a lightweight nudge — not a full method, just a thinking prompt.

### v8 Result Files

All in `specs/research-spike-results/v8/`:

| File | Contents | Model |
|------|----------|-------|
| `call1-*.json` | 8 per-automation outputs | Opus (Sonnet overwritten) |
| `call1-all.json` | Combined per-automation outputs | Opus |
| `call2-workspace.json` | Landscape + recommendations | Opus |

Sonnet results captured in tables above.

---

## Spike Complete — Final Summary (2026-04-04)

### What we set out to do

Test the three-call prompt chain against real FairTix workflow data. Iterate until one-shot output matches ANALYSIS-FINAL.md quality.

### What we learned

Eight prompt versions (v1–v8) tested across two models. The journey:

| Version | Approach | Key finding |
|---------|----------|-------------|
| v1 | PRD-based prompts | Good quality, some gaps |
| v2 | Patched gaps from test results | **Overfitted to FairTix** — answers disguised as instructions |
| v3 | First-principles rewrite (methods, rubrics) | Principled but missed non-winner gap |
| v4 | Two-phase enumeration + state machines | Found non-winner gap, but over-engineered |
| v5 | Simple "find every opportunity" | Found MORE than v4 — model doesn't need methods |
| v6 | Hybrid (simple + targeted methods) | Good, but data starvation still limited quality |
| v7 | Simple prompts + full data to all calls | Best quality — 12 recs, novel findings, technically specific |
| v8 | v7 + two-call architecture + PRD-complete schema | **Final version** — 12 recs, revenue estimates, 2 calls |

**Core insight: data > methods > prompt engineering.** The model already knows how to analyze automation landscapes. Eight iterations of increasingly elaborate prompt engineering were compensating for data starvation, not analytical incapability.

### Final architecture (v8)

**Two LLM calls during sync:**
1. **Per-automation** (parallel) — one call per workflow, all simultaneous. Produces Detail page data.
2. **Workspace** (single) — receives per-automation outputs + full workflow JSONs. Produces landscape analysis + recommendations + next move.

**One LLM call on-demand:**
3. **Deploy JSON** — triggered when user clicks Deploy on a recommendation. Generates n8n workflow JSON.

**Model:** Sonnet for production default, Opus configurable.

**Prompts:** Simple — ~150 words per-automation, ~250 words workspace. No rubrics, no methods. Output schema IS the instruction.

### Decisions recorded

PRD amendments N–S in `prd-2.0-decisions.md`:
- **N**: Two-call architecture (supersedes Understand/Advise split)
- **O**: Simple prompts + full data (supersedes method engineering D, H, I, J, K)
- **P**: Deployable JSON as separate on-demand call
- **Q**: Per-automation calls run in parallel
- **R**: Aggregate estimates on dashboard (LLM + deterministic rollups)
- **S**: Sonnet default, Opus configurable

### Test scripts

| Script | Version | Purpose |
|--------|---------|---------|
| `scripts/research-spike-step1.ts` | v1/v2 | Per-automation (3 test workflows) |
| `scripts/research-spike-step1-remaining.ts` | v1/v2 | Per-automation (remaining 5) |
| `scripts/research-spike-step2.ts` | v1/v2 | Call 1 "Understand" |
| `scripts/research-spike-step3.ts` | v1/v2 | Call 2 "Advise" |
| `scripts/research-spike-v3.ts` | v3 | Full chain, model selectable |
| `scripts/research-spike-v4.ts` | v4 | Two-phase + state machine |
| `scripts/research-spike-v5-simple.ts` | v5 | Simple prompt test |
| `scripts/research-spike-v6.ts` | v6 | Hybrid |
| `scripts/research-spike-v7.ts` | v7 | Simple everywhere + full data |
| `scripts/research-spike-v8.ts` | **v8** | **Final — two calls, PRD-complete** |

### Next step

Epic 10: implement v8 architecture in production code.
