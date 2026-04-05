# Patch: Design System Overhaul

> Triggered by: [Design Spike](../design-spike.md) — light theme + card-based layout approved
> Status: **In progress**

---

## Plan

| Step | Action | Command | Status |
|------|--------|---------|--------|
| 1 | Add Amendment T to `prd-2.0-decisions.md` | Manual edit | ✅ Done |
| 2 | Update `specs/design-guidelines.md` + cross-references | Manual edit | ✅ Done |
| 3 | Patch Epic 12 — light theme, font, components, sidebar, auth | `/patch 12 light-theme 'Switch to light theme per Amendment T'` | ☐ Pending |
| 4 | Patch Epic 13 — rebuild dashboard with card components | `/patch 13 card-layout 'Rebuild dashboard with UnifiedCard/EstimateCard/ProcessCard from design spike demo'` | ☐ Pending |
| 5 | Refine Epics 14-17 against new design direction | `/refine_all_ind` | ☐ Pending |
| 6 | Commit + update results files | Manual | ☐ Pending |

---

## Step 3 — `/patch` Epic 12: Light Theme

**Command:** `/patch 12 light-theme 'Switch from dark to light theme per Amendment T and specs/design-guidelines.md. Changes: globals.css (light colors), layout.tsx (Plus Jakarta Sans + JetBrains Mono fonts), sidebar (dark sidebar on light content), auth pages (light bg + white form card + teal CTA), all shared components (update for light backgrounds). Reference: specs/design-guidelines.md sections 1-3 and 6-9.'`

**Files to change:**
| File | What changes |
|------|-------------|
| `src/app/globals.css` | Replace dark hex values with light theme: bg #f5f5f7, card #fff, text #111827/#6b7280/#9ca3af, borders #e5e7eb. Keep accent teal + status colors. |
| `src/app/layout.tsx` | Swap DM_Sans/DM_Mono → Plus_Jakarta_Sans/JetBrains_Mono. Remove `className="dark"` from `<html>`. |
| `src/app/(app)/layout.tsx` | Add light background class to main content area |
| `src/app/(auth)/layout.tsx` | Light bg, white card wrapper for form |
| `src/app/(auth)/login/page.tsx` | Dark text, gray labels, teal button on white card |
| `src/app/(auth)/signup/page.tsx` | Same as login |
| `src/components/app-sidebar.tsx` | Dark sidebar (#111827 bg) on light content — or adapt colors |
| `src/components/status-dot.tsx` | Verify colors still work on light bg |
| `src/components/confidence-badge.tsx` | Update for light bg (dark text, colored borders) |
| `src/components/tier-badge.tsx` | Update for light bg |
| `src/components/impact-badge.tsx` | Update for light bg |
| `src/components/coverage-bar.tsx` | Gray track on white, teal fill, dark percentage text |
| `src/components/fact-card.tsx` | Dark text on white card |
| `src/components/empty-state.tsx` | Dark text, teal button on light bg |
| `src/components/collapsible-row.tsx` | Light borders, dark text |
| `src/components/slide-over-panel.tsx` | White bg panel, dark text |
| `src/app/(app)/error.tsx` | Light bg error page |

**Verification:** Start dev server, navigate all routes, verify light theme renders correctly. Login page, dashboard (empty + populated), settings, sidebar.

---

## Step 4 — `/patch` Epic 13: Card Layout

**Command:** `/patch 13 card-layout 'Rebuild dashboard-view.tsx with card components from design spike demo (src/app/(app)/demo/page.tsx section 6). Create UnifiedCard, EstimateCard, ProcessCard as reusable components in src/components/. Reference: specs/design-guidelines.md section 4-5 and demo page v5.'`

**Files to change:**
| File | What changes |
|------|-------------|
| `src/components/unified-card.tsx` | NEW — shared card for attention + recommendation items |
| `src/components/estimate-card.tsx` | NEW — KPI card with confidence badge + methodology link |
| `src/components/process-card.tsx` | NEW — process coverage card with big bar + metrics |
| `src/components/kpi-card.tsx` | NEW — simple fact card (replaces fact-card.tsx or extends it) |
| `src/components/dashboard-view.tsx` | REWRITE — use new card components, match demo page v5 layout |
| `src/app/(app)/page.tsx` | May need data adjustments for new card props |
| `src/__tests__/dashboard.test.tsx` | Update for new component structure |

**Verification:** Seed data + browser verification showing all 6 dashboard sections with proper cards.

---

## Step 5 — `/refine_all_ind`

**Command:** `/refine_all_ind`

Epics 14-17 may reference dark theme, old component names, or visual patterns superseded by Amendment T. The refiner reads all results files (including the patch results from Steps 3-4) and updates unbuilt specs accordingly.

---

## Decisions Log

All decisions from the design spike are recorded in:
- [specs/design-spike.md](../design-spike.md) — full iteration history + final decisions
- [specs/design-guidelines.md](../design-guidelines.md) — authoritative implementation spec
- [prd-2.0-decisions.md](../../prd-2.0-decisions.md) Amendment T — formal PRD record
