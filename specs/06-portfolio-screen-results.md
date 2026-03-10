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

### Playwright E2E
Playwright MCP was unavailable in this session. Verification was done via code review + dev server health check. Full browser verification recommended before moving to next epic.

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
