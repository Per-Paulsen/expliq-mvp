---

## tags:
  - type/brainstorming
  - status/active

# Epic 16 — Detail — Brainstorming

> Upstream: [Spec](16-detail.md)

## Implementation Refinement Applied

Batch-refined via `/refine_all_ind` (in-dev mode). See `specs/ind-epic-review.md` for details.

Results incorporated:

- 01-project-setup-results.md
- 02-auth-results.md
- 03-n8n-connector-results.md
- 04-llm-pipeline-results.md
- 05-risk-engine-results.md
- 05.5-test-infrastructure-results.md
- 06-portfolio-screen-results.md
- 07-automation-detail-results.md
- 08-workspace-snapshot-results.md
- 10-schema-sync-results.md
- 11-llm-pipeline-v2-results.md
- 12-design-system-results.md
- 13-dashboard-results.md
- 14-process-map-results.md
- 15-opportunities-results.md

---

## Visual Design Research — Detail Page Layout

### Problem Statement

The current Epic 16 spec describes the Detail page as "scrollable sections, not cards" — seven blocks of flowing body text with inline badges. The design guidelines explicitly note: "Detail (per PRD §6 — NOT changed by design spike)."

This produces a text-heavy, visually flat page that is inconsistent with the rich card-based visual language established across Dashboard (KpiCards, EstimateCards, ProcessCards, UnifiedCards), Process Map (ProcessCards + expanded UnifiedCards), and Opportunities (UnifiedCards + structured inline detail with callouts, grids, pills, monospace metrics).

The Detail page is the deepest content page — answering "tell me everything about this one" — and deserves the richest visual treatment, not the plainest.

### Design Constraint

**We are NOT inventing a new visual language.** The existing design system vocabulary is the palette:


| Existing Pattern                                                                     | Used On                              | Available For Detail                   |
| ------------------------------------------------------------------------------------ | ------------------------------------ | -------------------------------------- |
| White cards with `shadow-sm` + `rounded-xl` + subtle border                          | All pages                            | Section containers                     |
| Section headers: `text-xs font-semibold uppercase tracking-wider text-text-tertiary` | Opportunities detail, Dashboard      | Section labels                         |
| Colored left-border callouts (`border-l-[3px]` + tinted bg)                          | Opportunities (amber honest framing) | Narrative, evidence sections           |
| Colored pills (`bg-primary/10 text-primary rounded-full`)                            | Opportunities (systems)              | Systems, credentials, process steps    |
| Monospace bold metrics (`font-mono font-bold text-primary`)                          | Everywhere                           | Stats, estimates, durations            |
| 2-column grids (`grid grid-cols-2`)                                                  | Opportunities detail                 | Business case, metadata pairs          |
| Attribute-value pairs (label above, value below)                                     | Dashboard KPIs, Opportunities        | Evidence stats, connection details     |
| TierBadge, ConfidenceBadge, StatusDot, ImpactBadge                                   | All pages                            | Header, recommendations, business case |
| Collapsible sections (ChevronRight + rotate)                                         | Opportunities, Process Map           | Evidence section                       |
| Clickable rows with hover → teal                                                     | Opportunities cards                  | Recommendations, connections           |
| Border-top separator (`border-t border-border`)                                      | Opportunities detail actions         | Between sections within a card         |


### Research Findings

Sources consulted:

- [PatternFly Primary-Detail Pattern](https://www.patternfly.org/patterns/primary-detail/design-guidelines/) — detail panes use description lists for attribute-value pairs, multiple card body sections with dividers
- [PatternFly Card Variants](https://www.patternfly.org/components/card/) — expandable cards, compact modifier, multiple `<CardBody>` sections separated by dividers, filled/unfilled body sections
- [PatternFly Service Card](https://www.patternfly.org/component-groups/content-containers/service-card/) — icon + title + description + footer; semantic ordering: visual identifier → primary content → supporting details → actions
- [NN/g Cards: UI Component Definition](https://www.nngroup.com/articles/cards-component/) — cards group related info within a boundary (common regions principle); detail pages should use cards as containers, not as link targets; anti-pattern: using flowing text when structured cards would aid scanning
- [NN/g Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) — defer advanced/rarely-used features to secondary surfaces; initially show the most important options; staged disclosure requires task analysis to know what goes together
- [Callout Section Design Examples](https://www.subframe.com/tips/callout-section-design-examples) — callouts use contrasting backgrounds, colored borders, icons, bold typography; purpose-based differentiation (feature highlight vs. warning vs. testimonial)
- [Pencil & Paper Dashboard UX Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards) — structure top-down by importance; details cards display attribute-value pairs; space between cards aids focus
- [SaaS UI Design Patterns](https://www.saasui.design/) — modern SaaS uses card sections for every content block; progressive disclosure for technical detail; metadata as compact key-value grids
- [Tailwind CSS Detail Screens](https://tailwindcss.com/plus/ui-blocks/application-ui/page-examples/detail-screens) — profile/entity detail pages use card containers per section with section headers, attribute-value grids, and action footers

### Key Principles Extracted

1. **Every content block gets a card container.** No floating text on the page background. Each section is a white card with `shadow-sm`, `rounded-xl`, and subtle border — identical to how Dashboard and Opportunities work.
2. **Attribute-value pairs for structured data, not prose.** When data has labels (error rate, runs per week, confidence level), display as key-value grid, not as a sentence. Labels above or to the left, values below in bold monospace.
3. **Callout boxes for narrative content.** Business narrative and similar prose sections use colored left-border callouts (like Opportunities' honest framing) to visually distinguish "interpretation" from "data."
4. **Pills for categorical data.** Systems, credentials, connection types — anything that's a tag/category gets a pill treatment, not inline text.
5. **Progressive disclosure preserved.** Evidence stays collapsible. But WITHIN the expanded evidence section, content is structured (attribute-value grids, bulleted cards) — not a text dump.
6. **Top-down importance hierarchy.** Answer first (header + status), interpretation second (narrative, business case), actionable context third (recommendations, position, connections), raw evidence last (collapsed).
7. **Consistent section header pattern.** Every section uses the same `text-xs font-semibold uppercase tracking-wider text-text-tertiary` section header as Opportunities detail.

---

## Proposed Visual Treatment Per Section

### 1. Header — Status Card

**Container:** White card, full-width, `shadow-sm rounded-xl`.

**Layout:** Two-row structure inside the card.

**Row 1 — Identity:**


| Element                  | Treatment                                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Automation name          | `text-xl font-bold text-foreground` (largest text on page)                                                                  |
| StatusDot + status label | Inline right of name: dot + `text-sm` colored label (e.g., "Critical — 31% error rate" in red, "Healthy — active" in green) |
| Platform badge           | Far-right: small pill `bg-foreground/5 text-text-tertiary rounded-full text-[10px] font-mono uppercase` reading "n8n"       |


**Row 2 — Context metadata:**


| Element            | Treatment                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| SystemFlow         | Existing component (11px monospace chain with arrows)                                                     |
| Process step label | Pill-style link: `bg-primary/10 text-primary rounded-full text-xs font-medium` — clickable → `/processes` |
| Back link          | Top-left above the card: `text-sm text-text-secondary hover:text-primary` — "← Back to Process Map"       |


### 2. Business Narrative — Teal Callout Card

**Container:** White card with **teal left border** (`border-l-[3px] border-primary`).

This mirrors the amber callout pattern from Opportunities' honest framing but uses teal (the primary/insight color) to signal "this is Expliq's interpretation."

**Layout:**


| Element           | Treatment                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Section header    | `text-xs font-semibold uppercase tracking-wider text-text-tertiary` — "BUSINESS NARRATIVE"                                      |
| Icon              | Small `Bot` or `Sparkles` icon inline with header (signals LLM-generated, like Opportunities uses Sparkles for recommendations) |
| Narrative text    | `text-[15px] text-foreground leading-relaxed` — full prose, no truncation                                                       |
| Tinted background | `bg-primary/[0.03]` — very subtle teal tint inside the card to reinforce "insight"                                              |


### 3. Business Case — Three-Column Grid Card

**Container:** White card, `shadow-sm rounded-xl`.

**Section header:** "BUSINESS CASE" in standard section header style.

**Layout:** `grid grid-cols-1 lg:grid-cols-3 gap-6` — three columns on desktop, stack on mobile.

Each column is a **mini-card** (not a separate card — a bordered section within the card):


| Column                 | Content                                              | Visual Treatment                                                                                                                                                                                                   |
| ---------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Failure Impact**     | `impact.failureScenario`                             | Red left-border accent (`border-l-[3px] border-status-critical`), `bg-status-critical/5` tint. Section sub-header "FAILURE IMPACT" in `text-status-critical`. Body text `text-sm text-foreground leading-relaxed`. |
| **Time Savings**       | `timeSavingsEstimate` + reasoning                    | Primary/teal left-border accent. Estimate value in `text-lg font-bold font-mono text-primary`. ConfidenceBadge inline below value. Reasoning as `text-sm text-text-secondary`.                                     |
| **Revenue Connection** | `impact.revenueConnection` + `revenueImpactEstimate` | Primary/teal left-border accent. Estimate in `text-lg font-bold font-mono text-primary`. ConfidenceBadge inline. Connection text as `text-sm text-text-secondary`.                                                 |


Each column uses the same left-border callout pattern but with contextual color: red for failure (danger), teal for value (opportunity).

**N/A handling:** When a field is null, the column renders with a gray left border, `text-text-tertiary`, and "Not applicable" or "Insufficient data" — still occupies space for layout consistency.

### 4. Recommendations — List Card

**Container:** White card, `shadow-sm rounded-xl`.

**Section header:** "RECOMMENDATIONS FOR THIS WORKFLOW" + count badge (`text-xs font-mono font-semibold text-primary bg-primary/10 rounded-full px-2`).

**Layout:** Vertical stack of recommendation rows separated by `border-t border-border`.

Each row:


| Element       | Treatment                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------- |
| Left cluster  | TierBadge + recommendation name (`text-[15px] font-semibold text-foreground`) on one line |
| Brief         | `text-sm text-text-secondary` below the name — one-liner from `Recommendation.brief`      |
| Right cluster | Impact estimate in `font-mono font-bold text-primary`                                     |
| Hover         | Background `hover:bg-surface-hover`, name → teal                                          |
| Click         | Full row → `/opportunities?highlight={id}`                                                |


Identical visual rhythm to how Opportunities renders its cards, but simplified (no expand, no confidence badge — those details live on the Opportunities page).

**Empty state:** "No recommendations linked to this workflow" — centered, `text-sm text-text-secondary`, with link "View all opportunities →".

### 5. Process Position — Visual Step Card

**Container:** White card, `shadow-sm rounded-xl`.

**Section header:** "PROCESS POSITION"

**Layout:**


| Element         | Treatment                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Process name    | `text-[15px] font-semibold text-primary hover:underline` — clickable link → `/processes`        |
| Maturity badge  | Inline pill next to process name (same MaturityBadge pattern as ProcessCard)                    |
| Step list       | Horizontal flow or vertical list of step pills                                                  |
| Current step    | `bg-primary text-white rounded-full px-3 py-1 text-xs font-semibold` — filled pill (stands out) |
| Other steps     | `bg-surface-hover text-text-secondary rounded-full px-3 py-1 text-xs font-medium` — ghost pills |
| Step connectors | Small arrow or line between pills (`text-text-tertiary`)                                        |


This creates a visual "breadcrumb trail" of the process with the current automation's step highlighted — similar to how SystemFlow shows the system chain, but for process steps.

### 6. Connected Automations — Upstream/Downstream Card

**Container:** White card, `shadow-sm rounded-xl`.

**Section header:** "CONNECTED AUTOMATIONS"

**Layout:** Two sub-sections within the card, separated by `border-t border-border`.

Each sub-section:


| Element         | Treatment                                                                                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sub-header      | `text-xs font-semibold uppercase tracking-wider` — "UPSTREAM" (with `ArrowDownToLine` icon) / "DOWNSTREAM" (with `ArrowUpFromLine` icon) in `text-text-tertiary`                                                                                                   |
| Connection rows | Each row: automation name (`text-[15px] font-semibold text-foreground`) + connection type pill (`rounded-full text-[10px] font-mono uppercase` — "ERROR HANDLER" in red/10, "SUB-WORKFLOW" in amber/10, "LOGICAL" in gray) + brief (`text-sm text-text-secondary`) |
| Click           | Full row → `/automations/[id]`, hover → name turns teal                                                                                                                                                                                                            |


Connection type pill colors:

- **error handler** → `bg-status-critical/10 text-status-critical` (red) — matches the severity of error handling
- **sub-workflow** → `bg-status-attention/10 text-status-attention` (amber) — structural dependency
- **logical** → `bg-foreground/5 text-text-tertiary` (gray) — inferred, softer confidence

**Hidden entirely** when no connections exist (both sections empty → card not rendered).

### 7. "How We Know This" — Collapsible Evidence Card

**Container:** White card, `shadow-sm rounded-xl`. Collapsed by default.

**Collapsed state:** Section header "HOW WE KNOW THIS" + ChevronRight icon (rotates on expand) + brief summary line: "Execution data, error handling, credentials, and technical findings" in `text-sm text-text-secondary`.

**Expanded state:** Multiple sub-sections within the card, each with its own visual treatment:

#### 7a. Execution Stats — Key-Value Grid

`grid grid-cols-2 lg:grid-cols-4 gap-4`

Each stat as an attribute-value pair:


| Label           | Value Style                                                                              |
| --------------- | ---------------------------------------------------------------------------------------- |
| "Runs / Week"   | `text-lg font-bold font-mono text-foreground`                                            |
| "Error Rate"    | `text-lg font-bold font-mono` + contextual color: green (<5%), amber (5-15%), red (>15%) |
| "Last Executed" | `text-lg font-bold font-mono text-foreground` — relative time                            |
| "Avg Duration"  | `text-lg font-bold font-mono text-foreground` — formatted ms/s/min                       |


Labels: `text-xs font-semibold uppercase tracking-wider text-text-tertiary`

This is the same attribute-value pair pattern used in Dashboard KPIs.

#### 7b. Error Handling — Callout

Amber left-border callout (`border-l-[3px] border-status-attention bg-status-attention/5 rounded-r-lg p-4`):

- Sub-header "ERROR HANDLING" in `text-status-attention`
- Content as `text-sm text-foreground leading-relaxed`
- Highlights what's present (retry settings, error workflow) and what's missing

Uses the amber callout pattern from Opportunities' honest framing — appropriate because error handling findings often contain warnings/concerns.

#### 7c. Credentials — Pill List

Sub-header "CREDENTIALS & SYSTEM DEPENDENCIES"

Horizontal flex-wrap of pills:

- Each credential: `bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-medium`
- Same pill pattern as Opportunities' systems display

#### 7d. Detectability — Attribute-Value + Badge

`grid grid-cols-1 lg:grid-cols-3 gap-4`:


| Column        | Content                                            |
| ------------- | -------------------------------------------------- |
| **Level**     | ImpactBadge-style pill showing detectability level |
| **Reasoning** | `text-sm text-foreground leading-relaxed`          |
| **Evidence**  | `text-sm text-text-secondary`                      |


#### 7e. Key Findings — Bulleted Cards

Each finding as a mini-row with left-border accent:

- `border-l-[2px] border-primary/30 pl-3 py-1.5`
- Finding text: `text-sm text-foreground`
- Observation + business implication on same line or two lines

NOT a plain `<ul>` — structured mini-cards that elevate each finding visually.

#### 7f. Complexity

Compact key-value pairs:

- "Node Count" → bold monospace number
- "Branching" → descriptive text
- Same grid pattern as execution stats but smaller (`text-sm`)

---

## Summary: Before vs After


| Section                   | Before (Spec)                      | After (Proposed)                                                                         |
| ------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| **Header**                | Inline text elements on page bg    | White card container with structured 2-row layout                                        |
| **Business Narrative**    | Body text paragraph                | Teal left-border callout card with LLM indicator icon                                    |
| **Business Case**         | "Three-column layout" (text)       | Three-column grid with color-coded left-border mini-sections (red/teal/teal)             |
| **Recommendations**       | "List of rows" (text)              | Card container with structured clickable rows, TierBadge + impact metric                 |
| **Process Position**      | "Visual: step list with highlight" | Card with horizontal pill trail, filled pill for current step                            |
| **Connected Automations** | "Two sections with rows"           | Card with upstream/downstream sub-sections, connection type pills with semantic colors   |
| **Evidence**              | "Collapsed text section"           | Collapsible card with 6 structured sub-sections: KV grid, callouts, pills, finding cards |


Every section is now a card. Every data point has a visual treatment. The existing design vocabulary (callouts, pills, grids, monospace metrics, badges, section headers) is reused throughout — no new patterns invented.

---

## Questions for Review

1. **Teal callout for business narrative** — The teal left-border + subtle tint distinguishes "Expliq's interpretation" from "data." Is teal the right signal color, or should narrative use a different accent (e.g., a muted blue) to avoid confusion with teal-as-interactive/positive?

what even is this here: teal-as-interactive/positive?

2. **Business Case column colors** — Red for failure impact, teal for time savings and revenue. Should revenue connection use a different accent (e.g., amber) to distinguish it from time savings visually?

what is revenue connection and how is it different from revenue?

3. **Connection type pill colors** — error handler = red, sub-workflow = amber, logical = gray. These follow the severity metaphor. Alternative: all gray pills since connection type isn't a severity level. Which approach?

all grey

4. **Evidence sub-sections** — 6 sub-sections may be a lot even within a collapsible. Should some be grouped (e.g., detectability + key findings = "Analysis Detail")?

please list all evidence sub-sections

5. **Key findings as bordered mini-rows vs. plain bullets** — The mini-row treatment adds visual weight. If there are 8-10 findings, does this become too heavy? Should we cap the visible count with "Show N more"?

yes

---

## Round 2 — Responses to Review Questions

### Q1: Teal callout for business narrative

Fair point, that was unclear. What I meant: in our design system, teal (`#0d9488`) is used for interactive elements (links, CTAs, hover states) AND for positive signals (healthy status, opportunity value, impact estimates). The concern was whether a teal-bordered narrative callout could be mistaken for a clickable element or a "positive" indicator. But since the callout is clearly a card with prose text inside — not a button or a metric — this confusion is unlikely. I'd say teal is fine for the narrative callout.

why dont you have a look at how this is dealt with in the existing pages: dashboard, process map and opportunities?!

### Q2: Revenue connection vs revenue

These are two fields on the Automation model from the LLM pipeline:

- `impact.revenueConnection` — prose text explaining HOW this automation connects to revenue (e.g., "This workflow handles lead scoring which directly impacts conversion rates")
- `revenueImpactEstimate` — the actual number/range (e.g., "~€1.2K-2K/mo")

They're displayed together in the same column — the connection text is the reasoning, the estimate is the headline metric. So there's only one "Revenue" column, not two. The question was whether it should look different from the Time Savings column. Given your answer on Q3 (all gray), I think keeping both value columns teal is fine — they're both "opportunity" signals.

why dont you have a look at how this is dealt with in the existing pages: dashboard, process map and opportunities?! i think in the dashboard the revenue number is shown in amber or not?! why cant you establish these connections on your own?!

### Q3: Connection type pill colors

Clear. Connection type pills will all be gray (`bg-foreground/5 text-text-tertiary`).

well, if you have a better idea just tell me eg. from your best practice research

### Q4: Evidence sub-sections

The 6 proposed sub-sections within the collapsible evidence card:

1. **Execution Stats** — runsPerWeek, errorRate, lastExecutedAt, avgDurationMs (key-value grid)
2. **Error Handling** — retry settings, error workflow, what's missing (amber callout)
3. **Credentials** — system dependencies (pill list)
4. **Detectability** — level + reasoning + evidence (badge + text grid)
5. **Key Findings** — bulleted observations with business implications (bordered mini-rows)
6. **Complexity** — node count, branching patterns (compact key-value pairs)

Should some of these be merged? For example:
- Merge **Credentials** into **Execution Stats** as additional KV pairs?
- Merge **Complexity** into **Execution Stats**?
- Merge **Detectability** into **Key Findings**?

mo merging for now

### Q5: Key findings cap

Key findings will be capped with a "Show N more" toggle.

---

## Round 3 — Responses After Checking Existing Code

Checked `dashboard-view.tsx`, `estimate-card.tsx`, `unified-card.tsx`, and `opportunities-view.tsx` for actual color usage patterns.

### Q1: Teal callout for business narrative — confirmed by existing code

The Dashboard already uses a teal callout for LLM-generated content: the "Your Next Move" section is `border-l-[3px] border-primary bg-primary/[0.04] rounded-r-xl` with a `Bot` icon. This is exactly the pattern proposed for the business narrative — a teal left-border callout that signals "this is Expliq's insight/interpretation."

The pattern is already established: **teal callout = Expliq's recommendation/interpretation**. The business narrative is the same category of content — LLM-generated insight about what a workflow means for the business.

### Q2: Revenue column color — amber, not teal

The Dashboard's `EstimateCard` component uses `deltaType` to determine color:
- `deltaType="positive"` → `text-primary` (teal) — used for "Time Saved"
- `deltaType="negative"` → `text-status-attention` (amber) — used for "At Risk"

So the existing convention is:
- **Teal** = positive value / savings / opportunity
- **Amber** = risk / exposure / revenue impact

This means the Business Case three-column card should follow the same convention:

| Column | Left-border color | Metric color | Rationale |
|--------|------------------|--------------|-----------|
| **Failure Impact** | Red (`border-status-critical`) | `text-status-critical` | Danger/failure — red throughout the app |
| **Time Savings** | Teal (`border-primary`) | `text-primary` | Positive value — matches Dashboard "Time Saved" |
| **Revenue Connection** | Amber (`border-status-attention`) | `text-status-attention` | Revenue exposure/risk — matches Dashboard "At Risk" |

This gives each column a distinct color AND is consistent with how the Dashboard already presents these value types. Three colors (red, teal, amber) map to the three semantic categories the design system already defines: critical, positive, attention.

### Q3: Connection type pill colors — gray is fine, nothing better from research

Checked the research and existing code. The Dashboard's system chips use neutral styling (`bg-surface border border-border text-text-secondary`). Connection type is a classification, not a severity — "error handler" isn't worse than "sub-workflow", they're just different types. The research (NN/g, PatternFly) says: only use color when it adds meaning. Color on connection types would imply a severity hierarchy that doesn't exist.

Gray pills (`bg-foreground/5 text-text-tertiary`) are the right call. Consistent with how other neutral categorical data is displayed.

### Q4: Evidence sub-sections — no merging

Acknowledged. All 6 sub-sections stay separate:
1. Execution Stats (KV grid)
2. Error Handling (amber callout)
3. Credentials (pill list)
4. Detectability (badge + text grid)
5. Key Findings (bordered mini-rows)
6. Complexity (compact KV pairs)

### Q5: Key findings cap — confirmed

Capped with "Show N more" toggle. Default visible count TBD during implementation (proposal: 3).

i dont fucking care. what is convention?

Checked existing code. Two truncation patterns in the app:
- `line-clamp-2` on UnifiedCard descriptions — hard CSS clamp, no toggle
- Dashboard attention items: shows all, but adds "View all on Process Map →" link when `>= 5` items

No existing "Show N more" toggle anywhere in the codebase. Industry convention for bulleted lists inside collapsible/detail sections is typically 3-5 visible items. Given that key findings are inside an already-collapsed evidence section (so the user explicitly asked to see them), showing more by default makes sense. **Cap at 5, with "Show N more" toggle for the rest.** 5 aligns with the Dashboard's threshold for "this is getting long."

---

## Round 4 — Refinement Review (Codebase Verification)

Delegated a full codebase investigation to verify every assumption in the spec and brainstorming proposal against the actual code. Here are the findings.

### All Discussion Items — Status

All 5 questions from the brainstorming are resolved through Rounds 1-3:

| Q | Decision | Grounding |
|---|----------|-----------|
| Q1 — Narrative callout color | **Teal** | Dashboard "Your Next Move" uses `border-l-[3px] border-primary bg-primary/[0.04]` for LLM content |
| Q2 — Revenue column color | **Amber** (not teal) | Dashboard EstimateCard: `deltaType="negative"` → `text-status-attention` for "At Risk" |
| Q3 — Connection type pills | **All gray** | `bg-foreground/5 text-text-tertiary` — classification, not severity |
| Q4 — Evidence sub-sections | **No merging**, all 6 separate | Per user decision |
| Q5 — Key findings cap | **5 visible**, "Show N more" toggle | Aligns with Dashboard's `>= 5` threshold |

### Proactive Flags — Issues Found in Codebase

#### 1. HIDDEN SCOPE: `normalizeTier()` not exported (blocks AC #13)

The spec says to "reuse or extract `normalizeTier()` from `opportunities-data.ts`." Codebase check: `normalizeTier()` exists at `src/lib/opportunities-data.ts:43-49` but is **NOT exported** — it's module-private. The Detail page can't import it.

**Recommendation:** The spec should explicitly call out extracting `normalizeTier()` to a shared utility (e.g., `src/lib/format-utils.ts`) or exporting it from opportunities-data.ts. This is a small change but if not spec'd, the dev team may duplicate the logic.

#### 2. HIDDEN SCOPE: No connection type derivation utility (blocks AC #21)

The spec says connection type labels are "derived heuristically" from `rawWorkflowJson` — checking `settings.errorWorkflow` and `settings.callerIds`. Codebase check: `src/lib/connected-automations.ts` uses this logic internally to build the upstream/downstream ID arrays, but **does NOT expose a function to derive the label** for a given connection pair.

The Detail page needs a utility like `getConnectionType(sourceId, targetId, automations): "error-handler" | "sub-workflow" | "logical"`. This doesn't exist yet.

**Recommendation:** Add this as an explicit scope item. It's a new utility function, not just rendering existing data.

#### 3. HIDDEN SCOPE: No confidence normalization utility

The spec says normalize confidence with `.toLowerCase().replace(/\s+/g, "-")` before passing to `ConfidenceBadge`. This is inline code, not a utility. The Opportunities page does this inline too (`opportunities-view.tsx:465`). No shared utility exists.

**Recommendation:** This is fine as inline normalization (consistent with Opportunities). But if `normalizeTier()` is being extracted to a shared utility (Flag #1), confidence normalization should go there too for consistency.

#### 4. UNGROUNDED ASSUMPTION: `governanceDot` is computed, not stored

The spec's header section references "governance level" and AC #1 says "StatusDot with governance level." The `governanceDot` is NOT a stored field on Automation — it's computed at query-time via `computeGovernanceDot()` from `src/lib/risk-engine.ts:38-75`. The Dashboard (`page.tsx`) and Process Map (`process-map-data.ts`) both call this function when preparing data.

**Recommendation:** Not a problem — just needs to be clear in the spec that the Detail page's data layer must call `computeGovernanceDot()` to derive the status. The spec currently implies it's a field on the model.

#### 5. PREREQUISITE PATCH: Already applied

The spec says "Prerequisites: Pipeline patch needed — add `timeSavingsConfidence String?` and `revenueConfidence String?`." Codebase check: **Both fields already exist** in `prisma/schema.prisma` (lines 94-95) and in the LLM pipeline output schema. The prerequisite is satisfied — the spec's prerequisites section is stale.

#### 6. SPEC INCONSISTENCY: Connection type pill colors in proposal vs. spec

The original spec (Section 6, Connected Automations) doesn't mention connection type pills or colors at all — it just says "connection type label." The brainstorming proposal initially proposed colored pills (red/amber/gray) but Q3 resolved to all gray. The spec needs to be updated to reflect the gray pill treatment.

Additionally, the original spec's Connected Automations section (line 217 of brainstorming) still shows the OLD colored pill proposal. When the spec is updated, only the gray treatment should appear.

#### 7. MISSING ACCEPTANCE CRITERIA: Visual layout

The current spec has no ACs for the visual layout decisions from the brainstorming. The card-based container approach, callout patterns, pill treatments, KV grids, and color conventions are all new requirements that need to be reflected in the ACs. Without this, the dev team will implement the old "scrollable sections, not cards" layout.

### No Other Issues Found

- All Automation model fields exist in schema ✅
- All referenced components exist with correct prop types ✅
- BusinessProcess model has `steps` Json and `maturityLevel` ✅
- Recommendation model has all needed fields including `automationId` and `processId` ✅
- `resolveStepScope()` exported from dashboard-data.ts ✅
- `computeGovernanceDot()` exported from risk-engine.ts ✅
- EstimateCard deltaType convention confirmed: positive=teal, negative=amber ✅
- ProcessCard has maturity badge styling built in ✅

---

## Refinement Applied

Spec `specs/16-detail.md` updated to reflect all agreed decisions from Rounds 1-4. Changes made:

### Prerequisites
- Removed stale pipeline patch prerequisite (already applied during Epic 15 cycle)

### Scope — Complete Rewrite
- **Visual layout principles** section added: every section is a white card container, standard section header pattern, existing design vocabulary reused
- **Shared utilities** section added: `normalizeTier()` extraction, `normalizeConfidence()` helper, `getConnectionType()` new utility, `computeGovernanceDot()` clarification (computed, not stored)
- **Header**: now a Status Card (white card, two-row layout with identity + metadata rows)
- **Business Narrative**: now a Teal Callout Card (`border-l-[3px] border-primary bg-primary/[0.03]`) with LLM indicator icon — mirrors Dashboard "Your Next Move" pattern
- **Business Case**: three-column grid with color-coded left borders: red (failure), teal (time savings), amber (revenue) — follows Dashboard EstimateCard color convention
- **Recommendations**: List Card with structured clickable rows, TierBadge + impact metric, count badge in header
- **Process Position**: Visual Step Card with horizontal pill trail (filled = current, ghost = others)
- **Connected Automations**: card with upstream/downstream sub-sections, all-gray connection type pills
- **Evidence**: collapsible card with 6 structured sub-sections (KV grid, amber callout, pills, detectability grid, bordered mini-rows capped at 5, compact KV pairs)

### Acceptance Criteria — Rewritten
- Added ACs 1-3 for visual layout (card containers, section headers, monospace numbers)
- Added ACs 4-5 for shared utilities (normalizeTier export, getConnectionType)
- Renumbered all ACs (was 1-37, now 1-42)
- Header ACs updated: clarify `computeGovernanceDot()` is called at query-time, two-row card layout
- Business Narrative ACs: teal callout card with icon
- Business Case ACs: three-column grid with red/teal/amber color coding, N/A handling
- Recommendations ACs: card container, styled rows with hover/click, empty state with link
- Process Position ACs: pill trail with filled/ghost distinction
- Connected Automations ACs: gray pills, hidden when empty, `getConnectionType()` usage
- Evidence ACs: 6 sub-sections with specific visual treatments, key findings capped at 5 with "Show more"
- Added render test for key findings cap (AC 39)

### Open Questions
- OQ 2 updated: now references `getConnectionType()` utility and gray pills
- OQ 3 updated: notes fields already exist
- OQ 4 added (resolved): visual layout decisions documented
