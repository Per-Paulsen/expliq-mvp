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
| **Delta Banner** | On re-sync: "Since last analysis: X improved, Y deployed, Z new workflows detected." (Nice-to-have for demo.) |

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

**Recommendation types:**

| Type | Example | Behavior |
|------|---------|----------|
| New workflow | "Add lottery-loss notification" | Deploy button → deploy modal with n8n JSON |
| Technical fix | "Fix 31% error rate — add retry logic" | Links to Detail page of affected workflow |
| New process suggestion | "Payment & Billing — 4 workflows" | Collapsible section with child recommendation cards |
| Platform connection | "Connect your ticketing platform" | Text + reasoning, no deploy button |

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
| **"How We Know This"** | Expandable evidence section: execution stats, node configuration, credential info, raw data points. Renamed from "Technical Details" to emphasize trust-building. |

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

### Workspace-Level Analysis (two-call strategy)

**Call 1: "Understand"**
- Input: all per-workflow summaries (not full JSONs) + credentials list + execution stats + user/project data
- Output: process clustering, system landscape with narratives, connected automation links, process-level metrics
- Prompt: business analyst persona, XML-tagged sections, chain-of-thought before structured output

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

### Research Spike (Phase 0)

Before coding: test prompts against real fairtix data. Iterate until one-shot output quality matches the ANALYSIS-FINAL.md standard. Document proven prompts.

---

## 11. n8n API Scope

*(From n8n-api-findings.md)*

### Sync pipeline queries (in order)

| # | Endpoint | Purpose | Priority |
|---|----------|---------|----------|
| 1 | `GET /discover` | Feature detection — what does this instance support? | Required (call first) |
| 2 | `GET /workflows?tags=X` or `GET /workflows` | All workflow definitions | Required |
| 3 | `GET /executions?workflowId=X` per workflow | Execution stats (runs, errors, timing) | Required |
| 4 | `GET /credentials` | Verified system inventory | If permitted (may 403) |
| 5 | `GET /users` | Ownership data | If permitted |
| 6 | `GET /tags` | Process clustering hints | Required |
| 7 | `GET /projects` | Team structure | If permitted |
| 8 | `GET /variables` | Environment context | If permitted |
| 9 | `POST /workflows` + `POST /workflows/{id}/activate` | Deploy recommended workflows | Required for deploy feature |

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
| **Recommendation** | Suggested new workflow or fix. Fields: id, workspaceId, processId, type (new_workflow / technical_fix / process_suggestion / platform_connection), stepName, name, brief, businessCase, evidence (Json), confidence, tier, implementationNotes, suggestedPlatform, systemSource, systemDestination, deployableJson (Json), priorityOrder, createdAt |
| **ProcessSuggestion** | Entirely new recommended process. Fields: id, workspaceId, name, description, basedOn, businessCase, connectedSystems (String[]), createdAt. Has child Recommendations (one-to-many). |
| **CompanyProfile** | Workspace-level analysis cache. Fields: id, workspaceId, systemLandscape (Json), nextMoveText, nextMoveReasoning, processMetrics (Json), benchmarks (Json), insights (Json), analyzedAt |

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

## 15. Design Reference

**Figma Make file** `3bG7mlpucVffGMdoAFPcgc` — use for:
- Design system: color palette (darkened teal + darker text), typography, spacing
- Component code: WorkflowCard, DeployModal, StatusDot, SystemFlow, ExpliqBadge, ExpliqCard, MetricCard
- Layout patterns: sidebar, card structures, collapsible sections
- Dark mode: single dark theme (Figma's dark sidebar approach)

**Do NOT use Figma for:** screen structure, information architecture, number of screens, card field density, governance toggle, Company Intelligence page. These are all superseded by the brainstorming decisions.

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
