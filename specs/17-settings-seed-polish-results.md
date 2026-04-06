# Epic 17 — Settings + Seed + Polish: Results

## What Was Built

Full visual alignment of auth and settings pages with the R2 design system, sync progress UI with real-time stage tracking, shared form components, normalization bug fixes, and R1 artifact cleanup. Seed scripts deferred by user decision.

## Key Files Created/Modified

### New Files (9)

| File | Purpose |
|------|---------|
| `src/components/password-input.tsx` | PasswordInput — Input with eye/eye-off toggle, passes through all Input props |
| `src/components/alert-message.tsx` | AlertMessage — success/error/warning banner with R2 design tokens |
| `screenshots/epic-17-login.png` | Login page verification screenshot |
| `screenshots/epic-17-signup.png` | Signup page verification screenshot |
| `screenshots/epic-17-settings.png` | Settings page verification screenshot |
| `screenshots/epic-17-dashboard.png` | Dashboard verification screenshot |
| `screenshots/epic-17-sync-progress.png` | Sync progress in-flight screenshot |
| `screenshots/epic-17-sync-done.png` | Sync complete with results screenshot |
| `screenshots/epic-17-sync-complete.png` | Sync complete intermediate screenshot |

### Modified Files (12)

| File | Change |
|------|--------|
| `src/app/(auth)/layout.tsx` | Card wrapper: `bg-white shadow-md` → `bg-surface border border-border shadow-sm` (R2 pattern) |
| `src/app/(auth)/login/page.tsx` | Full rewrite: Expliq logo + tagline, PasswordInput, AlertMessage, autocomplete, aria-describedby, disabled fields |
| `src/app/(auth)/signup/page.tsx` | Full rewrite: same as login + password requirements list with live checkmarks (Check icon, text-status-healthy) |
| `src/app/(app)/settings/page.tsx` | Added `max-w-2xl mx-auto` container with page title + subtitle |
| `src/components/settings-form.tsx` | Full rewrite (409 → 616 lines): card-wrapped sections, R2 section headers, connected state summary view, progressive disclosure, sync progress stage list with polling, KpiCard-style result stats, enrichment pill badges |
| `src/lib/actions/connector.ts` | `syncAndAnalyze`: fire-and-forget analysis pipeline (removed `await`). Added `getAnalysisStatus()` server action. |
| `src/lib/dashboard-data.ts` | Lines 552/565: replaced `r.tier as ...` with `normalizeTier(r.tier)` |
| `src/lib/risk-engine.ts` | Removed R1 stubs (7 functions, 4 types, 3 constants — all unused) |
| `src/__tests__/login.test.tsx` | Updated for new heading structure ("Sign in" + "Expliq" headings) |
| `src/__tests__/signup.test.tsx` | Updated for new heading structure ("Create account" + "Expliq" headings) |
| `src/__tests__/settings.test.tsx` | Updated for card layout, renamed sections (Workflow Scope), progressive disclosure, getAnalysisStatus mock, polling with fake timers |
| `src/__tests__/route-smoke.test.tsx` | Added `getAnalysisStatus` to connector mock |

### Deleted Files (28)

| File | Reason |
|------|--------|
| 9 R1 components | `snapshot-dashboard.tsx`, `portfolio-*.tsx` (7 files), `automation-detail-view.tsx` — replaced by R2 pages |
| 5 R1 utilities | `snapshot-metrics.ts`, `snapshot-types.ts`, `automation-detail-types.ts`, `portfolio-filters.ts`, `portfolio-types.ts` — unused |
| 2 R1 actions | `actions/automation.ts`, `actions/llm.ts` — replaced by R2 analysis pipeline |
| 12 R1 test files | 11 with `describe.skip` + 1 orphaned (`home.test.tsx`) — 183 skipped tests eliminated |

## Decisions and Deviations from Spec

1. **Seed scripts deferred** — User decided to defer ACs 39-47 (deterministic + LLM-powered seed scripts). Existing seed data (`seed-real@expliq.dev`) is sufficient for demo verification. Partially-written seed files were deleted.

2. **Loading states unchanged** — ACs 31-34 required "polish if needed." Investigation found all existing skeleton/analyzing states handle `analysisStatus` values correctly. No changes made.

3. **Risk-engine R1 stubs removed** — Beyond the spec's file deletion list, foundations agent also cleaned 7 unused R1 stub functions, 4 types, and 3 constants from `risk-engine.ts`. These were dead code only preserved for R1 pages that no longer exist.

4. **`portfolio-types.ts` deleted** — Not in the spec's deletion list but found unused during cleanup. Safe to remove.

5. **Pre-existing lint error not fixed** — `opportunities-view.tsx:402` has a `setState` inside `useEffect` lint error. This is from Epic 15 and not in scope for Epic 17.

6. **Sync stage simplification** — Spec listed 5 stages. Implementation uses 4 displayable stages: "Syncing workflows...", "Analyzing workflows...", "Clustering processes & generating recommendations..." (combines two spec stages since `analyzing_workspace` covers both), "Complete".

## Verification Results

| Check | Result |
|-------|--------|
| `npm run test` (307 tests, 24 files) | Pass (0 skipped) |
| `npm run build` | Pass |
| `npm run lint` | 1 pre-existing error (opportunities-view.tsx, not from this epic) |
| Playwright: Login page | Pass — logo, tagline, PasswordInput eye toggle, R2 card styling |
| Playwright: Signup page | Pass — password requirements checkmarks, eye toggles, R2 styling |
| Playwright: Settings page | Pass — card sections, Connected badge, summary view, masked API key, Edit button |
| Playwright: Sync & Analyze | Pass — full pipeline: stage progression (syncing → analyzing → clustering → complete), stats grid (0/0/14/0), enrichment badges |
| Playwright: Dashboard | Pass — renders with real data, no TierBadge crash (normalization fix) |
| Playwright: All pages | 0 console errors |

## Risks for Future Epics

1. **Seed scripts still needed** — ACs 39-47 were deferred. When demo readiness is needed for a different audience/environment, these scripts will need to be built.

2. **`syncAndAnalyze` is now fire-and-forget** — The analysis pipeline runs in the background after sync. Any code that previously relied on `syncAndAnalyze` returning only after analysis completes will need updating. Currently only the settings form calls this, and it polls correctly.

3. **`getAnalysisStatus` has no error handling for missing profile** — Returns `{ status: null }` if no CompanyProfile exists. This is fine since polling only starts after sync, but worth noting.

4. **Pre-existing lint error** — `opportunities-view.tsx:402` setState-in-effect needs fixing in a future pass.

## Open Questions

1. Should the "Last synced" time in the Sync & Analyze card update after a successful sync completes? Currently it still shows the old time until page refresh since `lastSyncAt` comes from server props.

## Commit

`4c2727a` — `feat: implement epic 17 — settings + seed + polish`

---

## Patch: Design Spike V2 — Visual QA Fixes (2026-04-06)

**What changed:** 10 quick fixes from a full visual QA walkthrough covering dashboard, detail page, and process map.

**Files modified:**
- `src/lib/dashboard-data.ts` — delta banner colors (new recs→teal, resolved→green, new wfs→neutral), totalOpportunityValue fix (was using totalValueAtRisk), confidence clamp helper
- `src/components/dashboard-view.tsx` — facts bar merged into one vertical card (3-col grid), next move card wrapped in Link, total impact regex parse (amount vs explanation), estimate card cleanup
- `src/components/estimate-card.tsx` — removed explanation prop, dead methodology button; badge moved below value
- `src/components/detail-view.tsx` — overflow-x-hidden, step pill truncated at `(`, business narrative/failure impact 2-sentence truncate + "Read more", time savings/revenue split at "Reasoning:" with collapsed reasoning
- `src/components/process-map-view.tsx` — gap card border gray → teal
- `src/lib/opportunities-data.ts` — normalizeConfidence clamps "data-driven" → "benchmark-based"; applied to recommendation confidence
- `src/__tests__/detail-utils.test.ts` — updated expectations for confidence clamp

**Why:** Full visual QA spike revealed 18 issues. 10 were quick-fixable: color inconsistencies, non-clickable cards, dead buttons, raw LLM text dumps without truncation/parsing, wrong aggregate field, fake confidence badges.

**Verification:**
| Check | Result |
|-------|--------|
| `npm run test` | Pass (307 tests) |
| `npm run lint` | Pass (1 pre-existing error) |
| `npm run build` | Pass |
| Playwright: Dashboard | Pass |
| Playwright: Detail page | Pass |
| Playwright: Process Map | Pass |
| Console errors | 0 |

**Commit:** `69bd1fc` — `fix: design spike v2 — dashboard, detail, and process map visual fixes`

---

## Patch: Design Spike V2 Round 2 (2026-04-06)

**What changed:** Fixed horizontal scrollbar on detail page, reverted over-aggressive confidence clamp, made View all links consistent, simplified step pill.

**Files modified:**
- `src/app/(app)/layout.tsx` — SidebarInset overflow-x-hidden + main min-w-0
- `src/app/layout.tsx` — body overflow-x-hidden
- `src/components/dashboard-view.tsx` — View all links consistent, removed "5 items" label
- `src/components/detail-view.tsx` — break-words on mono text, grid min-w-0, step pill shows only process name
- `src/lib/opportunities-data.ts` — reverted global "data-driven" clamp in normalizeConfidence
- `src/lib/detail-data.ts` — targeted clampEstimateConfidence for timeSavings/revenue only
- `src/lib/dashboard-data.ts` — plain normalizeConfidence for recommendation confidence

**Why:** Round 2 of visual QA walkthrough found persistent scrollbar (overflow escaping sidebar wrapper), confidence clamp breaking recommendation badges (all showed "benchmark-based"), inconsistent navigation links, and confusing step pill concatenating two LLM names.

**Verification:**
| Check | Result |
|-------|--------|
| `npm run test` | Pass (306 tests) |
| `npm run build` | Pass |
| Playwright: Detail page | Pass — no scrollbar, content wraps |
| Playwright: Dashboard | Pass — mixed confidence badges, consistent links |

**Commit:** `4e49afc` — `fix: design spike v2 round 2 — scrollbar, confidence, view-all, step pill`

---

## Patch: Vercel Analysis Pipeline Reliability (2026-04-06)

**What changed:** Replaced fire-and-forget `runAnalysisPipeline()` with `after()` from `next/server` so Vercel keeps the serverless function alive for background LLM analysis. Added `maxDuration = 300` to settings page and per-automation error logging.

**Files modified:**
- `src/lib/actions/connector.ts` — Replaced `.catch()` fire-and-forget with `after()` wrapper
- `src/app/(app)/settings/page.tsx` — Added `export const maxDuration = 300` route segment config
- `src/lib/actions/analysis.ts` — Added `console.error` for failed per-automation LLM calls in Promise.allSettled handler
- `src/__tests__/connector-actions.test.ts` — Added `vi.mock('next/server')` for `after()` in test environment

**Why:** Live Vercel test with real n8n data showed only 1 of 9 per-automation LLM calls succeeding. Root cause: Vercel terminates serverless functions after response is sent, killing in-flight fire-and-forget promises. `after()` is the Next.js-native primitive that tells the runtime to keep the function alive for background work.

**Verification:**
| Check | Result |
|-------|--------|
| `npm run test` | Pass (306 tests) |
| `npm run lint` | Pass (1 pre-existing error) |
| `npm run build` | Pass |
| Real data pipeline | Pass (Sync & Analyze against perpaulsen.app.n8n.cloud) |
| E2E verification | Pass — Dashboard: 6 processes, 15 workflows. Process Map: all processes with coverage. |

**Commit:** `beed038` — `fix: use after() for analysis pipeline reliability on Vercel`
