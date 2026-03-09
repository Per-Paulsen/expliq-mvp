# Cross-Epic Review — 2026-03-09

## Summary
- Total specs reviewed: 8
- Specs modified: 01-project-setup, 02-auth, 03-n8n-connector, 04-llm-pipeline, 05-risk-engine, 06-portfolio-screen, 07-automation-detail, 08-workspace-snapshot
- Specs clean: (none — all required at least minor updates)

## Changes by Epic

### 01 — Project Setup
- **Issue**: Status enum missing `deprecated` value that epic 07 introduces in its edit mode (schema drift)
  - **Involved epics**: 07-automation-detail, 03-n8n-connector
  - **Change**: ~~Initially flagged NEEDS CONFIRMATION.~~ **Resolved**: Added `statusOverride` field to Automation model (enum: `active`, `inactive`, `deprecated` — nullable). Sync writes to `status`; user overrides write to `statusOverride`. Effective status = `statusOverride ?? status`. Added domain term for `status / statusOverride`.
  - **Cascade**: Applied to epics 03, 05, 06, 07, 08

### 02 — Authentication
- **Issue**: Epic 01 defers password storage to epic 02, but epic 02 never explicitly states that a `passwordHash` field must be added to the User model (acceptance criteria gap)
  - **Involved epics**: 01-project-setup
  - **Change**: Added to scope: "The User model is extended with a `passwordHash` field (`String`) to support the Credentials provider — this field was deferred from epic 01." Added AC: "A `passwordHash` field is added to the User model in the Prisma schema."
  - **Cascade**: None — epic 01 already documents the deferral

### 03 — n8n Connector
- **Issue**: All imported workflows are set to `status = active`, but epic 05's "Inactive" governance signal assumes status is derived from n8n's active/inactive flag (forward dependency gap)
  - **Involved epics**: 05-risk-engine
  - **Change**: Updated the import pipeline step 3 and acceptance criteria to read the n8n workflow's `active` property and map it to `status = active` or `status = inactive`
  - **Cascade**: None — epic 05's "Inactive" signal rule (`status = inactive`) now has a valid data source

### 04 — LLM Pipeline
- **Issue**: `triggerType` exists in the schema (epic 01) and is displayed on the detail screen (epic 07), but no epic populates it (forward dependency gap)
  - **Involved epics**: 01-project-setup, 07-automation-detail
  - **Change**: Added `triggerType` (categorical classification: webhook, schedule, manual, event, or other) to the LLM extraction field list and updated the AC for the LLM return format
  - **Cascade**: None — the schema field already exists and epic 07 already displays it

### 06 — Portfolio Screen
- **Issue 1**: Epic 05 defines 5 governance signals, but epic 06's attention filter row only shows 4 — "Overdue review" is missing (missing handoff)
  - **Involved epics**: 05-risk-engine
  - **Change**: Added "Overdue review" to the attention filter badges list and updated the AC to reference "all five governance signal counts"
  - **Cascade**: None

- **Issue 2**: Epic 08 says clicking an owner in the exposure ranking navigates to Portfolio filtered by that owner, but epic 06 has no owner filter (missing handoff)
  - **Involved epics**: 08-workspace-snapshot
  - **Change**: Added an **Owner** filter row (clickable chips with counts, including "No owner") and a new AC: "Owner filter chips show each owner (and 'No owner') with count; selecting one or more filters the list to automations with those owners"
  - **Cascade**: None — epic 08's click-through now has a valid destination

### 07 — Automation Detail
- **Issue**: Edit mode offers "Deprecated" as a status option, but this value doesn't exist in the schema enum (`active`, `inactive`, `removed`). Additionally, the single `status` field serves dual duty for sync-derived status and user overrides, which could conflict (schema drift / design decision)
  - **Involved epics**: 01-project-setup, 03-n8n-connector
  - **Change**: ~~Initially flagged NEEDS CONFIRMATION.~~ **Resolved**: Edit mode now writes to `statusOverride` field. Header shows effective status badge. Added `Status override` domain term.
  - **Cascade**: Schema change applied in epic 01; effective status propagated to epics 03, 05, 06, 08

## Cascading Changes

1. **Status override pattern** (resolved): Epic 07 → Epic 01 → Epics 03, 05, 06, 08. Added `statusOverride` field to schema. Sync writes to `status`, user writes to `statusOverride`. All downstream epics updated to use effective status (`statusOverride ?? status`).

2. **n8n active/inactive → Inactive signal** (resolved): Epic 03 → Epic 05. Epic 03 now extracts the active/inactive flag from n8n, which provides the data that epic 05's "Inactive" governance signal depends on.

3. **triggerType population** (resolved): Epic 04 → Epic 07. Epic 04 now extracts triggerType via the LLM pipeline, which epic 07 displays in the metadata grid.

4. **Owner filter for snapshot click-through** (resolved): Epic 06 ← Epic 08. Epic 06 now has an owner filter row, giving epic 08's owner exposure click-through a valid destination.

---

# Cross-Epic Review Pass 2 — 2026-03-09

## Summary
- Total specs reviewed: 8
- Specs modified: 05-risk-engine, 06-portfolio-screen, 07-automation-detail
- Specs clean: 01-project-setup, 02-auth, 03-n8n-connector, 04-llm-pipeline, 08-workspace-snapshot

## Changes by Epic

### 05 — Risk Engine

- **Issue**: "Effective impact" not defined — exposure scores reference "impact level" without specifying which field (`impactProposal`, `impactOverride`, or the effective value) (schema drift)
  - **Involved epics**: 05, 08 (08 already uses `impactOverride ?? impactProposal` explicitly)
  - **Change**: Added "Effective Impact" subsection defining `impactOverride ?? impactProposal`. Added domain term. Updated exposure score weight mapping to reference "effective impact."

- **Issue**: Removed automations not explicitly excluded from governance/risk/exposure computations (forward dependency gap)
  - **Involved epics**: 05, 06, 08 (both 06 and 08 already exclude `status = removed`)
  - **Change**: Added "Scope Precondition" section stating all computations exclude automations with `status = removed` regardless of `statusOverride`. Resolved and removed the open question that asked about this.

- **Issue**: Risk level AC references "impact classification" but scope rules use governance signal counts only (acceptance criteria gap)
  - **Involved epics**: 05, 06, 07, 08 (all consume risk levels)
  - **Change**: `NEEDS CONFIRMATION` — added as open question on the spec. The scope rules and AC need to be aligned once the design decision is made.

### 06 — Portfolio Screen

- **Issue**: Layout mentions "sync status indicator" in the header area but no acceptance criterion covers it (acceptance criteria gap)
  - **Involved epics**: 06, 03 (data comes from `ConnectorConfig.lastSyncAt`)
  - **Change**: Added AC: "Sync status indicator in the header shows the last sync timestamp from `ConnectorConfig.lastSyncAt` (e.g., 'Last synced: 2 hours ago'), or 'Never synced' if no sync has occurred."

### 07 — Automation Detail

- **Issue**: "Open in n8n" link depends on `ConnectorConfig.instanceUrl` without mentioning the cross-model query (missing handoff)
  - **Involved epics**: 07, 03 (ConnectorConfig created in epic 03)
  - **Change**: Added note that `instanceUrl` is read from the workspace's `ConnectorConfig` record.

## Cascading Changes

- The "Scope Precondition" addition to Epic 05 aligns it with exclusion rules already present in Epics 06 and 08. No changes needed in 06 or 08 — they were already correct; 05 was the gap.

## Brainstorming

### Epic 05 — Risk Level: Should Impact Factor In?

**Context**: The risk engine currently defines risk level using governance signal counts only:
- High: 3+ signals, OR no owner + documentation outdated, OR inactive + any other signal
- Medium: 1-2 signals
- Low: 0 signals

However, the acceptance criterion says risk level is "based on its active governance signals **and impact classification**." These contradict each other.

**Option A — Governance signals only (current scope rules)**
- Risk level = pure governance health indicator
- Impact is a separate dimension (shown independently on the detail page, used in exposure scores)
- Simpler to reason about: risk = "how well-governed is this automation?"
- Impact already factors into exposure scores, so it's not ignored

**Option B — Blend impact into risk level**
- A Critical-impact automation with 1 governance gap would be elevated to High risk
- Example rule: if effective impact = Critical or High, reduce the signal threshold for High risk by 1
- More intuitive: "a critical automation with any governance gap is high risk"
- But conflates two distinct concepts (governance health vs business impact)

**Question 1**: Which approach do you prefer — A (signals only, impact stays separate) or B (impact elevates risk level)?

> i get your point. intuitively impact should elevate risk, but then signals are mixed. shall we have a separate risk class for risky workflwos with high impact? such as "very high". what do you think? lets elaborate futher ... is there best practice approach to such problems? we are not the first to think about sth. like this ...

**Response — Best practice: the Risk Matrix**

Yes, there is a well-established approach. Every major risk framework (ISO 31000, NIST RMF, FAIR) uses a **risk matrix** — a 2D grid that combines two independent dimensions:

1. **Likelihood** — how likely is the bad outcome? In our case: governance signals. Poor governance (missing owner, stale docs, overdue review) = higher likelihood of undetected failure.
2. **Impact** — how bad is it when it fails? In our case: the impact classification (Critical/High/Medium/Low).

These are kept as separate, clean dimensions. The matrix produces a **combined severity** at their intersection:

```
                    Low Impact   Medium Impact   High Impact   Critical Impact
Low gov risk        Low          Low             Medium        Medium
(0 signals)
Medium gov risk     Low          Medium          High          High
(1-2 signals)
High gov risk       Medium       High            Critical      Critical
(3+ signals)
```

**The good news: we already have this.** The exposure score formula (`impact_weight × risk_weight`) IS the risk matrix, expressed as a number instead of a category. It's already used for system and owner exposure rankings in the Workspace Snapshot.

**So here's the proposal — Option C (recommended):**

1. **Risk level stays governance-only** (Low/Medium/High) — keeps it clean and single-purpose
2. **Impact stays business-consequence-only** (Low/Medium/High/Critical) — from LLM or user override
3. **No new "severity" or "very high" level** — exposure scores already serve as the combined dimension
4. **The AC in Epic 05 is corrected** to say "based on its active governance signals" (removing "and impact classification")
5. Impact classification continues to factor into **exposure scores** (which rank systems and owners on the Workspace Snapshot) — so it's not ignored, it just lives in the right place

This avoids adding complexity while staying aligned with standard risk frameworks. The two dimensions are visible side-by-side on the Automation Detail screen (risk section shows risk level + impact classification independently), and the Workspace Snapshot uses exposure scores for the combined view.

**Question 2**: Does Option C work for you? Or do you still want an explicit combined severity label (like "Critical", "High", "Medium", "Low") derived from the matrix and shown on each automation card/detail page?

lets stick with option c for now

## Confirmations Applied

### Epic 05 — Risk Level: Governance Signals Only (Option C confirmed)

1. **AC fixed**: Changed "based on its active governance signals and impact classification" → "based on its active governance signals"
2. **Open question resolved**: Marked the risk-level-vs-impact open question as resolved with explanation: risk level = governance signals only; impact factors into exposure scores as a separate dimension
3. **No other specs affected**: Risk level was already displayed as governance-only in the scope rules; the AC was the only inconsistency

---

# Cross-Epic Review Pass 3 (In-Dev) — 2026-03-09

Post-implementation review after Epic 01 completion. Checks all specs against implementation reality and cross-epic consistency with newly refined specs (from `/refine_all_ind` in-dev pass).

## Summary
- Total specs reviewed: 7 (02-08; 01 completed)
- Specs modified: 03, 07
- Specs clean: 02, 04, 05, 06, 08

## Changes by Epic

### 03 — n8n Connector

- **Issue**: `ConnectorConfig.lastSyncAt` never updated (Missing handoff → 06)
  - **Involved epics**: 03 (producer), 06 (consumer — sync status indicator reads `lastSyncAt`)
  - **Change**: Added AC: "`ConnectorConfig.lastSyncAt` is updated to the current timestamp when sync completes successfully"
  - **Cascade**: None — spec 06 already reads the field correctly

- **Issue**: Upsert key underspecified (Schema drift → 01)
  - **Involved epics**: 01 (schema defines `@@unique([workspaceId, externalId])`), 03 (performs upsert)
  - **Change**: Updated scope and AC to say "by `workspaceId` + `externalId`" instead of just "by externalId"
  - **Cascade**: None

### 07 — Automation Detail

- **Issue**: `impactReasoning` not displayed (Missing handoff → 04)
  - **Involved epics**: 04 (stores `impactReasoning` — added in `/refine_all_ind`), 07 (displays detail)
  - **Change**: Added `impactReasoning` display to risk section layout and updated AC to include impact reasoning
  - **Cascade**: None — spec 04 already stores the field

## Verified Cross-Epic Consistency (no issues found)

- **Data flow**: All producer → consumer handoffs verified (02→03, 03→04, 04→05, 05→06/07/08). Field names, types, and nullability match across all specs.
- **Schema consistency**: All specs align with implemented schema (`prisma/schema.prisma`). `impactReasoning` migration deferred to Epic 04 as documented.
- **Removed automation exclusion**: Consistent `status = removed` exclusion across specs 05, 06, 08.
- **Effective status/impact formulas**: Consistent `statusOverride ?? status` and `impactOverride ?? impactProposal` usage.
- **Implementation drift**: No specs reference deprecated patterns (Prisma url/directUrl, tailwind.config.ts, asChild prop). Spec 02 has Prisma 7 compatibility note.
- **Governance signals**: All 5 signals consistent across specs 05, 06, 07 (documentation outdated, automation stale, overdue review, no owner, inactive).
- **Exposure scores**: Weight mapping consistent (impact × risk), null impact defaults to Low (1).

## Cascading Changes
None. All 3 fixes were isolated to their respective specs.
