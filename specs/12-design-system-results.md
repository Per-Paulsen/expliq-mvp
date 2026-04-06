---
tags:
  - type/results
  - status/done
  - epic/12
---

# Epic 12 — Design System + App Shell: Results

> Upstream: [Epic 12: Design System + App Shell](12-design-system.md)

## What Was Built

Dark advisory design system (single dark theme, no toggle), 10 shared UI components, sidebar conversion with 4 R2 nav items and sync status, route scaffolding for all R2 pages, and auth pages dark theme.

## Key Files Created/Modified

### New Files (20)

| File | Purpose |
|------|---------|
| `src/components/status-dot.tsx` | StatusDot — healthy/attention/critical circle indicator |
| `src/components/system-flow.tsx` | SystemFlow — "System A → System B" display |
| `src/components/confidence-badge.tsx` | ConfidenceBadge — solid/dashed/outline variants |
| `src/components/tier-badge.tsx` | TierBadge — Act Now/Investigate/Explore |
| `src/components/impact-badge.tsx` | ImpactBadge — critical/high/medium/low |
| `src/components/collapsible-row.tsx` | CollapsibleRow — expand/collapse with chevron animation |
| `src/components/slide-over-panel.tsx` | SlideOverPanel — right-side overlay with Escape/click-outside/X close |
| `src/components/coverage-bar.tsx` | CoverageBar — proportional fill bar (0-100%) |
| `src/components/fact-card.tsx` | FactCard — label + monospace value + optional subtitle |
| `src/components/empty-state.tsx` | EmptyState — centered message + optional CTA button |
| `src/app/(app)/processes/page.tsx` | Process Map empty shell |
| `src/app/(app)/opportunities/page.tsx` | Opportunities empty shell |
| `src/__tests__/status-dot.test.tsx` | StatusDot tests (4 tests) |
| `src/__tests__/confidence-badge.test.tsx` | ConfidenceBadge tests (6 tests) |
| `src/__tests__/tier-badge.test.tsx` | TierBadge tests (6 tests) |
| `src/__tests__/impact-badge.test.tsx` | ImpactBadge tests (6 tests) |
| `src/__tests__/collapsible-row.test.tsx` | CollapsibleRow tests (5 tests) |
| `src/__tests__/slide-over-panel.test.tsx` | SlideOverPanel tests (5 tests) |
| `src/__tests__/route-smoke.test.tsx` | Route smoke tests (5 tests) |

### Modified Files (10)

| File | Change |
|------|--------|
| `src/app/globals.css` | Replaced oklch light/dark theme with single hex-based dark advisory theme. Added semantic CSS custom properties (status colors, surface hierarchy, text hierarchy). Mapped to Tailwind utilities via @theme inline. |
| `src/app/layout.tsx` | Added `className="dark"` to html element. Updated metadata description to "Automation Intelligence". |
| `src/app/(app)/layout.tsx` | Made async, fetches ConnectorConfig.lastSyncAt, passes to AppSidebar as prop. |
| `src/app/(app)/page.tsx` | Replaced R1 Workspace Snapshot with simple Dashboard empty shell. Removed all R1 imports. |
| `src/app/(app)/automations/[id]/page.tsx` | Replaced R1 Detail view with simple empty shell. Removed R1 imports. |
| `src/components/app-sidebar.tsx` | Converted to client component with usePathname. 4 nav items (Dashboard/Home, Process Map/Layers, Opportunities/Target, Settings/Settings). Active state via data-active. Sync status in footer with formatTimeAgo helper. |
| `src/app/(auth)/layout.tsx` | Added bg-background for dark theme. |
| `src/app/(auth)/login/page.tsx` | Dark theme: text-white heading, teal accent button (bg-primary). |
| `src/app/(auth)/signup/page.tsx` | Dark theme: same as login, updated subtitle text. |

### Deleted Files (1)

| File | Reason |
|------|--------|
| `src/app/(app)/automations/page.tsx` | R1 Portfolio page — replaced by /opportunities in R2. |

## Decisions and Deviations from Spec

1. **Hex colors instead of oklch** — The existing globals.css used oklch color space. Replaced entirely with hex values from the spec (§15). This is simpler and matches the spec exactly.

2. **Single dark theme, no .dark class needed** — Removed the `@custom-variant dark` line and `.dark` block. The `:root` block now contains dark advisory colors directly. Added `className="dark"` to `<html>` for shadcn component compatibility.

3. **Custom Tailwind utility classes via @theme** — Added `--color-status-healthy`, `--color-surface`, `--color-text-secondary` etc. mappings in the @theme inline block, enabling classes like `bg-status-healthy`, `text-text-secondary`, `bg-surface` throughout the codebase.

4. **Open question 1 resolved** — Sidebar "Synced X ago" reads from `ConnectorConfig.lastSyncAt` (not CompanyProfile.analyzedAt), as recommended in the spec.

5. **R1 pages replaced with empty shells** — Dashboard and Automation Detail pages stripped of all R1 content (prisma queries, risk-engine imports, snapshot-metrics). These will be populated by Epics 13 and 16 respectively.

6. **Old /automations route deleted** — The R1 Portfolio page at `/automations` was deleted. The route `/automations/[id]` remains for the Detail page.

7. **Settings page unchanged** — Already uses semantic shadcn classes that pick up the new theme automatically. No manual color overrides needed.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run test` (230 tests, 21 files) | Pass (183 skipped — R1 test files) |
| `npm run build` | Pass (all routes compile). Required `.next` cache clean after /automations/page.tsx deletion. |
| `npm run lint` | No new errors (pre-existing: research spike scripts, R1 stubs) |
| Playwright browser verification | Pass — all 5 routes verified (see below) |

### Playwright Browser Verification

1. **Dashboard (/)** — "Dashboard" heading, empty state text, sidebar with 4 nav items, "Synced 2h ago" in footer
2. **Process Map (/processes)** — "Process Map" heading, "Process data will appear after your first sync." text, Process Map active in sidebar
3. **Opportunities (/opportunities)** — "Opportunities" heading, correct empty state text, Opportunities active in sidebar
4. **Settings (/settings)** — Full Epic 10 functionality intact (n8n connection, tag selection, sync & analyze). Dark theme applied via semantic classes.
5. **Login (/login)** — Dark background, white heading, gray subtitle, teal accent button, properly themed inputs

### Test Coverage (37 new tests)

- `status-dot.test.tsx`: 4 tests — 3 status colors + className merging
- `confidence-badge.test.tsx`: 6 tests — 3 levels + styling variants
- `tier-badge.test.tsx`: 6 tests — 3 tiers + styling variants
- `impact-badge.test.tsx`: 6 tests — 4 levels + styling variants
- `collapsible-row.test.tsx`: 5 tests — collapsed default, expand on click, collapse on second click, defaultOpen
- `slide-over-panel.test.tsx`: 5 tests — open/closed rendering, Escape close, X button close
- `route-smoke.test.tsx`: 5 tests — Dashboard, Process Map, Opportunities, Automation Detail, Settings

## Risks for Future Epics

1. **R1 test files still skipped** — 9 test files with 183 tests remain `describe.skip`. When Epics 13-16 replace the R1 pages and their components, delete these test files and their associated R1 component/type files.

2. **R1 component files still exist** — `snapshot-dashboard.tsx`, `portfolio-view.tsx`, `automation-detail-view.tsx`, `portfolio-automation-card.tsx`, etc. are no longer imported by any page but still exist. They can be deleted when their replacement pages are built (Epics 13-16).

3. **R1 utility files still exist** — `snapshot-metrics.ts`, `snapshot-types.ts`, `automation-detail-types.ts`, `portfolio-filters.ts` etc. are no longer imported. Safe to delete during Epics 13-16.

4. **Tailwind custom utility classes** — Components use Tailwind classes mapped via @theme inline (e.g., `bg-status-healthy`, `text-text-secondary`). If future epics add new semantic colors, add them to both `:root` CSS vars AND the `@theme inline` block.

5. **Sidebar is now a client component** — Uses `usePathname()` for active state detection. The layout passes `lastSyncAt` as a serializable prop (Date → JSON). This pattern should continue for any server data the sidebar needs.

6. **Build cache stale after route deletion** — Deleting a page file (e.g., `/automations/page.tsx`) requires cleaning `.next` before rebuilding. Future epics that delete routes should `rm -rf .next` before `npm run build`.

## Open Questions

None.

## Commit

`359c5ea` — `feat: implement epic 12 — design system + app shell`

---

## Patch: Switch from dark to light theme (2026-04-05)

**What changed:** Replaced the dark advisory theme with a light theme per Amendment T and `specs/design-guidelines.md`. Background #f5f5f7, white cards, dark text #111827, light sidebar. Fonts changed from DM Sans/Mono to Plus Jakarta Sans/JetBrains Mono.

**Files modified:**
- `src/app/globals.css` — All `:root` CSS custom properties switched to light theme values
- `src/app/layout.tsx` — Plus Jakarta Sans + JetBrains Mono fonts, removed `dark` class
- `src/components/dashboard-view.tsx` — ~26 hardcoded dark-theme classes → semantic tokens
- `src/components/coverage-bar.tsx` — `text-white` → `text-foreground`
- `src/components/fact-card.tsx` — `text-white` → `text-foreground`
- `src/components/app-sidebar.tsx` — `text-white` → `text-foreground` (light sidebar)
- `src/components/slide-over-panel.tsx` — `text-white` → `text-foreground`
- `src/components/collapsible-row.tsx` — `hover:bg-surface` → `hover:bg-muted`
- `src/app/(app)/page.tsx` — Inline state component headings updated
- `src/app/(auth)/layout.tsx` — Added white card wrapper with shadow
- `src/app/(auth)/login/page.tsx` — Light theme heading + error state
- `src/app/(auth)/signup/page.tsx` — Same as login
- `src/__tests__/dashboard.test.tsx` — Fixed 4 tests for updated component structure

**Why:** Amendment T rejected the dark theme after reviewing the dashboard with real data — text unreadable at small sizes, no visual depth, revenue/savings numbers invisible. Design spike (5 iterations) validated light theme with card-based layout.

**Verification:**
| Check | Result |
|-------|--------|
| `npm run test` | Pass (252 tests) |
| `npm run lint` | Pass (no new errors) |
| `npm run build` | Pass |
| E2E verification | Pass — login, dashboard, settings all verified with Playwright |

**Commit:** `3886245` — `style: switch from dark to light theme per Amendment T`

---

## Related

- [Spec](12-design-system.md)
- [Brainstorming](12-design-system-brainstorming.md)
- [Epic 10: Schema + Extended Sync](10-schema-sync.md) (parallel, no dependency)
- [Epic 11: LLM Pipeline V2](11-llm-pipeline-v2.md) (parallel, no dependency)
