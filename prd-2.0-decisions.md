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

### Research Spike (Phase 0)

Before coding: test prompts against real fairtix data. Iterate until one-shot output quality matches the ANALYSIS-FINAL.md standard. Document proven prompts.

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
