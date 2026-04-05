---
tags:
  - type/review
  - status/done
---

# Cross-Epic Review — 2026-03-09

> Upstream: [PRD](../expliq_prd.md) | [Map of Content](../_MOC.md)

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

---

# Cross-Epic Review Pass 4 (In-Dev) — 2026-03-10

Post-implementation review after Epics 01–03 completion. All within-epic refinement (`/refine_all_ind`) already applied. This pass focuses on cross-epic consistency across all 8 specs.

## Summary
- Total specs reviewed: 8 (5 unbuilt: 04–08; 3 completed read-only: 01–03)
- Specs modified: 04, 06, 08
- Specs clean: 05, 07

## Changes by Epic

### 04 — LLM Pipeline
- **Issue**: Post-sync LLM trigger modifies the existing settings page component (built in epic 03) but this was not explicitly stated (Missing handoff)
  - **Involved epics**: 03 (completed, provides `src/components/settings-form.tsx`), 04 (must modify it)
  - **Change**: Added explicit scope note that epic 04 modifies `src/components/settings-form.tsx` to call the new server action after sync and display a processing indicator

### 05 — Risk Engine
No cross-epic issues found. Data flow (governance signals, risk levels, exposure scores) is consumed correctly by epics 06, 07, and 08.

### 06 — Portfolio Screen
- **Issue**: Epic 08's clickable metric cards and structural indicator "View all" links need Portfolio filter params that don't exist — `impact`, `risk`, `updatedAfter`, `minSystems` (Missing handoff)
  - **Involved epics**: 06 (defines filter params), 08 (consumes them for click-throughs)
  - **Change**: `NEEDS CONFIRMATION` — added as open question on spec 06 with three options

### 07 — Automation Detail
No cross-epic issues found. All data references (LLM fields from 04, risk engine from 05, ConnectorConfig from 03) are consistent.

### 08 — Workspace Snapshot
- **Issue**: Clickable metric cards for "High-impact" and "High-risk" and "View all" links for structural indicators reference filter capabilities not defined in epic 06 (Forward dependency gap)
  - **Involved epics**: 06, 08
  - **Change**: `NEEDS CONFIRMATION` — added as open question on spec 08, linked to epic 06 resolution

## Cross-Epic Consistency Verified

| Concern | Epics involved | Status |
|---------|---------------|--------|
| Schema field references (all Automation fields) | 01→04→05→06→07→08 | Consistent |
| Enum values (impact, status, statusOverride) | 01, 04, 05, 06, 07, 08 | Consistent |
| Governance signal names and rules (5 signals) | 05, 06, 07, 08 | Consistent |
| `systemsTouched` normalization (lowercase) | 04→05→06 | Consistent |
| Removed automation exclusion (`status != removed`) | 05, 06, 08 | Consistent |
| Effective status (`statusOverride ?? status`) | 05, 06, 07, 08 | Consistent |
| Effective impact (`impactOverride ?? impactProposal`) | 05, 07, 08 | Consistent |
| `documentationLastUpdated` lifecycle | 04 (sets) → 05 (reads) | Consistent |
| ConnectorConfig usage | 03 (sets) → 06 (lastSyncAt) → 07 (Open in n8n) | Consistent |
| Architecture pattern (service module + server actions) | 03, 04 | Consistent |
| Risk level = governance signals only (not impact) | 05, 07, 08 | Consistent |
| Exposure score formula (impact_weight × risk_weight) | 05, 08 | Consistent |
| Attention filter badge counts (global, not dynamic) | 06 | Confirmed in prior review |

## Cascading Changes
The filter gap between epics 06 and 08 is a single coordinated issue. Resolution of epic 06's open question will determine what changes (if any) are needed in epic 08's click-through URLs.

## Brainstorming

### Epic 06/08 — Portfolio filter params for Snapshot click-throughs

Epic 08's confirmed design (Q8 from individual review) makes all 5 metric cards clickable, navigating to filtered Portfolio views. Two of these ("High-impact" and "High-risk") plus the structural indicator "View all" links need filter capabilities not currently defined in epic 06.

**Affected click-throughs:**
- "High-impact" card → needs `?impact=critical&impact=high`
- "High-risk" card → needs `?risk=high`
- "Recently changed — View all" → needs `?updatedAfter=<7-days-ago>` or similar
- "Multi-system — View all" → needs `?minSystems=3` or similar

**Options:**

**(a) Add filter params with visible filter rows** — Add `impact` and `risk` filter chip rows to the Portfolio (alongside Systems, Platform, Owner, Attention). Add `updatedAfter` and `minSystems` as URL params without visible rows (they're only used by "View all" links, not for manual filtering). This gives the fullest functionality but adds 2 more filter rows to an already filter-heavy screen.

**(b) Add URL-only params (no visible rows)** — Support `impact`, `risk`, `updatedAfter`, `minSystems` as URL query params that filter the list, but don't show them as visible filter chip rows. The active filter would be visible only in the URL and the result count. A small "Showing filtered results — Clear" banner would indicate when hidden filters are active. Simpler UI but less discoverable.

**(c) Simplify click-throughs** — Keep epic 06 as-is. Change epic 08 click-throughs to use only existing params:
  - "High-impact" card → navigates to `/automations` (no filter — user scans manually)
  - "High-risk" card → navigates to `/automations` (no filter)
  - "Recently changed — View all" → `/automations?sort=automationLastUpdated&order=desc` (sorted, not filtered)
  - "Multi-system — View all" → `/automations` (no filter/sort available)

  This avoids scope creep in epic 06 but weakens the dashboard-to-action flow.

**Recommendation:** (b) — URL-only params. The click-throughs from the Snapshot are the primary use case for these filters, not manual Portfolio browsing. URL params keep the Portfolio UI clean while supporting programmatic navigation. A small "Showing filtered results — Clear" banner handles discoverability.

Your answer:  i actually think we should go for a. because this is our main add-on. its almost our usp. and we might need a foldable filter area ... what do you think? or do i understand this wrong?

**Response — You're right, and the foldable filter area is a good idea.**

You're not wrong at all. The filtering and triage flow IS the product's core value — Emma goes from Snapshot → Portfolio (filtered) → Detail. If those click-throughs land on a page where she can't see or adjust the active filters, the experience falls apart. Making the filters visible and interactive is the right call.

**On the foldable filter area:** With 6 filter rows (Systems, Platform, Owner, Attention, Impact, Risk), the filter section could take up significant vertical space — especially on smaller screens. A collapsible/foldable filter panel solves this well:

- **Default collapsed** with a summary line showing active filter count (e.g., "3 filters active") and a toggle to expand
- **Auto-expands** when arriving via a Snapshot click-through (so Emma immediately sees what's filtered)
- **Stays expanded** while the user is interacting with filters
- Common pattern in operational dashboards (Datadog, Grafana, Jira all do this)

For the "View all" links (`updatedAfter`, `minSystems`), these are less like filter *rows* and more like pre-set queries. They don't need their own visible chip rows — they can show as a small "Filtered: recently changed" or "Filtered: multi-system (3+)" tag in the filter summary, clearable with an ×.

**Proposed approach:**

1. Add `impact` and `risk` as visible filter chip rows (same style as Systems, Owner, etc.)
2. Add `updatedAfter` and `minSystems` as URL-only params with a visible "active filter" tag (no dedicated chip row — they're only used by Snapshot "View all" links)
3. Make the entire filter section collapsible — collapsed by default, auto-expands when filters are active

**Question 3**: Does this split work — full visible rows for impact/risk, but tag-only display for updatedAfter/minSystems? Or would you rather all 8 filters have visible chip rows?

Your answer: sorry, i dont understand what you are actually asking

**Response — Let me clarify with a concrete example.**

The Portfolio filter area currently has 4 rows of clickable chips:

```
Systems:   [Slack (10)] [Salesforce (8)] [Stripe (5)]       [Clear]
Platform:  [n8n (23)]                                        [Clear]
Owner:     [Alice (5)] [Bob (3)] [No owner (2)]              [Clear]
Attention: [No owner (2)] [Stale (4)] [Outdated (7)] ...
```

We're adding **Impact** and **Risk** as two more rows like these — full chip rows where Emma can click to filter:

```
Impact:    [Critical (3)] [High (7)] [Medium (10)] [Low (3)] [Clear]
Risk:      [High (5)] [Medium (12)] [Low (6)]                [Clear]
```

That's straightforward. Now the question is about two *other* filters that only come from Snapshot "View all" links:

- **"Recently changed — View all"** → filters to automations updated in the last 7 days
- **"Multi-system — View all"** → filters to automations touching 3+ systems

These are niche filters — Emma would never manually think "show me automations with 3+ systems." They only exist to support the "View all" click from the Snapshot. So my question was: should these also get full chip rows in the filter area? That would look odd:

```
Min systems: [3+ systems (8)]    ← weird standalone chip row
Updated after: [Last 7 days (4)] ← weird standalone chip row
```

Or should they just work as URL params without a dedicated row, showing only a small dismissible tag like `[× Filtered: recently changed]` at the top of the results?

**Actually, on reflection, the answer is obvious.** These are so niche that full chip rows would clutter the UI for no benefit. Let's just do:

1. **Impact + Risk** → full visible chip rows (like Systems, Owner, etc.)
2. **updatedAfter + minSystems** → URL params only, with a small dismissible "active filter" tag shown above results when active
3. **Collapsible filter section** — collapsed by default, auto-expands when any filter is active

This keeps the filter area clean (6 rows: Systems, Platform, Owner, Attention, Impact, Risk) while still supporting all Snapshot click-throughs. Does this make sense now? If so, I'll apply it to the specs.

Your answer:  fine. but do we actually have sorting in the automations portfolio page?

**Response — Yes, sorting is already in the spec.**

Epic 06 defines a sort bar with three options:

- **Automation Last Updated** (default)
- **Documentation Last Updated**
- **Name**

Each has an ascending/descending toggle. The URL params `sort` and `order` control it (e.g., `?sort=automationLastUpdated&order=desc`).

So the "Recently changed — View all" link could combine both: `?updatedAfter=7d&sort=automationLastUpdated&order=desc` — filtered to last 7 days AND sorted most recent first.

OK — everything is clear now. I'll apply all confirmations to the specs. Confirmed decisions:

1. **Option (a)** — visible filter rows for Impact and Risk
2. **updatedAfter + minSystems** — URL-only params with dismissible tag
3. **Collapsible filter section** — collapsed by default, auto-expands when filters are active

Applying now.

## Confirmations Applied

### Epic 06/08 — Portfolio filter params for Snapshot click-throughs (confirmed: option A with refinements)

1. **Spec 06 — Impact filter row added**: Visible chip row showing Critical/High/Medium/Low counts using effective impact. Added to layout, filter params, and ACs.
2. **Spec 06 — Risk filter row added**: Visible chip row showing High/Medium/Low counts. Added to layout, filter params, and ACs.
3. **Spec 06 — URL-only params added**: `updatedAfter` and `minSystems` filter the list when present in URL, with dismissible "active filter" tag above results. Added to layout, filter params, and ACs.
4. **Spec 06 — Collapsible filter section**: Filter area collapsed by default, auto-expands when any filter is active. Added to layout and ACs.
5. **Spec 06 — Filter params list updated**: Now includes `system`, `owner`, `attention`, `platform`, `impact`, `risk`, `search`, `sort`, `order`, `updatedAfter`, `minSystems`.
6. **Spec 08 — Concrete click-through URLs**: High-impact → `?impact=critical&impact=high`, High-risk → `?risk=high`, Recently changed View all → `?updatedAfter=7d&sort=automationLastUpdated&order=desc`, Multi-system View all → `?minSystems=3`.
7. **NEEDS CONFIRMATION removed** from both specs 06 and 08 (marked resolved).
8. **Spec 06 — Collapsible behavior clarified**: Filter section can be manually collapsed even with active filters (filters remain applied, only the UI is hidden).

---

# Cross-Epic Review Pass 5 (In-Dev) — 2026-03-10

Post-implementation review after Epics 01–04 completion. Within-epic refinement (`/refine_all_ind` pass 2) already applied. This pass focuses on cross-epic consistency with the newly completed Epic 04 (LLM Pipeline).

## Summary
- Total specs reviewed: 9 (5 unbuilt: 05–09; 4 completed read-only: 01–04)
- Specs modified: 05, 06, 07
- Specs clean: 08, 09

## Changes by Epic

### 05 — Risk Engine
- **Issue**: Stale note references resolved open question (within-epic)
  - The note under Risk Level says "See open question below about whether impact classification should also factor into risk level elevation" — but the question was resolved in cross-epic review pass 2 (governance signals only, confirmed Option C)
  - **Change**: Updated note to state the resolution inline: "Risk level is derived from governance signal counts only. Impact classification is a separate dimension that factors into exposure scores (impact_weight × risk_weight) but does not elevate risk level."
  - **Cascade**: None

### 06 — Portfolio Screen
- **Issue 1**: Attention filter param identifiers undefined (missing handoff → 08)
  - Epic 08 uses `?attention=no-owner` and `?attention=overdue-review` in click-through URLs, but epic 06 never defined the canonical set of attention param identifiers. Only an example (`attention=no-owner`) appeared in the param format description.
  - **Involved epics**: 06 (defines filter params), 08 (consumes them)
  - **Change**: Added canonical param value definitions for `attention` (`no-owner`, `documentation-outdated`, `automation-stale`, `overdue-review`, `inactive`), `sort` (`automationLastUpdated`, `documentationLastUpdated`, `name`), and `order` (`asc`, `desc`) to the Filters section.
  - **Cascade**: None — epic 08's existing URLs already use matching identifiers

- **Issue 2**: Platform filter open question still unresolved after 5 refinement passes (within-epic)
  - "Should the Platform filter row be shown if only n8n is supported for MVP?"
  - **Change**: `NEEDS CONFIRMATION` — tagged the existing open question

### 07 — Automation Detail
- **Issue**: Missing Dependencies section (forward dependency gap)
  - Epic 07 uses risk level and governance signals from epic 05, regenerate server action from epic 04, and ConnectorConfig from epic 03, but had no explicit Dependencies section
  - **Involved epics**: 03, 04, 05
  - **Change**: Added Dependencies section listing epic 05 (risk section), epic 04 (regenerate + LLM fields), epic 03 (ConnectorConfig for "Open in n8n" link)
  - **Cascade**: None

### 08 — Workspace Snapshot
No cross-epic issues found. All click-through URLs match epic 06's now-defined canonical param values. Exposure score consumption from epic 05 is consistent.

### 09 — Production Hardening
No cross-epic issues found. All referenced components (error boundaries, server actions, buttons) are defined in earlier epics and will exist by the time this epic runs.

## Cross-Epic Consistency Verified

| Concern | Epics involved | Status |
|---------|---------------|--------|
| Schema field references (all Automation fields) | 01→04→05→06→07→08 | Consistent |
| Enum values (ImpactLevel, AutomationStatus, StatusOverride) | 01, 04, 05, 06, 07 | Consistent with Prisma schema |
| Governance signal names (5 signals) | 05, 06, 07, 08 | Consistent |
| Attention filter param identifiers | 06, 08 | Now explicitly defined in 06 |
| `systemsTouched` normalization (lowercase) | 04→05→06→07 | Consistent |
| Removed automation exclusion (`status != removed`) | 05, 06, 08 | Consistent |
| Effective status (`statusOverride ?? status`) | 05, 06, 07, 08 | Consistent |
| Effective impact (`impactOverride ?? impactProposal`) | 05, 06, 07, 08 | Consistent |
| `documentationLastUpdated` lifecycle | 04 (sets) → 05 (reads for signal) → 06/07 (displays) | Consistent |
| ConnectorConfig usage | 03 (creates) → 06 (lastSyncAt) → 07 (instanceUrl for "Open in n8n") | Consistent |
| Risk level = governance signals only | 05, 07, 08 | Consistent |
| Exposure score formula (impact_weight × risk_weight) | 05, 08 | Consistent |
| Filter chip counts (global) | 06 | Now uniformly specified |
| Epic 04 results: lazy client, fence stripping, app-level filtering | 05, 06 | No conflicts |
| Epic 04 results: all impact classified as "high" | 05, 06, 07 | No spec impact (formulas correct regardless) |
| Sort/order param values | 06, 08 | Now explicitly defined in 06 |

## Cascading Changes
None. All fixes were isolated to their respective specs.

## Brainstorming

### Epic 06 — Platform filter row visibility

The Portfolio filter area has 6 rows: Systems, Platform, Owner, Attention, Impact, Risk. For MVP, only n8n is supported as a platform. The Platform row would show a single chip: `[n8n (23)]`.

- **(a) Show it** — Communicates multi-platform support is coming. Shows the count. Consistent filter row layout. Trivial implementation cost.
- **(b) Hide it** — One chip with one value adds no filtering utility. Removes visual clutter from an already filter-heavy screen. Can be added when a second platform is supported.

**Recommendation:** (a) — the implementation cost is zero (it's just another chip row reading from the `platform` field), and removing a filter row now only to add it back later is churn. One-chip rows are common in faceted search UIs (they serve as a label/count, not just a filter).

Your answer:  a

## Confirmations Applied

### Epic 06 — Platform filter row (confirmed: show it)

1. **Spec 06 — Open question resolved**: Marked as resolved. Platform filter row is shown for MVP even with only n8n supported.
2. **No other specs affected**: No cascading changes needed.

---

# Cross-Epic Review Pass 6 (In-Dev) — 2026-03-10

Post-implementation review after Epics 01–05 completion. Within-epic refinement (`/refine_all_ind` pass 3) already applied. This pass focuses on cross-epic consistency with the newly completed Epic 05 (Risk Engine).

## Summary
- Total specs reviewed: 9 (4 unbuilt: 06–09; 5 completed read-only: 01–05)
- Specs modified: 06
- Specs clean: 07, 08, 09

## Changes by Epic

### 06 — Portfolio Screen
- **Issue**: Missing canonical param values for `impact`, `risk`, and null-owner convention for `owner` (missing handoff → 08)
  - **Involved epics**: 06 (defines filter params), 08 (consumes them in click-through URLs)
  - Epic 08 uses specific param values in click-through URLs (`?impact=critical&impact=high`, `?risk=high`) and epic 08's owner exposure ranking navigates to Portfolio filtered by owner — but epic 06 only defined canonical values for `attention`, `sort`, and `order` (added in pass 5). The `impact`, `risk`, and null-owner `owner` param conventions were missing.
  - Epic 05 results confirm `getOwnerExposure` groups null owners as "Unassigned". When this entry is clicked in the Snapshot, the click-through URL needs a defined convention for representing null-owner in the `owner` param.
  - **Change**: Added canonical values for `impact` (matching `ImpactLevel` enum: `critical`, `high`, `medium`, `low`), `risk` (matching risk level values: `high`, `medium`, `low`), and defined `_none` as the sentinel value for null-owner in the `owner` param.
  - **Cascade**: None — epic 08's existing click-through URLs already use matching lowercase values for `impact` and `risk`. The owner exposure click-through now has an unambiguous param convention.

### 07 — Automation Detail
No cross-epic issues found. Risk section data flow from epic 05 is well-grounded:
- `getRiskLevel(automation)` → risk level display ✓
- `getGovernanceSignals(automation)` → active signals as risk drivers ✓
- `getEffectiveImpact(automation)` returns `string | null` (per epic 05 risk #2) — no impact on display logic ✓
- `impactReasoning` field exists in schema and is populated by epic 04 ✓

### 08 — Workspace Snapshot
No cross-epic issues found. All data flows verified:
- `getSystemExposure(workspaceId)` → pre-sorted system rankings ✓
- `getOwnerExposure(workspaceId)` → pre-sorted owner rankings (null owners as "Unassigned") ✓
- Top metrics derivable from loading all non-removed automations + epic 05 functions ✓
- All click-through URLs use canonical param values now defined in epic 06 ✓
- Epic 05 risk #1 (all test automations "high" impact → flat rankings) is a data issue, not spec issue ✓
- Epic 05 risk #3 (multiple full-table scans) is an MVP-scale optimization concern, not spec-level ✓

### 09 — Production Hardening
No cross-epic issues found. All referenced components (error boundaries for routes from epics 06-08, server actions from epics 03-07, rate-limited buttons from epics 03/07) are properly scoped.

## Cross-Epic Consistency Verified

| Concern | Epics involved | Status |
|---------|---------------|--------|
| Schema field references (all Automation fields) | 01→04→05→06→07→08 | Consistent |
| Enum values (ImpactLevel, AutomationStatus, StatusOverride) | 01, 04, 05, 06, 07 | Consistent with Prisma schema |
| Governance signal names and rules (5 signals) | 05, 06, 07, 08 | Consistent |
| Risk level = governance signals only (not impact) | 05, 07, 08 | Consistent |
| Exposure score formula (impact_weight × risk_weight) | 05, 08 | Consistent |
| Effective status (`statusOverride ?? status`) | 05, 06, 07, 08 | Consistent |
| Effective impact (`impactOverride ?? impactProposal`) | 05, 06, 07, 08 | Consistent |
| Removed automation exclusion (`status != removed`) | 05, 06, 08 | Consistent |
| `systemsTouched` normalization (lowercase) | 04→05→06→07 | Consistent |
| `documentationLastUpdated` lifecycle | 04 (sets) → 05 (reads for signal) → 06/07 (displays) | Consistent |
| ConnectorConfig usage | 03 (creates) → 06 (lastSyncAt) → 07 (instanceUrl for "Open in n8n") | Consistent |
| Filter param canonical values (`attention`, `impact`, `risk`, `sort`, `order`) | 06, 08 | Now complete |
| Null-owner convention (`_none` sentinel in `owner` param) | 06, 08 | Now defined |
| Epic 05 API surface consumed correctly | 05→06, 05→07, 05→08 | Consistent |
| `getEffectiveImpact` return type (`string | null`) | 05→06, 05→07 | No spec impact |
| `deprecated` status and governance signals | 05, 06, 07 | Consistent (deprecated ≠ inactive) |

## Cascading Changes
None. The canonical param value addition to epic 06 is an isolated fix that aligns with epic 08's existing URLs.

---

# Cross-Epic Review Pass 7 — 2026-03-10

Post-05.5 addition. Reviews the new Test Infrastructure spec (05.5) against the full epic chain (01-09) and re-verifies existing unbuilt specs (06-09) for any new cross-epic issues.

## Summary
- Total specs reviewed: 10 (5 unbuilt: 05.5, 06–09; 5 completed read-only: 01–05)
- Specs modified: (none)
- Specs clean: 05.5, 06, 07, 08, 09

## Changes by Epic

### 05.5 — Test Infrastructure
No cross-epic issues found. The spec integrates cleanly with the completed epic chain:

- **Dependencies verified**: All four referenced modules exist and have the expected signatures:
  - `createN8nClient(instanceUrl, apiKey)` in `n8n-client.ts` — standalone, no session ✓
  - `processAutomation(automationId, workspaceId)` in `llm-pipeline.ts` — explicit params, no session ✓
  - `encrypt(plaintext)` in `encryption.ts` — standalone ✓
  - `bcrypt` for password hashing — used in epic 02 ✓
- **Sync upsert replication**: Correctly identifies that `syncWorkflows` server action can't be called from a script and specifies replicating the upsert logic. ✓
- **Schema alignment**: All Automation fields referenced in the data design section match `prisma/schema.prisma`. Required fields (`workspaceId`, `externalId`, `platform`, `rawWorkflowJson`, `status`) are all addressed. ✓
- **Governance signal design**: Hardcoded governance fields are designed per epic 05's rules — the combination of owners, review dates, timestamps, and statuses can produce all three risk levels. ✓
- **No backward impact**: The seed script is standalone — it doesn't modify any code that epics 06-09 depend on. ✓
- **No forward dependency gap**: Epics 06-09 don't reference the seed data or seed script — it's a development tool, not a code dependency. ✓

### 06 — Portfolio Screen
No new issues. All findings from passes 1-6 remain resolved.

### 07 — Automation Detail
No new issues. All findings from passes 1-6 remain resolved.

### 08 — Workspace Snapshot
No new issues. All findings from passes 1-6 remain resolved.

### 09 — Production Hardening
No new issues. Epic 09 depends on "all prior epics (01-08)" — the seed script (05.5) doesn't add pages, server actions, or UI components that would require hardening. No dependency update needed.

## Cross-Epic Consistency Verified

| Concern | Epics involved | Status |
|---------|---------------|--------|
| 05.5 module imports match actual signatures | 05.5 → 03, 04 | Verified against code |
| 05.5 governance field design matches signal rules | 05.5 → 05 | Consistent |
| 05.5 schema field usage matches Prisma schema | 05.5 → 01 | Consistent |
| 05.5 doesn't break existing test infrastructure | 05.5 vs scripts/verify-risk-engine.ts | Isolated (separate workspaces) |
| 09 scope unaffected by 05.5 insertion | 09, 05.5 | No update needed |
| All previously verified items from passes 1-6 | 01-09 | Still consistent |

## Cascading Changes
None. Epic 05.5 is a standalone addition with no impact on existing specs.

---

# Cross-Epic Review Pass 8 (In-Dev) — 2026-03-10

Post-implementation review after Epics 01–06 completion (including epic 05.5). Within-epic refinement (`/refine_all_ind` pass 4) already applied. This pass focuses on cross-epic consistency with the newly completed Epic 06 (Portfolio Screen) and its two patches.

## Summary
- Total specs reviewed: 10 (3 unbuilt: 07–09; 7 completed read-only: 01–06, 05.5)
- Specs modified: 07, 08
- Specs clean: 09

## Changes by Epic

### 07 — Automation Detail
- **Issue**: Governance attention badges vs risk drivers ambiguity (implementation drift from epic 06)
  - **Involved epics**: 06 (completed — removed "Inactive" from `ATTENTION_SIGNAL_MAP` per patch), 07 (consumes attention badges)
  - The epic 06 patch removed "Inactive" from portfolio attention badges because it was redundant with the status badge. Spec 07's header also shows both an effective status badge AND "governance attention badges." Without clarification, the implementer might include all 5 governance signals as attention badges, re-creating the same redundancy the portfolio patched out.
  - The risk section separately shows "Active governance signals listed as explicit risk drivers" — this SHOULD include all 5 signals from the risk engine (they explain the risk computation).
  - **Change**: Clarified header attention badges use the same set as Portfolio card badges (excludes "Inactive" since the status badge already conveys active/inactive/deprecated). Risk section remains unchanged — it uses all risk engine signals.
  - **Cascade**: None

### 08 — Workspace Snapshot
- **Issue**: System/owner exposure click-through URL format unspecified (missing handoff → 06)
  - **Involved epics**: 06 (defines filter param names), 08 (consumes them)
  - The 5 metric card click-throughs have concrete URLs (e.g., `?impact=critical&impact=high`), but the system and owner exposure ranking click-throughs just say "navigates to Portfolio filtered by that system/owner" without specifying the URL format. Epic 06's `parseFiltersFromParams` uses `params.getAll("system")` (singular) and `params.getAll("owner")` with `_none` sentinel for null owners.
  - **Change**: Added concrete URL patterns to ACs: `?system={systemName}` for systems, `?owner={ownerName}` (or `?owner=_none` for "Unassigned") for owners.
  - **Cascade**: None

### 09 — Production Hardening
No cross-epic issues found. All referenced components are properly scoped:
- Error boundary for `src/app/(app)/automations/error.tsx` already exists (created in epic 06). Spec 09's audit will update it if needed and create the remaining three.
- All server actions in `src/lib/actions/` are confirmed to exist: `auth.ts` (epic 02), `connector.ts` (epic 03), `llm.ts` (epic 04).
- Rate-limited buttons: "Regenerate" (spec 07), "Sync Now" and "Test Connection" (epic 03, implemented). Spec 07's Regenerate loading state and spec 09's 10s debounce are complementary (loading covers actual processing time, debounce is a minimum cooldown).

## Cross-Epic Consistency Verified

| Concern | Epics involved | Status |
|---------|---------------|--------|
| Schema field references (all Automation fields) | 01→04→05→06→07→08 | Consistent |
| Enum values (ImpactLevel, AutomationStatus, StatusOverride) | 01, 04, 05, 06, 07 | Consistent with Prisma schema |
| Governance signal names (5 in risk engine, 4 in attention badges) | 05, 06, 07, 08 | Now consistent — 07 explicitly aligned with 06's 4-signal attention set |
| Risk level = governance signals only (not impact) | 05, 07, 08 | Consistent |
| Exposure score formula (impact_weight × risk_weight) | 05, 08 | Consistent |
| Effective status (`statusOverride ?? status`) | 05, 06, 07, 08 | Consistent |
| Effective impact (`impactOverride ?? impactProposal`) | 05, 06, 07, 08 | Consistent |
| Removed automation exclusion (`status != removed`) | 05, 06, 08 | Consistent |
| `systemsTouched` normalization (lowercase) | 04→05→06→07 | Consistent |
| `documentationLastUpdated` lifecycle | 04 (sets) → 05 (reads) → 06/07 (displays) | Consistent |
| ConnectorConfig usage | 03 (creates) → 06 (lastSyncAt) → 07 (instanceUrl) | Consistent |
| Filter param canonical values | 06, 08 | Complete — all click-throughs now have concrete URLs |
| Null-owner convention (`_none` sentinel) | 06, 08 | Now used in system/owner click-throughs |
| Attention badge set (4 signals, excludes inactive) | 06 (implementation), 07 | Now explicitly aligned |
| Risk drivers (all 5 governance signals) | 05, 07 | Consistent |
| `formatRelativeTime` helper duplication | 06 (two copies) → 07, 08 (will need it) | Implementation concern only, no spec impact |
| Epic 06 filter section collapsed by default | 06, 08 | No conflict — compact active-filters bar shows when arriving with URL params |
| Epic 05.5 seed data | 05.5 → 06, 07, 08, 09 | No dependencies — seed is a dev tool |
| Error boundary pre-existence | 06 (`automations/error.tsx`) → 09 | 09 audits existing, creates missing |
| Rate limiting vs loading states | 07 (loading during processing), 09 (10s debounce) | Complementary, not conflicting |

## Cascading Changes
None. Both fixes were isolated to their respective specs.

---

# Cross-Epic Review Pass 9 (R2) — 2026-04-05

First cross-epic review of R2 specs (11-17) after Epic 10 completion. Individual refinement (`/refine_all_ind` pass 6) already applied. This pass focuses on data flow consistency, schema alignment, and missing handoffs across the R2 epic chain.

## Summary
- Total specs reviewed: 17 (10 completed read-only: 01-08, 05.5, 10; 1 deferred: 09; 6 unbuilt: 11-17 — note: 17 was 17 in the spec sequence)
- Specs modified: 11, 12, 13, 14, 15
- Specs clean: 16, 17

## Data Flow Model (R2)

```
Epic 10 (completed)
  └── Schema: Automation (R2 fields), BusinessProcess, Recommendation,
      ProcessSuggestion, CompanyProfile, ConnectorConfig extensions
  └── n8n client: deploy methods, execution fetch
  └── Sync pipeline: two-phase (Discover → Sync & Analyze)

Epic 11 (LLM Pipeline V2) ← PRODUCER
  ├── Per-automation → Automation: businessNarrative, impact, detectability, etc.
  ├── Workspace → BusinessProcess, Recommendation, ProcessSuggestion, CompanyProfile
  ├── Governance dot: pure function from error rate + detectability + impact
  └── Delta: previousSnapshot → deltaSummary

Epic 12 (Design System) ← COMPONENTS
  └─�� 10 shared components + dark theme + route shells + sidebar

Epics 13-16 ← CONSUMERS (all depend on 11 + 12)
  13 Dashboard:  CompanyProfile, Automation (governance), BusinessProcess, Recommendation (top 3)
  14 Process Map: BusinessProcess (steps, maturity, valueAtStake), Automation (per-process)
  15 Opportunities: Recommendation, ProcessSuggestion, deploy LLM call
  16 Detail:     Automation (all fields), BusinessProcess, Recommendation

Epic 17 (Polish) ← INTEGRATOR (depends on all above)
```

## Changes by Epic

### 11 — LLM Pipeline V2
- **Issue 1**: Missing output structure definitions for Json fields consumed by Epics 13-16 (missing handoff)
  - **Involved epics**: 11 (produces), 13 (systemLandscape), 14 (steps, maturityLevel, valueAtStake), 16 (steps)
  - `BusinessProcess.steps` — spec 14 assumes `isGap` entries, spec 16 assumes ordered step names. Structure was never defined.
  - `CompanyProfile.systemLandscape` — spec 13 needs system names + workflow counts. Structure was never defined.
  - `BusinessProcess.maturityLevel` — spec 14 lists 5 named levels but spec 11 never defined the vocabulary.
  - **Change**: Added "Workspace call output structures" section to scope defining: steps Json array structure, maturityLevel values, systemLandscape array structure.

- **Issue 2**: `BusinessProcess.valueAtStake` has no data source (forward dependency gap)
  - **Involved epics**: 11 (must produce), 14 (displays it on process rows)
  - Spec 14 shows "value at stake" per process (from PRD §4/§8), but no field exists on BusinessProcess and Epic 11's workspace call output doesn't include it.
  - **Change**: Added `valueAtStake` (String?) to the Epic 11 migration scope (alongside trigger/triggerType/systemsTouched).
  - **Cascade**: None — spec 14 already references it

### 12 — Design System + App Shell
- **Issue**: `lastSyncedAt` field name incorrect (schema drift from completed Epic 10)
  - **Involved epics**: 10 (completed — ConnectorConfig has `lastSyncAt`), 12 (sidebar scope + OQ)
  - The actual Prisma field is `lastSyncAt`, not `lastSyncedAt`.
  - **Change**: Updated all references from `lastSyncedAt` to `lastSyncAt`.
  - **Cascade**: None

### 13 — Dashboard
- **Issue**: "brief" in Attention section references wrong field (schema drift)
  - **Involved epics**: 11 (produces Automation.businessNarrative), 13 (displays it)
  - The Attention section said "StatusDot + name + brief" — but Automation has `businessNarrative`, not `brief`. (`brief` exists on Recommendation, not Automation.) Ambiguous reference could lead to using the wrong field.
  - **Change**: Updated scope and AC 14 to `businessNarrative (truncated to one line)`.
  - **Cascade**: None

### 14 — Process Map
- **Issue 1**: `businessBrief` doesn't exist on Automation model (schema drift)
  - **Involved epics**: 10 (schema), 11 (produces `businessNarrative`), 14 (displays it)
  - Spec 14 used `businessBrief` in scope and AC 5. The actual field is `businessNarrative` (consolidated per Amendment M, confirmed in Prisma schema).
  - **Change**: Replaced all `businessBrief` references with `businessNarrative`.
  - **Cascade**: None

- **Issue 2**: Per-process reliability computation undefined (missing handoff)
  - **Involved epics**: 10 (per-automation errorRate), 14 (displays per-process reliability %)
  - BusinessProcess has no `reliability` field. Per-automation `errorRate` exists but no spec defines how to aggregate it per process.
  - **Change**: Added AC 19a: per-process reliability computed on-read as average `(1 - errorRate)` across automations in the process.
  - **Cascade**: None

### 15 — Opportunities
- **Issue**: Row display uses `businessCase` instead of `brief` (inconsistent domain language across epics)
  - **Involved epics**: 13 (Dashboard uses `brief` for recommendation one-liner after pass 6 fix), 15 (should match)
  - AC 5 said "businessCase (one line truncated)" for the row display. But `brief` is the one-sentence summary field; `businessCase` is the full reasoning shown in the slide-over panel. Spec 13 already uses `brief` for the Dashboard's Top Opportunities rows.
  - **Change**: Updated AC 5 to use `brief` (Recommendation.brief) for row display.
  - **Cascade**: Consistent with spec 13 AC 17

### 16 — Detail
No cross-epic issues found. All field references verified:
- `businessNarrative` ✓ (matches spec 11 output, Prisma schema)
- `systemsTouched` ✓ (will exist after spec 11 migration)
- `upstreamIds`/`downstreamIds` ✓ (connection type derivation resolved in ind-review Q2)
- `impact`, `detectability`, `technicalEvidence` as Json ✓
- `stepName` + `processId` for process position ✓
- Recommendation linking via `processId` ✓

### 17 — Settings + Seed + Polish
No cross-epic issues found. Sync progress tracking gap (AnalysisStatus vs sync-phase stages) already addressed in individual review.

## Cross-Epic Consistency Verified (R2)

| Concern | Epics involved | Status |
|---------|---------------|--------|
| Automation field names (businessNarrative, not businessBrief) | 11→13, 14, 16 | Now consistent |
| Recommendation one-liner field (brief, not businessCase) | 11→13, 15 | Now consistent |
| ConnectorConfig.lastSyncAt (not lastSyncedAt) | 10→12 | Now consistent |
| BusinessProcess.steps Json structure | 11→14, 16 | Now defined in 11 |
| CompanyProfile.systemLandscape Json structure | 11→13 | Now defined in 11 |
| BusinessProcess.maturityLevel vocabulary | 11→14 | Now defined in 11 |
| BusinessProcess.valueAtStake data source | 11→14 | Now in 11 migration |
| Per-process reliability computation | 10→14 | Now defined in 14 |
| Route paths (/, /processes, /opportunities, /automations/[id], /settings) | 12→13, 14, 15, 16, 17 | Consistent |
| URL params (/opportunities?highlight={id}, ?process={id}) | 13, 14, 15, 16 | Consistent |
| Governance dot computation (pure function) | 11→13, 14, 16 | Consistent |
| AnalysisStatus enum (5 values) | 10→11→13, 17 | Consistent |
| Design system components consumed correctly | 12→13, 14, 15, 16 | Consistent |
| n8n client deploy methods | 10→15 | Consistent |
| Delta banner data flow (previousSnapshot → deltaSummary) | 11→13 | Consistent |
| Connected automations (upstreamIds/downstreamIds) | 11→16 | Consistent (heuristic type derivation) |
| Deploy LLM call ownership | 15 (on-demand, separate from 11's pipeline) | Clear |
| Epic 11 migration scope (trigger, triggerType, systemsTouched, valueAtStake) | 11→14, 16 | Consistent |

## Cascading Changes
- Epic 11 migration scope expanded: `valueAtStake` on BusinessProcess added alongside the existing trigger/triggerType/systemsTouched additions. This cascades from Epic 14's requirement but doesn't change Epic 14's spec.

---

# Cross-Epic Review Pass 10 (Post-Epic 11) — 2026-04-05

Post-implementation review after Epic 11 (LLM Pipeline V2) completion. Individual refinement (`/refine_all_ind` pass 7) found no new within-epic issues. This pass verifies cross-epic consistency against Epic 11's actual implementation.

## Summary
- Total specs reviewed: 17 (11 completed read-only: 01-08, 05.5, 10, 11; 1 deferred: 09; 5 unbuilt: 12-17)
- Specs modified: none
- Specs clean: 12, 13, 14, 15, 16, 17

## Changes by Epic

### 12 — Design System + App Shell
No cross-epic issues. No Epic 11 dependency.

### 13 — Dashboard
No cross-epic issues. Verified against Epic 11 results:
- CompanyProfile fields (nextMoveText, deltaSummary, systemLandscape, aggregateEstimates, analysisStatus) — all populated by `runAnalysisPipeline()` ✓
- Governance dots via `computeGovernanceDot()` — pure function, no DB calls, consistent with spec's "governance dot = critical or attention" filtering ✓
- Empty/analyzing states driven by CompanyProfile.analysisStatus enum (5 values) ✓
- Epic 11 risk #2 (processMetrics OQ unresolved) — spec 13 reads aggregateEstimates, not processMetrics. No impact ✓

### 14 — Process Map
No cross-epic issues. Verified against Epic 11 results:
- BusinessProcess.steps Json structure defined in Epic 11 scope: `{ name, isAutomated, isGap, automationExternalId? }` ✓
- BusinessProcess.maturityLevel vocabulary defined: Prototype/Emerging/Developing/Production/Optimized ✓
- BusinessProcess.valueAtStake field added in Epic 11 migration ✓
- Automation.businessNarrative (not businessBrief) — already fixed in pass 9 ✓
- Per-process reliability computed on-read from Automation.errorRate — defined in pass 9 ✓

### 15 — Opportunities
No cross-epic issues. Verified against Epic 11 results:
- Recommendation fields all populated by workspace call (including impactEstimate, honestFraming, affectedScope) ✓
- Deploy LLM call (spec 15 ACs 15-28) can reuse Epic 11's `retryWithBackoff()` and `stripJsonFences()` exports ✓
- Recommendation.suggestedPlatform populated from systemSource (Epic 11 risk #4) — consistent with spec 15's SystemFlow display ✓
- ProcessSuggestion child recommendations linked via processSuggestionId ✓

### 16 — Detail
No cross-epic issues. Verified against Epic 11 results:
- All Automation enriched fields now populated: businessNarrative, impact (Json), detectability (Json), timeSavingsEstimate, revenueImpactEstimate, technicalEvidence (Json), trigger, triggerType, systemsTouched ✓
- upstreamIds/downstreamIds populated by `resolveDeterministicConnections()` + `mergeLlmConnections()` ✓
- Connection type heuristic (resolved in ind-review Q2) reads rawWorkflowJson.settings.errorWorkflow/callerIds — independent of Epic 11's connection resolution ✓
- Automation.processId links to BusinessProcess for process position section ✓

### 17 — Settings + Seed + Polish
No cross-epic issues. Verified against Epic 11 results:
- `runAnalysisPipeline()` called synchronously inside `syncAndAnalyze` — sync action waits for analysis to complete before returning ✓
- analysisStatus progresses: pending → analyzing_workflows → analyzing_workspace → complete (4 stages map to UI stages 3-6 in spec 17) ✓
- Sync-phase stages (stages 1-2) tracked separately from analysisStatus — already noted in ind-review pass 6 ✓
- Seed data "all v8 fields" covers Epic 11's new fields (trigger, triggerType, systemsTouched on Automation; valueAtStake on BusinessProcess) ✓

## Cross-Epic Consistency Verified (R2, Post-Epic 11)

| Concern | Epics involved | Status |
|---------|---------------|--------|
| Automation field names (businessNarrative, impact, detectability, etc.) | 11→13, 14, 16 | Consistent (verified against implementation) |
| Recommendation field names (brief, businessCase, impactEstimate, etc.) | 11→13, 15 | Consistent |
| BusinessProcess fields (steps, maturityLevel, valueAtStake) | 11→14 | Consistent (migration applied) |
| CompanyProfile fields (systemLandscape, nextMoveText, aggregateEstimates, deltaSummary) | 11→13 | Consistent |
| ConnectorConfig.lastSyncAt | 10→12 | Consistent |
| Governance dot computation (computeGovernanceDot pure function) | 11→13, 14, 16 | Consistent |
| AnalysisStatus enum (5 values) | 10→11→13, 17 | Consistent |
| Route paths (/, /processes, /opportunities, /automations/[id], /settings) | 12→13-17 | Consistent |
| URL deep-linking params (?highlight, ?process) | 13, 14, 15, 16 | Consistent |
| Deploy infrastructure (retryWithBackoff, stripJsonFences) | 11→15 | Reusable exports available |
| Connected automations (upstreamIds/downstreamIds + heuristic type derivation) | 11→16 | Consistent |
| Sync + analysis pipeline integration | 10, 11→17 | Consistent (synchronous call) |
| Epic 11 risk: R1 stubs preserved in risk-engine.ts | 11→13-16 | No impact (R2 pages use computeGovernanceDot, not R1 functions) |
| Epic 11 risk: processMetrics OQ unresolved | 11→13 | No impact (Dashboard reads aggregateEstimates, not processMetrics) |

## Cascading Changes
None. All cross-epic relationships verified consistent with Epic 11's implementation.

---

# Cross-Epic Review — 2026-04-05 (pass 5, post-Epic 12)

## Summary
- Total specs reviewed: 17 (12 completed + 5 unbuilt + 1 deferred)
- Completed epics (read-only): 01, 02, 03, 04, 05, 05.5, 06, 07, 08, 10, 11, 12
- Specs modified: 16-detail, 17-settings-seed-polish
- Specs clean: 09 (deferred), 13, 14, 15

## Data Flow Verification

Verified the full data production/consumption chain:

| Producer | Data | Consumers | Status |
|----------|------|-----------|--------|
| Epic 10 | Automation (synced), ConnectorConfig, n8n deploy client | 11, 13-17 | ✓ Consistent |
| Epic 11 | Automation (enriched), BusinessProcess, Recommendation, ProcessSuggestion, CompanyProfile, governance dot | 13-17 | ✓ Consistent |
| Epic 12 | Dark theme, 10 shared components, route shells, sidebar | 13-17 | ✓ Consistent |
| Epic 13 | Dashboard page (consumes CompanyProfile, Automation, BusinessProcess, Recommendation) | — | ✓ Clean |
| Epic 14 | Process Map (consumes BusinessProcess, Automation, Recommendation) | — | ✓ Clean |
| Epic 15 | Opportunities (consumes Recommendation, ProcessSuggestion, n8n client) | — | ✓ Clean |
| Epic 16 | Detail (consumes Automation, BusinessProcess, Recommendation, connections) | — | Fixed: brief vs businessCase |
| Epic 17 | Polish + seed (consumes all) | — | Fixed: R1 cleanup added |

## Changes by Epic

### 16 — Detail

- **Issue**: Recommendation row field mismatch — uses `businessCase` instead of `brief` (schema drift / cross-epic inconsistency)
  - **Involved epics**: 13 (uses `brief`), 15 (uses `brief`), 16 (used `businessCase`)
  - **Change**: Updated scope and AC 13 to use `Recommendation.brief` (one-liner) instead of `businessCase` (full reasoning). The `businessCase` field is correctly used only in the Opportunities slide-over panel (Epic 15 AC 8).
  - **Cascade**: None — Epics 13 and 15 were already correct.

### 17 — Settings + Seed + Polish

- **Issue**: R1 artifact cleanup not in scope (missing handoff)
  - **Involved epics**: 10 (flagged R1 test files as risk), 11 (flagged R1 stubs as risk), 12 (flagged R1 components/utilities as risk)
  - **Change**: Added "R1 artifact cleanup" scope section listing specific files to delete (9 components, 4 utility modules, 9 skipped test files, 2 stubbed action modules). Added 4 ACs (22-25) for verification.
  - **Cascade**: None — this is cleanup of artifacts flagged as risks in Epics 10, 11, 12 results.

## Cross-Epic Consistency Notes

1. **`Recommendation.brief` vs `businessCase` convention established**: `brief` = one-liner for list rows (Dashboard, Process Map, Detail, Opportunities rows). `businessCase` = full reasoning for the slide-over panel (Opportunities only). All specs now consistent.

2. **Governance dot derivation**: `computeGovernanceDot()` is a pure function taking errorRate, impact, detectability, isActive (derived from `status === 'active'`), isRemoved. Consumed by Epics 13 (attention items), 14 (workflow rows), 16 (header). All specs reference it consistently.

3. **BusinessProcess.steps Json structure**: Defined in Epic 11 scope as `{ name: string, isAutomated: boolean, isGap: boolean, automationId?: string }`. Epic 14 (Process Map) consumes `isGap` for gap indicators. Consistent.

4. **Recommendation.evidence Json structure**: Defined implicitly by LLM output (Epic 11). Consumed by Epic 15 (slide-over panel) and Epic 16 (evidence section). Structure depends on LLM response — consuming specs should handle the Json adaptively.

5. **AnalysisStatus enum mapping**: `pending → analyzing_workflows → analyzing_workspace → complete | failed`. Consumed by Epic 13 (dashboard states), Epic 17 (sync progress UI). Epic 17 now correctly documents that sync-phase stages are NOT trackable via this enum.

6. **R1 cleanup ownership**: Now explicitly assigned to Epic 17. Covers all artifacts flagged in Epic 10, 11, 12 results.

## Cascading Changes
None. Epic 16's `brief` fix was self-contained (13 and 15 were already correct). Epic 17's R1 cleanup was additive scope.

---

# Cross-Epic Review — 2026-04-05

> Trigger: Post card-layout patch. Epics 12-13 complete with new card components + dashboard-data.ts utility. Epics 14-17 unbuilt.

## Summary

- Total specs reviewed: 17 (13 completed + read-only, 4 unbuilt + 1 deferred)
- Specs modified: 14, 15
- Specs clean: 09 (deferred), 16, 17

## Changes by Epic

### 14 — Process Map

- **Issue**: UnifiedCard component dependency misleading (implementation drift)
  - **Involved epics**: 13 (Dashboard — produced stacked UnifiedCard), 14 (Process Map — consumes same data fields)
  - **Change**: Clarified dependency text from "card components" to "dashboard-data.ts utilities" only. The `/refine_all_ind` pass added "UnifiedCard pattern" but design guidelines §5 explicitly states "Same UnifiedCard fields for workflow rows (but as **aligned columns, not stacked cards**)." Process Map uses table-row layout for workflow rows, not the stacked UnifiedCard component. Removed misleading component reference.
  - **Cascade**: None — Epic 14 spec already described table rows in its scope.

### 15 — Opportunities

- **Issue 1**: Same UnifiedCard clarification (implementation drift)
  - **Involved epics**: 13 (Dashboard), 15 (Opportunities)
  - **Change**: Updated Related section note to explicitly say "use same data fields as UnifiedCard but in table-row layout, not the stacked card component" per design guidelines §5.
  - **Cascade**: None.

- **Issue 2**: Technical fix → Detail page link has no automation ID (forward dependency gap)
  - **Involved epics**: 11 (LLM Pipeline — produces Recommendation with processId but no automationId), 15 (Opportunities — AC 6/10 assume linking to a specific automation's Detail page)
  - **Change**: `NEEDS CONFIRMATION` — added as open question 3 on Epic 15. The Recommendation model has `processId` (FK to BusinessProcess) but no `automationId`. AC 6 says technical_fix rows have "→" link to Detail, and AC 10 says the slide-over includes a link to the affected workflow. Neither can be resolved without knowing which specific automation. Three options proposed: (a) link to first automation in process, (b) match by affectedScope text, (c) link to Process Map instead.
  - **Cascade**: None — this is a data gap in the Recommendation model design, but adding an FK would require an LLM pipeline change (Epic 11, completed). The unbuilt spec (Epic 15) must adapt to the existing model.

### 09 — Production Hardening (deferred)

Clean — no cross-epic issues. The deferred status means R2 page epics handle their own concerns.

### 16 — Detail

Clean after `/refine_all_ind` pass. All cross-page links verified consistent:
- Process position → `/processes` (Epic 14) ✓
- Connected automations → `/automations/[id]` (self) ✓
- Recommendation rows → `/opportunities?highlight={id}` (Epic 15) ✓

### 17 — Settings + Seed + Polish

Clean after `/refine_all_ind` pass. Theme references corrected. Cross-page navigation ACs (26-29) reference all pages consistently.

## Cross-Page Navigation Verification

| From | Link | To | Handler |
|------|------|----|----|
| Dashboard attention items | `/automations/{id}` | Detail (Epic 16) | AC 1-4 ✓ |
| Dashboard opportunities | `/opportunities?highlight={id}` | Opportunities (Epic 15) | AC 29-30 ✓ |
| Dashboard "View recommendations" | `/opportunities` | Opportunities (Epic 15) | route ✓ |
| Dashboard process coverage | `/processes` | Process Map (Epic 14) | route ✓ |
| Process Map workflow rows | `/automations/{id}` | Detail (Epic 16) | AC 6 ✓ |
| Process Map gap indicators | `/opportunities?process={processId}` | Opportunities (Epic 15) | AC 31-33 ✓ |
| Opportunities technical_fix | `/automations/{id}` | Detail (Epic 16) | **NEEDS CONFIRMATION** (no automationId) |
| Detail back nav | `/processes` | Process Map (Epic 14) | AC 30 ✓ |
| Detail recommendations | `/opportunities?highlight={id}` | Opportunities (Epic 15) | AC 29-30 ✓ |
| Detail connected automations | `/automations/{id}` | Detail (Epic 16) | AC 20 ✓ |

## Cascading Changes

None. The UnifiedCard clarification was self-contained in each spec's dependency section. The technical_fix → Detail link gap is an isolated issue on Epic 15.

---

## Brainstorming: Card-Based Layout for Process Map + Opportunities

**Context:** The design spike redesigned the Dashboard with card components (UnifiedCard, ProcessCard, KpiCard, EstimateCard) but left Process Map and Opportunities with table-row layouts per the original PRD. This creates an inconsistent experience — Dashboard shows rich cards, then dedicated pages fall back to plain tables. The user wants consistent card-based design across all pages, using the same components as the Dashboard.

**Design reference:** [Fillow Dashboard Template](https://fillow.dexignlab.com/) — modern card-based admin UI with consistent visual units throughout.

**Core principle:** Workflows and recommendations are our "units." They should look the same whether they appear on the Dashboard (as a preview) or on their dedicated page (as the full list). A UnifiedCard on the Dashboard → same UnifiedCard on Process Map / Opportunities.

---

### Proposal A: Process Map — Card-Based Layout

**Current spec:** Collapsible rows → table rows for workflows inside.

**Proposed:** Collapsible ProcessCards → UnifiedCards for workflows inside.

| Element | Current (table rows) | Proposed (cards) |
|---------|---------------------|-----------------|
| **Collapsed process** | CollapsibleRow with inline columns | **ProcessCard** (same component as Dashboard) — name, maturity badge, coverage bar, reliability, at-risk, recommendations. Click to expand. |
| **Expanded workflows** | Table rows: StatusDot + name + narrative + SystemFlow + ImpactBadge in aligned columns | **UnifiedCard (type=attention)** — same as Dashboard attention items: severity dot, name, description, metric (error rate), scope (step position), process name. Stacked vertically in a grid or single-column list. |
| **Gap indicators** | Dashed-border table rows | **Styled gap cards** — dashed border, step name, "Gap" label, recommendation count, subtle call-to-action to view on Opportunities. Similar visual weight to an "explore" tier UnifiedCard. |

**Layout:**
```
[Search bar]                           [Show gaps toggle]

┌─ ProcessCard: Lead Management ──── Production ─────┐
│ Coverage ████████░░ 60%  |  Reliability 86%        │
│ At Risk ~€2.1K/mo  |  Recommendations 2            │
└────────────────────────────────────────────── [▼] ──┘

  ↳ Expanded:
  ┌─ UnifiedCard (attention) ─────────────────────────┐
  │ ● HubSpot → Gmail Cold Outreach                   │
  │ Primary lead capture — entry point for pipeline... │
  │ 31% error rate         Step 1 of 5 · Lead Mgmt    │
  └────────────────────────────────────────────────────┘
  ┌─ UnifiedCard (attention) ─────────────────────────┐
  │ ● Employee Onboarding Automation                   │
  │ Provisions accounts to Workspace, Slack, Jira...   │
  │ 8% error rate          Step 2 of 5 · Lead Mgmt    │
  └────────────────────────────────────────────────────┘
  ┌╌╌ Gap Card ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐
  ╎ ○ Lead Scoring (Gap)          2 recommendations   ╎
  ╎ View opportunities →                               ╎
  └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
```

**Benefits:**
- ProcessCard is reused from Dashboard (zero new components)
- UnifiedCard (attention type) is reused from Dashboard (same component, same visual)
- User sees the same workflow card whether scanning Dashboard or drilling into Process Map
- Gap cards get proper visual weight instead of being invisible table rows

**Questions for you:**
1. Should expanded workflows be single-column (full width under the ProcessCard) or 2-column grid (like Dashboard attention/opportunities)?

why should it be two column? waht should be in the second column?

2. The ProcessCard in Dashboard is clickable (links to /processes). On Process Map, it would expand/collapse instead. Should we add an expand chevron to ProcessCard, or wrap it differently?

chevron. how else?

---

### Proposal B: Opportunities — Card-Based Layout

**Current spec:** Table rows grouped by tier header.

**Proposed:** UnifiedCards grouped by tier header. Same cards as Dashboard "Top Opportunities" section, just showing ALL recommendations instead of top 3.

| Element | Current (table rows) | Proposed (cards) |
|---------|---------------------|-----------------|
| **Tier section header** | Styled text header | Same — ACT NOW / INVESTIGATE / EXPLORE section headers with visual weight |
| **Recommendation rows** | Table row: name + brief + confidence + scope + impact in columns | **UnifiedCard (type=recommendation)** — Sparkles icon + tier badge + confidence badge, name, description, impact metric, scope, process name. Same as Dashboard cards. |
| **Slide-over trigger** | Click table row | Click UnifiedCard |
| **Deploy button** | Action column in table | Button inside UnifiedCard (or keep in slide-over only) |
| **Process suggestions** | Collapsible section → table rows | Collapsible section → UnifiedCards (same card for child recommendations) |

**Layout:**
```
ACT NOW                                        3 recommendations

┌─ UnifiedCard (recommendation) ─────────────────────┐
│ ✦ ACT NOW  |  Data-driven                          │
│ Add error handling to lead capture                   │
│ Silent failures lose inbound leads...                │
│ ~€1.2K/mo saved    Lead Mgmt · HubSpot → Gmail      │
└──────────────────────────────────────── [Deploy ▶] ──┘

┌─ UnifiedCard (recommendation) ─────────────────────┐
│ ✦ ACT NOW  |  Data-driven                          │
│ Reduce error rate on notifications                   │
│ Status notification running at 8% error rate...      │
│ ~€800/mo in support cost    Customer Communication   │
└──────────────────────────────────────── [Deploy ▶] ──┘

INVESTIGATE                                    2 recommendations

┌─ UnifiedCard (recommendation) ─────────────────────┐
│ ✦ INVESTIGATE  |  Benchmark-based                   │
│ Connect CRM for visibility                           │
│ Customer lifecycle gaps unknown without CRM data...  │
│ Strategic              Lead Mgmt · Salesforce        │
└───────────────────────────────────────────── [→] ───┘
```

**Benefits:**
- UnifiedCard (recommendation type) is the EXACT same component as Dashboard "Top Opportunities"
- Dashboard shows top 3 as preview → Opportunities page shows all — same card, same visual
- Visual tier hierarchy maintained through left-border colors (green/amber/gray) which UnifiedCard already implements
- Confidence badge, tier badge, impact metric — all already built into UnifiedCard

**One addition needed:** The UnifiedCard currently has no slot for an action button (Deploy ▶ / →). Options:
1. Add an optional `action` prop to UnifiedCard that renders a button in the bottom-right of row 4
2. Keep the action button outside UnifiedCard — render it adjacent
3. Only show action buttons in the slide-over panel (simplest — keeps the card clean, matches Dashboard where cards are click-to-navigate)

**My recommendation:** Option 3 — keep cards clean (no action buttons on cards), match Dashboard behavior. Cards click to open slide-over. Deploy button lives in the slide-over. This is simpler AND more consistent. The "→" for technical_fix can also be in the slide-over ("View affected workflow →").

**Questions for you:**
1. Should cards be single-column (full width) or 2-column grid? Single-column lets descriptions breathe; 2-column is more information-dense.

i dont even know what should be two column or a second column?

2. Deploy button on the card or only in the slide-over?

what?!!? slide-over?!?!

3. Process suggestion sections: same UnifiedCard for child recommendations, or a different (more compact) layout?

i dont understand the question?

---

### Summary of Component Reuse

If both proposals are accepted:

| Component | Dashboard | Process Map | Opportunities |
|-----------|-----------|-------------|---------------|
| **UnifiedCard (attention)** | Attention items | Workflow cards in expanded process | — |
| **UnifiedCard (recommendation)** | Top Opportunities + Your Next Move | — | All recommendations |
| **ProcessCard** | Process Coverage grid | Collapsed process rows | — |
| **KpiCard** | Facts bar | — | — |
| **EstimateCard** | Facts bar | — | — |

**Zero new card components needed.** Everything reuses what already exists from the Dashboard build.

### Resolved Decisions

Based on your answers:

**Process Map:**
1. **Single-column** for expanded workflows — cards stack vertically under the process. No 2-column grid needed (there's no second entity type to put in a second column).
2. **Chevron on ProcessCard** — add expand/collapse chevron to the component. On Dashboard it navigates; on Process Map it expands.



**Opportunities:**
1. **Single-column** for recommendation cards — same reasoning, one entity type stacked.
2. **Deploy button in slide-over** — the slide-over panel is already in the Epic 15 spec (AC 8-11: click card opens slide-over with full detail + deploy button). Cards stay clean, click opens the panel. This is the existing spec behavior — no change needed.
3. **Same UnifiedCard for process suggestion children** — obviously same component. No reason for a different layout.

**Both proposals accepted in principle. But I jumped ahead without properly understanding the PRD. Correcting now.**

---

### PRD-Informed Field Mapping: Cards Must Show Exactly What the PRD Specifies

I re-read PRD decisions §3, §4, §5, §9 and the McKinsey/Celonis framework. The card-based layout changes HOW we display data, but WHAT data each card shows is precisely defined in the PRD. Here's the mapping:

#### Process Map — Workflow Cards (PRD §4)

The PRD specifies these fields for a workflow inside an expanded process:

| PRD Field | Source | UnifiedCard Prop |
|-----------|--------|-----------------|
| Name + step label | n8n name + LLM stepName | `name` |
| Business brief (one line) | LLM businessNarrative (truncated) | `description` |
| Governance dot | Risk engine | `severity` (via StatusDot) |
| Error rate metric | Automation.errorRate | `metric` (e.g., "31% error rate") |
| Step position | LLM stepName + process.steps | `scope` (e.g., "Step 1 of 5") |
| Process name | BusinessProcess.name | `process` |
| **Impact badge** | LLM impact.level | **Not in UnifiedCard — needs adding** |
| **System flow** | Deterministic from node types | **Not in UnifiedCard — needs adding** |

**Gap vs UnifiedCard:** The PRD's workflow card has two fields that UnifiedCard doesn't currently show: **SystemFlow** (source → destination) and **ImpactBadge** (critical/high/medium/low). Options:
1. Add optional `systemFlow` and `impactBadge` slots to UnifiedCard — keeps one component
2. Show them as separate elements above/below the card
3. Accept Process Map workflow cards as a slightly extended variant

My recommendation: option 1 — add optional props to UnifiedCard. ImpactBadge fits in row 1 (next to severity dot). SystemFlow fits in row 4 (next to scope + process). This keeps one unified component with optional fields.

#### Opportunities — Recommendation Cards (PRD §5)

| PRD Field | Source | UnifiedCard Prop |
|-----------|--------|-----------------|
| Title | Recommendation.name | `name` ✓ |
| Business case (one line) | Recommendation.brief | `description` ✓ |
| Confidence badge | Recommendation.confidence | `confidence` ✓ |
| Tier badge | Recommendation.tier | `tier` ✓ |
| Affected scope | Recommendation.affectedScope | `scope` ✓ |
| Impact estimate | Recommendation.impactEstimate | `metric` ✓ |
| Process name | BusinessProcess.name | `process` ✓ |

**This maps perfectly to UnifiedCard (recommendation type).** Zero new fields needed. Dashboard already shows the exact same card for "Top Opportunities" — the Opportunities page just shows ALL of them instead of top 3.

**Deploy button:** PRD §5 says deploy button on the card for `new_workflow` type, but also says the slide-over has a deploy button. Since cards click to open the slide-over (PRD §5 slide-over spec), deploy lives there. Cards stay clean.

**The slide-over panel (PRD §5)** is the drill-down level per the McKinsey pyramid:
- Full business case (reasoning, 2-3 sentences)
- Evidence chain (specific data points from user's n8n data)
- Key assumptions
- Honest framing (amber callout for investigate/explore)
- Implementation notes
- Systems involved (SystemFlow)
- Deploy button (if applicable)

Cards = scan level. Slide-over = depth level. This is the McKinsey answer-first structure preserved.

#### Summary

| Page | Card Component | Maps to PRD? | Changes Needed |
|------|---------------|-------------|----------------|
| Process Map — processes | ProcessCard | ✓ | Add expand chevron |
| Process Map — workflows | UnifiedCard (attention) | **Partial** — missing SystemFlow + ImpactBadge | Add 2 optional props |
| Opportunities — recommendations | UnifiedCard (recommendation) | ✓ Perfect match | None |
| Opportunities — slide-over | SlideOverPanel | ✓ Already in spec | None |

#### The Nesting Problem: Workflow Cards Inside Process Cards

This is the core layout challenge. A ProcessCard is a white card with border + shadow. UnifiedCards are also white cards with border + shadow. Nesting cards inside cards creates visual clutter — double borders, double shadows, confusing depth.

**Option A: Accordion — cards appear BELOW, not inside**

ProcessCard stays closed. When you click the chevron, workflow cards appear below it (not inside), slightly indented. ProcessCard acts like an accordion header.

```
┌─ ProcessCard: Lead Management ───── Production ──┐
│ Coverage ████████░░ 60%  |  Reliability 86%      │
│ At Risk ~€2.1K/mo  |  Recommendations 2          │
└──────────────────────────────────────────── [▲] ──┘
   ┌─ UnifiedCard ────────────────────────────────┐
   │ ● HubSpot → Gmail Cold Outreach              │
   │ Primary lead capture — entry point for...     │
   │ 31% error rate      Step 1 of 5 · Lead Mgmt  │
   └──────────────────────────────────────────────┘
   ┌─ UnifiedCard ────────────────────────────────┐
   │ ● Employee Onboarding Automation              │
   │ Provisions accounts to Workspace, Slack...    │
   │ 8% error rate       Step 2 of 5 · Lead Mgmt  │
   └──────────────────────────────────────────────┘
```

Pros: Simple, no visual nesting confusion, each card has its own space.
Cons: Long list when multiple processes expanded — lots of vertical scroll.

**Option B: ProcessCard transforms into a section header when expanded**

Collapsed: full ProcessCard with all metrics. Expanded: ProcessCard simplifies to just a header bar (name + maturity badge + collapse chevron), and workflow cards appear below in a tinted area.

```
┌─ Lead Management ── Production ───────── [▲] ────┐
│                                                    │
│  ┌─ UnifiedCard ──────────────────────────────┐   │
│  │ ● HubSpot → Gmail Cold Outreach            │   │
│  │ Primary lead capture — entry point...       │   │
│  │ 31% error rate    Step 1 of 5 · Lead Mgmt  │   │
│  └────────────────────────────────────────────┘   │
│  ┌─ UnifiedCard ──────────────────────────────┐   │
│  │ ● Employee Onboarding Automation            │   │
│  │ Provisions accounts to Workspace, Slack...  │   │
│  │ 8% error rate     Step 2 of 5 · Lead Mgmt  │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
└────────────────────────────────────────────────────┘
```

Pros: Clear visual containment — workflows are "inside" their process. The containing area uses a tinted background (bg-surface-raised = #f5f5f7) to differentiate from the white workflow cards.
Cons: Loses the ProcessCard metrics (coverage bar, reliability, etc.) when expanded — user has to collapse to see summary again.

**Option C: ProcessCard stays full, workflow cards in a tinted area below the metrics**

ProcessCard keeps ALL its content visible. Below the metrics row, a tinted expanded area appears with workflow cards inside.

```
┌─ ProcessCard: Lead Management ───── Production ──┐
│ Coverage ████████░░ 60%  |  Reliability 86%      │
│ At Risk ~€2.1K/mo  |  Recommendations 2          │
│──────────────────────────────────────────── [▲] ──│
│ ┌─────────────────────────────────────────────┐   │
│ │ bg-surface-raised area                      │   │
│ │  ┌─ UnifiedCard ─────────────────────────┐  │   │
│ │  │ ● HubSpot → Gmail Cold Outreach       │  │   │
│ │  │ 31% error rate  Step 1 of 5           │  │   │
│ │  └───────────────────────────────────────┘  │   │
│ │  ┌─ UnifiedCard ─────────────────────────┐  │   │
│ │  │ ● Employee Onboarding Automation      │  │   │
│ │  │ 8% error rate   Step 2 of 5           │  │   │
│ │  └───────────────────────────────────────┘  │   │
│ └─────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────┘
```

Pros: Process metrics stay visible while drilling in. Background contrast (white card → gray area → white cards) creates natural depth without double-border confusion.
Cons: Very tall cards when expanded. Triple nesting of visual containers (page bg → ProcessCard → tinted area → UnifiedCards).

**Option D: No nesting — master-detail layout**

Don't expand inline at all. Process cards are a grid/list. Clicking a ProcessCard navigates to a process detail view (could be a separate route `/processes/[id]` or a slide-over panel) that shows the workflow cards.

```
Process Grid:
┌─ ProcessCard ──┐  ┌─ ProcessCard ──┐
│ Lead Mgmt      │  │ Customer Comm  │
│ 60% coverage   │  │ 75% coverage   │
└────────────────┘  └────────────────┘

Click "Lead Mgmt" → slide-over or new view:

│ Lead Management — Production
│ Coverage ████████░░ 60%
│
│ Workflows:
│ ┌─ UnifiedCard ─────────────────────┐
│ │ ● HubSpot → Gmail Cold Outreach   │
│ │ 31% error rate  Step 1 of 5       │
│ └───────────────────────────────────┘
│ ┌─ UnifiedCard ─────────────────────┐
│ │ ● Employee Onboarding Automation  │
│ │ 8% error rate   Step 2 of 5       │
│ └───────────────────────────────────┘
```

Pros: Cleanest separation. No nesting at all. Each level gets full screen width. Familiar pattern (Fillow uses this — grid of cards, click for detail).
Cons: Navigation away from the list. Can't compare workflows across processes without switching back and forth.

**My recommendation: Option A (accordion).** Reasons:
- Simplest to implement
- No visual nesting confusion — cards are BELOW, not inside
- ProcessCard keeps all its metrics visible
- The slight indent (pl-6 or pl-8) creates visual hierarchy without containers
- This is how the existing CollapsibleRow component works already — just replace table rows with cards
- Fillow and similar dashboards use this pattern for expandable sections

What do you think?

**Answer:** The PRD already solved this — **CollapsibleRow** is an accordion. Process summary is the header, workflow cards are the children that appear below when expanded. No nesting of cards inside cards. This is Option A, confirmed.

---

## Confirmations Applied (2026-04-05)

All brainstorming items resolved. Changes applied to specs:

1. **Design guidelines §5** — Updated Process Map and Opportunities from table-row layouts to card-based layouts using ProcessCard, UnifiedCard, and CollapsibleRow.
2. **Epic 14 (Process Map)** — Scope and ACs updated: CollapsibleRow with ProcessCard-style header + UnifiedCard (attention) workflow cards + dashed-border gap cards. Single-column, accordion pattern.
3. **Epic 15 (Opportunities)** — Scope and ACs updated: UnifiedCard (recommendation) per recommendation, grouped by tier. Same card as Dashboard "Top Opportunities." Click opens slide-over. Deploy in slide-over.
4. **Process Map nesting** — Resolved: accordion pattern (CollapsibleRow). Workflow cards appear BELOW the process header, not inside a card.
5. **Layout** — Single-column for both pages. No 2-column grids.
6. **Component reuse** — Zero new card components. Everything reuses ProcessCard + UnifiedCard from Epic 13 + CollapsibleRow from Epic 12.

Specs are ready for implementation.

---

## Related

- [Individual Epic Review](ind-epic-review.md)
- [Initial Brainstorming](brainstorming.md)
