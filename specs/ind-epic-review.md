# Individual Epic Review — 2026-03-09

## Summary
- Specs reviewed: 02, 03, 04, 05, 06, 07, 08
- Specs skipped (completed): 01
- Specs modified: 02, 04, 05, 06
- Specs clean: 03, 07, 08

## 02 — Authentication

### Findings
- **Prisma 7 adapter compatibility not addressed** (Ungrounded assumption)
  - Epic 01 results flagged that Prisma 7 uses `src/generated/prisma/` output path and `prisma.config.ts` for datasource config. The Auth.js Prisma adapter needs to be configured for this non-default import path. The spec made no mention of this.
  - **Change**: Added a Prisma 7 compatibility note to the scope section, specifying the generated client path and the need to verify `@auth/prisma-adapter` compatibility with Prisma 7.

### Changes applied
- Scope: added Prisma 7 note about generated client path and adapter compatibility

## 03 — n8n Connector

### Findings
- No new issues found. Previous refinement covered settings route, sync button placement, and sync-in-progress state. Open questions about encryption approach and `updatedAt` optimization remain — these are design choices left for implementation.

### Changes applied
- (none)

## 04 — LLM Pipeline

### Findings
- **Impact reasoning has no storage field** (Hidden scope creep)
  - The spec says the LLM returns "impactProposal (level + reasoning)" and the AC says the response contains "impactProposal (level + reasoning)." However, the schema only has `impactProposal ImpactLevel?` — an enum that stores the level only. The reasoning from the LLM would be silently discarded unless a new field is added.
  - `NEEDS CONFIRMATION` — added as open question: should an `impactReasoning String?` field be added, or is reasoning discarded after classification?

### Changes applied
- Added 1 open question (`NEEDS CONFIRMATION`): impact reasoning storage

## 05 — Risk Engine

### Findings
- **`deprecated` effective status not explicitly addressed by governance signals** (Inconsistent domain language)
  - The `Inactive` signal fires when `effective status = inactive`. An automation with `statusOverride = deprecated` has effective status `deprecated`, which does NOT trigger this signal. This was implicit but not stated, which could confuse implementers.
  - **Change**: Added clarifying note after the governance signals table explaining that `deprecated` does not trigger the Inactive signal.
- **Null effective impact not addressed in weight mapping** (Missing acceptance criteria)
  - The exposure score weight mapping defines weights for Critical (4), High (3), Medium (2), Low (1), but both `impactProposal` and `impactOverride` can be null (before LLM pipeline runs). The spec doesn't define what weight to use when effective impact is null.
  - `NEEDS CONFIRMATION` — added as open question with three options: default to Low (1), use weight 0, or exclude from calculations.

### Changes applied
- Added clarifying note: `deprecated` effective status does not trigger Inactive governance signal
- Added 1 open question (`NEEDS CONFIRMATION`): null effective impact weight mapping

## 06 — Portfolio Screen

### Findings
- **Status badge values incomplete** (Inconsistent domain language)
  - Scope layout listed "Status badge (Active / Inactive)" but the `StatusOverride` enum includes `deprecated`. An automation with `statusOverride = deprecated` would show "Deprecated" as its effective status, which the badge needs to handle.
  - **Change**: Updated to "Status badge (Active / Inactive / Deprecated)"

### Changes applied
- Scope: updated status badge values to include Deprecated

## 07 — Automation Detail

### Findings
- No new issues found. Previous refinement covered null LLM fields placeholder. Open question about "Mark as reviewed" placement (standalone vs edit mode) remains — this is a design choice left for implementation.

### Changes applied
- (none)

## 08 — Workspace Snapshot

### Findings
- No new issues found. Previous refinement covered empty state (resolved: guided empty state with CTA). Open questions about 7-day threshold and clickable metrics cards remain — these are design choices left for implementation.

### Changes applied
- (none)

## Brainstorming

Two design decisions need your input before they can be applied to the specs. Please answer below each question.

### 04 — LLM Pipeline: Impact reasoning storage

The spec says the LLM returns "impactProposal (level + reasoning)" — e.g., the LLM might say `{ "level": "high", "reasoning": "This automation handles payment processing and modifies CRM records. Failure would block revenue recognition." }`. However, the Automation schema only has `impactProposal ImpactLevel?` (an enum), so only the level is stored. The reasoning would be silently discarded.

**Question:** Should the LLM's impact reasoning be persisted?

- **Yes — add `impactReasoning String?`** — Stored alongside the level; could be shown on the Automation Detail screen (spec 07) to help Emma understand why the LLM classified impact that way. Requires a schema migration.
- **No — discard reasoning** — The level alone is sufficient for MVP. Emma can read `businessContext` for a similar understanding. Simpler schema, no migration needed.

Your answer: yes

### 05 — Risk Engine: Null effective impact in exposure scores

The exposure score formula is `impact_weight × risk_weight`. Impact weights are defined for Critical (4), High (3), Medium (2), Low (1). But before the LLM pipeline runs (or if the LLM fails), both `impactProposal` and `impactOverride` are null, so effective impact is null. The spec doesn't define what happens.

**Question:** What exposure weight should be used when effective impact is null?

- **(a) Default to Low (weight 1)** — Automations still appear in exposure rankings with minimal weight. Conservative; nothing is invisible.
- **(b) Use weight 0** — Automations are effectively invisible in exposure rankings until the LLM classifies them. Encourages running the LLM pipeline but could hide important automations.
- **(c) Exclude from exposure calculations** — Same practical effect as (b) but semantically different: null-impact automations don't contribute to system/owner totals at all.

Your answer: what is your recommendation?

**Recommendation: (a) Default to Low (weight 1).** Reasoning: null impact only occurs in the brief window between n8n sync and LLM pipeline completion (the pipeline runs automatically after sync). During that window, automations should still be visible in exposure rankings rather than silently disappearing. Defaulting to Low is conservative — it doesn't overstate risk but ensures nothing is hidden. Options (b) and (c) risk masking an automation that touches a critical system just because the LLM hasn't processed it yet.

accept recommendation

## Confirmations Applied

Both `NEEDS CONFIRMATION` items resolved and applied to specs:

1. **Spec 04 — Impact reasoning storage** → Yes, store reasoning. Added `impactReasoning String?` to the Automation model definition in spec 01. Updated spec 04: scope clarifies reasoning is stored in `impactReasoning`, AC updated to include `impactReasoning` persistence, domain terms updated, open question marked resolved. Note: the actual schema migration happens in epic 04 (not retroactively in the already-completed epic 01).
2. **Spec 05 — Null effective impact weight** → Default to Low (weight 1). Updated weight mapping to include `null = 1 (defaults to Low until classified)`. Open question marked resolved.