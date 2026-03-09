# Individual Epic Review — 2026-03-09

## Summary
- Specs reviewed: 02, 03, 04, 05, 06, 07, 08
- Specs skipped (already refined): 01
- Specs modified: 02, 03, 04, 05, 06, 07, 08
- Specs clean: (none)

## 02 — Authentication

### Findings
- **No AC for duplicate email signup** (Missing acceptance criteria)
  - **Change**: Added AC — signing up with an already-registered email shows an error and does not create a duplicate User record
- **No AC for invalid login credentials** (Missing acceptance criteria)
  - **Change**: Added AC — logging in with incorrect credentials shows a generic error message (does not reveal whether email or password was wrong)

### Changes applied
- Added 2 acceptance criteria: duplicate email error handling, invalid credentials error handling

## 03 — n8n Connector

### Findings
- **`/settings` route and sidebar nav not called out** (Hidden scope creep)
  - **Change**: Added explicit note in scope that `/settings` route and a sidebar settings icon need to be created (not part of epic 01)
- **"Optionally in the app header" is ambiguous** (Missing acceptance criteria)
  - **Change**: Removed "optionally in the app header" from scope; added `NEEDS CONFIRMATION` open question about whether a Sync button should also appear in the app header
- **No AC for sync-in-progress state** (Missing acceptance criteria)
  - **Change**: Added AC — while sync is in progress, the Sync button is disabled and a progress indicator is shown

### Changes applied
- Scope: added note about `/settings` route and sidebar navigation creation
- Scope: removed ambiguous "optionally in the app header"
- Added 1 acceptance criterion: sync-in-progress state
- Added 1 open question (`NEEDS CONFIRMATION`): Sync button placement outside settings

## 04 — LLM Pipeline

### Findings
- **Post-sync trigger mechanism undefined** (Hidden scope creep)
  - **Change**: Clarified in scope that the trigger mechanism is implemented within this epic (sync completion handler calls LLM pipeline internally) and automations are processed sequentially to respect rate limits
- **No AC for partial/incomplete LLM responses** (Missing acceptance criteria)
  - **Change**: Added AC — if the LLM response is missing required fields or contains unparseable data, existing LLM fields are not overwritten and the error is reported

### Changes applied
- Scope: clarified post-sync trigger mechanism and sequential processing strategy
- Added 1 acceptance criterion: partial/malformed LLM response handling

## 05 — Risk Engine

### Findings
- **Inconsistency between prose and rules on impact classification** (Inconsistent domain language)
  - The paragraph after the risk level rules says "The risk level considers both governance signals and the impact classification" but the concrete rules (High/Medium/Low) only use governance signal counts. The open question already asks about this but the spec text was contradictory.
  - **Change**: Replaced the inconsistent paragraph with a note clarifying the current rules use signal counts only and referencing the open question about impact elevation
- **Null `documentationLastUpdated` not handled in "Documentation outdated" signal** (Missing acceptance criteria)
  - If LLM pipeline hasn't run yet, `documentationLastUpdated` is null. The original rule `automationLastUpdated > documentationLastUpdated` would evaluate to false in SQL, missing the case where documentation was never generated.
  - **Change**: Updated rule to: `documentationLastUpdated IS NULL` (never generated) OR `automationLastUpdated > documentationLastUpdated`
- **Null `automationLastUpdated` not handled in "Automation stale" signal** (Missing acceptance criteria)
  - **Change**: Updated rule to require `automationLastUpdated IS NOT NULL`; if null, signal is inactive

### Changes applied
- Governance signals table: fixed "Documentation outdated" to handle null `documentationLastUpdated`
- Governance signals table: fixed "Automation stale" to handle null `automationLastUpdated`
- Risk level section: replaced contradictory paragraph with clarifying note referencing open question

## 06 — Portfolio Screen

### Findings
- **No AC for Platform filter** (Missing acceptance criteria)
  - The scope defines a Platform filter row with chips, but no acceptance criterion covers its behavior.
  - **Change**: Added AC — platform filter chips show each platform with count; selecting one or more filters the list
- **Attention badges domain term lists only 4 of 5 signals** (Inconsistent domain language)
  - Definition listed "documentation outdated, no owner, stale, inactive" — missing "overdue review"
  - **Change**: Updated to list all 5 governance signals

### Changes applied
- Added 1 acceptance criterion: platform filter behavior
- Updated domain term "Attention badges" to include all 5 governance signals

## 07 — Automation Detail

### Findings
- **No handling for null LLM fields** (Missing acceptance criteria)
  - Between n8n sync and LLM pipeline processing, all LLM-generated fields are null. The detail page needs to handle this gracefully rather than showing blank content.
  - **Change**: Added AC — if LLM-generated fields are null, the page displays placeholder text (e.g., "Pending generation")

### Changes applied
- Added 1 acceptance criterion: null LLM fields display placeholder text

## 08 — Workspace Snapshot

### Findings
- **"High-impact" metric doesn't specify effective impact** (Ungrounded assumption)
  - The metric "High-impact automations" references impact = Critical or High, but doesn't specify whether to use `impactProposal` or `impactOverride`. Should use effective impact = `impactOverride ?? impactProposal`, consistent with how effective status works.
  - **Change**: Updated metric description to specify effective impact = `impactOverride ?? impactProposal`
- **Vague AC for exposure ranking visuals** (Missing acceptance criteria)
  - AC said "visual indication of relative exposure" but scope specifies "a visual bar". AC should match scope.
  - **Change**: Updated both ACs to specify "visual bar" instead of "visual indication"
- **No guidance for empty state** (Missing acceptance criteria)
  - `NEEDS CONFIRMATION` — added as open question: what should the dashboard show when no automations have been synced?

### Changes applied
- Updated "High-impact" metric to specify effective impact formula
- Updated 2 ACs: exposure ranking visuals now specify "visual bar"
- Added 1 open question (`NEEDS CONFIRMATION`): empty state behavior

## Brainstorming

Two design decisions need your input before they can be applied to the specs. Please answer below each question.

### 03 — n8n Connector: Sync button placement

The scope originally said "Sync button on the settings page (and optionally in the app header)." The "optionally" was ambiguous, so the scope was trimmed to settings page only and this question was flagged.

**Question:** Should a Sync button also appear in the app header (visible on all pages) for quick re-sync access, or should syncing only be triggered from the settings page?

- **Settings page only** — sync is a setup/config action; keeps the main UI clean
- **Both header and settings** — Emma can re-sync without navigating away from Portfolio or Snapshot

Your answer: settings page

### 08 — Workspace Snapshot: Empty state when no automations

The dashboard aggregates metrics from synced automations. Before the first n8n sync, there are zero automations.

**Question:** What should the Workspace Snapshot show when no automations have been synced yet?

- **Guided empty state** — a message like "No automations yet" with a call-to-action linking to the settings page to connect n8n
- **Just zeros** — render the normal dashboard layout with all metrics at 0 and empty rankings

Your answer: guided empty state

## Confirmations Applied

Both `NEEDS CONFIRMATION` items resolved and applied to specs:

1. **Spec 03 — Sync button placement** → Settings page only. Open question marked as resolved. No scope/AC changes needed (scope already reflected this after the ambiguous phrasing was removed in Phase 1).
2. **Spec 08 — Empty state** → Guided empty state. Open question marked as resolved. Added AC: "When no automations exist in the workspace, the dashboard shows a guided empty state with a message and a call-to-action linking to the settings page to connect n8n."
