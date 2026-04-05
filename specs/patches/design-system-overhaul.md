# Patch: Design System Overhaul

> Triggered by: [Design Spike](../design-spike.md) — light theme + card-based layout approved
> Status: **In progress**

---

## Plan

| Step | Action | Skill | Status |
|------|--------|-------|--------|
| 1 | Add Amendment T to `prd-2.0-decisions.md` — record design spike decisions | Manual edit | ✅ Done |
| 2 | Update `specs/design-guidelines.md` — merge final decisions, mark theme/font decided | Manual edit | ☐ Pending |
| 3 | Patch Epic 12 — switch globals.css to light, swap font, update shared components | `/patch` | ☐ Pending |
| 4 | Patch Epic 13 — rebuild dashboard with approved card components | `/patch` | ☐ Pending |
| 5 | Refine Epics 14-17 — update specs against new design direction | `/refine_all_ind` | ☐ Pending |
| 6 | Commit everything | Manual | ☐ Pending |

## What Changes

### PRD Amendment T (Step 1)
- Light theme replaces dark
- Plus Jakarta Sans replaces Geist
- Card-based layout for Dashboard (tables still for Process Map + Priorities)
- Unified card component system
- Estimate cards with confidence + methodology
- Minimum 15px body text
- Numbers always highlighted
- "Your Next Move" = tinted section with recommendation card inside

### Epic 12 Patch (Step 3)
- `globals.css` — light theme colors
- `layout.tsx` — Plus Jakarta Sans + JetBrains Mono fonts
- Shared components — update for light backgrounds
- Sidebar — adapt to light theme (keep dark sidebar or switch to light TBD)
- Auth pages — adapt to light theme

### Epic 13 Patch (Step 4)
- `dashboard-view.tsx` — complete rewrite using UnifiedCard, EstimateCard, ProcessCard, KpiCard patterns from demo
- `page.tsx` — may need minor data adjustments
- Tests — update to match new component structure

### Spec Refinement (Step 5)
- Epics 14-17 reference dark theme / old component names
- Process Map (14) — still uses collapsible rows (correct per PRD) but card patterns inside may change
- Opportunities (15) — recommendation cards should match UnifiedCard pattern
- Detail (16) — sections may use cards instead of flat sections
- Settings (17) — light theme adjustments

---

## Decisions Log

All decisions from the design spike are recorded in [specs/design-spike.md](../design-spike.md) under "Final Decisions (Approved)".
