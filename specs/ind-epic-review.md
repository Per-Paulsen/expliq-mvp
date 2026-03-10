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
