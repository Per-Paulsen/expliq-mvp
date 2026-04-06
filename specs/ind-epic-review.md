---
tags:
  - type/review
  - status/done
---

# Individual Epic Review — 2026-03-10 (pass 2)

> Upstream: [Cross-Epic Review](cross-epic-review.md) | [Map of Content](../_MOC.md)

## Summary
- Specs reviewed: 05, 06, 07, 08, 09
- Specs skipped (completed epics): 01, 02, 03, 04
- Specs skipped (already refined): none (all stale — missing 04-llm-pipeline-results.md)
- Specs modified: 06, 07, 08, 09
- Specs clean: 05

## 05 — Risk Engine

### Findings

No issues found. The spec correctly handles all edge cases, including:
- Null `impactProposal` defaults to weight 1 (Low) for exposure calculation
- `statusOverride ?? status` logic is consistent with the schema's separate `AutomationStatus` and `StatusOverride` enums
- Compute-on-read approach via pure functions on loaded records naturally avoids Prisma's column-to-column comparison limitation (confirmed in epic 04 results)
- Scope precondition (`status != removed`) is clearly stated

Epic 04 results note that all test automations were classified as "high" impact. This doesn't affect the spec — the formulas are correct regardless of impact distribution, and `impactOverride` (epic 07) addresses the bias.

### Changes applied

- None

## 06 — Portfolio Screen

### Findings

- **Filter chip counts not uniformly scoped** (missing AC clarity)
  - The Attention row explicitly stated counts are "always total workspace counts, not affected by other active filters"
  - Other filter rows (Systems, Owner, Platform, Impact, Risk) did not specify whether their counts are global or filtered
  - The resolved open question says "Filter badge counts are global" generically, but this clarification was only applied to the Attention row
  - **Change**: Added a sentence to the filter section intro clarifying all chip and badge counts across all filter rows are global workspace counts. Removed redundant global-count parenthetical from the Attention row since the rule now applies at the section level.

### Changes applied

- Added global count clarification to filter section intro: "All chip and badge counts across all filter rows are global — they always show total workspace counts regardless of other active filters"
- Simplified Attention row description (removed now-redundant global count parenthetical)

## 07 — Automation Detail

### Findings

- **Override fields cannot be cleared back to null** (hidden scope creep)
  - Edit mode dropdowns for Impact Classification and Status Override have no "reset" or "use default" option
  - Once a user sets `impactOverride`, there's no way to revert to the LLM proposal (`impactProposal`). The user can manually match the value, but `impactOverride` remains non-null, losing the "LLM proposal vs user override" distinction shown on the detail page
  - Same applies to `statusOverride` — no way to revert to sync-derived `status`
  - `NEEDS CONFIRMATION` — added as open question on the spec

### Changes applied

- Added open question tagged `NEEDS CONFIRMATION`: whether override dropdowns should include a "Reset to default" option

## 08 — Workspace Snapshot

### Findings

- **"Recently changed" threshold still unresolved** (pre-existing open question)
  - The spec proposes 7 days but frames it as an open question
  - After multiple refinement passes, this should be confirmed
  - `NEEDS CONFIRMATION` — tagged the existing open question

### Changes applied

- Tagged existing open question with `NEEDS CONFIRMATION`

## 09 — Production Hardening

### Findings

- **Error boundary fallback style** (pre-existing open question)
  - "Try again" only vs adding "Report issue" link. Proposed: "Try again" only for MVP.
  - `NEEDS CONFIRMATION` — tagged the existing open question

- **Loading skeleton fidelity** (pre-existing open question)
  - Exact layout match vs approximate. Proposed: approximate layout skeletons.
  - `NEEDS CONFIRMATION` — tagged the existing open question

### Changes applied

- Tagged both existing open questions with `NEEDS CONFIRMATION`

## Brainstorming

4 design decisions need your input before they can be applied to the specs. Please answer below each question.

---

### Epic 07 — Automation Detail

#### Q1: Override reset capability

Edit mode dropdowns for Impact Classification and Status Override currently only offer concrete values (Critical/High/Medium/Low for impact; Active/Inactive/Deprecated for status). Once set, there's no way to clear an override back to null — meaning you can't revert to "let the LLM decide" (impact) or "use the synced value" (status).

- **(a) No reset for MVP** — overrides are permanent once set. If the user wants to match the LLM proposal, they manually select the same value. The `impactOverride` field remains non-null, so the detail page always shows "Override: X" even when it matches the proposal. Simple to implement.
- **(b) Add "Use default" option** — dropdowns include a top option like "Use LLM proposal" (impact) or "Use synced status" (status) that clears the override back to null. More accurate semantics, slightly more UI work.

**Recommendation:** (a) for MVP. The practical impact is minimal — the effective impact is correct either way. The visual distinction ("proposal vs override") is a nice-to-have, not critical.

Your answer:  a

---

### Epic 08 — Workspace Snapshot

#### Q2: "Recently changed" threshold

The "Recently changed" section shows automations updated in the last 7 days. The "Automation stale" governance signal uses a 14-day threshold. Should these match?

- **(a) Keep 7 days** — "Recently changed" surfaces recent activity (what changed this week). "Automation stale" flags inaction (hasn't been touched in 2 weeks). Different concepts, different thresholds.
- **(b) Match at 14 days** — simpler mental model, one threshold for "recent" across the app.

**Recommendation:** (a) — they measure different things. 7 days for "what's new" vs 14 days for "what's neglected."

Your answer:  a

---

### Epic 09 — Production Hardening

#### Q3: Error boundary fallback

When an error boundary catches a crash, should it show:

- **(a) "Try again" only** — simple retry button. For MVP, errors are logged to console. No external error tracking service to link to.
- **(b) "Try again" + "Report issue"** — adds a link (e.g., to a support email or GitHub issues). More helpful for users but requires deciding where reports go.

**Recommendation:** (a) — no external error tracking or support channel exists for MVP. A "Report issue" link with nowhere to go is worse than no link.

Your answer:  a

#### Q4: Loading skeleton fidelity

Should loading skeletons (shown while data fetches) match the exact page layout or use approximate placeholders?

- **(a) Approximate** — recognizable shape (e.g., rectangles for cards, lines for text) but not pixel-perfect. Faster to build, less maintenance when layouts change.
- **(b) Exact layout** — skeletons mirror the loaded page structure precisely. Better perceived performance but must be updated whenever the page layout changes.

**Recommendation:** (a) — approximate. The pages are still evolving through epics 05-08. Pixel-perfect skeletons would need updating with each layout change.

Your answer:  a

## Confirmations Applied

All 4 `NEEDS CONFIRMATION` items resolved and applied to specs:

1. **Spec 07 — Q1: Override reset** → (a) no reset for MVP. Overrides are permanent once set. Marked resolved in spec.
2. **Spec 08 — Q2: Recently changed threshold** → (a) keep 7 days. Different concept from 14-day staleness. Marked resolved in spec.
3. **Spec 09 — Q3: Error boundary fallback** → (a) "Try again" only. No external error tracking exists for MVP. Marked resolved in spec.
4. **Spec 09 — Q4: Loading skeleton fidelity** → (a) approximate layout. Pages still evolving. Marked resolved in spec.

---

# Individual Epic Review — 2026-03-10 (pass 3)

## Summary
- Specs reviewed: 06, 07, 08, 09
- Specs skipped (completed epics): 01, 02, 03, 04, 05
- Specs skipped (already refined): none (all stale — missing 05-risk-engine-results.md)
- Specs modified: 06
- Specs clean: 07, 08, 09

## 06 — Portfolio Screen

### Findings

- **Filter section toggle mechanism not described** (hidden scope creep)
  - The spec says the filter section is "collapsible" and describes auto-expand/manual-collapse behavior, but doesn't mention a visible toggle control. Since the section is collapsed by default and all filter chips are inside it, the user needs a way to expand it manually.
  - **Change**: Added "via a toggle control in the section header" to the filter section description.

- **`updatedAfter` param format undefined** (ungrounded assumption)
  - The spec uses `?updatedAfter=7d` as an example but doesn't define the format or supported units. Epic 08 also uses `7d`. Without a defined format, implementers must guess the parsing rules.
  - **Change**: Specified the format as `{N}d` where N is a number of days (e.g., `7d` = within the last 7 days). Also clarified `minSystems` value is an integer.

- **Zero-results filter state not addressed** (missing AC)
  - The spec has an empty state for when no automations exist in the workspace, but no AC for when active filters or search produce zero matches. These are distinct states requiring different messaging ("connect a platform" vs "no results match your filters").
  - **Change**: Added AC: "When active filters or search produce zero matching automations (but automations do exist in the workspace), the Portfolio shows a 'no results' message distinct from the empty workspace state."

### Changes applied

- Added "via a toggle control in the section header" to the collapsible filter section description
- Specified `updatedAfter` format as `{N}d` (number of days) and `minSystems` as integer
- Added new AC for zero-results filter state

## 07 — Automation Detail

### Findings

No new issues. Reviewed against epic 05 results — the risk section's dependency on `getGovernanceSignals`, `getRiskLevel`, `getEffectiveImpact`, and `getEffectiveStatus` is well-grounded. The `getEffectiveImpact` returning `string | null` (not `ImpactLevel | null`) per epic 05 risk #2 has no impact on the spec since the display just shows the value. Previous pass findings (override reset) already resolved as (a) no reset for MVP.

### Changes applied

- None

## 08 — Workspace Snapshot

### Findings

No new issues. Reviewed against epic 05 results — the exposure rankings map directly to `getSystemExposure(workspaceId)` and `getOwnerExposure(workspaceId)` which return pre-sorted arrays. Epic 05 risk #1 (all test automations "high" impact → flat rankings) is a data issue, not a spec issue. Epic 05 risk #3 (two full-table scans) is an implementation optimization concern, not spec-level. Previous pass finding (7-day threshold) already resolved as (a) keep 7 days.

### Changes applied

- None

## 09 — Production Hardening

### Findings

No new issues. Epic 05 results have no specific impact on the hardening spec — the risk engine is a pure service module with no error boundaries, loading states, or rate-limiting concerns of its own. Previous pass findings (error boundary fallback, skeleton fidelity) already resolved as (a) for both.

### Changes applied

- None

---

# Individual Epic Review — 2026-03-10 (pass 4)

## Summary
- Specs reviewed: 07, 08, 09
- Specs skipped (completed epics): 01, 02, 03, 04, 05, 06
- Specs skipped (already refined): none (all stale — missing 05.5-test-infrastructure-results.md, 06-portfolio-screen-results.md)
- Specs modified: none
- Specs clean: 07, 08, 09

## 07 — Automation Detail

### Findings

No new issues. Reviewed against epic 05.5 and 06 results:

- **Epic 05.5 risk #2** (LLM impact classification uniformity) — the detail page shows both `impactProposal` and `impactOverride`. Clustering of proposal values is a data quality issue, not a spec issue. The display is correct regardless of distribution.
- **Epic 06 risk #3** (`formatRelativeTime` duplication) — the detail page's metadata grid shows timestamps that will likely need the same helper. This is an implementation code-reuse concern, not a spec issue.
- **Epic 06 patch: "Inactive" attention signal removed** from `ATTENTION_SIGNAL_MAP` — the detail page header shows "governance attention badges" (same set as portfolio, 4 signals) while the risk section shows "active governance signals" (full risk-engine set, 5 signals including `inactive`). These are intentionally different: attention badges are quick visual alerts, risk drivers explain the risk computation. No ambiguity in the spec — "attention badges" and "governance signals" are already distinct terms.
- **Back navigation** (`router.back()`) — verified that epic 06 uses URL-synced filter state, so browser history preserves filter context. Spec 07's back navigation AC is well-grounded.
- **Null LLM fields** — epic 06 shows unprocessed automations with "Untitled automation" / "No description available" fallbacks on portfolio cards. Spec 07 already has an AC for placeholder text on unprocessed automations. Consistent.

### Changes applied

- None

## 08 — Workspace Snapshot

### Findings

No new issues. Reviewed against epic 05.5 and 06 results:

- **Click-through URL params verified** against epic 06 implementation — all params use singular names matching `parseFiltersFromParams`: `impact`, `risk`, `attention`, `system`, `owner`, `updatedAfter`, `minSystems`, `sort`, `order`. All spec 08 URLs are correct.
- **"Inactive" attention signal removal** — spec 08 doesn't include an "inactive" metric card, so the removal has no impact.
- **Epic 06 deviation: filter section always collapsed by default** (even with URL params, shows compact active-filters bar instead) — this is a portfolio UX detail. Spec 08 only specifies navigation targets, not how the portfolio renders them. No impact.
- **Epic 05.5 seed data** — provides known test data for all 5 metric cards (total, high-impact, high-risk, missing owners, overdue reviews) plus exposure rankings. No spec impact.

### Changes applied

- None

## 09 — Production Hardening

### Findings

No new issues. Reviewed against epic 05.5 and 06 results:

- **Epic 06 already created `src/app/(app)/automations/error.tsx`** — one of the four route-level error boundaries spec 09 requires. The hardening pass will audit the existing one and create the remaining three. Not a spec issue — reduces implementation scope slightly.
- **Epic 06 risk #2** (no search debouncing) — search is client-side instant filtering, not an expensive server call. Not in scope for spec 09's rate-limiting (which targets expensive operations: Regenerate, Sync Now, Test Connection).
- **Epic 05.5** — the seed script is a dev tool, not a user-facing feature. No error boundaries, loading states, or rate limiting needed for it.

### Changes applied

- None

---

# Individual Epic Review — 2026-03-10 (pass 5)

## Summary
- Specs reviewed: 08, 09
- Specs skipped (completed epics): 01, 02, 03, 04, 05, 05.5, 06, 07
- Specs skipped (already refined): none (both stale — missing 07-automation-detail-results.md)
- Specs modified: none
- Specs clean: 08, 09

## 08 — Workspace Snapshot

### Findings

No new issues. Reviewed against epic 07 results:

- **Shared utilities available** — Epic 07 extracted `formatRelativeTime` to `src/lib/format.ts` and badge color maps to `src/lib/badge-colors.ts`. Spec 08's "Recently changed" section will benefit from the shared `formatRelativeTime`. This is an implementation convenience, not a spec concern.
- **Impact override logic consistent** — Spec 08's "high-impact automations" metric uses `impactOverride ?? impactProposal`, which is consistent with epic 07's edit mode that writes to `impactOverride`. Effective impact calculation is unchanged.
- **`status = removed` exclusion consistent** — Spec 08 already specifies `status = removed` exclusion regardless of `statusOverride`, matching the override semantics confirmed in epic 07.
- **No spec-level impact from epic 07 risks** — Risk #1 (impact override display) is about badge rendering, not aggregation. Risk #4 (no optimistic updates) doesn't affect the read-only dashboard.

### Changes applied

- None

## 09 — Production Hardening

### Findings

No new issues. Reviewed against epic 07 results:

- **2 of 4 route-level error boundaries already exist** — Epic 06 created `src/app/(app)/automations/error.tsx`, epic 07 created `src/app/(app)/automations/[id]/error.tsx`. Spec 09's AC "Route-level `error.tsx` files exist for all four app route segments" is an end-state check — still valid, just less implementation work remaining (need `(app)/error.tsx` and `(app)/settings/error.tsx`).
- **New server actions in scope for audit** — Epic 07 added `saveAutomationEdits()` and `markAsReviewed()` in `src/lib/actions/automation.ts`. These fall under spec 09's "all server actions return structured `{ success, error }` responses" AC. No spec change needed — the AC already scopes to "all server actions in `src/lib/actions/`".
- **Regenerate button already has loading state** — Epic 07 implemented a loading state for Regenerate. Spec 09 adds a 10s cooldown on top. No conflict — the cooldown is additive to the loading state.
- **No spec-level impact from epic 07 risks** — Risk #4 (no optimistic updates using `router.refresh()`) is a UX concern, not a hardening concern. Not in spec 09's scope.

### Changes applied

- None

---

# Individual Epic Review — 2026-04-05 (pass 6)

## Summary
- Specs reviewed: 09, 11, 12, 13, 14, 15, 16, 17
- Specs skipped (completed epics): 01, 02, 03, 04, 05, 06, 07, 08, 10
- Specs skipped (already refined): none (09 stale — missing 08-workspace-snapshot-results.md, 10-schema-sync-results.md; 11-17 had no prior refinement marker)
- Specs modified: 09, 11, 13, 14, 16, 17
- Specs clean: 12, 15

## 09 — Production Hardening

### Findings

- **Spec scope is obsolete due to R2 pivot** (ungrounded assumptions)
  - The spec targets R1 routes (Workspace Snapshot, Portfolio, Automation Detail), R1 buttons ("Regenerate", "Sync Now", "Test Connection"), and R1 server actions (`src/lib/actions/automation.ts`, `actions/llm.ts`) — all of which are being replaced or have been stubbed by the R2 pivot (Epic 10 results confirm stubs).
  - Epic 17 (Settings + Seed + Polish) covers R2-era loading states, integration polish, and UX gap fixing — overlapping significantly with 09's intent.
  - `NEEDS CONFIRMATION` — added as open question with three options: (A) drop, (B) rewrite for R2, (C) keep as-is and build last.

### Changes applied

- Added `NEEDS CONFIRMATION` open question about spec viability with three options
- **Resolution: Deferred** — spec 09 is shelved for now. Not dropped (may be revisited later), not built in the R2 sequence. The R2 page epics (12-17) handle their own error boundaries and loading states.

## 11 — LLM Pipeline V2

### Findings

- **Missing DB fields for per-automation output** (ungrounded assumption)
  - AC 3 says `trigger`, `triggerType`, and `systemsTouched` are "stored on the Automation model." Verified against `prisma/schema.prisma` — these three fields do NOT exist. The Epic 10 migration added 17 R2 fields but not these three. Epic 11 needs its own migration.
  - **Change**: Added migration requirement note to the scope section.

- **Open question 1 contradicts v8 architecture** (inconsistent spec)
  - The scope section included a lightweight nudge sentence in the workspace prompt. This contradicts the v8 research spike findings (Amendment O): simple prompts + full data, no rubrics, no methods, no nudges. The nudge was a leftover from pre-spike prompt engineering.
  - **Change**: Removed nudge from scope. Resolved OQ 1 as "no nudge — per v8 architecture."

- **AC 30 overlaps with Epic 10 tests** (hidden scope creep)
  - "Unit tests for execution aggregation → LLM input formatting" — execution aggregation is already tested in Epic 10 (`execution-stats.test.ts`, 12 tests). This AC should only cover LLM input formatting.
  - **Change**: Clarified AC 30 to specify it tests LLM input formatting, not aggregation.

### Changes applied

- Added migration note in scope: `trigger` (String?), `triggerType` (String?), `systemsTouched` (String[]) need to be added via Prisma migration
- Removed lightweight nudge from scope (contradicts v8 simple-prompt architecture)
- Resolved open question 1 as "no nudge"
- Clarified AC 30 to avoid overlap with Epic 10 execution aggregation tests

## 12 — Design System + App Shell

### Findings

No issues found. The spec is internally consistent:
- The "Opportunities" screen name (diverging from PRD's "Priorities") is consistent across ALL R2 specs (12-17) — this is an intentional rename, not an inconsistency.
- Sidebar "Synced X ago" open question is appropriately flagged and well-scoped.
- Component specifications match decisions §15 with concrete props and behaviors.
- Route scaffolding correctly covers all R2 routes.

### Changes applied

- None

## 13 — Dashboard

### Findings

- **AC 17 uses wrong field for one-liner** (inconsistent domain language)
  - AC 17 said "businessCase" for the opportunity one-liner. The Recommendation model has both `brief` (one-sentence summary) and `businessCase` (full reasoning shown in slide-over panels). The Dashboard row should use `brief`, not `businessCase`.
  - **Change**: Updated AC 17 to specify `Recommendation.brief`.

- **Open question 1 already answered by AC 13** (redundant)
  - OQ 1 asks whether methodology is inline accordion or separate page. AC 13 already specifies "expandable or tooltip acceptable for MVP."
  - **Change**: Resolved OQ 1 per AC 13.

### Changes applied

- Updated AC 17: "businessCase" → "brief (one-liner from Recommendation.brief, not the full businessCase)"
- Resolved open question 1 (inline accordion per AC 13)

## 14 — Process Map

### Findings

- **"Value at stake" placement assumed in scope but questioned in OQ** (inconsistent spec)
  - The scope lists "value at stake" as a collapsed row column, but open question 1 asks whether it should be on the collapsed or expanded row. The scope should not presume the answer.
  - **Change**: Updated collapsed row columns to mark value at stake as TBD per OQ 1.

- **Maturity level names not established upstream** (ungrounded assumption)
  - AC 2 lists five maturity levels (Prototype/Emerging/Developing/Production/Optimized), but these names aren't defined in Epic 11's spec or the PRD. They depend on the LLM output schema.
  - **Change**: Added note to AC 2 that maturity level names must match Epic 11's workspace call output schema.

### Changes applied

- Updated scope: value at stake column marked as "TBD — see open question 1"
- Added note to AC 2: maturity badge names must match Epic 11's LLM output schema

## 15 — Opportunities

### Findings

No issues found. The spec is comprehensive and internally consistent:
- All referenced Recommendation fields verified against Prisma schema: `impactEstimate`, `affectedScope`, `honestFraming`, `brief`, `businessCase`, `evidence`, `confidence`, `tier`, `deployableJson` all exist.
- Deploy modal flow (generate → review → deploy) is well-specified with clear error handling.
- Deep-linking and filtering URL parameters are concrete and testable.
- Process suggestion sections are clearly separated from tier sections.
- Open questions (model selection, post-deploy re-sync) are genuine design decisions appropriately flagged.

### Changes applied

- None

## 16 — Detail

### Findings

- **"LLM-generated business name" doesn't exist** (ungrounded assumption)
  - The header spec said "Automation name (LLM-generated business name)." The Automation model has `name` (synced from n8n) but no LLM-generated business name field. Epic 11's per-automation output produces `businessNarrative` (multi-sentence), not a short business name.
  - **Change**: Updated header and AC 1 to "Automation name (from n8n)."

- **Connection type labels have no data source** (ungrounded assumption)
  - AC 21 specifies type labels (error handler / sub-workflow / logical) per connected automation, but `upstreamIds`/`downstreamIds` are flat `String[]` arrays with no type metadata. The information is lost during the merge step in Epic 11 (AC 12-14).
  - `NEEDS CONFIRMATION` — added as open question with three options: (A) change Epic 11 to store typed connections, (B) derive heuristically on the Detail page, (C) drop type labels.

### Changes applied

- Updated header and AC 1: "LLM-generated business name" → "from n8n `name` field"
- Added `NEEDS CONFIRMATION` open question about connection type labels (schema gap)

## 17 — Settings + Seed + Polish

### Findings

- **Sync progress stages don't map to AnalysisStatus enum** (ungrounded assumption)
  - The spec lists 6 UI stages, but CompanyProfile.analysisStatus has only 5 enum values (pending, analyzing_workflows, analyzing_workspace, complete, failed). The first two stages ("Fetching workflows", "Fetching execution data") are sync-phase activities from Epic 10, not tracked by AnalysisStatus. The spec assumed one tracking source but needs two.
  - **Change**: Clarified that sync-phase stages need separate tracking from analysis-phase stages (AnalysisStatus).

### Changes applied

- Clarified sync progress section: UI must combine sync-phase tracking (from sync action) with analysis-phase tracking (from CompanyProfile.analysisStatus)

## Brainstorming

2 design decisions need your input before they can be applied to the specs. Please answer below each question.

---

### Epic 09 — Production Hardening

#### Q1: Spec viability after R2 pivot

Epic 09 was written for the R1 MVP (epics 01-08). The R2 pivot replaces most of the routes, actions, and buttons it targets:
- Routes: Workspace Snapshot → Dashboard (Epic 13), Portfolio → Process Map (Epic 14), Detail → rewritten (Epic 16)
- Buttons: "Regenerate" is gone, "Sync Now" is now "Sync & Analyze" (Epic 10)
- Actions: `actions/automation.ts` and `actions/llm.ts` are stubbed

Meanwhile, Epic 17 (Settings + Seed + Polish) covers R2-era loading states, UX gaps, and integration testing — which overlaps with 09's intent.

- **(A) Drop spec 09** — its concerns are absorbed by individual R2 page epics (each builds their own error boundaries, loading states) + Epic 17 (polish pass). Remove from the build sequence.
- **(B) Rewrite spec 09 for R2** — update routes, buttons, and actions to target the R2 pages. Keep it as a dedicated hardening pass after all R2 pages are built. Risk: significant overlap with Epic 17.
- **(C) Keep as-is, build last** — build Epic 09 after all R2 epics complete, targeting whatever routes/actions exist at that point. The spec text will be inaccurate but the intent (error boundaries, loading states, rate limiting, graceful degradation) remains valid. Risk: spec text doesn't match reality, implementation requires interpretation.

**Recommendation:** (A) Drop it. Each R2 page epic should include its own error boundary and loading state. Epic 17 handles the cross-cutting polish. A separate hardening pass adds complexity without new value.

Your answer: Defer — skip for now, may revisit later. Not part of the R2 build sequence.

---

### Epic 16 — Detail

#### Q2: Connection type labels

The Detail page spec (AC 21) shows connection type labels per connected automation: "error handler", "sub-workflow", or "logical." However, `upstreamIds` and `downstreamIds` on the Automation model are flat `String[]` arrays — they don't carry type metadata. During Epic 11's connected automations resolution (AC 12-14), deterministic connections (errorWorkflow, callerIds) and LLM connections are all merged into the same arrays, losing type information.

- **(A) Change Epic 11 schema** — store connections as `Json[]` with `{ id: string, type: "error_handler" | "sub_workflow" | "logical" }` objects instead of flat string arrays. Requires schema migration in Epic 11 and updates to the resolution logic. Most accurate data.
- **(B) Derive heuristically on Detail page** — keep flat arrays. On the Detail page, check if a connected ID matches `settings.errorWorkflow` from the raw workflow JSON → "error handler". If matched via `settings.callerIds` → "sub-workflow". Otherwise → "logical." Avoids schema change but adds heuristic logic to the UI layer.
- **(C) Drop type labels** — show connected automations without type distinction. Simplest. The connection itself is valuable; the type label is nice-to-have.

**Recommendation:** (B) Derive heuristically. The type information is deterministic and available in the raw workflow JSON (already stored on Automation.rawWorkflowJson). No schema change needed, and the heuristic is straightforward.

Your answer: b

## Confirmations Applied

Both `NEEDS CONFIRMATION` items resolved and applied to specs:

1. **Spec 09 — Q1: Spec viability** → Deferred. Spec shelved for R2 build sequence; may revisit post-R2. Marked resolved in spec.
2. **Spec 16 — Q2: Connection type labels** → (B) derive heuristically. Detail page checks `rawWorkflowJson` for `errorWorkflow`/`callerIds` to determine type. No schema change. Marked resolved in spec.

---

# Individual Epic Review — 2026-04-05 (pass 7)

## Summary
- Specs reviewed: 09, 12, 13, 14, 15, 16, 17
- Specs skipped (completed epics): 01, 02, 03, 04, 05, 05.5, 06, 07, 08, 10, 11
- Specs skipped (already refined): none (all stale — missing 11-llm-pipeline-v2-results.md)
- Specs modified: none
- Specs clean: 09, 12, 13, 14, 15, 16, 17

## Post-Epic 11 Review

Reviewed all 7 unbuilt specs against Epic 11 results. No new issues found:

- **09 (deferred)**: No Epic 11 dependencies. Still deferred.
- **12 (Design System)**: No Epic 11 dependency. Sidebar reads from ConnectorConfig.lastSyncAt, not LLM output.
- **13 (Dashboard)**: References CompanyProfile fields (nextMoveText, deltaSummary, systemLandscape, aggregateEstimates, analysisStatus) — all now populated by Epic 11. Governance dot references consistent with new `computeGovernanceDot()`.
- **14 (Process Map)**: BusinessProcess fields (steps, maturityLevel, valueAtStake) all defined and populated by Epic 11. businessNarrative already fixed in pass 6.
- **15 (Opportunities)**: Recommendation fields all populated. Deploy LLM call can reuse Epic 11's retryWithBackoff + stripJsonFences. suggestedPlatform mapping from systemSource noted in results but no spec impact.
- **16 (Detail)**: Automation enriched fields (businessNarrative, impact, detectability, systemsTouched, etc.) all populated. Connection type heuristic independent of Epic 11.
- **17 (Settings + Seed + Polish)**: Sync progress consistent with Epic 11's synchronous pipeline call + analysisStatus enum. Seed data "all v8 fields" covers new fields (trigger, triggerType, systemsTouched). processMetrics OQ (Epic 11 risk #2) doesn't affect spec 17.

All refinement markers updated with `11-llm-pipeline-v2-results.md`.

---

# Individual Epic Review — 2026-04-05 (pass 8)

## Summary
- Specs reviewed: 09, 13, 14, 15, 16, 17
- Specs skipped (completed epics): 01, 02, 03, 04, 05, 05.5, 06, 07, 08, 10, 11, 12
- Specs skipped (already refined): none (all stale — missing 12-design-system-results.md plus prior gaps)
- Specs modified: 09, 13, 14, 15, 16, 17
- Specs clean: none

## Post-Epic 12 Review

Reviewed all 6 unbuilt specs against new results from epics 06, 07, 08, 10, 11, 12 (accumulated since last refinement pass). Verified all field references against current `prisma/schema.prisma`.

## 09 — Production Hardening

### Findings

- **Status tag still "pending" despite being deferred** (inconsistent metadata)
  - The open questions confirm the spec is shelved. The status tag should match.
  - **Change**: Updated status tag from `pending` to `deferred`.

### Changes applied

- Changed `status/pending` → `status/deferred` in frontmatter

## 13 — Dashboard

### Findings

- **AC 4 doesn't handle "failed" analysisStatus** (missing AC clarity)
  - The AnalysisStatus enum includes `failed` (Epic 10 migration). AC 4 said `!== "complete"` which would show a skeleton for failed analyses — wrong UX. Failed should show an error message.
  - **Change**: Updated AC 4 to explicitly list the analyzing states (pending, analyzing_workflows, analyzing_workspace) and specify error state for "failed."

### Changes applied

- Updated AC 4: distinguishes analyzing states from failed state (error message + "Re-sync" link)

## 14 — Process Map

### Findings

- **Schema field name mismatch: "maturity" vs "maturityLevel"** (inconsistent domain language)
  - The spec used "maturity badge" and "maturity badge" in scope and ACs. The actual Prisma field is `BusinessProcess.maturityLevel` (String?). Consumers need the correct field name.
  - **Change**: Updated scope and AC 2 to reference `maturityLevel`.

- **AC 2 coverage and reliability computation not explicit** (hidden scope)
  - The scope says "coverage bar" and "reliability %" but doesn't specify how they're computed. Coverage and reliability are NOT stored fields on BusinessProcess. Coverage = automations.length / (automations.length + recommendations.length). Reliability is computed per AC 19a.
  - **Change**: Added computation formulas to AC 2.

- **BusinessProcess.steps Json structure undocumented** (ungrounded assumption)
  - AC 8 relies on `isGap` property in steps entries but no schema or type definition specifies the expected Json structure.
  - **Change**: Added expected structure `{ name: string, isGap: boolean }` to AC 8.

### Changes applied

- Updated scope and AC 2: "maturity" → "maturityLevel" field reference
- Added coverage/reliability computation formulas to AC 2
- Documented expected steps Json structure in AC 8

## 15 — Opportunities

### Findings

- **AC 8 references "evidenceChain" but field is "evidence"** (inconsistent domain language)
  - The Recommendation model has `evidence Json?` (not `evidenceChain`). The slide-over panel content description used "evidenceChain (bulleted)" which doesn't match the field name.
  - **Change**: Updated AC 8 to reference `evidence Json` with clarification about expected sub-structure.

### Changes applied

- Updated AC 8: "evidenceChain" → "evidence (from Recommendation.evidence Json)"

## 16 — Detail

### Findings

- **"total executions" referenced but no stored field** (ungrounded assumption)
  - AC 24 (evidence section) listed "total executions" in the execution stats. The Automation model stores `runsPerWeek`, `errorRate`, `lastExecutedAt`, `avgDurationMs` — but NOT `totalExecutions`. This field doesn't exist in the schema.
  - **Change**: Removed "total executions" from AC 24 and scope.

### Changes applied

- Removed "total executions" from execution stats list in scope and AC 24

## 17 — Settings + Seed + Polish

### Findings

- **Sync-phase stages not individually trackable** (hidden scope creep)
  - The spec listed 6 named stages but the `syncAndAnalyze` server action is a single call. The first 2 stages (fetching workflows, fetching execution data) are NOT individually observable from the client — the sync action completes entirely before analysis begins. Only analysis-phase stages are trackable via CompanyProfile.analysisStatus polling.
  - **Change**: Clarified the two-phase tracking constraint: sync phase = single "Syncing..." state (not individually trackable), analysis phase = trackable via analysisStatus polling.

### Changes applied

- Rewrote sync progress description to explicitly separate sync-phase (not individually trackable) from analysis-phase (trackable via polling) with AnalysisStatus enum mapping

---

# Individual Epic Review — 2026-04-05 (pass 3)

> Trigger: Epic 13 Dashboard completed + card-layout patch applied. All remaining specs (09, 14-17) were stale — missing `13-dashboard-results.md` from their refinement markers.

## Summary

- Specs reviewed: 09, 14, 15, 16, 17
- Specs skipped (completed epics): 01, 02, 03, 04, 05, 06, 07, 08, 10, 11, 12, 13
- Specs skipped (already refined): none (all 5 remaining specs were stale)
- Specs modified: 14, 15, 16, 17
- Specs clean: 09

## 09 — Production Hardening

### Findings
- No changes needed. Spec is deferred (`status/deferred`). The deferred resolution already notes that R2 page epics handle their own error boundaries and loading states.

### Changes applied
- None — spec clean.

## 14 — Process Map

### Findings
- **Dark theme color reference** (inconsistent domain language): Scope references `border-bottom (#262626)` — this is a dark theme hex value. Must use light theme semantic token `border-border` (#e5e7eb) per Amendment T.
- **Duplicated computation logic** (hidden scope creep): AC 19a describes computing reliability on-read, but this logic already exists in `dashboard-data.ts` as `buildProcessCoverage()`. Spec should reference the shared utility to prevent duplication (flagged in Epic 13 results as a risk).
- **Missing dependency** (ungrounded assumption): Spec depends on `dashboard-data.ts` utilities from Epic 13 but doesn't list Epic 13 as a dependency.
- **AC 19 missing maturityLevel and stepName** in query fields: These fields are needed for the collapsed row maturity badge and workflow step scope, but weren't listed in the query AC.

### Changes applied
- Fixed `#262626` → `border-border` token in scope section
- Updated AC 19 to include `maturityLevel` and `stepName` in query fields
- Updated AC 19a to reference `buildProcessCoverage()` and `formatAttentionMetric()` from `dashboard-data.ts`
- Added Epic 13 to dependencies
- Added Epic 13 to Related section

## 15 — Opportunities

### Findings
- **Missing dependency** (ungrounded assumption): Recommendation rows should maintain visual consistency with Dashboard's UnifiedCard pattern (same data fields: name, brief, tier, confidence, impactEstimate, scope, process). Spec doesn't reference Epic 13 which established this pattern.

### Changes applied
- Added Epic 13 to dependencies (UnifiedCard pattern, dashboard-data.ts utilities)
- Added Epic 13 to Related section

## 16 — Detail

### Findings
- **Body text size violation** (inconsistent domain language): Business Narrative scope says "12-13px, light gray" but design guidelines mandate 15px minimum body text. Fixed.
- **Missing dependency** (ungrounded assumption): Detail page can reuse `resolveStepScope()` and `formatAttentionMetric()` from `dashboard-data.ts` (Epic 13) for process position and metric display.
- **Missing TierBadge in Related** (hidden scope creep): Recommendation rows use TierBadge but it wasn't listed in the Related section's component list.

### Changes applied
- Updated body text size from "12-13px" to "15px minimum per design guidelines"
- Added Epic 13 to dependencies
- Added TierBadge to component list in Related section
- Added Epic 13 to Related section

## 17 — Settings + Seed + Polish

### Findings
- **Dark theme references** (inconsistent domain language): AC 20 says "dark theme" but Amendment T mandates light theme. Scope section also references "Dark theme already applied" — must be "Light theme."
- **Dashboard loading state already exists** (oversized slice): Scope implies creating Dashboard skeleton, but Epic 13 already implemented `DashboardAnalyzing` component in `page.tsx`. Updated to "polish styling if needed."

### Changes applied
- AC 20: "dark theme" → "light theme (per Amendment T)"
- Scope: "Dark theme already applied" → "Light theme applied in Epic 12 + light-theme patch"
- Scope: "Ensure error states render cleanly in dark theme" → "light theme"
- Dashboard loading state: noted as already implemented in Epic 13

---

# Individual Epic Review — 2026-04-05 (pass 9)

> Trigger: Epic 14 Process Map completed. All remaining specs (09, 15, 16, 17) were stale — missing `14-process-map-results.md` from their refinement markers.

## Summary

- Specs reviewed: 09, 15, 16, 17
- Specs skipped (completed epics): 01, 02, 03, 04, 05, 05.5, 06, 07, 08, 10, 11, 12, 13, 14
- Specs skipped (already refined): none (all 4 remaining specs were stale)
- Specs modified: 15, 17
- Specs clean: 09, 16

## 09 — Production Hardening

### Findings
- No changes needed. Spec is deferred (`status/deferred`). Epic 14 has no impact on a deferred spec.

### Changes applied
- None — spec clean.

## 15 — Opportunities

### Findings
- **AC 3 border styles don't match UnifiedCard component** (inconsistent domain language): Spec said "dashed amber (Investigate), none (Explore)." The actual UnifiedCard component (built in Epic 13 card-layout patch) uses solid `border-l-[3px]` for all types: green (act-now), amber (investigate), gray (explore). No dashed or missing borders.
  - **Change**: Updated AC 3 to match UnifiedCard's actual solid border behavior.

- **Stale Related section note contradicts scope** (inconsistent domain language): Related section had a NOTE saying "use same data fields as UnifiedCard but in table-row layout, not the stacked card component." This contradicts the scope ("UnifiedCard (type=recommendation) per recommendation") and design guidelines §5 ("UnifiedCard (recommendation type) per recommendation"). Stale note from before the card-layout patch.
  - **Change**: Removed contradictory note from Related section.

- **Process filter verified** (no change needed): Epic 14 gap cards link to `/opportunities?process={processId}`. AC 31-33 already cover this filter. Aligned.

### Changes applied
- Updated AC 3: border styles corrected to solid green/amber/gray per UnifiedCard component
- Removed stale "table-row layout" note from Related section

## 16 — Detail

### Findings
- No new issues. Reviewed against Epic 14 results:
  - "← Back to Process Map" link (AC 30) targets `/processes` which is now live and verified.
  - Process position clickable → `/processes` is consistent with the live Process Map.
  - `resolveStepScope()` and `formatAttentionMetric()` reuse from dashboard-data.ts (added in pass 3) is consistent with Epic 14's usage of the same utilities.

### Changes applied
- None — spec clean.

## 17 — Settings + Seed + Polish

### Findings
- **Process Map loading state already implemented** (oversized slice): Scope said "Process Map: skeleton or 'Analysis in progress...' message" — but Epic 14 already built `ProcessMapAnalyzing` component in `page.tsx` with skeleton layout and "Analyzing your automation landscape..." message.
  - **Change**: Updated to note the loading state is already implemented, same pattern as Dashboard.

### Changes applied
- Updated Process Map loading state: noted as already implemented in Epic 14 (ProcessMapAnalyzing)

---

# Individual Epic Review — 2026-04-06 (pass 10)

> Trigger: Epic 15 Opportunities completed. All remaining specs (09, 16, 17) were stale — missing `15-opportunities-results.md` from their refinement markers.

## Summary

- Specs reviewed: 09, 16, 17
- Specs skipped (completed epics): 01, 02, 03, 04, 05, 05.5, 06, 07, 08, 10, 11, 12, 13, 14, 15
- Specs skipped (already refined): none (all 3 remaining specs were stale)
- Specs modified: 16, 17
- Specs clean: 09

## Epic 15 — Key Changes Reviewed

Epic 15 had 11 commits with significant pipeline and UI changes:
- **automationId migration**: `automationId String?` added to Recommendation model, FK-validated against real IDs in pipeline
- **Tier normalization**: LLM outputs `"act now"`, `"immediate"`, `"high"` etc. Normalized to `"act-now" | "investigate" | "explore"` in `opportunities-data.ts`. TierBadge has **no fallback** — crashes on raw values.
- **Confidence normalization**: ConfidenceBadge expects `"data-driven" | "benchmark-based" | "ai-suggested"`. Also **no fallback**. Other views apply ad-hoc normalization (`.toLowerCase().replace(/\s+/g, "-")`).
- **processName linking**: LLM outputs `processName` per recommendation; pipeline creates new BusinessProcess records for unmatched names.
- **Inline collapsible**: Replaced slide-over with inline expand/collapse. Deep-link `?highlight=` auto-expands.
- **Deploy for all types**: Deploy button available for new workflow + fix/optimize/enhance types.
- **Performance**: Skip-unchanged automations (checks `automationLastUpdated`), Haiku for per-automation calls, previous analysis context for workspace LLM.
- **Known issues**: Process name instability across re-syncs; skip-unchanged misses execution stat changes.

## 09 ��� Production Hardening

### Findings
- No changes needed. Spec is deferred (`status/deferred`). Epic 15 has no impact on a deferred spec.

### Changes applied
- None — spec clean.

## 16 — Detail

### Findings

- **TierBadge will crash on raw DB tier values** (ungrounded assumption)
  - AC 13 renders TierBadge per recommendation. The TierBadge component expects `"act-now" | "investigate" | "explore"` with NO fallback — it uses direct object key lookup (`tierStyles[tier]`, `tierLabels[tier]`). The DB stores LLM output values like `"act now"` (with space), `"immediate"`, `"high"`. Epic 15's `opportunities-data.ts` normalizes these via `normalizeTier()`, but the Detail page has no data layer and would pass raw values.
  - **Change**: Added normalization note to AC 13 — must reuse or extract `normalizeTier()` from `opportunities-data.ts`.

- **ConfidenceBadge will crash on raw confidence values** (ungrounded assumption)
  - AC 9-10 render ConfidenceBadge for time savings and revenue connection. ConfidenceBadge expects `"data-driven" | "benchmark-based" | "ai-suggested"` with NO fallback (`levelStyles[level]` direct lookup). LLM may output `"data driven"` (with space), `"high"`, `"medium"`, etc. Epic 15's opportunities-view.tsx and dashboard-view.tsx apply ad-hoc normalization (`.toLowerCase().replace(/\s+/g, "-")`). Detail page needs the same.
  - **Change**: Added normalization note to scope (Business Case Card) and referenced in AC 9-10.

- **No issues with other Epic 15 changes**:
  - AC 12 already specifies `automationId` match (direct) as primary recommendation linkage — consistent with Epic 15's migration.
  - AC 14 navigates to `/opportunities?highlight={id}` — still correct with inline collapsible (highlight auto-expands).
  - Process Position (AC 16-17) reads from `Automation.processId` which is set by pipeline independently of Epic 15's recommendation-level `processName` linking.
  - Deploy actions live on Opportunities page; Detail page correctly navigates there via AC 14.

### Changes applied
- Added tier normalization note to AC 13 (reference `normalizeTier()` from `opportunities-data.ts`)
- Added confidence normalization note to scope (Business Case Card section)
- Added normalization cross-reference to AC 9 and AC 10

## 17 — Settings + Seed + Polish

### Findings

- **Opportunities loading state already implemented** (oversized slice)
  - Scope said "Opportunities: skeleton or 'Generating recommendations...' message" — but Epic 15 already built the Opportunities page.tsx to handle all `analysisStatus` values (empty/analyzing/failed/complete states). Same pattern as Dashboard (Epic 13) and Process Map (Epic 14) loading states previously noted.
  - **Change**: Updated scope to note Opportunities loading state is already implemented in Epic 15.

- **Dashboard tier normalization gap — latent crash bug** (hidden scope creep)
  - `dashboard-data.ts` (lines ~552, 565) casts `Recommendation.tier` directly as `"act-now" | "investigate" | "explore"` WITHOUT calling `normalizeTier()`. If the DB contains LLM output like `"act now"` (with space) or `"immediate"`, TierBadge will crash. Same risk exists for ConfidenceBadge. This is a pre-existing bug surfaced by Epic 15's normalization discovery.
  - **Change**: Added to "Remaining UX gaps" scope section as a known normalization gap to fix.

- **No issues with other Epic 15 changes**:
  - Seed data (AC 10-15): Deterministic seed uses hardcoded values — not affected by pipeline changes. Should include `automationId` on some recommendations but this is an implementation detail, not a spec gap.
  - Sync progress (AC 1-5): Performance optimizations (skip-unchanged, Haiku) don't change the `analysisStatus` enum progression. Progress UI still valid.
  - Deep-links (AC 27): `/opportunities?highlight={id}` and `/opportunities?process={id}` verified working in Epic 15.

### Changes applied
- Updated Opportunities loading state: noted as already implemented in Epic 15
- Added dashboard-data.ts tier/confidence normalization gap to "Remaining UX gaps" scope section

---

## Related

- [Cross-Epic Review](cross-epic-review.md)
