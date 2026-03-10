# Individual Epic Review — 2026-03-10

## Summary
- Specs reviewed: 04, 05, 06, 07, 08
- Specs skipped (completed epics): 01, 02, 03
- Specs modified: 04, 05, 06, 07, 08
- Specs clean: none

## 04 — LLM Pipeline

### Findings
- **`impactReasoning` migration not in ACs** (Hidden scope creep)
  - **Change**: Added AC for Prisma schema migration adding `impactReasoning String?` to Automation model
- **`rawWorkflowJson` returns Prisma `JsonValue` type, needs casting** (Hidden scope creep)
  - **Change**: Added scope note about `JsonValue` type requiring `JSON.stringify()` before sending to API
- **Model name references "Sonnet 4.6 or Haiku 4.5" may be stale** (Ungrounded assumption)
  - **Change**: Replaced with generic "Claude Sonnet or Haiku — choose at implementation time" and added note about named constant for model ID
- **Missing workspace authorization on regenerate endpoint** (Missing AC)
  - **Change**: Added AC verifying automation belongs to requesting user's workspace
- **`sideEffects` is `String[]` in schema but spec describes it as if single text** (Ungrounded assumption)
  - **Change**: Clarified Side Effects is an array matching schema `sideEffects String[]`
- **"API route" vs server action vs service function inconsistency** (Inconsistent domain language)
  - `NEEDS CONFIRMATION` — added as open question: should the LLM pipeline be an internal service function callable from both a server action (regenerate) and the sync handler (post-sync)?
- **Post-sync trigger integration point unclear — risks timeout** (Hidden scope creep)
  - `NEEDS CONFIRMATION` — added as open question: inline (blocks sync), separate call, or fire-and-forget?
- **Which automations need LLM processing after sync** (Missing AC)
  - `NEEDS CONFIRMATION` — added as open question: track IDs during sync or query by `documentationLastUpdated` comparison?

### Changes applied
- Added `impactReasoning` migration AC
- Added `rawWorkflowJson` JsonValue handling note to scope
- Changed model references to generic with named constant
- Changed "API route" to "endpoint (server action or API route)" with workspace verification
- Clarified Side Effects as array type
- Added 3 `NEEDS CONFIRMATION` open questions (post-sync trigger, API route vs service function, LLM target selection)
- Resolved Claude model choice open question

## 05 — Risk Engine

### Findings
- **Overdue review rule undefined when `lastReviewDate` is null** (Missing AC)
  - **Change**: Updated rule to explicitly handle null: `lastReviewDate IS NULL` (never reviewed) OR `lastReviewDate + reviewCadenceDays < now`
- **Function signature inconsistency: pure vs data-loading** (Hidden scope creep)
  - **Change**: Clarified `getGovernanceSignals`/`getRiskLevel` are pure functions on a single record; `getSystemExposure`/`getOwnerExposure` are data-loading functions that query and aggregate
- **No AC for null `impactProposal` or empty `systemsTouched` edge cases** (Missing AC)
  - **Change**: Added to unit test AC: null impactProposal defaults to weight 1, empty systemsTouched means no system exposure contribution
- **`systemsTouched` values from LLM may have inconsistent casing** (Ungrounded assumption)
  - `NEEDS CONFIRMATION` — added as open question: should epic 04 normalize system names (lowercase) during LLM parsing?

### Changes applied
- Updated Overdue review rule for null case
- Clarified function signatures (pure vs data-loading)
- Extended unit test edge cases
- Added 1 `NEEDS CONFIRMATION` open question (system name normalization)

## 06 — Portfolio Screen

### Findings
- **Governance badge computation depends on epic 05 but not stated** (Hidden scope creep)
  - **Change**: Added Dependencies section referencing epic 05
- **URL query param format unspecified** (Hidden scope creep)
  - **Change**: Specified repeated query params format with named param keys (`system`, `owner`, `attention`, `platform`, `search`, `sort`, `order`)
- **Case-insensitive search needs explicit Prisma `mode: 'insensitive'`** (Ungrounded assumption)
  - **Change**: Clarified Prisma `contains` with `mode: 'insensitive'`
- **Sync status indicator assumes single connector** (Ungrounded assumption)
  - **Change**: Clarified "workspace's n8n ConnectorConfig (for MVP, at most one connector per workspace)"
- **No empty state AC** (Missing AC)
  - **Change**: Added AC for empty state with guidance to connect automation platform
- **Filter badge counts: global vs dynamic with active filters** (Missing AC)
  - `NEEDS CONFIRMATION` — added as open question: global counts (simpler) or counts that update with other active filters?

### Changes applied
- Added Dependencies section
- Specified URL param format
- Clarified case-insensitive search mode
- Clarified sync status single connector scope
- Added empty state AC
- Added 1 `NEEDS CONFIRMATION` open question (filter badge counts)

## 07 — Automation Detail

### Findings
- **"Open in n8n" link needs ConnectorConfig loading, no handling for missing config** (Hidden scope creep)
  - **Change**: Added note that link is hidden if no ConnectorConfig exists; added AC for missing config
- **Regenerate button has no loading/error state** (Missing AC)
  - **Change**: Added loading state and error handling behavior to scope and AC
- **`triggerType` in metadata grid is LLM-generated but appears alongside editable fields** (Inconsistent domain language)
  - **Change**: Added "(read-only, LLM-generated)" annotation to triggerType in AC
- **Edit persistence mechanism not specified** (Missing AC)
  - **Change**: Updated save AC to specify server action with workspace ownership verification
- **Missing 404 handling for invalid/unauthorized automation IDs** (Missing AC)
  - **Change**: Added AC for 404 when automation doesn't exist or doesn't belong to user's workspace
- **"Mark as reviewed" — open question contradicts AC** (Missing AC)
  - `NEEDS CONFIRMATION` — replaced old open question: standalone (recommended) vs edit mode?
- **Back navigation filter preservation** (Hidden scope creep)
  - `NEEDS CONFIRMATION` — added as open question: `router.back()` (preserves filters) vs simple link (loses filters)?

### Changes applied
- Added ConnectorConfig missing state handling
- Added Regenerate loading/error behavior
- Annotated triggerType as read-only LLM-generated
- Specified server action persistence with workspace verification
- Added 404 AC
- Added 2 `NEEDS CONFIRMATION` open questions (Mark as reviewed placement, back navigation)

## 08 — Workspace Snapshot

### Findings
- **Null effective impact not explicitly excluded from high-impact count** (Missing AC)
  - **Change**: Added note that automations with null effective impact are not counted as high-impact
- **Click-through URLs must match Portfolio's URL param format** (Hidden scope creep)
  - **Change**: Added Dependencies section referencing epic 05 and epic 06 (URL param format defined in epic 06)
- **Recently changed/multi-system sections have no result limits** (Missing AC)
  - **Change**: Added "up to 5 items with 'View all' link" to both sections in scope and ACs
- **Exposure bar visual scale undefined** (Missing AC)
  - **Change**: Added "scaled relative to highest score — top item fills 100% width" to scope and ACs
- **Missing dependency section** (Hidden scope creep)
  - **Change**: Added Dependencies section
- **Metrics cards clickable still unresolved** (Missing AC)
  - `NEEDS CONFIRMATION` — added as open question: should all 5 metrics cards navigate to filtered Portfolio views?

### Changes applied
- Added null impact exclusion note
- Added Dependencies section (epic 05 + epic 06)
- Added result limits (5 items + "View all") for structural indicators
- Defined exposure bar relative scaling
- Added 1 `NEEDS CONFIRMATION` open question (clickable metrics cards)

## Brainstorming

8 design decisions need your input before they can be applied to the specs. Please answer below each question.

---

### Epic 04 — LLM Pipeline

#### Q1: Post-sync LLM trigger mechanism

After `syncWorkflows()` completes, the LLM pipeline needs to run for new/updated automations. The current `syncWorkflows` is a server action that returns a summary to the client. Three options:

- **(a) Inline** — LLM processing runs inside `syncWorkflows` before it returns. Simplest, but for 10+ workflows with sequential LLM calls, this could take 30+ seconds and risk server action timeouts.
- **(b) Separate call** — `syncWorkflows` returns the sync summary immediately. The UI (or a follow-up server action) then triggers LLM processing separately. Keeps sync fast, LLM processing is observable.
- **(c) Fire-and-forget** — `syncWorkflows` kicks off LLM processing but returns without waiting. Fastest response, but errors are invisible to the user.

**Recommendation:** (b) — return sync immediately, then expose a separate "process unprocessed automations" action. The sync summary can indicate how many automations need LLM processing.

Your answer: b

#### Q2: API route vs server action vs internal service function

The existing codebase uses server actions for all mutations (`actions/auth.ts`, `actions/connector.ts`). The LLM pipeline needs to be callable from two places: (1) the regenerate button on the detail page, and (2) the post-sync handler. A server action calling another server action is architecturally awkward.

**Recommendation:** Create an internal service function (`src/lib/llm-pipeline.ts`) with the core logic. Expose it via a server action for the regenerate button. Call it directly from the sync/post-sync handler. This follows the existing pattern where `n8n-client.ts` is a service module called by `actions/connector.ts`.

Your answer: oke ie. follow your recommendation

#### Q3: Determining which automations need LLM processing

After sync, the pipeline needs to know which automations to process. Two approaches:

- **(a) Track IDs during sync** — `syncWorkflows` returns the IDs of created/updated automations, and the pipeline processes exactly those.
- **(b) Query by timestamp** — process all automations where `documentationLastUpdated IS NULL OR automationLastUpdated > documentationLastUpdated`. Idempotent, doesn't require sync to pass IDs, also works for a manual "process all unprocessed" action.

**Recommendation:** (b) — more robust, reusable, and handles edge cases like interrupted previous LLM runs.

Your answer:  b

---

### Epic 05 — Risk Engine

#### Q4: System name normalization

`systemsTouched` values come from the LLM and may vary in casing (e.g., "Slack" vs "slack" vs "Slack API"). This affects the accuracy of system exposure scores and filter chips in epic 06. Should epic 04 normalize system names during LLM response parsing?

**Recommendation:** Yes — lowercase all system names during parsing in epic 04. This is a lightweight mitigation that prevents "Slack" and "slack" from being counted as different systems. It's a one-line change in the LLM response parser.

Your answer: oke ie your recommendation

---

### Epic 06 — Portfolio Screen

#### Q5: Filter badge counts — global or dynamic

The Attention filter row shows governance signal counts (e.g., "No owner assigned (3)"). When other filters are active (e.g., system=Slack), should these counts:

- **(a) Stay global** — always show total workspace counts regardless of other active filters. Simpler to implement, matches typical faceted search UX (e.g., Amazon).
- **(b) Update dynamically** — counts reflect the currently filtered set. More informative but more complex (requires recomputing counts on every filter change).

**Recommendation:** (a) — global counts for MVP simplicity. Dynamic counts can be added later if users find it confusing.

Your answer:  a

---

### Epic 07 — Automation Detail

#### Q6: "Mark as reviewed" placement

The current AC bundles "Mark as reviewed" inside edit mode. But the open question (and UX reasoning) suggests it should be standalone. "Mark as reviewed" is a frequent, single-click action — requiring the user to enter edit mode, click "Mark as reviewed", then save/cancel adds unnecessary friction.

- **(a) Standalone** — a button visible on the detail page at all times, outside edit mode. One click to mark as reviewed.
- **(b) Part of edit mode** — only accessible after clicking "Edit". Grouped with other editable fields.

**Recommendation:** (a) — standalone. It's a high-frequency, low-ceremony action.

Your answer:  a

#### Q7: Back navigation filter preservation

"← Back to Automations" needs to navigate back to the Portfolio. If Emma came from a filtered view (e.g., system=Slack), pressing back should ideally return to that filtered view.

- **(a) `router.back()`** — uses browser history, preserving the Portfolio's filter state. If there's no history (user navigated directly to the detail page), falls back to `/automations`.
- **(b) Simple `<Link href="/automations">`** — always navigates to the unfiltered Portfolio. Simpler, but loses filter context.

**Recommendation:** (a) — `router.back()` with fallback. Better UX with minimal additional complexity.

Your answer:  a

---

### Epic 08 — Workspace Snapshot

#### Q8: Clickable metrics cards

Should the 5 top metrics cards (Total automations, High-impact, High-risk, Missing owners, Overdue reviews) be clickable, navigating to filtered Portfolio views?

- **(a) Clickable** — each card navigates: Total → `/automations`, High-impact → filtered by impact, High-risk → filtered by risk, Missing owners → `/automations?attention=no-owner`, Overdue reviews → `/automations?attention=overdue-review`.
- **(b) Not clickable** — metrics are display-only. Click-through only via exposure rankings.

**Recommendation:** (a) — low implementation effort (just wrapping cards in links) and significantly improves dashboard-to-action navigation.

Your answer:  a

## Confirmations Applied

All 8 `NEEDS CONFIRMATION` items resolved and applied to specs:

1. **Spec 04 — Q1: Post-sync trigger** → (b) separate call. Updated scope and ACs: sync returns immediately, UI triggers LLM processing via follow-up server action.
2. **Spec 04 — Q2: Architecture** → Internal service module (`src/lib/llm-pipeline.ts`) with server action wrappers. Updated scope and ACs.
3. **Spec 04 — Q3: LLM target selection** → (b) query by timestamp (`documentationLastUpdated IS NULL OR automationLastUpdated > documentationLastUpdated`). Updated ACs.
4. **Spec 05 → Spec 04 — Q4: System name normalization** → Yes, lowercase during parsing. Added normalization note to spec 04 `systemsTouched` field. Marked resolved in spec 05.
5. **Spec 06 — Q5: Filter badge counts** → (a) global counts. Updated Attention row description. Marked resolved.
6. **Spec 07 — Q6: Mark as reviewed** → (a) standalone. Moved out of edit mode into new "Standalone Actions" section. Updated ACs. Marked resolved.
7. **Spec 07 — Q7: Back navigation** → (a) `router.back()` with fallback. Updated AC. Marked resolved.
8. **Spec 08 — Q8: Clickable metrics cards** → (a) clickable. Updated AC with navigation targets. Marked resolved.
