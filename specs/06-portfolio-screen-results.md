# Epic 06 — Portfolio Screen: Results

## What Was Built

The Portfolio screen (`/automations`) — the primary automation list view with search, filtering, sorting, and card-based display. All automations in the workspace (excluding removed) are shown with governance badges, status, impact, risk level, and system tags.

### Architecture
- **Server component** (`page.tsx`) fetches all automations + connector config, enriches with risk-engine computed fields, serializes to client
- **Client component** (`portfolio-view.tsx`) handles all interactivity: URL-synced filters via `useSearchParams` + `router.replace`, search, sort, collapsible filter panel
- **Pure filter logic** (`portfolio-filters.ts`) — zero React dependencies, fully unit tested
- Filter chip counts are global (always show total workspace counts regardless of active filters)

## Key Files Created

| File | Purpose |
|------|---------|
| `src/lib/portfolio-types.ts` | Shared types: `PortfolioAutomation`, `PortfolioFilters`, `GlobalCounts`, attention signal constants |
| `src/lib/portfolio-filters.ts` | Pure filter/search/sort/URL-parse logic (7 exported functions) |
| `src/app/(app)/automations/page.tsx` | Async server component — data fetch + risk engine enrichment |
| `src/app/(app)/automations/error.tsx` | Route error boundary |
| `src/components/portfolio-view.tsx` | Main client orchestrator — URL state, memoized filtering, renders sub-components |
| `src/components/portfolio-header.tsx` | Search input + sync status indicator |
| `src/components/portfolio-filter-section.tsx` | Collapsible filter panel with 6 FilterChips rows |
| `src/components/portfolio-filter-chips.tsx` | Reusable chip row (label, chips with counts, clear button) |
| `src/components/portfolio-active-filters-bar.tsx` | Compact dismissible chips for active filters (shown when panel is collapsed) |
| `src/components/portfolio-sort-bar.tsx` | Sort dropdown + asc/desc toggle + result count |
| `src/components/portfolio-automation-card.tsx` | Automation card with name, badges, systems, owner, description, governance signals, timestamps |
| `src/components/ui/badge.tsx` | shadcn/ui Badge component |
| `src/components/ui/card.tsx` | shadcn/ui Card component |
| `src/components/ui/collapsible.tsx` | shadcn/ui Collapsible component (base-ui/react) |
| `src/components/ui/select.tsx` | shadcn/ui Select component |
| `src/__tests__/portfolio-filters.test.ts` | 49 unit tests for pure filter logic |
| `src/__tests__/portfolio-automation-card.test.tsx` | 13 component tests for automation card |
| `src/__tests__/portfolio-view.test.tsx` | 7 component tests for orchestrator |

## Decisions and Deviations from Spec

1. **Client-side filtering instead of Prisma `contains`** — The spec mentions Prisma `contains` queries for search, but since we load all automations anyway (no pagination for MVP), search is done client-side with `toLowerCase().includes()`. Equivalent behavior at this scale, simpler implementation.

2. **Filter section always collapsed by default** — The spec says "collapsed by default, auto-expands when any filter is active via URL params." We changed this per user feedback: the filter panel is always collapsed by default, even with URL params. Instead, a compact **active filters bar** shows dismissible chips (e.g., `Risk: High ×`) when the panel is collapsed and filters are active. This feels less intimidating when navigating from the dashboard with pre-selected filters.

3. **Collapsible uses base-ui/react** — The shadcn/ui Collapsible component uses `@base-ui/react` (not Radix) with a `render` prop on `CollapsibleTrigger`, consistent with the sidebar pattern in this project.

4. **formatRelativeTime duplicated** — Both `portfolio-header.tsx` and `portfolio-automation-card.tsx` have their own `formatRelativeTime` helper. Could be extracted to a shared utility, but kept local to avoid over-engineering for MVP.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run test` (178 tests, 14 files) | Pass |
| `npm run lint` | Pass (0 errors, 1 pre-existing warning) |
| `npm run build` | Pass |
| Dev server responds on `/automations` | Pass (307 redirect when unauthenticated) |

### Test Coverage (69 new tests)
- `portfolio-filters.test.ts`: 49 tests — computeGlobalCounts, filterAutomations (all filter types, AND/OR logic, _none sentinel, updatedAfter, minSystems), sortAutomations, parseFiltersFromParams, filtersToSearchString, hasActiveFilters, getActiveFilterChips
- `portfolio-automation-card.test.tsx`: 13 tests — name/description rendering (including null fallbacks), status/platform badges, system tags, owner, governance badges, timestamps, link target
- `portfolio-view.test.tsx`: 7 tests — basic rendering, empty workspace state, no results state, card count, sync status

### Playwright E2E — Pass

Verified via Playwright MCP on 2026-03-10. Logged in as `seed-mock@expliq.dev`, navigated to `/automations`.

**Checks:**
- [x] 17 automation cards visible (15 processed + 2 unprocessed; 2 removed excluded)
- [x] Unprocessed automations show "Untitled automation" / "No description available"
- [x] Sync status shows "Last synced: 3 hours ago" (not "Never synced")
- [x] Search filters by name/description (case-insensitive), result count updates (e.g., "stripe" → 4 results)
- [x] Filter section collapsed by default; "Filters" button expands 6 rows (Systems, Platform, Owner, Attention, Impact, Risk)
- [x] Chips show counts in parens; clicking toggles filter; "Clear" resets row
- [x] Chip counts are global (don't change when other filters are active)
- [x] When collapsed with active filters: compact active-filters bar shows dismissible chips (e.g., "Risk: high ×")
- [x] Clicking × removes that filter; "Clear all" resets everything
- [x] Owner filter has "No owner (5)" chip; selecting it shows only 5 ownerless automations (URL: `?owner=_none`)
- [x] Attention filter has all 5 signals: Documentation outdated (8), Overdue review (8), Automation stale (6), No owner assigned (5), Inactive (3)
- [x] Impact shows Critical (3)/High (6)/Medium (3)/Low (3); Risk shows High (7)/Medium (6)/Low (4)
- [x] URL-only filters: `?updatedAfter=7d` → 11 results with "Updated: last 7 days" tag; `?minSystems=3` → 10 results with "Systems: 3+ systems" tag
- [x] Sort dropdown (3 options: Automation Last Updated, Documentation Last Updated, Name) + asc/desc toggle work
- [x] Card click navigates to `/automations/[id]` (stub page: "Automation Detail")
- [x] Filter state reflected in URL; browser back/forward preserves sort/filter state
- [x] Impossible search shows "No automations match your current filters" + "Clear all filters" button
- [x] No crashes on any interaction

## Risks for Future Epics

1. **Card click navigates to `/automations/[id]`** — The detail page (epic 07) is still a stub. Card clicks will land on the placeholder page until epic 07 is implemented.

2. **No debouncing on search** — Each keystroke triggers a URL replace via `router.replace`. At MVP scale this is fine (all filtering is client-side and instant), but could cause excessive URL history if needed later.

3. **`formatRelativeTime` is duplicated** — Exists in both `portfolio-header.tsx` and `portfolio-automation-card.tsx`. If epic 07 or 08 need the same helper, consider extracting to `src/lib/utils.ts`.

4. **Unprocessed automations** — Automations with null LLM fields (name, description) render with fallbacks ("Untitled automation", "No description available"). They still appear in the list and can be filtered. Impact filter won't include them (impactLevel is null).

5. **Global filter counts use full automation list** — If the workspace grows beyond MVP scale, computing counts on every render could become expensive. Currently fine for tens to low hundreds of automations.

## Open Questions

None.

## Commit

`585fc12` — `feat: implement epic 6 — portfolio screen`

---

## Patch: Vertical card layout with two-column card design (2026-03-10)

**What changed:** Portfolio cards now stack vertically (single column) instead of a responsive 1/2/3-column grid. Each card uses a two-column internal layout: primary info (title, risk badge, impact badge, systems, description, attention signals) on the left; secondary metadata (status, platform, owner, timestamps) right-aligned on the right.

**Files modified:**
- `src/components/portfolio-view.tsx` — Removed `md:grid-cols-2 lg:grid-cols-3` from grid container
- `src/components/portfolio-automation-card.tsx` — Added `IMPACT_COLORS` map, removed `CardHeader`/`CardTitle`, restructured JSX to two-column flex layout

**Why:** Multi-column grid made sort order confusing (ambiguous reading direction). Vertical stacking gives clear top-to-bottom order. Two-column card layout puts key governance info (title, risk, impact, systems) at top-left for fast scanning.

**Verification:**
| Check | Result |
|-------|--------|
| `npm run test` | Pass (178 tests) |
| `npm run lint` | Pass |
| `npm run build` | Pass |
| E2E verification | Playwright — cards stack vertically, two-column layout correct, sort order clear, navigation works |

**Commit:** `98dd767` — `fix: portfolio cards vertical layout with two-column card design`

---

## Patch: Clarify card badge labels and remove redundant Inactive attention signal (2026-03-10)

**What changed:** Fixed inconsistent/unclear labels on portfolio card elements and removed the redundant "Inactive" attention signal.

**Files modified:**
- `src/components/portfolio-automation-card.tsx` — Risk badge: "medium" → "medium risk"; system names capitalized; timestamps: "Updated:" → "Automation updated:", "Docs:" → "Docs updated:"
- `src/lib/portfolio-types.ts` — Removed "inactive" from `ATTENTION_SIGNAL_MAP` and `ATTENTION_LABELS`
- `src/__tests__/portfolio-automation-card.test.tsx` — Updated timestamp assertions

**Why:** Badge labels were inconsistent (impact had "impact" label but risk didn't). Timestamps were abbreviated and unclear. "Inactive" appeared as both a red attention badge and gray status badge, causing confusion.

**Verification:**
| Check | Result |
|-------|--------|
| `npm run test` | Pass (178 tests) |
| `npm run lint` | Pass |
| `npm run build` | Pass |
| E2E verification | Playwright — all labels correct, no redundant Inactive badge |

**Commit:** `18e878a` — `fix: clarify card badge labels and remove redundant Inactive attention signal`
