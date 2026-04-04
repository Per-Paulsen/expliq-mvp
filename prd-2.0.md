# PRD 2.0 — Expliq: Automation Intelligence

> Extension PRD for the Expliq R2 pivot. Builds on top of the deployed MVP (epics 01-08).
> This document is a MAP to detailed references — it defines WHAT to build and WHERE to find the details.

---

## Product Vision

Expliq is **Automation Intelligence**. It connects to automation platforms (starting with n8n), uses LLMs to deeply understand every workflow and the full automation landscape, and delivers process assessment, business opportunity detection, and actionable recommendations with deployable workflow scaffolds.

**Core principle:** The value is in REASONING, not numbers. Every insight traces back to the user's own data. Estimates show their methodology. Expliq is a consultant, not a calculator.

**Tagline:** "Understand your automation landscape. Know what's working, what's broken, and what to build next."

**Two differentiators** no competitor can match:
1. **Deploy button** — from recommendation to running workflow in one click
2. **LLM-powered analysis** — from raw workflow JSON to consulting-grade business insight, no human analyst needed

---

## What's New (vs MVP)

The MVP (epics 01-08) is a governance dashboard: 3 screens (Workspace Snapshot, Portfolio, Detail), n8n connector (workflow sync), per-automation LLM analysis, risk engine.

The R2 pivot transforms this into an intelligence platform:

| Capability | MVP | R2 |
|-----------|-----|-----|
| Primary entity | Workflows | **Business processes** |
| Analysis depth | Per-workflow (impact, risk) | Per-workflow + **workspace-level** (process clustering, gap detection, system narratives) |
| Recommendations | None | **Ranked by impact with confidence, deployable to n8n** |
| Data sources | Workflow definitions only | Workflow definitions + **execution history + credentials + users + tags** |
| Framing | Governance (risk, owner, review) | **Business intelligence** (impact, opportunity, coverage, maturity) |
| Screens | 3 (Snapshot, Portfolio, Detail) | **4 (Dashboard, Process Map, Priorities, Detail)** |

---

## Four Screens

| Screen | User question | One job |
|--------|--------------|---------|
| **Dashboard** | "What needs my attention?" | Executive summary: next move, facts, top priorities, process overview |
| **Process Map** | "What do I have?" | Processes with workflows, coverage, maturity. Toggle to show where gaps are. |
| **Priorities** | "What should I do?" | ALL recommendations ranked by impact × confidence. Deploy from here. |
| **Detail** | "Tell me everything about this one." | Per-workflow business narrative, business case, evidence, connections. |

Plus: **Settings** (existing — n8n connector config, sync) and **Login/Signup** (existing).

> **Detailed screen specifications:** see `prd-2.0-decisions.md` sections 3-7 for layout, content, navigation map, and entity model.

---

## Data Architecture

### n8n API — What We Query

The sync pipeline uses a two-phase approach: **Discover** (lightweight, on connection) → **Sync + Analyze** (full, after user configures tag filter).

**Phase 1 — Discover:** `GET /discover` (feature detection), `GET /tags` (available tags), `GET /workflows` (names + tags for preview). Runs on "Verify Connection." Shows the user what's in their instance with tag-based filtering — essential for instances with mixed-purpose workflows (e.g., shared team instances).

**Phase 2 — Sync + Analyze:** `GET /workflows?tags=X` (full definitions, filtered), `GET /executions?workflowId=X` (per workflow), plus optional enrichment endpoints: `GET /credentials`, `GET /users`, `GET /projects`, `GET /variables`. Then `POST /workflows` + activate for deploy.

**Graceful degradation:** Credentials, users, projects, and variables endpoints may return 403 depending on API key permissions. The `GET /discover` response tells us which scopes are available. Expliq must work without these endpoints — they enrich the analysis but are not required.

> **Full two-phase pipeline with tag selection UX:** see `prd-2.0-decisions.md` section 11.

> **Full API schemas and examples:** see `n8n-api-examples/README.md` for the complete directory index.
> **Real-world validation:** see `n8n-api-examples/fairtix/reference/ANALYSIS-FINAL.md` for what this data produces.

### LLM Pipeline — Two-Call Strategy

**Per-automation enrichment** (extend existing call): adds businessBrief, stepName, timeSavingsEstimate, revenueImpactEstimate, failureImpact, dataIn, dataOut to each workflow.

**Workspace-level analysis** (two new calls):
- **Call 1 "Understand":** All workflow summaries → process clustering, system landscape narratives, connected automation links, process-level metrics
- **Call 2 "Advise":** Call 1 output + summaries → recommendations (Act Now / Investigate / Explore), process suggestions, "Your next move" synthesis, visibility expansions

> **Prompt architecture:** see `prd-2.0-decisions.md` section 10 for persona, output schemas, confidence calibration, anti-patterns, and few-shot strategy.
> **Target output quality:** see `n8n-api-examples/fairtix/reference/ANALYSIS-FINAL.md` — this is what one-shot LLM output should match.

### Schema Changes

4 new Prisma models: **BusinessProcess**, **Recommendation**, **ProcessSuggestion**, **CompanyProfile** (includes workspace analysis cache + delta tracking for the re-sync banner).

Extended fields on existing **Automation** model: stepName, processId, businessBrief, timeSavingsEstimate, revenueImpactEstimate, failureImpact, dataIn, dataOut, runsPerWeek, errorRate, upstreamIds, downstreamIds.

> **Full schema details:** see `prd-2.0-decisions.md` section 12.

---

## Recommendation Framework

Based on McKinsey/BCG/Celonis consulting best practices.

**Sort:** By business impact (primary). Confidence shown per card but does not determine sort order.

**Three tiers:**
- **Act Now** — high impact + high confidence. No-regret moves. Data-driven evidence.
- **Investigate** — high impact + Expliq can't fully verify. May exist in other systems. Honest framing.
- **Explore** — valuable but lower urgency or requires platform expansion.

**Three recommendation types:** new workflow (deployable), technical fix (on existing workflow), platform connection suggestion. Process suggestions are a separate entity (ProcessSuggestion) that contains child recommendations.

**Confidence labels:** "Data-driven" (from user's data) / "Benchmark-based" (industry knowledge) / "AI-suggested" (inference, may be wrong).

**Honest framing (three frames):**
1. **Clearly n8n domain:** "This is missing from your automation layer and should be built." Confident language.
2. **May be handled elsewhere:** "We don't see this in your n8n workflows. If handled by your platform, consider connecting it for visibility. If not, here's what we'd suggest."
3. **Connect more for visibility:** "Connect X platform for deeper insight into Y." Growth suggestion, not a fix.

> **Full framework with fairtix examples:** see `prd-2.0-decisions.md` section 9 and `n8n-api-examples/fairtix/reference/ANALYSIS-FINAL.md`.

---

## Process-Level Variables

The primary metrics are PROCESS-LEVEL, not workflow-level. Individual workflow stats are drill-down evidence.

| Variable | Description | Source |
|----------|-------------|--------|
| Coverage | % of process steps automated | workflow count / (workflows + recommendations) |
| Reliability | % of executions that succeed | Execution API, aggregated per process |
| Maturity | Composite level | Coverage × reliability × error handling × monitoring |
| Value at Stake | Impact of current gaps | LLM estimate with reasoning |
| Recommendations | Count of actionable items | Per process |

> **Variable definitions:** see `prd-2.0-decisions.md` section 8.

---

## What Stays from the MVP

**Keep as-is:** Auth system, n8n connector foundation (extended with new endpoints), Prisma setup (schema extended), LLM pipeline foundation (massively extended), risk engine (governance dots derive from it), encryption, test infrastructure, settings page, login/signup, app shell with sidebar.

**Replace:** Dashboard page, Portfolio/automations page, automation detail page, all page-specific types and utilities.

> **Full list:** see `prd-2.0-decisions.md` section 14.

---

## Scope Cuts

Not building: governance toggle, technical improvements as separate feature, editable process names, full filter system (search only), sort by revenue, workflow node visualization, company profile inference (industry/size/stage — unless certainly derivable from the data), mobile, separate Automation Intelligence page, version history, multi-platform connectors beyond n8n.

> **Full list:** see `prd-2.0-decisions.md` section 13.

---

## Design Reference

**Design system:** Dark advisory theme — confident, restrained, data-forward. The mood is a consulting deliverable, not a SaaS app. Tables/lists for data, not cards. Color = meaning only (green/amber/red for status, accent for interactive). High-contrast typography on dark backgrounds. Monospace for all numbers.

> **Full design system specification:** see `prd-2.0-decisions.md` section 15 — covers color palette, typography hierarchy, component patterns (tables vs cards), sidebar, loading states, confidence visual patterns, and sync UX.

**Figma Make file** `3bG7mlpucVffGMdoAFPcgc` — use for component CODE as starting point (adapt to dark theme + table patterns). Do NOT use for color palette, card layouts, screen structure, or information density — all superseded.

**How to access Figma via MCP:**

The Figma MCP server is configured in `.mcp.json`. Use these tools:

- **Read component source code:**
  ```
  ReadMcpResourceTool(server: "figma", uri: "file://figma/make/source/3bG7mlpucVffGMdoAFPcgc/src/app/components/{ComponentName}.tsx")
  ```

- **Read theme/styles:**
  ```
  ReadMcpResourceTool(server: "figma", uri: "file://figma/make/source/3bG7mlpucVffGMdoAFPcgc/src/styles/theme.css")
  ```

- **Get design context with screenshot:**
  ```
  mcp__figma__get_design_context(fileKey: "3bG7mlpucVffGMdoAFPcgc", nodeId: "...")
  ```

> **Figma resource index:** see `WORKFLOW.md` for the component-to-file mapping.

---

## Demo Target

Next week. Industry experts, trainers, and mentors. Using the FairTix n8n instance (known to the audience) as live demo data.

**Demo flow:** Login → Settings (sync n8n instance live) → Dashboard (overview + next move) → Process Map (show processes, toggle gaps) → Priorities (show recommendations, deploy one) → Detail (drill into one workflow, show evidence).

**Research spike (Phase 0):** Before coding, test the prompt architecture defined in `prd-2.0-decisions.md` section 10 against real FairTix data. Iterate on persona, output schema, confidence calibration, and anti-patterns until one-shot output matches `ANALYSIS-FINAL.md` quality. Document proven prompts as the foundation for Epic 10.

---

## Suggested Epic Sequence

| Phase | Epic | Scope |
|-------|------|-------|
| 0 | Research spike | Test LLM prompts against fairtix. Not a formal epic. |
| 1 (parallel) | 10: LLM Pipeline V2 + Schema + n8n API | Extended sync, new models, per-automation enrichment, workspace-level LLM, deploy endpoint |
| 1 (parallel) | 11: Design System + Layout | Figma palette, dark mode, sidebar, shared components, login polish |
| 2 | 12: Dashboard | Your next move, facts, attention/opportunities, process coverage |
| 2 | 13: Process Map | Process rows, workflow rows, show-gaps toggle, search |
| 2 | 14: Priorities | Recommendation tiers, cards, slide-over panels, deploy modal |
| 2 | 15: Detail | Business narrative, business case, connections, evidence |
| 3 | 16: Settings + Auth Polish | Loading states, explanations |

> **Full epic descriptions:** see `prd-2.0-decisions.md` section 16.

---

## Reference Map

| Document | What it contains | When to read |
|----------|-----------------|-------------|
| **This file** (`prd-2.0.md`) | Product vision, screen overview, data architecture summary | Start here |
| `prd-2.0-decisions.md` | All 16 sections of detailed decisions (screens, navigation, entities, schema, prompts, scope) | For spec derivation — the detailed reference |
| `prd-2.0-brainstorming.md` | 15 rounds of discussion with reasoning | When you need to understand WHY a decision was made |
| `n8n-api-examples/README.md` | Directory index of all API schemas and real data | For understanding available data |
| `n8n-api-examples/fairtix/reference/ANALYSIS-FINAL.md` | Target output quality — what Expliq should produce | For LLM prompt design and output validation |
| `archive/n8n-api-findings.md` | Initial API research (historical, technical details still valid) | For deep API field-level reference |
| `WORKFLOW.md` | Dev workflow with Figma MCP integration | For the implementation process |
| `archive/expliq_prd.md` | Original MVP PRD (3 screens, governance focus) | Historical context only |

---

## Related

- [Map of Content](_MOC.md)
- [Original PRD](archive/expliq_prd.md) (superseded by this document)
- [Tech Stack](tech-stack-idea.md)
- [Development Workflow](WORKFLOW.md)
