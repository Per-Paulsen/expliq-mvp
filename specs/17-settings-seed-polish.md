---
tags:
  - type/spec
  - status/refined
  - phase/4
---

# Epic 17 — Settings + Seed + Polish

> Upstream: [PRD 2.0](../prd-2.0.md) | [Decisions §15](../prd-2.0-decisions.md) | [Brainstorming](17-settings-seed-polish-brainstorming.md)
> Phase: 4 (after Epics 13-16)
> Dependencies: All prior R2 epics (this is the polish pass)

## Scope

Final polish, seed data, and loading states for demo readiness. Includes full visual alignment of auth and settings pages with the R2 design system.

**Auth pages overhaul (login + signup):**
- Both pages were built in R1 (Epic 02) and only received color token updates in Epic 12. They need a full overhaul to match R2 design system.
- Auth layout card: `bg-surface rounded-xl border border-border shadow-sm p-8` (replace `bg-white shadow-md`)
- Add Expliq logo (`text-xl font-bold text-foreground`) + tagline ("Automation Intelligence Platform" in `text-sm text-text-tertiary`) centered at top of card
- Labels: `text-sm font-medium text-[#374151]` per design guidelines §7
- Error banners: `bg-status-critical/10 text-status-critical rounded-lg` (replace raw `bg-red-50 text-red-700`)
- Links: `text-primary hover:underline` (replace always-on underline)
- Add `autocomplete` attributes: `autocomplete="email"` on email, `autocomplete="current-password"` on login password, `autocomplete="new-password"` on signup password
- Create `PasswordInput` component: wraps shadcn `Input` with eye icon toggle (`Eye`/`EyeOff` from Lucide), `aria-label="Show password"` / `"Hide password"`
- Signup page: add password requirements list with live checkmarks ("At least 8 characters")
- Disable all form fields during submission (not just the button)
- Accessibility: `aria-describedby` linking inputs to error messages

**Settings page — visual alignment:**
- Settings page was built in R1 (Epic 03) and never updated for R2. Needs full alignment.
- Page wrapper: `max-w-2xl mx-auto` container with page title (`text-2xl font-bold text-foreground`) + subtitle (`text-sm text-text-secondary mt-1`: "Configure your n8n connection and manage sync settings")
- All 3 sections (Connection, Tag Selection, Sync & Analyze) wrapped in R2 card containers: `bg-surface rounded-xl border border-border shadow-sm p-5`
- Section headers: `text-sm font-semibold text-text-secondary uppercase tracking-wider` (replace `text-lg font-semibold`)
- Section descriptions: muted text below each header explaining the section's purpose
- Connection status badge on Section 1: "Connected" (green: `bg-status-healthy/10 text-status-healthy`) or "Not configured" (gray: `bg-surface-raised text-text-tertiary`)
- Connected state transformation: when credentials are saved + verified, Section 1 collapses to summary view (URL displayed, API key masked as `••••••abcd`, status badge) with "Edit" button to re-enter edit mode
- Progressive disclosure: Sections 2 and 3 always visible but disabled (`opacity-50 pointer-events-none`) until prerequisites met — not hidden via conditional rendering
- Success/error messages: use R2 design tokens (`bg-status-healthy/10 text-status-healthy` / `bg-status-critical/10 text-status-critical`)
- Sync result stats: match KpiCard pattern (`bg-surface rounded-xl border border-border shadow-sm p-4`, values in `font-mono`)
- Enrichment status: pill badges instead of plain text spans

**Settings page — sync progress UI:**
- Replace basic progress indicator (from Epic 10) with step-by-step named stages
- Stages: "Syncing workflows..." → "Analyzing workflows..." → "Clustering processes..." → "Generating recommendations..." → "Complete"
- Each stage shows a checkmark when done, current stage shows spinner/animation
- Progress tracking via client-side polling:
  - `syncAndAnalyze` server action is restructured to fire-and-forget the analysis pipeline (remove `await` from `runAnalysisPipeline()` call). Returns sync summary immediately after sync phase completes.
  - New `getAnalysisStatus()` server action reads `CompanyProfile.analysisStatus` from DB
  - Client polls `getAnalysisStatus()` every 2-3 seconds after sync returns
  - Status mapping: `analyzing_workflows` → "Analyzing workflows...", `analyzing_workspace` → "Clustering processes... / Generating recommendations...", `complete` → "Complete" (green checkmark), `failed` → error state
  - "Syncing workflows..." stage shown optimistically while `syncAndAnalyze` promise is pending (not trackable from client)
- Important for the demo: audience sees the intelligence being built in real time

**Shared form components:**
- `PasswordInput` — Input with eye icon toggle, autocomplete attrs (used on login + signup)
- `AlertMessage` — success/error/warning banner using R2 design tokens (used on auth + settings pages)

**Loading / skeleton states:**
- Dashboard: skeleton layout already implemented in Epic 13 (DashboardAnalyzing component in page.tsx) — polish styling if needed
- Process Map: skeleton already implemented in Epic 14 (ProcessMapAnalyzing component in page.tsx) — polish styling if needed
- Opportunities: analyzing/failed/complete states already implemented in Epic 15 (page.tsx handles all analysisStatus values) — polish styling if needed
- Detail: per-automation data may be available before workspace analysis completes — show available sections, skeleton for process/recommendation sections

**R2 seed script:**
- Deterministic seed (no API keys): creates a test workspace with all R2 models populated using hardcoded data modeled after research spike results
  - ~8 Automation records with all v8 fields populated (businessNarrative, impact, detectability, etc.)
  - 4 BusinessProcess records with steps, coverage, maturity
  - ~10 Recommendation records across all 3 tiers with impactEstimate badges
  - 3 ProcessSuggestion records with child recommendations
  - 1 CompanyProfile with systemLandscape, nextMoveText, aggregateEstimates, deltaSummary
  - Governance dots: mix of healthy, attention, critical
- LLM-powered seed (needs API keys): imports research spike v8 result files (`specs/research-spike-results/v8/`) into the database as a realistic demo workspace
- Both seeds create a login account with known credentials (documented in .env.example)

**Bug fixes:**
- **Tier normalization:** `dashboard-data.ts` lines ~552/565 cast `Recommendation.tier` directly without `normalizeTier()`. TierBadge crashes on raw DB values like `"act now"`. Must apply `normalizeTier()` pattern from `opportunities-data.ts`.
- **Confidence normalization:** Same risk exists for ConfidenceBadge anywhere confidence values pass through without `normalizeConfidence()`. Apply normalization in `detail-data.ts` and any other locations.

**R1 artifact cleanup:**
- Delete R1 components no longer imported by any R2 page: `snapshot-dashboard.tsx`, `portfolio-view.tsx`, `automation-detail-view.tsx`, `portfolio-automation-card.tsx`, `portfolio-filter-chips.tsx`, `portfolio-filter-section.tsx`, `portfolio-header.tsx`, `portfolio-active-filters-bar.tsx`, `portfolio-sort-bar.tsx`
- Delete R1 utility modules no longer imported: `snapshot-metrics.ts`, `snapshot-types.ts`, `automation-detail-types.ts`, `portfolio-filters.ts`
- Delete R1 skipped test files (9 files, 183 skipped tests): replace with R2 tests from Epics 13-16
- Delete R1 stubbed action modules if no longer imported: `actions/automation.ts` (R1 version), `actions/llm.ts` (R1 version)

**Remaining UX gaps:**
- Any broken links, missing empty states, or visual inconsistencies caught during integration testing
- All page transitions smooth (no flash of unstyled content)

## Acceptance Criteria

### Auth Pages

1. Auth layout card uses `bg-surface border border-border shadow-sm rounded-xl` (not `bg-white shadow-md`)
2. Expliq logo rendered as `text-xl font-bold text-foreground` centered at top of auth card
3. Tagline "Automation Intelligence Platform" in `text-sm text-text-tertiary` below logo
4. Form headings: "Sign in" / "Create account" in `text-2xl font-bold text-foreground`
5. Labels use `text-sm font-medium text-[#374151]` per design guidelines §7
6. All password inputs have eye icon toggle (show/hide) with `aria-label`
7. Email inputs have `autocomplete="email"`, login password `autocomplete="current-password"`, signup password `autocomplete="new-password"`
8. Signup page shows password requirements list with live checkmarks ("At least 8 characters")
9. Error banners use `bg-status-critical/10 text-status-critical rounded-lg`
10. Links use `text-primary hover:underline` (no always-on underline)
11. All form fields disabled during submission (not just the button)
12. `aria-describedby` on inputs linked to error message elements

### Settings — Visual Alignment

13. Settings page has `max-w-2xl mx-auto` container with page title + subtitle
14. All 3 sections wrapped in `bg-surface rounded-xl border border-border shadow-sm` cards
15. Section headers use `text-sm font-semibold text-text-secondary uppercase tracking-wider`
16. Each section has a description line below its header
17. Section 1 shows connection status badge: "Connected" (green) or "Not configured" (gray)
18. When saved + verified, Section 1 collapses to summary view (URL + masked API key `••••••abcd` + status badge) with "Edit" button
19. Sections 2 and 3 always visible but disabled (`opacity-50 pointer-events-none`) until prerequisites met
20. Success/error messages use R2 design tokens (`bg-status-healthy/10` / `bg-status-critical/10`)
21. Sync result stats styled as KpiCard-pattern boxes with `font-mono` values
22. Enrichment status displayed as pill badges

### Settings — Sync Progress

23. Settings page shows named stages during sync + analysis
24. Each stage transitions to "done" (checkmark) as it completes
25. Current stage shows active indicator (spinner or pulse)
26. `syncAndAnalyze` returns after sync phase; analysis pipeline runs in background (fire-and-forget)
27. New `getAnalysisStatus()` server action returns current `CompanyProfile.analysisStatus`
28. Client polls `getAnalysisStatus()` every 2-3 seconds to track analysis progress
29. "Complete" state shown with green checkmark and "Sync & Analyze" button re-enabled
30. "Failed" state shows error message with re-sync option

### Loading States

31. Dashboard shows skeleton + contextual message while analysis is in progress
32. Process Map shows loading state while analysis is in progress
33. Opportunities shows loading state while analysis is in progress
34. Detail page shows available per-automation data even if workspace analysis is still running

### Shared Components

35. `PasswordInput` component at `src/components/password-input.tsx` wraps Input with eye icon toggle
36. `AlertMessage` component at `src/components/alert-message.tsx` renders success/error/warning with R2 tokens

### Bug Fixes

37. `dashboard-data.ts` uses `normalizeTier()` for all Recommendation.tier values (no direct casting)
38. ConfidenceBadge values normalized via `normalizeConfidence()` wherever they pass through from DB

### Seed Script — Deterministic

39. `scripts/seed-r2-data.ts` creates a full R2 workspace with hardcoded data
40. Includes: 8 Automations, 4 BusinessProcesses, ~10 Recommendations, 3 ProcessSuggestions, 1 CompanyProfile
41. Data variety: all 3 governance dot levels, all 3 recommendation tiers, all 3 confidence levels, mix of impact levels
42. Login credentials for seed workspace documented in `.env.example`
43. Script is idempotent (can be re-run without creating duplicates)
44. Runs with `npx tsx scripts/seed-r2-data.ts`

### Seed Script — LLM-Powered

45. `scripts/seed-r2-from-spike.ts` reads research spike v8 result files and inserts them into the database
46. Creates a demo workspace with realistic LLM output
47. Requires OPENROUTER_API_KEY only if re-running LLM (result files are pre-generated)

### R1 Cleanup

48. No R1-only component files remain in `src/components/` (snapshot-dashboard, portfolio-*, automation-detail-view)
49. No R1-only utility/type files remain in `src/lib/` (snapshot-metrics, snapshot-types, automation-detail-types, portfolio-filters)
50. R1 skipped test files deleted and replaced by R2 test coverage from Epics 13-16
51. No `describe.skip` blocks remain in the test suite

### Integration

52. All cross-page navigation works end-to-end (Dashboard → Detail → Process Map → Opportunities → back)
53. Deep-links work: `/opportunities?highlight={id}`, `/opportunities?process={id}`
54. No console errors on any page with seed data loaded

## Out of Scope

- New features or pages beyond what's specified in Epics 10-16
- Mobile responsiveness
- Performance optimization (acceptable for <50 workflows)
- CI/CD pipeline setup
- Automated e2e Playwright tests (manual demo verification sufficient)
- Forgot password link / password reset flow (no backend exists)
- FormCard or StatusBadge as separate components (use inline classes — only PasswordInput and AlertMessage warrant extraction since they have logic)

## Domain Terms

| Term | Definition |
|------|-----------|
| **Sync progress** | Step-by-step UI showing the pipeline stages during sync + analysis. Important for demo — audience sees intelligence being built in real time. |
| **Deterministic seed** | Test data with no external dependencies (no API keys, no network). Hardcoded values modeled after real LLM output. For tests and local development. |
| **LLM-powered seed** | Demo data imported from research spike results. Realistic quality for presentations. |
| **Connected state** | Settings Section 1 after credentials are saved + verified — collapses to summary view with masked API key and Edit button. |
| **Progressive disclosure** | Sections 2+3 always visible but disabled until prerequisites met. Not hidden — user can see the full flow ahead. |
| **Fire-and-forget** | `syncAndAnalyze` kicks off analysis pipeline without `await`-ing it. Client polls for progress separately. |

## Open Questions

1. Should the sync progress UI poll for status updates (client-side polling every 2-3s), or use server-sent events / streaming? **Decision: polling for MVP** — simpler, sufficient for a sync that takes 2-5 minutes. SSE is a future enhancement.
2. Should the deterministic seed data match the FairTix scenario (so it's recognizable in demos), or use a different fictional company (to avoid confusion with the live FairTix sync)? **Decision: different fictional company** — avoids confusion when demo shows both seed data and live FairTix sync.

---

## Related

- [All prior R2 epics](10-schema-sync.md) (this epic polishes their output)
- [Research Spike Results](research-spike.md) (v8 result files for LLM-powered seed)
- [Design Guidelines](design-guidelines.md) (§7 Auth Pages, §8 Settings Page)
