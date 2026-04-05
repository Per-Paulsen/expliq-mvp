# PRD 2.0 — Final Decisions

> Extracted from `prd-2.0-brainstorming.md` (15 rounds). This file contains ONLY final decisions — no history, no superseded ideas. For the reasoning behind any decision, see the referenced brainstorming round.
>
> Supporting references:
> - `prd-2.0-brainstorming.md` — full decision history
> - `n8n-api-findings.md` — n8n API capabilities
> - `n8n-api-examples/` — real API schemas and response examples
> - `n8n-api-examples/fairtix/reference/ANALYSIS-FINAL.md` — consulting-grade analysis of fairtix demo data
> - Figma Make file key `3bG7mlpucVffGMdoAFPcgc` — visual design reference (components + style only, NOT screen structure)

---

## 1. Product Identity

**Expliq is Automation Intelligence.** It connects to automation platforms (starting with n8n), uses LLMs to deeply understand every workflow and the full automation landscape, and delivers:

1. **Deep understanding** — per-workflow business narrative, per-system deductive reasoning, cross-workflow dependency mapping
2. **Process assessment** — business process discovery, maturity evaluation, coverage analysis, reliability metrics
3. **Actionable recommendations** — prioritized by impact with transparent confidence, deployable n8n JSON
4. **Transparent reasoning** — every insight traces back to the user's own data. Estimates are labeled as such with methodology visible.

**Tagline:** "Understand your automation landscape. Know what's working, what's broken, and what to build next."

**Core principle (from brainstorming Round 1, reaffirmed throughout):** The value is in REASONING, not numbers. Transparency of how insights are derived matters more than precision. Expliq is a consultant, not a calculator.

---

## 2. Four Screens

*(Round 15)*

| Screen | User question | One job |
|--------|--------------|---------|
| **Dashboard** | "What needs my attention?" | Executive summary: next move, facts, top priorities, process overview |
| **Process Map** | "What do I have?" | Processes with workflows, coverage, maturity. Toggle to show where gaps are. |
| **Priorities** | "What should I do?" | ALL recommendations ranked by impact × confidence. Deploy from here. |
| **Detail** | "Tell me everything about this one." | Per-workflow business narrative, business case, evidence, connections. |

Plus: **Settings** page (existing — n8n connector config, sync button) and **Login/Signup** (existing).

---

## 3. Dashboard

*(Rounds 11, 11b, 12, 15)*

Layout follows the McKinsey pyramid — answer first, evidence second:

| Section | Content |
|---------|---------|
| **Your Next Move** | AI banner: 1 specific recommendation with reasoning, referencing workflow names and chaining actions. Links to Priorities page. |
| **Facts Bar** | Workflow count, process count, system count, active count, recommendation count. Estimates secondary: "est. ~X hrs/wk (methodology →)" |
| **Two sections** | Left: Attention items (existing workflows with issues, linked to Detail). Right: Top Opportunities (top 3 recommendations, linked to Priorities). |
| **Process Coverage** | Table: process name, existing/recommended count, coverage bar, reliability indicator. |
| **Systems Compact** | One line: icons or names with workflow counts. Not full narratives. |
| **Delta Banner** | On re-sync: landscape changes, health changes, recommendation movement. Shows the Expliq product loop. See below. |

### Delta Banner

**What it demonstrates:** The Expliq product loop — sync → analyze → act → re-sync → see what changed. This proves Expliq is a living tool, not a one-shot report.

**When it appears:** Only after a re-sync (i.e., a previous analysis exists). Hidden on first sync.

**Position:** Top of Dashboard, below page title, above "Your Next Move." Compact — one or two lines. Accent-left border. Dismissible (X button, session-only).

**Three categories of change:**

| Category | Example | Source |
|----------|---------|--------|
| **Landscape changes** | "+2 new workflows detected", "1 workflow removed", "3 workflows updated" | Diff automation count + `updatedAt` timestamps between syncs |
| **Health changes** | "Lottery-Win error rate improved: 31% → 12%", "Support classifier now active" | Diff `errorRate`, `isActive`, `runsPerWeek` on automations that existed in both syncs |
| **Recommendation movement** | "1 recommendation resolved", "2 new recommendations" | Diff recommendation count + match by name/type to detect resolved items |

**Example outputs:**
- `"Since last analysis (2 days ago): 2 new workflows detected, lottery-win error rate improved 31% → 12%, 1 recommendation resolved."`
- `"Since last analysis (4 hours ago): 1 workflow deployed via Expliq, 3 new recommendations generated."`
- `"Since last analysis (1 week ago): no changes detected in your automation landscape."`

**How it works:** Before running a new analysis, the sync pipeline snapshots the current state into `previousSnapshot` on CompanyProfile (see section 12). After the new analysis completes, diff current vs. previous to generate a `deltaSummary` string. Computed once at sync time, not on every page load.

**Demo flow:** First sync — full analysis, no banner. Presenter makes a change in n8n (activates lottery-win workflow, fixes error rate). Re-syncs. Delta banner appears: "Since last analysis: lottery-win notification now active, error rate improved." The audience sees the loop close.

---

## 4. Process Map

*(Rounds 12, 14, 15)*

**Primary entity is the BUSINESS PROCESS, not the workflow.** Workflows are evidence inside processes.

**Process cards** (collapsed, the top level):

| Field | Source |
|-------|--------|
| Process name | LLM process clustering |
| Summary (one line) | LLM |
| Maturity level (Level 1-5 or named) | Composite: coverage × reliability × error handling × monitoring |
| Coverage bar | existing / (existing + recommendations) |
| Reliability | % successful executions (from execution API, aggregated per process) |
| Value at stake | LLM estimate with reasoning |
| Recommendation count | Count of recommendations in this process |

**Expanded process card** shows:
- Process flow visualization: step 1 → step 2 → step 3 (showing which are automated, which are gaps)
- Existing workflow cards inside
- Gap indicators (where recommendations exist) — visible when "Show gaps" toggle is ON
- Gap indicators link to Priorities page

**Workflow cards** (compact, inside expanded process):

| Field | Source |
|-------|--------|
| Name + step label | LLM (step) + n8n (name) |
| Business brief (one line) | LLM |
| Impact badge | LLM |
| Governance dot (healthy / attention / critical) | Risk engine |
| System flow (source → destination) | Deterministic from node types |

Click → Detail page.

**Toggle: "Show gaps"** — highlights where recommendations exist in each process. Links to Priorities for action. This is a contextual overlay, not the primary recommendation experience.

**Search bar** — filter processes and workflows.

---

## 5. Priorities

*(Rounds 7a, 12, 14, 15)*

ALL recommendations ranked by business impact. Confidence shown per card but does not change sort order.

**Three named tiers:**

| Tier | Criteria | Visual |
|------|----------|--------|
| **Act Now** | High impact + high confidence (data-driven evidence). No-regret moves. | Green accent, solid confidence indicator |
| **Investigate** | High impact + Expliq can't fully verify. May be handled by another system. | Amber accent, dashed confidence indicator |
| **Explore** | Valuable but lower urgency or requires platform expansion. | Grey accent, outline confidence indicator |

**Recommendation card** (compact):

| Field | Content |
|-------|---------|
| Title | One line |
| Business case | One line — the "so what" |
| Confidence badge | "Data-driven" / "Benchmark-based" / "AI-suggested" |
| Affected scope | "Ticket Lottery Lifecycle" / "3 workflows" |
| Deploy button | For n8n-deployable recommendations |
| Expand | → Slide-over panel with full detail |

**Slide-over panel** (on expand):
- Full business case with reasoning
- Evidence chain (specific data points from the user's n8n data)
- Key assumptions (what must be true for this recommendation to be valid)
- Honest framing for uncertain recommendations ("We don't see this in n8n. If handled by your platform, consider connecting it for visibility.")
- Implementation notes
- Systems involved
- Deploy button

**Recommendation types** (maps to Recommendation.type enum):

| Type | Example | Behavior |
|------|---------|----------|
| New workflow (`new_workflow`) | "Add lottery-loss notification" | Deploy button → deploy modal with n8n JSON |
| Technical fix (`technical_fix`) | "Fix 31% error rate — add retry logic" | Links to Detail page of affected workflow |
| Platform connection (`platform_connection`) | "Connect your ticketing platform" | Text + reasoning, no deploy button |

**Process suggestions** (separate ProcessSuggestion model, not a Recommendation type):

| Entity | Example | Behavior |
|--------|---------|----------|
| ProcessSuggestion with child Recommendations | "Payment & Billing — 4 workflows" | Collapsible section with child recommendation cards |

**Deploy modal:**
- n8n JSON preview (context-aware, generated by LLM based on recommendation + connected systems)
- Copy button
- "Deploy to n8n" button → POST to n8n API + activate
- Does not need to produce production-ready workflows — reasonable scaffolds are sufficient

---

## 6. Detail

*(Rounds 11, 14)*

Per existing workflow only. Recommendations and suggested processes do NOT have detail pages — they use slide-over panels on the Priorities page.

| Section | Content |
|---------|---------|
| **Header** | Name, governance dot + status label, platform badge, system flow, process step label |
| **Business Narrative** | Extended description — what this workflow does in business terms, why it matters. The text that made the trainer laugh. |
| **Business Case Card** | Three columns: Failure impact / Time savings / Revenue connection. Each with reasoning, not just numbers. |
| **Recommendations for This Workflow** | Technical fixes and improvements linked from Priorities. In-page, no navigation. |
| **Process Position** | Visual: which step in which process. Clickable → Process Map. |
| **Connected Automations** | Upstream (feeds this) / downstream (this feeds). From errorWorkflow + callerIds. Clickable → other Detail pages. |
| **"How We Know This"** | Expandable evidence section: execution stats, node configuration, credential info, raw data points. Includes the deductive reasoning chain — how Expliq derived its business conclusions from the workflow's node parameters, systems, and data flows. Renamed from "Technical Details" to emphasize trust-building. |

---

## 7. Navigation Map

*(Round 15)*

```
DASHBOARD
  ├── "Your next move" click → Priorities (scrolled to recommendation)
  ├── Attention item click → Detail page of that workflow
  └── Top opportunity click → Priorities (scrolled to recommendation)

PROCESS MAP
  ├── Process card expand → workflow cards (+ gap indicators if toggle ON)
  ├── Existing workflow click → Detail page
  └── Gap indicator click → Priorities (filtered to that process)

PRIORITIES
  ├── Recommendation "Deploy ▶" → Deploy modal (stays on Priorities)
  ├── Recommendation click → Slide-over panel (business case + evidence)
  ├── Technical fix click → Detail page of affected workflow
  └── Process suggestion expand → child recommendation cards

DETAIL
  ├── ← Back → Process Map
  ├── Connected automation click → Detail page of that workflow
  └── Process position click → Process Map (scrolled to process)
```

**Deep-linking:** Links marked "scrolled to recommendation" or "scrolled to process" require URL-based deep-linking (e.g., `/priorities?highlight={recommendationId}`). The target page scrolls to and briefly highlights the referenced item. This applies to: Dashboard → Priorities links, Process Map gap → Priorities links, and Detail → Process Map links.

---

## 8. Process-Level Variables

*(Round 12)*

The primary metrics are PROCESS-LEVEL, not workflow-level. Workflow stats are drill-down evidence.

| Variable | Description | Source |
|----------|-------------|--------|
| **Coverage** | % of process steps automated | workflow count / (workflows + recommendations) |
| **Reliability** | % of executions that succeed | Execution API, aggregated per process |
| **Maturity** | Composite level | Coverage × reliability × error handling quality × monitoring presence |
| **Value at Stake** | Impact of current gaps | LLM estimate with reasoning |
| **Recommendations** | Count of actionable items | Per process |

---

## 9. Recommendation Framework

*(Rounds 7a, 12)*

Based on McKinsey/BCG/Celonis consulting best practices.

**Sort:** By business impact (primary). Confidence shown per card but does not determine sort order.

**Confidence calibration:**

| Level | Label | Meaning | Visual |
|-------|-------|---------|--------|
| High | "Data-driven" | Computed from user's own n8n data. Specific field or metric cited. | Solid badge |
| Medium | "Benchmark-based" | General industry knowledge applied to their situation. | Dashed badge |
| Lower | "AI-suggested" | Inferred from patterns. Might be wrong. Blind spots acknowledged. | Outline badge |

**Honest framing for uncertain recommendations (three frames):**
1. "This is clearly in n8n's domain and clearly missing" → confident language
2. "We don't see this in n8n — if handled by your platform, consider connecting it" → soft framing
3. "Connect X platform for deeper visibility into Y" → growth suggestion

**Evidence labels per recommendation:**
- "Based on your data" — links to specific execution stats, node config, workflow inventory
- "Based on industry patterns" — general knowledge, labeled as such
- "Based on AI analysis" — LLM inference, labeled with reasoning

---

## 10. LLM Architecture

*(Rounds 4, 9, 10)*

### Per-Automation Enrichment (extend existing call)

Extend the current per-automation LLM prompt with additional fields:

| New field | Description |
|-----------|-------------|
| `stepName` | Position label in process (e.g., "Winner Notification") |
| `businessBrief` | One-sentence business context |
| `timeSavingsEstimate` | Range with reasoning |
| `revenueImpactEstimate` | Range with reasoning, or "N/A — not revenue-adjacent" |
| `failureImpact` | What breaks if this fails |
| `dataIn` / `dataOut` | Input/output data description |

**Critical: deductive system reasoning.** The per-automation call receives the full workflow JSON including node parameters — field mappings, email templates, API endpoints, credential types, trigger configurations. The prompt MUST instruct the LLM to reason deductively about what must be true in each connected system for this workflow to function. Examples:
- A Google Sheets trigger polling a "winners" sheet → a lottery draw must have happened upstream, producing winner records
- An email template with a 24-hour purchase CTA → there's a time-limited purchase window, and no reminder workflow exists
- A Claude node classifying into 6 support categories → the company has structured customer support with those category types

This deductive depth must be reflected in `businessBrief`, `failureImpact`, and `businessContext` — not kept shallow. The per-automation summaries are the ONLY input to workspace-level analysis (Call 1 and Call 2). If the per-automation output is shallow ("sends data from Sheets to Gmail"), workspace-level analysis cannot recover the depth. The quality of every downstream insight depends on per-automation richness.

The prompt anti-pattern: "Do NOT describe the workflow mechanically ('triggers on new row, sends email'). DO describe what the workflow means for the business ('when a lottery winner is selected, this workflow is the revenue conversion trigger — it notifies the winner to purchase within 24 hours')."

**Per-automation calls are independent and parallel.** Each workflow is analyzed in isolation — one call per workflow, all calls can run simultaneously. This is an architectural decision, not just a performance optimization: per-automation analysis must NOT depend on other workflows' results. Cross-workflow patterns (duplication, shared dependencies, gaps) are the job of workspace-level Call 1, which sees all summaries together. Mixing these concerns would make per-automation calls order-dependent and harder to debug.

### Workspace-Level Analysis (two-call strategy)

**Call 1: "Understand"**
- Input: all per-workflow summaries (not full JSONs) + credentials list + execution stats + user/project data
- Output: process clustering, system landscape with narratives, connected automation links, process-level metrics
- Prompt: business analyst persona, XML-tagged sections, chain-of-thought before structured output

**Critical: cross-workflow pattern detection.** Call 1 sees the full collection of workflows together — this is the Celonis-equivalent step. The prompt MUST instruct the LLM to analyze patterns across the collection, not just summarize each workflow independently. Specific analytical behaviors to mandate:

- **Duplication and fragmentation:** Multiple workflows doing the same thing (3 LotteryWin versions). Which is canonical? Are they intentional variants or drift?
- **Shared dependency risks:** Which systems are touched by many workflows? One credential or system going down affects how many processes? (Gmail as single point of failure for ALL communication.)
- **Cross-referencing data with inventory:** One workflow's output categories (e.g., support classifier's "Payment/Billing" category) implies a domain that has NO corresponding workflow → proves a gap from the company's own data, not from LLM imagination.
- **Execution anomalies across workflows:** Error clusters, inactive workflows that should be active, active workflows with high failure rates, naming that contradicts status ("Published" but never activated).
- **Completeness of process chains:** If a workflow sends a winner notification with a 24-hour purchase CTA, there should be a reminder workflow and a confirmation workflow. The absence is a finding.

This is the analytical step that produces Expliq's most valuable insights — the ones no human looking at individual workflows would articulate. Without it, the output is 8 good individual analyses and a generic synthesis. With it, the output is landscape intelligence.

**Call 2: "Advise"**
- Input: Call 1 output + per-workflow summaries
- Output: recommendations (Act Now / Investigate / Explore), process suggestions, "Your next move" synthesis, visibility expansions
- Prompt: business opportunity consultant persona, few-shot example, anti-patterns, schema-first with field descriptions

### Prompt Design Principles

*(Round 10)*

1. **System prompt with XML tags** — `<role>`, `<instructions>`, `<output_format>`, `<anti_patterns>`
2. **Prefilled JSON response** — start assistant response with opening of expected structure
3. **Chain-of-thought scratchpad** — reason in `<analysis>` tags before producing structured output
4. **Schema-first** — define JSON schema with field descriptions as instructions
5. **Named confidence levels with criteria** — not numeric scores
6. **One few-shot example** — from a DIFFERENT domain, showing target quality
7. **Anti-patterns explicit** — "Do NOT lead with governance. Do NOT recommend platform-level code. Do NOT estimate without reasoning."
8. **Consistent rules across the entire chain** — The confidence framework (Data-driven / Benchmark-based / AI-suggested), anti-patterns, and honest framing rules apply to ALL calls in the chain — per-automation, Call 1, and Call 2. If per-automation calls label a `timeSavingsEstimate` as "Data-driven" using different criteria than Call 2 uses for recommendation confidence, the user sees inconsistent signals. One calibration, applied everywhere.

### Scalability Guidance

**Token budget:** Workspace-level calls must consume only per-automation summary fields (`businessBrief`, `stepName`, `failureImpact`, etc.) — never raw workflow JSON. Execution stats should be pre-aggregated to `runsPerWeek` + `errorRate` per automation during sync. Credentials/users/tags: pass names and types only, not full objects.

**Caching:** CompanyProfile has `analyzedAt`. The sync pipeline should skip workspace-level LLM calls when the automation landscape hasn't changed. Recommended approach: hash all automation summary fields, store on CompanyProfile, compare on re-sync. Same hash → reuse existing analysis. Different hash → re-run LLM calls.

**Progressive loading:** If workspace-level LLM calls take time (10-30s+), the per-automation data is already available. Dashboard and Detail pages can render with per-automation data while workspace-level analysis (processes, recommendations, "Your Next Move") loads in the background. Track analysis progress via a status field on CompanyProfile (`pending | understanding | advising | complete | failed`).

### Research Spike (Phase 0) — COMPLETE

Before coding: test prompts against real fairtix data. Iterate until one-shot output quality matches the ANALYSIS-FINAL.md standard. Document proven prompts.

**Completed 2026-04-04.** Full results in [`specs/research-spike.md`](../specs/research-spike.md). Eight prompt versions tested (v1–v8). Final architecture: two LLM calls (per-automation parallel + single workspace), simple prompts, full data. See Amendments N–S for decisions derived from the spike.

---

## 11. n8n API Scope

*(From n8n-api-findings.md)*

### Two-phase sync: Discover → Sync + Analyze

The sync pipeline is split into two user-facing phases. This allows the user to understand what's in their n8n instance before committing to a full analysis — important for instances with mixed-purpose workflows (e.g., shared bootcamp instances, multi-team setups).

**Phase 1: Discover** (triggered by "Verify Connection" on Settings page)

Lightweight calls that run immediately after the user enters URL + API key:

| # | Endpoint | Purpose | Priority |
|---|----------|---------|----------|
| 1 | `GET /discover` | Feature detection — what does this instance support? | Required (call first) |
| 2 | `GET /tags` | Available tags for filtering | Required |
| 3 | `GET /workflows` | Workflow list (names, tags, active status — used for tag preview, not full analysis) | Required |

After Phase 1, the Settings page shows:
- Connection status (verified)
- Instance overview: "68 workflows found"
- Tag selection: checkboxes for each tag with workflow count and name preview. E.g., "Reference (9): Welcome Email, LotteryWin Notification, Support Classifier, ..." Default: all selected. Untagged workflows shown as "Untagged (X)".
- The user selects which tags to include and clicks "Sync & Analyze"

**Phase 2: Sync + Analyze** (triggered by "Sync & Analyze" button)

Full sync for selected workflows only, followed by LLM analysis:

| # | Endpoint | Purpose | Priority |
|---|----------|---------|----------|
| 1 | `GET /workflows?tags=X` | Full workflow definitions (filtered by selected tags) | Required |
| 2 | `GET /executions?workflowId=X` per workflow | Execution stats (runs, errors, timing) | Required |
| 3 | `GET /credentials` | Verified system inventory | If permitted (may 403) |
| 4 | `GET /users` | Ownership data | If permitted |
| 5 | `GET /projects` | Team structure | If permitted |
| 6 | `GET /variables` | Environment context | If permitted |
| 7 | `POST /workflows` + `POST /workflows/{id}/activate` | Deploy recommended workflows | Required for deploy feature |

The tag selection is stored on ConnectorConfig so re-syncs use the same filter. The user can change the selection at any time on Settings and re-sync.

**Execution fetch depth:** Cap at 250 executions per workflow (newest-first). Aggregate to `runsPerWeek`, `errorRate`, `lastExecutedAt`, `avgDurationMs` on the Automation model at sync time. These aggregates feed the LLM and the UI — raw execution records are not stored. For workflows with 0 executions, execution-derived metrics are null and the LLM estimates instead (labeled "AI-suggested," not "Data-driven").

### Key data extracted from workflow JSON

| Field | Business value |
|-------|---------------|
| `nodes[].type` | System identification (deterministic) |
| `nodes[].parameters` | THE richest source — actual business config, field mappings, URLs, channels |
| `nodes[].credentials` | Which system each node connects to |
| `nodes[].retryOnFail` / `onError` | Error handling quality |
| `nodes[].disabled` | Dead code detection |
| `nodes[].notes` | User documentation — free LLM context |
| `settings.errorWorkflow` | Deterministic connected-automation link |
| `settings.callerIds` | Sub-workflow dependency graph |
| `settings.timeSavedPerExecution` | User-estimated ROI (in minutes) |
| `connections` | Workflow execution graph |
| `tags` | Process clustering hints |
| `shared[].project` | Team/project ownership |

Full schemas in `n8n-api-examples/`.

---

## 12. Schema Changes

*(Round 4)*

### New fields on Automation model

`stepName`, `processId` (FK), `businessBrief`, `timeSavingsEstimate`, `revenueImpactEstimate`, `failureImpact`, `dataIn`, `dataOut`, `runsPerWeek` (real from executions or estimated), `errorRate` (real from executions), `upstreamIds` (String[]), `downstreamIds` (String[])

### New Prisma models

| Model | Purpose |
|-------|---------|
| **BusinessProcess** | Groups automations. Fields: id, workspaceId, name, summary, maturityLevel, order, createdAt |
| **Recommendation** | Suggested new workflow, fix, or platform connection. Fields: id, workspaceId, processId (FK to BusinessProcess), processSuggestionId (FK to ProcessSuggestion, nullable — set when this recommendation belongs to a suggested process instead of an existing one), type (new_workflow / technical_fix / platform_connection), stepName, name, brief, businessCase, evidence (Json), confidence, tier, implementationNotes, suggestedPlatform, systemSource, systemDestination, deployableJson (Json), priorityOrder, createdAt |
| **ProcessSuggestion** | Entirely new recommended process (container for child Recommendations). Fields: id, workspaceId, name, description, basedOn, businessCase, connectedSystems (String[]), createdAt. Has child Recommendations via `processSuggestionId` (one-to-many). A Recommendation belongs to EITHER a BusinessProcess (via processId) OR a ProcessSuggestion (via processSuggestionId), never both. |
| **CompanyProfile** | Workspace-level analysis cache + delta tracking. Fields: id, workspaceId, systemLandscape (Json), nextMoveText, nextMoveReasoning, processMetrics (Json), benchmarks (Json), insights (Json), analyzedAt, previousSnapshot (Json — see below), deltaSummary (String — human-readable banner text, null on first sync) |

**CompanyProfile.previousSnapshot schema** (captured before each re-analysis):
```json
{
  "analyzedAt": "DateTime",
  "automationCount": "number",
  "activeCount": "number",
  "automations": [{ "id": "string", "name": "string", "errorRate": "number|null", "isActive": "boolean", "runsPerWeek": "number|null", "updatedAt": "DateTime" }],
  "recommendationCount": "number",
  "recommendations": [{ "id": "string", "name": "string", "type": "string", "tier": "string" }],
  "processCount": "number"
}
```
On first sync, `previousSnapshot` is null. On re-sync, the sync pipeline serializes the current state into `previousSnapshot` before overwriting with new analysis results. The `deltaSummary` is generated by diffing current vs. previous after the new analysis completes.

---

## 13. Scope Cuts

**Not building:**
- Governance toggle / governance view (eliminated — unified insight view)
- Technical improvements as a separate feature (technical fixes are just recommendations)
- Editable process names
- Full filter system (search only)
- Sort by revenue
- Workflow node visualization
- Company profile inference (industry, size, stage) — unless certainly derivable
- Mobile responsiveness
- Separate Automation Intelligence page (merged into Dashboard)
- Version history / change tracking
- Multi-platform connectors beyond n8n (future)

**Building but not polishing:**
- Settings page UX (lowest priority epic)
- Login page polish (lowest priority)

---

## 14. What Stays from Current MVP

**Keep as-is:**
- Auth system (Auth.js, sessions, middleware)
- n8n connector foundation (n8n-client.ts — will be extended with new endpoints)
- Prisma setup (schema extended, not replaced)
- LLM pipeline foundation (llm-pipeline.ts — will be massively extended)
- Risk engine (governance dots derive from it)
- Encryption (for connector credentials)
- Test infrastructure (vitest config, seed scripts)
- Settings page (n8n connector config + sync)
- Login/signup pages
- (app)/layout.tsx shell with sidebar (nav items change)

**Replace:**
- Dashboard page (complete rewrite as executive summary)
- Portfolio/automations page (replaced by Process Map)
- Automation detail page (rewrite as business-first with evidence)
- All page-specific types and utilities (snapshot-metrics, portfolio-filters, etc.)

---

## 15. Design System

Designed for an advisory/intelligence product, not a consumer SaaS app. Visual language inspired by Celonis (process intelligence), Linear (modern product), and McKinsey (authoritative presentation). The mood: **confident, restrained, data-forward.**

### Visual Theme

**Dark mode by default.** Single theme, no toggle. Dark backgrounds make data pop and convey seriousness. Advisory tools are dark (Celonis, Bloomberg, Linear dark mode).

| Element | Value | Rationale |
|---------|-------|-----------|
| **Background** | Near-black (#0a0a0a to #171717) | Data pops on dark. Conveys authority. |
| **Surface** | Dark gray (#1c1c1c to #262626) | Cards/sections slightly lighter than background for depth |
| **Text primary** | White (#ffffff) or near-white (#f5f5f5) | High contrast. Confident. Headlines. |
| **Text secondary** | Light gray (#a3a3a3) | Labels, metadata, secondary info |
| **Text tertiary** | Medium gray (#737373) | Timestamps, footnotes |
| **Accent** | Deeper teal (#0d9488) or sky-teal (#0ea5e9) | Used SPARINGLY — only for: interactive elements, positive signals, opportunity indicators. NOT for backgrounds or large areas. |
| **Healthy/positive** | Green (#22c55e) | Status dot, coverage bar fill, positive metrics |
| **Attention/warning** | Amber (#f59e0b) | Status dot, investigate-tier badges |
| **Critical/error** | Red (#ef4444) | Status dot, error rates, act-now tier accents |
| **Inactive/neutral** | Gray (#525252) | Inactive status, disabled elements |

**Color usage rule:** Color = meaning only. No decorative color. If something is teal, it means "interactive" or "opportunity." If something is red, it means "problem." Gray is the default; color is the exception.

### Typography

| Role | Style | Usage |
|------|-------|-------|
| **Page title** | 24-28px, semibold/bold | "Dashboard", "Process Map" — one per page |
| **Section header** | 11px, uppercase, tracking-wider, semibold, secondary color | "YOUR NEXT MOVE", "ACT NOW", "PROCESS COVERAGE" |
| **Row/item title** | 13-14px, medium weight | Process names, workflow names, recommendation titles |
| **Body text** | 12-13px, regular | Business narratives, briefs, descriptions |
| **Metrics/numbers** | Monospace (font-mono), semibold | All numbers, percentages, counts. Monospace aligns digits in columns. |
| **Badges/labels** | 9-10px, monospace, uppercase | Confidence labels, status labels, tier names |
| **Evidence/tertiary** | 10-11px, secondary color | Timestamps, methodology notes, "how we know this" |

**Hierarchy rule:** Headlines are bold and white. Body is regular and light gray. Numbers are always monospace. Every level of the hierarchy is visually distinct — you can blur your eyes and still see the structure.

### Component Patterns

**Tables/lists for data, NOT cards.**

Advisory products use aligned rows for comparable data. Cards create visual boundaries that separate items — analysis requires comparison.

| Context | Pattern | Why |
|---------|---------|-----|
| Process list (Process Map) | **Collapsible rows** — process header expands to show workflow rows inside | Scan process metrics vertically. Compare coverage across processes. |
| Workflow list (inside process) | **Table rows** — aligned columns (name, status, system flow, impact) | Scan any column independently. Compare workflows within a process. |
| Recommendation list (Priorities) | **Table rows grouped by tier header** — each row: title, impact, confidence badge, scope, action button | Scan recommendations, compare impact, act on any row. |
| Recommendation detail | **Slide-over panel** — triggered from row click | Full business case without leaving the list context. |
| Dashboard sections | **Sections/banners** — "Your Next Move" is a banner, not a card. Facts bar is a single row. Attention/Opportunities are compact lists. | Dashboard widgets are summary, not comparison. Sections work. |
| Detail page | **Scrollable sections** — narrative, business case (3-column section), process position, connections, evidence | One item, full depth. Sections flow naturally. No cards needed. |

**When cards ARE appropriate:** Only for Dashboard summary widgets (facts bar, process coverage) where each widget shows DIFFERENT information that doesn't need cross-comparison.

**Row anatomy for workflows/recommendations:**
```
[status dot] [name + step]          [system flow]      [impact badge] [confidence] [action]
     ●       Winner Notification     Sheets → Gmail     Critical       Data-driven   →
     ○       Winner Published        Sheets → Gmail     inactive       —             →
     ┈       Lottery-Loss Notify     Sheets → Gmail     High           Data-driven   [Deploy ▶]
```

Aligned columns. Color only on the status dot and badges. Clean horizontal lines or subtle borders between rows. No card chrome.

**Confidence visual pattern:**
- **Data-driven (Act Now):** Solid left border accent color + solid badge
- **Benchmark-based (Investigate):** Dashed left border + dashed badge outline
- **AI-suggested (Explore):** No left border + subtle badge outline

The visual weight decreases with confidence. You FEEL which recommendations are certain vs uncertain.

### Sidebar

Dark (#0a0a0a). Nav items:
- Dashboard (home icon)
- Process Map (layers/map icon)
- Priorities (target/flag icon)
- Settings (gear icon)

Active item: accent color text + subtle accent background. Inactive: secondary gray text.

Expliq logo at top. "Synced X ago" or "Not synced" at bottom.

### Loading & Sync States

**First visit (no data):** Empty state on Dashboard: "Connect your n8n instance in Settings to get started." Single CTA button.

**After connection verified (Phase 1 complete):** Settings page shows instance overview with tag selection. Dashboard still shows empty state until the user runs a full sync.

**During sync (Phase 2):** Progress steps visible: "Fetching workflows... Fetching execution data... Analyzing workflows... Clustering processes... Generating recommendations..." Each step shows a check when complete. This is important for the demo — the audience sees the intelligence being built in real time.

**During LLM analysis:** If the workspace-level LLM calls take time (10-30s), show a skeleton of the Dashboard/Process Map with a "Analyzing your automation landscape..." overlay. Not a spinner — a message that communicates what's happening.

**After sync with data:** Pages populate. If this is a re-sync, the delta banner appears at the top of the Dashboard with a summary of changes (see section 3, Delta Banner).

### Figma Reference (what to use from the prototype)

**Figma Make file** `3bG7mlpucVffGMdoAFPcgc` — use for:
- Component CODE as starting point (adapt to dark theme + table/list patterns): DeployModal, StatusDot, SystemFlow, ExpliqBadge
- Layout patterns: sidebar structure, collapsible section mechanics
- Spacing conventions (adapt to darker, more spacious layout)

**Do NOT use Figma for:** color palette (superseded by dark advisory theme), card-based layouts (superseded by table/list patterns), screen structure (superseded by 4-screen architecture), information density (superseded by consulting-grade layouts).

### How to Combine Figma Components with Design Decisions

The Figma prototype has React + Tailwind component code. This section tells the dev team exactly how to adapt it.

**Step 1: Read the Figma component** via MCP (`ReadMcpResourceTool`). Understand the MECHANICS — what props it takes, what state it manages, what interactions it supports (expand/collapse, click, hover).

**Step 2: Ignore the Figma styling.** Strip all color classes (`bg-[#14b8a6]`, `text-[#737373]`, `border-[#e5e5e5]`), card wrappers (`rounded-md border shadow`), and light-theme assumptions (`bg-white`, `bg-[#fafafa]`).

**Step 3: Apply the design system from this document (section 15).**
- Replace light backgrounds with dark (`bg-[#0a0a0a]`, `bg-[#1c1c1c]`)
- Replace dark text with light (`text-white`, `text-[#a3a3a3]`)
- Replace teal with the deeper accent (`text-[#0d9488]`) and use SPARINGLY
- Replace card wrappers with table rows / list items (subtle `border-b border-[#262626]` between rows, no card borders/shadows)
- Apply the typography hierarchy: headlines bold + white, body regular + light gray, numbers monospace

**Step 4: Restructure if needed.** Some Figma components are cards that should become table rows. The WorkflowCard component becomes a WorkflowRow. The RecommendationCard becomes a RecommendationRow. The PROPS stay similar (name, brief, impact, status) but the LAYOUT changes from stacked-in-a-box to aligned-in-columns.

**Concrete example — Figma WorkflowCard → Expliq WorkflowRow:**

Figma WorkflowCard (light theme, card layout):
```tsx
<div className="rounded-md border border-[#e5e5e5] bg-white px-3 py-2.5">
  <div className="text-[12px] text-[#404040]">{workflow.name}</div>
  <div className="text-[10px] text-[#a3a3a3]">{workflow.brief}</div>
  <div className="flex gap-2 mt-1">
    <Badge>{workflow.impact}</Badge>
    <SystemFlow systems={...} />
  </div>
</div>
```

Expliq WorkflowRow (dark theme, table row):
```tsx
<div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#262626] hover:bg-[#1c1c1c] transition">
  <StatusDot status={workflow.governance} />
  <span className="text-[13px] text-white w-64 truncate">{workflow.name}</span>
  <span className="text-[11px] text-[#a3a3a3] flex-1 truncate">{workflow.brief}</span>
  <SystemFlow systems={...} />
  <Badge variant={workflow.impact}>{workflow.impact}</Badge>
  <ChevronRight className="w-3.5 h-3.5 text-[#525252]" />
</div>
```

Same data. Same props. Different layout: horizontal row with aligned columns instead of vertical card with stacked content. Dark background. High-contrast text. Color only on the status dot and impact badge.

**Components to KEEP from Figma (adapt styling):**
- `DeployModal` — modal mechanics (open/close, JSON preview, copy button, deploy action). Restyle to dark theme.
- `StatusDot` — small, already minimal. Change colors to match design system palette.
- `SystemFlow` — the `source → destination` display. Keep mechanics, restyle.
- `ExpliqBadge` — badge component. Adapt to solid/dashed/outline confidence pattern.
- Collapsible section mechanics — the expand/collapse pattern from process groups.

**Components to REBUILD (Figma layout doesn't apply):**
- `WorkflowCard` → `WorkflowRow` (card → table row)
- `RecommendedWorkflowCard` → `RecommendationRow` (card → table row with dashed left border)
- `ProcessGroup` header → `ProcessRow` (collapsible row with metrics in aligned columns)
- All page layouts (Dashboard, Workflows, Roadmap → new page structures per section 2-6)

**The rule for the dev team:** Read Figma for WHAT the component does. Read this document for HOW it looks.

---

## 16. Suggested Epic Sequence

| Phase | Epic | What it does |
|-------|------|-------------|
| 0 | Research spike | Test LLM prompts against fairtix data. Iterate until one-shot quality. Not a formal epic. |
| 1 (parallel) | Epic 10: LLM Pipeline V2 + Schema + n8n API | Extended sync (all API endpoints), new Prisma models, per-automation enrichment, workspace-level LLM (2-call), deploy endpoint |
| 1 (parallel) | Epic 11: Design System + Layout | Figma palette (dark mode), sidebar nav, shared components, login polish |
| 2 | Epic 12: Dashboard | Your next move, facts, attention/opportunities, process coverage, systems compact |
| 2 | Epic 13: Process Map | Process cards, expand for workflows, show-gaps toggle, search |
| 2 | Epic 14: Priorities | Recommendation tiers, cards, slide-over panels, deploy modal |
| 2 | Epic 15: Detail | Business narrative, business case, process position, connections, evidence |
| 3 | Epic 16: Settings + Auth Polish | Loading states, explanations, password hints |

Epics 12-15 can be parallelized after 10+11 complete.

---

## Amendments from Research Spike (2026-04-04)

> Findings from Phase 0 research spike and subsequent framework research.
> These amend sections 9 and 10 above. Original text is unchanged — these are additions and corrections.
> Supporting research: automation assessment frameworks (UiPath, FMEA, Gartner TIME), process mining (van der Aalst), business capability mapping (TOGAF), LLM prompt research (meta-prompting, JSON field ordering, F-CoT, LLM-RUBRIC).

### Amendment A: Impact assessment rubric (amends §9)

Section 9 defines rubric criteria for **confidence** (data-driven / benchmark-based / ai-suggested) but not for **impact** (critical / high / medium / low). Without explicit criteria, the LLM applies inconsistent thresholds. Research (LLM-RUBRIC, ACL 2024) shows explicit per-level rubrics produce more consistent classification.

**Add to §9 — Impact classification rubric:**

| Level | Criteria | Examples |
|-------|----------|---------|
| Critical | Directly revenue-generating OR blocks customer journey with no fallback OR single point of failure for multiple processes | Payment processing, order confirmation, the only error handler |
| High | Customer-facing with degraded experience on failure OR supports a critical workflow's data pipeline OR affects multiple business processes | Support classification, lead routing, data sync feeding a critical workflow |
| Medium | Internal operations OR single-process scope OR has manual fallback that works at current scale | Internal reporting, single-team notifications, workflows with documented manual procedures |
| Low | Utility/tooling OR development/test OR no downstream consumers | Test workflows, one-off data migrations, prototype automations |

The LLM must assess reasoning BEFORE classification. See Amendment B.

### Amendment B: JSON field ordering — reasoning before classification (amends §10)

Research demonstrates that when a JSON schema places a classification field (e.g., `"level"`) before its reasoning field, the LLM picks the classification first and rationalizes afterward — producing shallower reasoning and less accurate classification.

**Rule: In every output schema, reasoning/analysis fields MUST precede classification/conclusion fields.**

Applies to all three prompts:
- `impactProposal`: change from `{ level, reasoning }` to `{ reasoning, level }`
- Recommendation `tier`: ensure `fullBusinessCase` and `evidenceChain` precede `tier` in the schema
- Any future classification: reasoning first, label second

### Amendment C: Detectability dimension (amends §10, per-automation)

The current assessment covers impact and confidence but not **detectability** — how likely is a failure to be noticed before it causes business harm? This is the third dimension from FMEA (Failure Mode and Effects Analysis): Risk = Severity × Occurrence × Detection.

**Add to per-automation output schema:**

```
"detectability": {
  "reasoning": "How would the team learn about a failure? Error workflow linked? Monitoring? Customer complaint?",
  "level": "monitored | partially-monitored | silent",
  "evidence": "Specific evidence: error workflow ID, alerting config, or absence thereof"
}
```

Criteria:
- **monitored**: Error workflow linked AND error workflow is active AND has acceptable reliability (>90%)
- **partially-monitored**: Error workflow linked but inactive, or error workflow has high failure rate, or manual checks exist
- **silent**: No error workflow, no monitoring, no retry logic — failures are invisible until business impact surfaces

This directly feeds recommendation priority: a critical workflow that fails silently is more urgent than a critical workflow whose failures are caught.

### Amendment D: Analytical methods, not pattern checklists (amends §10, Call 1)

Section 10 lists five analytical behaviors for Call 1 (duplication, shared risks, cross-referencing, anomalies, completeness). The research spike revealed these are effective as **pattern labels** but not as **reasoning methods**. When presented as a checklist, the LLM looks for the named patterns but misses structurally similar patterns not on the list (e.g., inverse outcome gaps). When presented as methods, the LLM applies the procedure and discovers whatever patterns exist — including ones the prompt author didn't anticipate.

**Replace the five bullet points in §10 Call 1 with these reasoning methods:**

1. **Capability enumeration**: "For each business function you can identify from the workflow data, enumerate all automations that serve it. When multiple automations serve the same function, assess whether this is intentional (variants, A/B tests) or drift (duplicates, abandoned versions)."

2. **Dependency graph construction**: "For each external system referenced in the automation data, count how many processes depend on it and through which credential. Assess what breaks if that system or credential becomes unavailable. Note systems that are touched by >50% of workflows."

3. **Domain-coverage verification**: "For each data type, business term, support category, CTA, and domain referenced anywhere in the automation data, check whether a corresponding automation or process exists. The automation data itself proves these domains are real — their absence from the workflow inventory is a verified gap, not speculation."

4. **Operational coherence check**: "For each automation, compare its declared status (active/inactive) against its execution patterns (frequency, recency, error rate) and its business importance (as assessed in per-automation analysis). Flag contradictions: important workflows that are inactive, active workflows with no recent executions, high-iteration-count workflows that were never deployed."

5. **Lifecycle completeness trace**: "For each business process, trace the full lifecycle from the initiating event to the final outcome. For each step in the lifecycle, check whether an automation handles it. Note every unhandled step — including inverse outcomes (if winners are notified, are non-winners?), follow-ups (if a CTA has a deadline, is there a reminder?), and confirmations (if an action is requested, is completion acknowledged?)."

These methods produce the same findings as the current checklist (duplication, SPOFs, gaps, anomalies, chain completeness) but also discover patterns the checklist doesn't name. The LLM applies the method to whatever data it receives — no domain-specific foreknowledge required.

### Amendment E: Pre-structured per-automation input (amends §10, per-automation)

Section 10 specifies pre-structuring for workspace calls ("summaries only, not raw JSON") but sends raw workflow JSON to the per-automation call. Research (Focused Chain-of-Thought) shows that pre-structuring inputs improves reasoning quality and reduces token usage.

**Add to §10 per-automation:**

Before sending to the LLM, extract these structural features from the workflow JSON programmatically:

```
{
  "structuralFeatures": {
    "nodeCount": number (excluding sticky notes),
    "nodeTypes": ["list of unique node type identifiers"],
    "branchCount": number (connection paths that diverge),
    "hasErrorTrigger": boolean,
    "errorWorkflowId": string | null,
    "retryOnFailNodes": ["list of node names where retryOnFail is explicitly true"],
    "noRetryNodes": ["list of customer-facing/data-writing node names where retryOnFail is false or absent"],
    "credentialNames": ["list of credential name + type pairs"],
    "disabledNodes": ["list of disabled node names"],
    "systemsDetected": ["list of external systems from node types"],
    "triggerType": "webhook | schedule | manual | error | polling",
    "triggerConfig": "interval or mechanism detail",
    "callerIds": string[] | null,
    "timeSavedPerExecution": number | null
  }
}
```

Send this alongside the full workflow JSON. The structural features serve as a **reading guide** — the LLM knows what to pay attention to before parsing the raw JSON. This reduces the chance of missing default behaviors (like absent retryOnFail) and makes the analysis more systematic.

Note: the full workflow JSON is still sent because node parameters (email templates, API configurations, AI prompts) contain the richest business context and cannot be extracted programmatically. The structural features complement, not replace, the raw JSON.

### Amendment F: `<analysis>` tags replaced by reasoning JSON field (amends §10, Prompt Design Principles)

Prompt design principle #3 specifies "Chain-of-thought scratchpad — reason in `<analysis>` tags before producing structured output." The research spike discovered this conflicts with `response_format: { type: "json_object" }`, which requires the entire response to be valid JSON.

**Amend principle #3:** Replace `<analysis>` tags with a `"reasoning"` field at the top of the JSON output schema. The LLM writes its chain-of-thought analysis as the first field, then produces the structured data fields. This preserves chain-of-thought benefits while maintaining JSON compatibility.

Schema pattern:
```json
{
  "reasoning": "Step-by-step analysis before producing structured output...",
  "processes": [...],
  "recommendations": [...]
}
```

### Amendment G: Few-shot example must NOT be from the test dataset (amends §10, Prompt Design Principles)

Prompt design principle #6 specifies "One few-shot example — from a DIFFERENT domain." The research spike revealed the risk of test-set leakage: when prompt examples or instructions are derived from the test data (FairTix), improvements appear to generalize but actually overfit.

**Strengthen principle #6:** The few-shot example MUST be from a domain unrelated to any test or demo data. If FairTix (ticketing) is the test data, the example should be from a completely different industry (e.g., SaaS onboarding, e-commerce fulfillment, HR operations). The example demonstrates the TARGET REASONING QUALITY AND DEPTH, not the specific patterns to find.

Additionally: analytical instructions in the prompt (Amendment D methods) must be domain-agnostic. If an instruction only makes sense when you know the test dataset, it's overfitting — rephrase as a general method.

### Amendment H: Two-phase enumerate-then-evaluate (amends §10, Call 1)

> From research spike v4 (2026-04-04). Based on Decomposed Prompting (Khot et al., ICLR 2023) and Chain of Verification (Dhuliawala et al., ACL 2024).

Amendment D replaced the five analytical behaviors with reasoning methods. The research spike revealed these methods work but are applied **incompletely** — the LLM follows one reasoning thread deeply (depth-first) instead of enumerating all possibilities first (breadth-first). This causes it to check some domains but not all, trace some lifecycle paths but not all.

**Structural fix: every analytical method must have two mandatory phases.**

Phase A (Census): Produce a complete, numbered inventory of items to analyze. No analysis yet — just enumeration.

Phase B (Analysis): For each numbered item in the census, produce a verdict. Every item must receive a verdict — no skipping.

The numbered census creates a contract: item 1 gets a verdict, item 2 gets a verdict, etc. The LLM's autoregressive nature works in our favor — once the pattern starts, it continues through the entire list.

This applies to all five methods from Amendment D. Methods 3 (domain-coverage) and 5 (lifecycle completeness) benefit most.

### Amendment I: State machine framing for lifecycle trace (amends §10, Call 1, Method 5)

> From research spike v4. Based on SMoT (Liu & Shuai, 2023) and classical CS completeness checking.

Amendment D's Method 5 (lifecycle completeness trace) says to "trace the full lifecycle from initiating event to final outcome." The research spike proved this traces the primary path but misses complementary outcomes (e.g., lottery winners are notified, but non-winners are not).

**Replace Method 5 with a three-phase state machine approach:**

Phase A — PARTICIPANT CENSUS: For each business process, identify ALL participants and stakeholders — including those who receive outcomes AND those who receive non-outcomes (rejected applicants, unselected candidates, denied requests, unsuccessful participants). List every participant role.

Phase B — STATE MACHINE: Model each process as a state machine. Define all states a participant can be in. For each state, define ALL possible transitions (not just the happy path). For each transition, check whether an automation handles it. A participant who enters the process but reaches no defined terminal state is a SILENT DROP-OFF — a high-priority gap.

Phase C — COMPLEMENTARY OUTCOME CHECK: For every automated outcome, ask: "What happens to participants who did NOT receive this outcome?" If no automation handles the complementary case, mark as gap.

This discovers complementary outcome gaps (like non-winner notifications) structurally, because state machines require defined transitions for ALL inputs, not just the primary path.

### Amendment J: Taxonomy pre-extraction (amends §10, Call 1 input preprocessing)

> From research spike v4. Based on Focused Chain-of-Thought (Ren et al., 2025) and SELLM taxonomy scaffolding (Nature Communications Materials, 2025).

Amendment E specified pre-extracting structural features from workflow JSON. Extend this to also extract **categorical taxonomies** — enumerated value lists that the business has defined within its own automation data.

Sources to extract from programmatically:
- Structured output parser schemas with JSON enum values (e.g., support classifier categories)
- Switch/router node conditions and case values
- AI prompt nodes containing explicitly defined category lists

These taxonomies are the business's own MECE partitions. When injected into the Call 1 user message as completeness constraints ("Your domain-coverage verification must produce a verdict for EVERY value in EVERY taxonomy"), they make enumeration deterministic — the LLM can't skip categories because the categories are explicitly listed and counted.

This moves the unreliable part (enumeration) from the LLM to deterministic preprocessing, while leaving the valuable part (analysis and gap reasoning) to the LLM.

### Amendment K: Completeness verification step (amends §10, Call 1)

> From research spike v4. Based on Chain of Verification factored variant (Dhuliawala et al., Meta, ACL Findings 2024).

After all five analytical methods, Call 1 must perform a mandatory completeness self-check:

A. **Census reconciliation**: Count total items in each Phase A census. Count verdicts in each Phase B. If counts don't match, complete the missing verdicts.

B. **Complementary outcome audit**: For every automated workflow, state the population it serves. Then state the population it does NOT serve. If the non-served population has no automated outcome, add to findings.

C. **Taxonomy exhaustion check**: For every categorical list from the pre-extracted taxonomies, confirm every value received a coverage verdict. List checked and unchecked values.

This is structurally different from the analysis step — it asks the LLM to count and compare, not to reason. Counting is reliable. "I enumerated 6 categories but only checked 4" is a concrete failure the LLM can detect and correct.

### Amendment L: Call 2 gap-to-recommendation completeness (amends §10, Call 2)

Every gap identified by Call 1 (suggested processes, missing lifecycle steps, silent drop-offs, uncovered domains) must be addressed by at least one recommendation in Call 2. The landscape analysis is the input; the recommendations are the output. No identified gap should be left without a recommended action — even if that action is "connect platform X for visibility" at EXPLORE tier.

### Amendment M: Per-automation output schema consolidation (amends §10)

The v1 per-automation schema from the research spike had ~20 fields with significant overlap. The research spike v3/v4 consolidated to ~12 fields with deeper output per field:

| Consolidated field | Replaces |
|---|---|
| `businessNarrative` (3-5 sentences) | `description` + `businessBrief` + `businessContext` + `coreLogic` |
| `dataFlow` | `dataIn` + `dataOut` + `dataTypes` + `sideEffects` |
| `impact.reasoning` + `impact.level` + `impact.failureScenario` + `impact.revenueConnection` | `impactProposal` + `failureImpact` + `revenueImpactEstimate` |
| `detectability` (new) | Partially covered by `technicalEvidence.errorHandling` |

The consolidated schema produces deeper analysis per field because the model doesn't spread thin across 20+ targets. Adopt the consolidated schema for Epic 10.

### Amendment N: Two-call architecture replaces three-call (amends §10, supersedes Understand/Advise split)

> From research spike v8 (2026-04-04).

The PRD specified a two-call workspace strategy: Call 1 "Understand" (process clustering, system landscape) → Call 2 "Advise" (recommendations, next move). The research spike proved this split is unnecessary — a single workspace call produces both landscape analysis and recommendations with equal or better quality.

**Final LLM architecture: two calls total.**

1. **Per-automation call** (parallel, one per workflow) — produces Detail page data: businessNarrative, impact, detectability, timeSavingsEstimate, revenueImpactEstimate, technicalEvidence. Independent and parallelizable.

2. **Workspace call** (single) — receives per-automation summaries + full workflow JSONs + execution overview. Produces ALL workspace-level data in one response: processes, systemLandscape, connectedAutomations, crossWorkflowFindings, recommendations, processSuggestions, nextMove, visibilityExpansions.

The Understand/Advise split in §10 is superseded. Epic 10 implements two calls, not three.

### Amendment O: Simple prompts + full data (amends §10, supersedes Amendments D, H, I, J, K)

> From research spike v5-v8 (2026-04-04).

The research spike tested eight prompt versions (v1-v8). Versions 3-6 added increasingly elaborate methods: analytical method checklists (D), two-phase enumeration (H), state machine framing (I), taxonomy pre-extraction (J), completeness verification (K). Version 7-8 stripped ALL of these and used simple prompts with full data.

**Result: simple prompts + full data outperformed all elaborate method versions.**

v8 Sonnet with simple prompts produced 12 recommendations (matching the reference), with technically specific implementation notes (naming nodes, citing config values), novel findings no previous version discovered, and revenue estimates — all without rubrics, methods, structural preprocessing, or state machines.

The key insight: the model already knows how to analyze automation landscapes. Elaborate methods compensated for data starvation (compressed summaries instead of full JSONs), not analytical incapability. When given full data, simple prompts work better.

**For Epic 10:**
- Per-automation prompt: ~150 words. "Analyze this workflow. Understand what it means for the business." + output schema.
- Workspace prompt: ~250 words. "Understand the landscape, then find every opportunity. Be extensive and creative." + output schema.
- Pass full workflow JSONs to the workspace call — the technical specificity of recommendations depends on it.
- No rubrics, no methods, no structural preprocessing. Output schema IS the instruction.

**Amendments D, H, I, J, K are superseded.** They remain documented as research findings but are not implemented in Epic 10.

**Amendments that remain in effect:** A (impact rubric — keep in output schema as field description), B (reasoning-first field ordering), C (detectability dimension — keep in output schema), E (structural features — optional, not required), F (reasoning JSON field), G (no test-set leakage), L (gap-to-recommendation completeness — embedded in "be extensive" instruction), M (schema consolidation).

### Amendment P: Deployable JSON is a separate on-demand LLM call (amends §10)

> From research spike discussion (2026-04-04).

The PRD specifies that `new_workflow` recommendations have a Deploy button → deploy modal with n8n JSON preview. The Recommendation model has a `deployableJson (Json)` field.

**This is NOT produced during analysis.** Generating deployable n8n workflow JSON is a separate LLM call triggered on-demand when the user clicks Deploy. Reasons:

1. **Most recommendations are never deployed.** Generating JSON for all `new_workflow` recommendations during analysis wastes tokens and time.
2. **Deploy JSON needs the latest context.** By the time a user clicks Deploy, they may have made changes to their n8n instance. The generation call should use current state.
3. **Different skill.** Analysis requires business reasoning. JSON generation requires n8n schema knowledge. Mixing these in one prompt degrades both.

**Implementation for Epic 10:**
- Analysis pipeline produces recommendations WITHOUT `deployableJson`.
- Deploy button triggers a separate LLM call: input = recommendation details + connected systems + relevant workflow JSONs → output = valid n8n workflow JSON.
- `deployableJson` is populated on the Recommendation record only after the user requests it.
- This is a third LLM call type, but on-demand (not part of the sync pipeline).

### Amendment Q: Per-automation calls run in parallel (amends §10)

> From research spike (2026-04-04). Already stated in §10 but making the implementation explicit.

Per-automation calls are independent. Epic 10 must run them in parallel (`Promise.all()`), not sequentially. With 8 workflows at ~30s each: sequential = ~4 min, parallel = ~30-40s. This is the difference between acceptable and unacceptable sync UX.

The workspace call runs after all per-automation calls complete (it needs their outputs as input).

### Amendment R: Aggregate estimates on dashboard (amends §3, §10)

> From research spike discussion (2026-04-04).

The PRD Facts Bar shows "est. ~X hrs/wk (methodology →)" but doesn't specify how this aggregate is computed.

**Two-tier approach:**

1. **LLM-produced aggregates** — the workspace call should produce top-level aggregate estimates in its response: total estimated time savings across all automations, total value at risk from current gaps, total opportunity value from recommendations. These are qualitative summaries with reasoning ("Your automations save approximately X hrs/wk. Current reliability issues put €Y/month at risk.").

2. **Deterministic rollups** — per-recommendation savings and revenue can be summed/ranked programmatically from per-automation structured data. "Top 3 recommendations save an estimated €X/month" is computed from the `revenueImpactEstimate` and `timeSavingsEstimate` fields, not re-estimated by the LLM.

Add to workspace call output schema:
```json
"aggregateEstimates": {
  "totalTimeSavings": "Aggregate with reasoning",
  "totalValueAtRisk": "Aggregate with reasoning",
  "totalOpportunityValue": "Aggregate with reasoning"
}
```

### Amendment S: Model selection — Sonnet for production, Opus available (amends §10)

> From research spike v8 comparison (2026-04-04).

The research spike tested Claude Opus 4 and Claude Sonnet 4 across eight prompt versions. At v8 (simple prompts + full data):

- **Sonnet** produced 12 recommendations (matching reference), with technical specificity and revenue estimates. ~5x cheaper, ~2x faster than Opus.
- **Opus** produced 10 recommendations with deeper individual reasoning. Occasionally finds the non-winner gap that Sonnet misses.

**Decision: Sonnet for production default. Opus as configurable upgrade.**

For the demo and standard usage, Sonnet provides sufficient quality at manageable cost. The model is configurable via `OPENROUTER_MODEL` environment variable — switching to Opus requires no code change. If a customer needs deeper analysis or the product targets enterprise pricing, Opus is one setting away.

### Amendment T: Design spike — light theme + card-based layout (amends §15)

> From design spike (2026-04-05). Full results in [`specs/design-spike.md`](specs/design-spike.md).

Epic 12 implemented §15's dark advisory theme. After building Epic 13 (Dashboard) and reviewing with real data, the dark theme was rejected: text unreadable (9-11px body), no visual depth (flat sections), revenue/savings numbers invisible, "Your Next Move" was a paragraph instead of a structured card.

A design spike (5 iterations) tested light themes, card patterns, and fonts against reference dashboards (FlowDash, Fillow). The following decisions amend §15:

**Theme: Light replaces dark.**
- Background: light gray (#f5f5f7). Cards: white with subtle shadow + 12px rounded corners.
- Text: dark gray (#111827) headings, medium gray (#6b7280) secondary. Minimum body text: 15px.
- Accent teal (#0d9488), status green/amber/red — unchanged.
- Color = meaning only — unchanged.
- Reference: FlowDash, Fillow SaaS dashboard templates.

**Font: Plus Jakarta Sans replaces Geist.**
- Body: Plus Jakarta Sans (geometric, modern, wide characters, high readability).
- Numbers: JetBrains Mono (monospace, all metrics/counts/percentages).
- Geist Sans, Inter, and DM Sans were tested and rejected for insufficient readability.

**Card component system (amends Component Patterns in §15).**

§15 said "Tables/lists for data, NOT cards." This remains true for **Process Map** (collapsible rows) and **Priorities** (table rows grouped by tier). But for the **Dashboard**, cards are the right pattern because each item shows DIFFERENT information that doesn't need cross-comparison.

| Component | Used for | Key fields |
|-----------|----------|------------|
| `UnifiedCard` | Both attention items AND recommendations — same structure, different accent color | Name, description, metric, scope, process. Left accent border: red/amber (attention) or green/amber/gray (recommendations). |
| `KpiCard` | Hard fact metrics | Label + large monospace number + delta indicator |
| `EstimateCard` | LLM-estimated values | Label + number + explanation text + confidence badge + "methodology →" link. Per §1 transparency principle. |
| `ProcessCard` | Process coverage | Name, maturity badge, big coverage bar, reliability, value at risk, recommendation count |

Cards are **reusable** — the same UnifiedCard appears on the Dashboard ("Your Next Move", "Needs Attention", "Top Opportunities") and on the Priorities page.

**"Your Next Move" layout (amends §3 Dashboard).**

§3 says "AI banner: 1 specific recommendation." The design spike found that a paragraph of free text is unreadable. Instead:
- Tinted teal background section with teal left accent border (3px)
- Bot icon + "YOUR NEXT MOVE" heading
- The #1 recommendation rendered as a standard UnifiedCard (recommendation type)
- Optional follow-up "Then" card for the #2 action
- Total impact summary

The recommendation card inside is the same component used on the Priorities page — not a custom text layout.

**Delta banner enhancements (amends §3 Dashboard).**

§3 defines three change categories (landscape, health, recommendation). The design spike adds color-coding: amber for "updated", green for "improved", teal for "resolved". All numbers in the banner are bold monospace.

**Estimate transparency (amends §3 Dashboard).**

§3 says estimates should be "secondary with (methodology →)." The design spike implements this as `EstimateCard` — a distinct card type that shows:
1. The estimate value (large, colored)
2. Explanation text (what it measures)
3. Confidence badge (Benchmark-based / AI-suggested)
4. "methodology →" link

This clearly separates hard facts (KpiCard: "12 workflows") from estimates (EstimateCard: "~€4.2K/mo at risk — AI-suggested").

**Numbers rule (extends §15 Typography).**

All numbers must be visually highlighted: bold + monospace + contextual color. Numbers never appear as plain body text. Even inline numbers in sentences (e.g., "2 workflows updated") use bold monospace. Per §15's existing rule "Metrics/numbers: Monospace, semibold" — this extends it to ALL number occurrences.

**What stays unchanged from §15:**
- Accent teal (#0d9488), status green/amber/red, color = meaning only
- Section header style: uppercase, tracking-wider, semibold
- Confidence visual pattern: solid/dashed/outline
- Sidebar structure (nav items, logo, sync status)
- Tables/lists for Process Map and Priorities pages
- Slide-over panel for recommendation detail
