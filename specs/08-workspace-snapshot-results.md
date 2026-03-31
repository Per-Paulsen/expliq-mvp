---
tags:
  - type/results
  - status/done
  - epic/08
---

# Epic 08 — Workspace Snapshot: Results

> Upstream: [Epic 08: Workspace Snapshot](08-workspace-snapshot.md)

## What Was Built

The Workspace Snapshot dashboard (`/`) — the executive summary landing page showing aggregate health metrics, exposure rankings, and structural indicators across all automations in the workspace.

### Architecture
- **Server-only component tree** — no `"use client"` needed since the dashboard is read-only with only link navigation
- **Async server component** (`page.tsx`) fetches automations + exposure rankings in parallel, enriches with risk engine, computes metrics
- **Presentational component** (`snapshot-dashboard.tsx`) receives pre-computed `SnapshotData` as props for testability
- **Pure metrics functions** (`snapshot-metrics.ts`) handle all computation — no React, no DB dependencies

## Key Files Created/Modified

| File | Purpose |
|------|---------|
| `src/lib/snapshot-types.ts` | `SnapshotMetrics`, `SnapshotAutomation`, `SnapshotData` interfaces |
| `src/lib/snapshot-metrics.ts` | Pure functions: `computeSnapshotMetrics`, `getRecentlyChanged`, `getMultiSystemAutomations` |
| `src/components/snapshot-dashboard.tsx` | Presentational server component — metrics row, exposure rankings, structural indicators, empty state |
| `src/app/(app)/page.tsx` | Async server component — parallel data fetch, risk engine enrichment, Suspense with skeleton fallback |
| `src/app/(app)/error.tsx` | Error boundary for root app route |
| `src/__tests__/snapshot-metrics.test.ts` | 16 unit tests for pure metric functions |
| `src/__tests__/snapshot-dashboard.test.tsx` | 20 component tests for dashboard rendering |
| `src/__tests__/home.test.tsx` | Updated — 2 tests for empty state rendering |

## Decisions and Deviations from Spec

1. **Server-only component tree** — Unlike the Portfolio (which uses a "use client" orchestrator for filtering/sorting/URL state), the Snapshot has no interactive state. All navigation is via Next.js `<Link>` components. This means no client component boundary, no date serialization, smaller bundle.

2. **Separate presentational component** — Extracted `SnapshotDashboard` from `page.tsx` to make rendering testable without mocking async server component internals. The component receives `SnapshotData` props — same pattern as Portfolio's server/client split but without the "use client" directive.

3. **`automationLastUpdated` kept as `Date`** — Since there's no client component boundary, dates stay as native `Date` objects throughout. `formatRelativeTime()` receives `.toISOString()` at render time.

4. **Skeleton loading state** — Added `SnapshotSkeleton` inline in `page.tsx` using the `Skeleton` component from shadcn/ui. Shows approximate layout: 5 metric card skeletons + 2 ranking skeletons + 2 indicator skeletons.

5. **Exposure rankings show all entries** — The spec doesn't specify a limit on ranking rows. All systems and owners are shown. For the seed data this is 15 systems and 5 owners.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run test` (244 tests, 18 files) | Pass |
| `npm run lint` | Pass (0 errors, 1 pre-existing warning) |
| `npm run build` | Pass |

### Test Coverage (38 new tests)
- `snapshot-metrics.test.ts`: 16 tests — computeSnapshotMetrics (empty, total, high-impact, high-risk, missing owners, overdue reviews, mixed), getRecentlyChanged (empty, within 7 days, excludes null dates, sorted desc, custom days), getMultiSystemAutomations (empty, 3+ systems, sorted desc, custom minSystems)
- `snapshot-dashboard.test.tsx`: 20 tests — heading, all 5 metric card values and link URLs, system/owner exposure rendering and link targets, "Unassigned" owner links to `_none`, recently changed items with times, multi-system items with badges, "View all" link visibility, empty state rendering and settings link, empty section messages
- `home.test.tsx`: 2 tests — empty state renders heading, empty state shows settings link

### Playwright E2E — Pass

Verified via Playwright MCP on 2026-03-10. Logged in as `seed-mock@expliq.dev`.

**Metric cards:**
- [x] Total Automations: 17
- [x] High Impact: 9
- [x] High Risk: 7
- [x] Missing Owners: 5
- [x] Overdue Reviews: 8
- [x] All 5 cards clickable, navigate to correct Portfolio filter URLs

**System exposure ranking:**
- [x] 15 systems displayed with visual bars sorted by exposure score
- [x] Clicking a system navigates to Portfolio filtered by that system

**Owner exposure ranking:**
- [x] 5 owner entries displayed with visual bars
- [x] "Unassigned" entry links to `?owner=_none`
- [x] Named owners link to `?owner={name}`

**Structural indicators:**
- [x] Recently Changed: 5 items shown with relative times, "View all" link present
- [x] Multi-System Automations: 5 items shown with system badge tags, "View all" link present

**Navigation:**
- [x] "High Risk" card → Portfolio shows 7 filtered automations
- [x] System click → Portfolio filtered by that system

## Risks for Future Epics

1. **No debouncing on exposure rankings** — All ranking rows are clickable links. If the list grows large, this could create many DOM nodes. Fine at MVP scale.

2. **3 parallel DB queries** — `getSystemExposure` and `getOwnerExposure` each do their own `findMany` query (same table, same filter). The page also queries automations directly. This means 3 queries hitting the same table. At MVP scale this is fine, but a future optimization could pass the already-fetched automations to the exposure functions to avoid redundant queries.

3. **`formatRelativeTime` shared** — Imported from `src/lib/format.ts` (extracted in epic 07). Future epics should continue using this shared utility.

4. **Error boundary at `(app)/error.tsx`** — This is one of the four route-level error boundaries spec 09 requires. Epic 06 created `automations/error.tsx`, epic 07 created `automations/[id]/error.tsx`, and now this epic adds `(app)/error.tsx`. Only `settings/error.tsx` remains for epic 09.

## Open Questions

None.

## Commit

`be8231a` — `feat: implement epic 8 — workspace snapshot`

---

---

## Patch: Dashboard UX Redesign — Exercise 21 (2026-03-31)

**What changed:** Redesigned the Workspace Snapshot dashboard from plain cards/bars to a professional UI using design tokens extracted from Figma Make via MCP sub-agent. Same data, same features, better presentation.

**Files modified:**
- `src/components/metric-card.tsx` — New: card with title, value, subtitle, icon, accent color
- `src/components/expliq-card.tsx` — New: clean container card with rounded borders
- `src/components/expliq-badge.tsx` — New: badge variants (risk/impact/system/status/healthy/attention)
- `src/components/progress-bar.tsx` — New: color-coded progress bar (teal→green→amber→red by value)
- `src/components/snapshot-dashboard.tsx` — Rewritten: uses new components, icons, subtitles, colored bars, two-column layout
- `src/__tests__/snapshot-dashboard.test.tsx` — 3 tests adapted for multiple text matches (same assertions, tolerant of repeated labels)

**Why:** Dashboard feedback: "overwhelming and asymmetric." Exercise 21 required demonstrating context engineering with a sub-agent for Figma design extraction.

**Sub-agent workflow (exercise 21):**
1. Figma MCP connected to Figma Make file (key: 3bG7mlpucVffGMdoAFPcgc, version 2)
2. `figma-design-extractor` sub-agent extracted: colors (neutral + teal accent), typography (Inter), spacing (8px grid), component specs (MetricCard, ExpliqCard, ExpliqBadge, ProgressBar)
3. Main agent implemented dashboard from extracted tokens
4. Playwright verified visual output

**Verification:**
| Check | Result |
|-------|--------|
| `npm run test` | Pass (244 tests) |
| `npm run lint` | Pass (0 errors) |
| `npm run build` | Pass |
| Playwright visual | Dashboard renders with new design, real data verified |

**Commit:** `80ab674` — `feat: redesign dashboard with Figma v2 design tokens (exercise 21)`

---

## Related

- [Spec](08-workspace-snapshot.md)
- [Brainstorming](08-workspace-snapshot-brainstorming.md)
