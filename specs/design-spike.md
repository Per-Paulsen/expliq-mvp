# Design Spike — Visual Design System

> Parallel to: [Design Guidelines](design-guidelines.md) | [PRD §15](../prd-2.0-decisions.md)
> Triggered by: Dashboard Epic 13 review — dark theme rejected, text-in-boxes layout rejected
> Goal: Prototype and validate a light, card-based visual design system before committing to spec changes

---

## Context

Epic 12 implemented a dark advisory theme per PRD §15. Epic 13 built the Dashboard using it. User feedback:
- Dark theme: unreadable, cold, flat
- Text too small across the board (9-11px body text)
- Layout is "text in boxes" — no structured components, no scannable units
- Revenue/savings numbers not visible or explained
- "Your Next Move" was a paragraph instead of a structured action card
- Process coverage bar too small
- Font (Geist → Inter → DM Sans) all rejected as not modern enough

## Reference Dashboards

- [FlowDash](https://themeforest.net/item/flowdash-saas-admin-dashboard-template/25586651) — light, card-based KPIs with sparklines
- [Fillow](https://fillow.dexignlab.com/xhtml/index.html) — light gray bg, white cards, large numbers, progress rings, colorful accents

## PRD Design Decisions Extracted (from §3, §4, §5, §7, §9, §15)

### Dashboard Layout (§3) — McKinsey Pyramid

| Order | Section | PRD Description | Card/Component Type |
|-------|---------|----------------|-------------------|
| 1 | Delta Banner | Re-sync changes. Top of page, below title. Compact 1-2 lines, accent-left border, dismissible. | Banner component |
| 2 | Your Next Move | AI banner: **1 specific recommendation** with reasoning, referencing workflow names. Links to Priorities. | Shows the top recommendation — reuse the Recommendation card component |
| 3 | Facts Bar | Workflow count, process count, system count, active count, recommendation count. Estimates secondary. | KPI card row |
| 4 | Two sections | Left: Attention items (workflows with issues → Detail). Right: Top Opportunities (top 3 recs → Priorities). | Left: Alert cards. Right: Recommendation cards (same component as used in Priorities page) |
| 5 | Process Coverage | Table: process name, existing/recommended count, coverage bar, reliability indicator. | Process cards or table rows |
| 6 | Systems Compact | One line: names with workflow counts. | System chips |

**Key PRD decisions:**
- "Your Next Move" IS a recommendation — it should look like one (same card used on Priorities page)
- Attention items link to **Detail page** (`/automations/[id]`) — they're about the WORKFLOW
- Opportunities link to **Priorities page** (`/opportunities?highlight={id}`) — they're about the RECOMMENDATION
- These are intentionally different destinations: diagnose (Detail) vs act (Priorities)

### Attention vs Opportunities — WHY They're Separate (§3, §7, §9)

| | Attention Items | Top Opportunities |
|---|---|---|
| **What** | Existing workflows with issues | LLM-generated recommendations |
| **Represents** | FACTS — observed problems | SUGGESTIONS — proposed actions |
| **Data source** | Risk engine (errorRate, detectability, impact) | LLM workspace analysis |
| **Confidence** | 100% — computed from user's data | Varies: Data-driven / Benchmark / AI-suggested |
| **Click destination** | Detail page — drill into the workflow | Priorities page — see full business case |
| **McKinsey analogy** | "Current state analysis" | "Recommended actions" |
| **Celonis analogy** | "Process conformance issues" | "Action recommendations" |

**This separation is intentional and well-reasoned.** But they CAN overlap — a technical_fix recommendation may address the same issue as an attention item.

### Recommendation Card Fields (§5)

The PRD defines a standard recommendation card used on the Priorities page:

| Field | Content |
|-------|---------|
| Title | One line |
| Business case | One line — the "so what" |
| Confidence badge | "Data-driven" / "Benchmark-based" / "AI-suggested" |
| Affected scope | "Ticket Lottery Lifecycle" / "3 workflows" |
| Deploy button | For n8n-deployable recommendations |
| Expand | → Slide-over panel with full detail |

**This same card should be reused wherever a recommendation appears** — on the Priorities page, in "Your Next Move" on the Dashboard, and in "Top Opportunities."

### Attention Card Fields (derived from §3, §4)

The PRD defines workflow cards for the Process Map (§4). The Dashboard attention items should use a similar compact format:

| Field | Source |
|-------|--------|
| Name + step label | Workflow name + stepName |
| Governance dot | Risk engine (healthy/attention/critical) |
| Specific metric | errorRate, or "inactive since X" — THE reason for attention |
| Impact badge | critical/high/medium/low |
| System flow | source → destination |
| Process | Which process this belongs to |

### Process Card Fields (§4, §8)

| Field | Source |
|-------|--------|
| Process name | LLM clustering |
| Coverage bar | existing / (existing + recommendations) |
| Maturity level | Composite assessment |
| Reliability | % successful executions |
| Value at stake | LLM estimate |
| Recommendation count | Per process |

### Navigation Map (§7)

```
DASHBOARD
  ├── "Your next move" click → Priorities (scrolled to recommendation)
  ├── Attention item click → Detail page of that workflow
  └── Top opportunity click → Priorities (scrolled to recommendation)
```

### Numbers Rule

PRD §15: "Metrics/numbers: Monospace (font-mono), semibold. All numbers, percentages, counts."

**Extension from design spike feedback:** All numbers should be visually highlighted — bold, monospace, and/or colored. Numbers should NEVER appear as plain body text. Even in sentences like "2 workflows updated", the "2" gets bold monospace treatment.

### Component Patterns (§15) — UPDATED from PRD

PRD §15 says "Tables/lists for data, NOT cards" for Priorities and Process Map pages. But for Dashboard, it says "Sections/banners" and "cards ARE appropriate for Dashboard summary widgets."

**Updated interpretation after design spike:**
- **Dashboard:** Cards for KPIs, process overview, attention items, opportunities. Cards work here because each item shows DIFFERENT information.
- **Process Map:** Collapsible rows (per PRD) — processes are compared vertically.
- **Priorities:** Table rows grouped by tier (per PRD) — recommendations are compared vertically.
- **Detail:** Scrollable sections (per PRD).

## Iterations

### v1 — Light theme, card prototypes

- Switched from dark to light theme (white cards on #f5f5f7 background)
- Created 5 card types: KPI, Action, Alert, Opportunity, Process
- Font: Plus Jakarta Sans
- Result: Much better readability. User approved the direction.
- Issue: "Your Next Move" was still a custom layout, not reusing the recommendation card.

### v2 — Delta banner, section reorder

- Added delta banner at top
- Moved "Your Next Move" before KPIs (McKinsey: answer first)
- Added systems section at bottom
- Made €2K/mo in next move bold + teal
- Result: Better section order.

### v3 — Unified card components

- "Your Next Move" now reuses the OpportunityCard component (same card as Priorities page)
- All numbers highlighted everywhere (delta banner, summaries)
- Result: Better card consistency. But user identified that Alert and Opportunity cards still look too different.

### v4 — Unified cards + PRD justification

- Created `UnifiedCard` component — same structure for both attention and recommendation cards
- Both show: name, description, metric, scope, process. Differ only by accent color and type-specific badges.
- Left accent border: red/amber for attention (severity), green/amber/gray for opportunities (tier)
- PRD justification comments added to demo section 6 (which PRD section each layout decision comes from)
- User approved the unified card approach

### v5 — Final approved version

**Delta banner:**
- Color-coded change types: amber for "updated", green for "improved", teal for "resolved"
- All numbers bold monospace
- Per PRD §3: "landscape changes, health changes, recommendation movement"

**Your Next Move:**
- Tinted teal background section (`bg-teal/4%`) with teal left accent border (3px)
- NOT a white card wrapper — a section like "Needs Attention" but visually highlighted
- Bot icon + "YOUR NEXT MOVE" heading in teal
- Contains the #1 recommendation as a standard UnifiedCard (recommendation type)
- Follow-up "Then" card below for the #2 action
- Total impact summary at bottom
- Per PRD §3: "1 specific recommendation with reasoning, referencing workflow names"

**KPI row:**
- Hard facts (Workflows, Processes, Active) as simple KPI cards — number + label only
- Estimated values (Time Saved, At Risk) as EstimateCard — includes:
  - Explanation text (what the estimate measures)
  - Confidence badge (Benchmark-based / AI-suggested)
  - "methodology →" link
- Per PRD §1: "Transparent reasoning — every insight traces back to the user's own data"
- Per PRD §3: "Estimates secondary with (methodology →)"

**Attention items (left column):**
- UnifiedCard with red/amber left accent border
- Shows: severity dot, workflow name, description, THE SPECIFIC METRIC (e.g., "31% error rate"), step position, process name
- Ordered by severity: critical first, then attention
- Click → Detail page (`/automations/[id]`) per PRD §7
- These are FACTS — observed problems from the risk engine

**Top Opportunities (right column):**
- UnifiedCard with green/amber left accent border
- Shows: tier badge (ACT NOW/INVESTIGATE/EXPLORE), sparkle icon, confidence badge, recommendation name, description, impact value, affected scope, process name
- Ordered by priorityOrder per PRD §5
- Click → Priorities page (`/opportunities?highlight={id}`) per PRD §7
- These are SUGGESTIONS — LLM-generated recommendations with confidence levels

**Process Coverage:**
- Process cards in 2×2 grid
- Each card: name, maturity badge, big coverage bar, coverage fraction, percentage, reliability, value at risk, recommendation count
- Maturity levels from PRD §8: Prototype → Emerging → Developing → Production → Optimized

**Connected Systems:**
- System name chips with bold workflow count

---

## Final Decisions (Approved)

### Theme: LIGHT
- Background: light gray (#f5f5f7)
- Cards: white with subtle shadow and rounded corners (12px radius)
- Text: dark gray for headings, medium gray for secondary
- Accent: teal (#0d9488) for interactive, positive, opportunity
- Status: green/amber/red as before
- Replaces: dark advisory theme from PRD §15

### Font: Plus Jakarta Sans
- Body: Plus Jakarta Sans (geometric, modern, readable)
- Numbers: JetBrains Mono (monospace for all metrics)
- Replaces: Geist Sans

### Card Component System
- `UnifiedCard` — shared by attention items AND recommendations. Same structure, different accent.
- `KpiCard` — for hard fact metrics (workflow count, process count, active count)
- `EstimateCard` — for LLM-estimated values with confidence badge + methodology link
- `ProcessCard` — for process coverage with big coverage bar + metrics grid
- Cards are REUSABLE — same component wherever the entity appears (dashboard, process map, priorities page)

### Layout Rules
- McKinsey pyramid: answer first (Your Next Move), evidence second (facts, attention, opportunities), detail last (processes, systems)
- All numbers highlighted: bold + monospace + color where meaningful
- Minimum body text: 15px
- Color = meaning only (unchanged from PRD §15)
- Estimates always show: confidence badge + explanation + methodology link

### What Changes from PRD §15
| PRD §15 Decision | Design Spike Override | Reason |
|---|---|---|
| Dark mode by default | **Light mode** | Unreadable, cold, flat. User preference for FlowDash/Fillow style. |
| Tables/lists for data, NOT cards | **Cards on Dashboard**, tables on Process Map + Priorities | Dashboard items show DIFFERENT info (cards work); Process Map/Priorities compare SIMILAR items (tables work). |
| Geist Sans font | **Plus Jakarta Sans** | More modern, rounder, better readability. |
| 11px section headers, 12-13px body | **15px minimum body, 12-13px labels** | Original sizes unreadable. |
| "Your Next Move" is a banner | **Tinted section with recommendation card inside** | Paragraph of text was unreadable; structured card is scannable. |

### What STAYS from PRD §15
- Color = meaning only (no decorative color)
- Accent teal (#0d9488) for interactive/opportunity
- Status colors: green/amber/red
- Section header style: uppercase, tracking-wider, semibold
- Monospace for all numbers
- Confidence visual pattern: solid (data-driven), dashed (benchmark), outline (AI-suggested)

---

## Implementation Plan

To incorporate these decisions into the codebase:

1. **Update `prd-2.0-decisions.md` §15** — Add an amendment recording the design spike decisions (light theme, Plus Jakarta Sans, card patterns). Don't delete original §15 — add "Amendment T: Design Spike" at the bottom.

2. **Update `specs/design-guidelines.md`** — Merge the final decisions into the guidelines file. Mark theme and font as decided (no longer open).

3. **Patch Epic 12** — Update globals.css (light theme), layout.tsx (font), all shared components (light styling). Use `/patch` skill.

4. **Patch Epic 13** — Rebuild dashboard-view.tsx using the approved card components. Use `/patch` skill.

5. **Refine Epics 14-17** — Run `/refine_all_ind` to update specs against the new design system decisions.

6. **Commit** — Single commit: "feat: design spike — switch to light theme + card-based layout"
