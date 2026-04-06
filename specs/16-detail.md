---
tags:
  - type/spec
  - status/draft
  - phase/3
---

# Epic 16 — Detail

> Upstream: [PRD 2.0](../prd-2.0.md) | [Decisions §6](../prd-2.0-decisions.md) | [Brainstorming](brainstorming.md)
> Phase: 3 (after Epics 11-15)
> Dependencies: Epic 11 (LLM data), Epic 12 (design system + route shell), Epic 13 (dashboard-data.ts utilities for step scope, metric formatting), Epic 15 (normalizeTier utility, recommendation patterns)
> Prerequisites: ~~Pipeline patch~~ — `timeSavingsConfidence` and `revenueConfidence` fields already exist on Automation model (applied during Epic 15 cycle). No remaining prerequisites.

## Scope

Per-automation deep dive answering "Tell me everything about this one." Existing route `/automations/[id]` — complete page rewrite with business-first content.

### Visual Layout Principles

Every section is a **white card container** (`bg-surface rounded-xl border border-border shadow-sm`). No floating text on the page background. The existing design vocabulary is reused throughout — callout boxes, pills, monospace metrics, badges, KV grids, section headers. See [brainstorming](16-detail-brainstorming.md) for research and rationale.

Section header pattern (used in every card): `text-xs font-semibold uppercase tracking-wider text-text-tertiary`.

### Shared Utilities (new)

- **Extract `normalizeTier()`** — currently module-private in `opportunities-data.ts`. Export it (or move to a shared utility) so the Detail page can import it. Bundle a `normalizeConfidence()` helper alongside it (same logic: `.toLowerCase().replace(/\s+/g, "-")`).
- **Add `getConnectionType(sourceId, targetId, automations)`** — new exported function in `connected-automations.ts`. Checks `rawWorkflowJson.settings.errorWorkflow` and `settings.callerIds` to derive `"error-handler" | "sub-workflow" | "logical"`. The internal logic already exists in that module but is not exposed.
- **`computeGovernanceDot()`** — already exported from `risk-engine.ts`. The governance dot is NOT a stored field — it must be computed at query-time in the Detail page's data layer, same as Dashboard and Process Map do.

### 1. Header — Status Card

White card, full-width. Two-row structure.

**Row 1 — Identity:**
- Automation name: `text-xl font-bold text-foreground` (largest text on page)
- StatusDot + status label: inline right of name — dot + colored label (e.g., "Critical — 31% error rate" in red, "Healthy — active" in green). Status derived via `computeGovernanceDot()`.
- Platform badge: far-right, small pill (`bg-foreground/5 text-text-tertiary rounded-full text-[10px] font-mono uppercase`) reading "n8n"

**Row 2 — Context metadata:**
- SystemFlow: existing component (11px monospace chain with arrows)
- Process step label: pill-style link (`bg-primary/10 text-primary rounded-full text-xs font-medium`) — clickable → `/processes`

**Back link:** above the card, not inside it: `text-sm text-text-secondary hover:text-primary` — "← Back to Process Map"

### 2. Business Narrative — Teal Callout Card

White card with **teal left border** (`border-l-[3px] border-primary`) and subtle teal tint (`bg-primary/[0.03]`). Mirrors the Dashboard "Your Next Move" callout pattern — teal signals "Expliq's interpretation."

- Section header: "BUSINESS NARRATIVE"
- Icon: `Bot` or `Sparkles` icon inline with header (signals LLM-generated content)
- Narrative text: `text-[15px] text-foreground leading-relaxed` — full prose, no truncation (3-5 sentences from LLM per-automation output)

### 3. Business Case — Three-Column Grid Card

White card. Section header: "BUSINESS CASE".

Layout: `grid grid-cols-1 lg:grid-cols-3 gap-6`. Each column is a mini-section within the card with a colored left border — colors follow the Dashboard EstimateCard convention (positive=teal, negative=amber, danger=red):

| Column | Data Fields | Left Border | Metric Color | Visual Treatment |
|--------|------------|-------------|-------------|-----------------|
| **Failure Impact** | `impact.failureScenario` | Red (`border-status-critical`), `bg-status-critical/5` tint | `text-status-critical` | Sub-header "FAILURE IMPACT" in red. Body text: cascading consequences in plain language. |
| **Time Savings** | `timeSavingsEstimate` + reasoning | Teal (`border-primary`) | `text-primary` | Estimate in `text-lg font-bold font-mono`. ConfidenceBadge from `timeSavingsConfidence` (normalized). Reasoning as `text-sm text-text-secondary`. |
| **Revenue Connection** | `impact.revenueConnection` + `revenueImpactEstimate` | Amber (`border-status-attention`), `bg-status-attention/5` tint | `text-status-attention` | Estimate in `text-lg font-bold font-mono`. ConfidenceBadge from `revenueConfidence` (normalized). Connection text as `text-sm text-text-secondary`. |

N/A handling: when a field is null, column renders with gray left border, `text-text-tertiary`, and "Not applicable" — still occupies space for layout consistency.

Confidence values normalized via `normalizeConfidence()` before passing to ConfidenceBadge.

### 4. Recommendations — List Card

White card. Section header: "RECOMMENDATIONS FOR THIS WORKFLOW" + count badge (`text-xs font-mono font-semibold text-primary bg-primary/10 rounded-full px-2`).

Vertical stack of recommendation rows separated by `border-t border-border`. Recommendations found by: first `automationId` match (direct), then `processId` match (process-level), deduplicated.

Each row:
- Left: TierBadge (normalized via `normalizeTier()`) + name (`text-[15px] font-semibold text-foreground`)
- Below name: brief (`text-sm text-text-secondary`) — one-liner from `Recommendation.brief` (not businessCase)
- Right: impact estimate in `font-mono font-bold text-primary`
- Hover: `hover:bg-surface-hover`, name → teal
- Click: full row → `/opportunities?highlight={id}`

Empty state: "No recommendations linked to this workflow" centered, with "View all opportunities →" link.

### 5. Process Position — Visual Step Card

White card. Section header: "PROCESS POSITION".

- Process name: `text-[15px] font-semibold text-primary hover:underline` — clickable → `/processes`
- Maturity badge: inline pill next to process name (same pattern as ProcessCard)
- Step list: horizontal flow of step pills with arrow connectors (`text-text-tertiary`)
- Current step: filled pill (`bg-primary text-white rounded-full px-3 py-1 text-xs font-semibold`)
- Other steps: ghost pills (`bg-surface-hover text-text-secondary rounded-full px-3 py-1 text-xs font-medium`)

### 6. Connected Automations — Upstream/Downstream Card

White card. Section header: "CONNECTED AUTOMATIONS". **Hidden entirely** when no connections exist.

Two sub-sections separated by `border-t border-border`:
- Sub-headers: "UPSTREAM" / "DOWNSTREAM" with directional icons, in `text-text-tertiary`
- Each connection row: automation name (`text-[15px] font-semibold`) + connection type pill (all gray: `bg-foreground/5 text-text-tertiary rounded-full text-[10px] font-mono uppercase` — "ERROR HANDLER" / "SUB-WORKFLOW" / "LOGICAL") + brief (`text-sm text-text-secondary`)
- Connection type derived via `getConnectionType()` (new utility — see Shared Utilities above)
- Click: full row → `/automations/[id]`, hover → name turns teal

### 7. "How We Know This" — Collapsible Evidence Card

White card, **collapsed by default**. Section header "HOW WE KNOW THIS" + ChevronRight (rotates on expand) + summary line: "Execution data, error handling, credentials, and technical findings" in `text-sm text-text-secondary`.

Expanded state has **6 sub-sections**, each with its own visual treatment:

**7a. Execution Stats** — KV grid (`grid grid-cols-2 lg:grid-cols-4 gap-4`). Each stat as attribute-value pair: label in `text-xs font-semibold uppercase tracking-wider text-text-tertiary`, value in `text-lg font-bold font-mono`. Error rate gets contextual color: green (<5%), amber (5-15%), red (>15%). Fields: runsPerWeek, errorRate %, lastExecutedAt (relative), avgDurationMs (formatted).

**7b. Error Handling** — Amber left-border callout (`border-l-[3px] border-status-attention bg-status-attention/5 rounded-r-lg p-4`). Sub-header "ERROR HANDLING" in `text-status-attention`. Content from `technicalEvidence.errorHandling`: retry settings, error workflow link, what's missing.

**7c. Credentials** — Sub-header "CREDENTIALS & SYSTEM DEPENDENCIES". Horizontal flex-wrap of pills (`bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-medium`). Data from `technicalEvidence.credentials`.

**7d. Detectability** — Grid (`grid grid-cols-1 lg:grid-cols-3 gap-4`): detectability level as badge, reasoning as body text, evidence as secondary text. Data from `detectability` Json field.

**7e. Key Findings** — Each finding as a bordered mini-row (`border-l-[2px] border-primary/30 pl-3 py-1.5`), `text-sm text-foreground`. Data from `technicalEvidence.keyFindings`. **Capped at 5 visible**, with "Show N more" toggle for the rest.

**7f. Complexity** — Compact KV pairs (`text-sm`): node count (bold monospace number), branching patterns (descriptive text). Data from `technicalEvidence.complexity`.

### Back Navigation

"← Back to Process Map" link at top of page, above the header card.

## Acceptance Criteria

### Visual Layout
1. Every section rendered inside a white card container (`bg-surface rounded-xl border border-border shadow-sm`) — no content floats on the page background
2. All section headers use the standard pattern: `text-xs font-semibold uppercase tracking-wider text-text-tertiary`
3. All numbers displayed in bold monospace with contextual color (never plain body text)

### Shared Utilities
4. `normalizeTier()` exported from a shared location (extracted from `opportunities-data.ts` or moved to a shared utility file). `normalizeConfidence()` helper alongside it.
5. `getConnectionType(sourceId, targetId, automations)` exported from `connected-automations.ts` — derives `"error-handler" | "sub-workflow" | "logical"` from `rawWorkflowJson.settings.errorWorkflow` and `settings.callerIds`.

### Header
6. White card container with two-row layout
7. Row 1: automation name (`text-xl font-bold`), StatusDot with governance level (computed via `computeGovernanceDot()`), status label describing the dot reason, platform pill ("n8n")
8. Row 2: SystemFlow (from `Automation.systemsTouched`), process step pill (stepName + process name, clickable → `/processes`)

### Business Narrative
9. Teal left-border callout card (`border-l-[3px] border-primary bg-primary/[0.03]`) with `Bot` or `Sparkles` icon
10. Renders full businessNarrative as body text (`text-[15px] text-foreground leading-relaxed`) — no truncation

### Business Case Card
11. Three-column grid (`grid grid-cols-1 lg:grid-cols-3`), each column with colored left-border mini-section
12. Failure Impact: red left border + tint, `impact.failureScenario` text, sub-header in `text-status-critical`
13. Time Savings: teal left border, `timeSavingsEstimate` in `text-lg font-bold font-mono text-primary`, ConfidenceBadge from `timeSavingsConfidence` (normalized via `normalizeConfidence()`), reasoning text
14. Revenue Connection: amber left border + tint, `revenueImpactEstimate` in `text-lg font-bold font-mono text-status-attention`, ConfidenceBadge from `revenueConfidence` (normalized), `impact.revenueConnection` text
15. Null fields render with gray left border and "Not applicable" — column still occupies space

### Recommendations
16. White card with section header + count badge. Recommendations found by `automationId` match (direct), then `processId` match (process-level), deduplicated.
17. Each row: TierBadge (normalized via `normalizeTier()`) + name + brief (from `Recommendation.brief`, not businessCase) + impact estimate in `font-mono font-bold text-primary`. Rows separated by `border-t border-border`.
18. Hover: `hover:bg-surface-hover`, name → teal. Click: full row → `/opportunities?highlight={id}`
19. Empty state: "No recommendations linked to this workflow" + "View all opportunities →" link

### Process Position
20. White card with process name (clickable → `/processes`) + maturity badge inline
21. Step list as horizontal pill trail: current step = filled pill (`bg-primary text-white`), other steps = ghost pills (`bg-surface-hover text-text-secondary`), arrow connectors between pills

### Connected Automations
22. White card, **hidden entirely** when no connections exist (both upstream and downstream empty)
23. Two sub-sections (Upstream / Downstream) separated by `border-t border-border`, with directional icons
24. Each row: automation name + connection type pill (all gray: `bg-foreground/5 text-text-tertiary`) + brief. Type derived via `getConnectionType()`.
25. Click: full row → `/automations/[id]`, hover → name turns teal

### Evidence Section
26. White card, collapsed by default (CollapsibleRow pattern). Summary line visible when collapsed.
27. **Execution Stats**: KV grid (4 columns on desktop). Error rate with contextual color (green <5%, amber 5-15%, red >15%). All values in `text-lg font-bold font-mono`.
28. **Error Handling**: amber left-border callout (`border-l-[3px] border-status-attention bg-status-attention/5`). Content from `technicalEvidence.errorHandling`.
29. **Credentials**: horizontal flex-wrap of teal pills (`bg-primary/10 text-primary rounded-full`). Data from `technicalEvidence.credentials`.
30. **Detectability**: 3-column grid — level badge + reasoning + evidence. Data from `detectability` Json field.
31. **Key Findings**: bordered mini-rows (`border-l-[2px] border-primary/30`). Capped at **5 visible**, "Show N more" toggle for the rest. Data from `technicalEvidence.keyFindings`.
32. **Complexity**: compact KV pairs — node count (monospace), branching (text). Data from `technicalEvidence.complexity`.
33. All data from Automation model fields — no additional API calls

### Navigation
34. "← Back to Process Map" link above the header card, navigates to `/processes`
35. Async params: `await params` for `[id]` route parameter (Next.js 15+)

### Tests
36. Render test: full detail page with all sections populated, all card containers present
37. Render test: sections hidden when data is null/empty (no connections → card hidden, no recommendations → empty state)
38. Render test: evidence section collapsed by default, expands on click
39. Render test: key findings capped at 5, "Show more" toggle reveals rest
40. Navigation test: step pill click → process map
41. Navigation test: connected automation click → other detail page
42. Navigation test: recommendation click → opportunities with highlight

## Out of Scope

- Editing any fields (all LLM-generated, read-only)
- Recommendation detail (inline collapsible is on Opportunities page)
- Workflow node visualization / flow diagram
- "Open in n8n" link (could be added as a small enhancement — constructable from instance URL + externalId — but not spec'd)
- Version history / change tracking

## Domain Terms

| Term | Definition |
|------|-----------|
| **Business narrative** | LLM-generated 3-5 sentence description of what a workflow means for the business. The text that differentiates Expliq from reading n8n's workflow editor. |
| **Business case card** | Three-column display: failure impact, time savings, revenue connection. Each with reasoning, not just numbers. The McKinsey "per-item deep dive." |
| **"How We Know This"** | Evidence section showing the raw data and deductive reasoning behind the analysis. Renamed from "Technical Details" to emphasize trust-building over technical documentation. |
| **Connected automations** | Upstream (feeds this workflow) and downstream (this workflow feeds). From errorWorkflow links, callerIds, and LLM-identified logical connections. |

## Open Questions

1. Should we include an "Open in n8n" link in the header? It's trivially constructable (`{instanceUrl}/workflow/{externalId}`) and high-value. (Recommendation: yes, include it — low effort, immediate user value for cross-referencing.)
2. ~~Resolved: Connection type labels derived heuristically via `getConnectionType()` utility. Checks `rawWorkflowJson.settings.errorWorkflow` and `settings.callerIds`. All connection type pills rendered in gray (classification, not severity).~~
3. ~~Resolved: `timeSavingsConfidence` and `revenueConfidence` fields already exist on Automation model (applied during Epic 15 cycle). No migration needed.~~
4. ~~Resolved: Visual layout — card-based containers, callout patterns, color conventions. See [brainstorming](16-detail-brainstorming.md) Rounds 1-4 for research and decisions.~~

---

## Related

- [Epic 11: LLM Pipeline V2](11-llm-pipeline-v2.md) (data source: Automation enriched fields)
- [Epic 12: Design System](12-design-system.md) (components: StatusDot, SystemFlow, ConfidenceBadge, ImpactBadge, TierBadge)
- [Epic 13: Dashboard](13-dashboard.md) (reusable utilities: resolveStepScope, formatAttentionMetric from dashboard-data.ts)
- [Epic 15: Opportunities](15-opportunities.md) (recommendation links)
- [Epic 14: Process Map](14-process-map.md) (back navigation, process position link)
- [Decisions §6: Detail](../prd-2.0-decisions.md)
