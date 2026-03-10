# Individual Epic Review — 2026-03-10 (pass 2)

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
