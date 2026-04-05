---
tags:
  - type/brainstorming
  - status/done
  - r2/done
---

# Brainstorming

> Upstream: [PRD](../expliq_prd.md) | [Map of Content](../_MOC.md)

## Round 1 — Questions

### Data Source & Automation Ingestion

1. For the MVP, how does automation data get into Expliq? The PRD assumes Emma "connected or synced her automation platforms," but the screenshots show a "+ Add Automation" button and Edit/Delete controls. Are we building:
   - (a) Manual CRUD only — users add automations by hand and fill in metadata (name, description, systems, owner, etc.)
   - (b) Real platform connectors (n8n API, Zapier API, etc.) that pull workflow data automatically
   - (c) Manual CRUD as the MVP path, with connectors planned for later

b - we query the n8n api and retreive all automations a jsons. these automation jsons are then fundamental for us 

2. If manual entry: what fields are required vs optional when adding an automation? From the screenshots, candidates include: Name, Platform (n8n/Zapier/Make), Status (Active/Inactive), Owner, Systems touched, Description, Trigger, Trigger Type, Core Logic, Data Types, Business Context, Review Cadence, Documentation Last Updated.

### Workspace Snapshot Screen

3. No screenshot was provided for the Workspace Snapshot (Screen 1). The PRD lists these elements:
   - Top metrics (total automations, high impact, high risk, missing owners, overdue reviews)
   - System exposure ranking
   - Owner exposure ranking
   - Structural indicators (recently changed, multi-system)

   Should we design this screen freely based on the PRD description, or do you have a specific layout/wireframe in mind?

   freely design this screen in the spirit of the other screens, but more dashboard like. it was not part of the mini prototype built 

4. How is **system exposure** calculated? Is it simply the count of automations per system, or is it weighted by risk/impact? Same question for **owner exposure**.

we have to find a way for this. it should probably be weighted. because the automations also differ in impact, eg. revenue vs internal. and risk ... 

### Risk & Impact Model

5. The PRD distinguishes **impact** (business consequence severity) and **risk** (governance/structural signals). For impact:
   - Is this a user-assigned value (e.g., High / Medium / Low)?
   - Or is it auto-calculated based on some criteria (e.g., number of systems, revenue-adjacent tags)?

   for automations an impact "score"/"classification" proposal can be automatically derived by the automation type e.g. is it a revenue relevant automation or not. the user can then agree to the proposal or modify. 

6. For **risk level**, the screenshots show governance badges (Documentation outdated, No owner assigned, Automation stale, Inactive) rather than an explicit risk score. The PRD mentions a "risk section with score, level, explicit drivers" on the detail view. Which approach for MVP:
   - (a) Governance badges only (as shown in screenshots) — risk is implicit from the badge count/type
   - (b) An explicit risk score/level (High/Medium/Low) derived from governance signals
   - (c) Both — badges plus a computed risk level

   c - as mentioned the tiny prototype did not model a general dashboard yet and was very crud like. 

7. What are the **thresholds** for governance signals? For example:
   - "Documentation outdated" — how many days since last doc update?
   - "Automation stale" — how many days since last automation update?
   - "Overdue review" — what defines the review cadence and when it's overdue?
   - Are these global defaults or configurable per workspace?

   let us first make them global defaults and later maybe customisable. i mean documentation is outdated as soon as it is outdated ... automation stale maybe a week? use best practice value here?

### LLM-Generated Content

8. The PRD mentions "Business explanation (LLM-generated)" on the Automation Detail. The screenshots show Description, Core Logic, and Business Context fields. For MVP:
   - Are these fields manually written by the user?
   - Or is there an LLM that generates them (from what input — the workflow JSON from a connector)?
   - If LLM-generated: which provider/model, and when does generation happen?

   yes, llm generated from the workflow JSON from a connector. this workflow json is our main "artiact of interest". you pick a suitable provider and model for this. the generation happens as soon as the workflow jsons are imported.  

### Authentication & Multi-Tenancy

9. The screenshots show "RevOps Workspace" in the header. For MVP:
   - Is there a single workspace per account, or can users create multiple workspaces?
   - Is the workspace shared among a team (multi-user), or is it single-user for now?

   let us keep it simple for now and say single user with single workspace? waht do you think?

10. For authentication (Auth.js is in the stack): what login method for MVP — email/password, magic link, OAuth (Google/GitHub), or just skip auth entirely and use a single default user for the prototype?

email/password

### Navigation & Scope Boundaries

11. The sidebar shows four nav items: **Automations, Agents, Integrations, Pipelines**. Only Automations seems in scope per the PRD. Are the other three just visible-but-disabled placeholder links for MVP, or should they be hidden entirely?

just prototype placeholders. yes, leave them out for this mvp. 

12. The Portfolio screenshot search bar says "Search automations..." — is search full-text across all fields, or just by name?

in the prototype just by name. but it would be really practical if we could search for more. especially workflow desciption content. what do you think?

### Automation Detail — Edit & Actions

13. The detail view shows an **Edit** button and a **Delete** button. What fields can be edited? Is it all metadata fields, or a limited subset?

some fields like owner or team and maybe impact "classification"/"score" must be set manually or automatic proposals accepted manually. but maybe we should not let the user manually allow to change the workflow description? what do you think? in the prototype this was just a placeholder.  

14. The detail view shows an **"Open in n8n"** link. For MVP, is this just a stored URL that the user provides, or does it need to dynamically construct the link based on platform + workflow ID?

it should be constructable. but maybe that is out of mvp scope?

15. The detail view in the PRD mentions **review cadence** and **documentation status** as governance fields. Is review cadence a user-set interval (e.g., "every 30 days") that then drives the "overdue review" badge?

yes. but maybe we can provide best practice default value?

---

## Round 2 — Follow-Up Questions & Recommendations

Based on your answers, here are follow-ups grouped by topic. Where you asked "what do you think?", I've included my recommendation marked with **>>**.

### n8n Connector & Platform Scope

16. You said we query the n8n API to retrieve workflow JSONs. For MVP, are we supporting **only n8n**, or also Make and Zapier connectors? The prototype screenshots show all three platforms, but building one solid connector first makes sense.

    **>> Recommendation:** n8n only for MVP. The prototype can show platform badges for Make/Zapier in the UI, but only n8n has a working import pipeline. This keeps the connector work manageable.

    yes

17. For the n8n connector: does the user provide their **n8n instance URL + API key** through a settings/integrations page? Or is this configured via environment variables for MVP?

for mvp lets say n8n instance URL + API key. do you agree?

18. How often should Expliq re-sync from n8n? Options:
    - (a) Manual sync only — user clicks a "Sync" button
    - (b) Periodic background sync (e.g., every hour)
    - (c) Manual sync for MVP, periodic later

c

### LLM Processing Pipeline

19. For LLM-generated fields from workflow JSON, I recommend using **Claude (Anthropic API)** since the rest of the stack is already Anthropic-adjacent and Claude excels at structured analysis of JSON. The LLM would generate from each workflow JSON:
    - **Description** (1-2 sentence business summary)
    - **Core Logic** (bullet points of what the workflow does)
    - **Business Context** (why this automation matters)
    - **Trigger** description
    - **Systems touched** (extracted from node types)
    - **Data Types** handled
    - **Impact classification proposal** (revenue-relevant, operational, internal)

    Does this set of generated fields match your expectations? Anything to add or remove?

    thats good. but what do you think? what do we need to show to really satisfy the user emma from the prd?

20. Should the user be able to **re-trigger** LLM generation for a single automation (e.g., after the workflow changes in n8n and is re-synced)?

yes

### Search (Q12 — you asked what I think)

**>> Recommendation:** Full-text search across name + description for MVP. It's low implementation cost with Prisma (simple `contains` query on two fields) and significantly more useful than name-only. No need for a full search engine — database-level text matching is sufficient for the automation counts we're dealing with.

nice

### Editable Fields (Q13 — you asked what I think)

**>> Recommendation:** The user should be able to edit:
- **Owner** — manually assigned
- **Impact classification** — accept/override the LLM proposal
- **Review cadence** — set the review interval
- **Status override** — mark as inactive/deprecated if needed

The user should **NOT** be able to edit LLM-generated fields (description, core logic, business context, trigger, systems, data types). These are derived from the source workflow JSON and should only change via re-sync + re-generation. This preserves the "source of truth" principle.

yes

Does this split feel right?

yes

### Single User / Workspace (Q9 — you asked what I think)

**>> Recommendation:** Agreed — single user, single workspace for MVP. But I'd model the database with a `workspaceId` foreign key on automations from day one so multi-tenancy is easy to add later. The workspace is auto-created on signup. No workspace management UI needed.

yes

### "Open in n8n" Link (Q14 — you said maybe out of scope)

**>> Recommendation:** Include it — it's trivial. The n8n API response includes the workflow ID, and the n8n instance URL is already stored from the connector setup. The link is just `{instanceUrl}/workflow/{workflowId}`. Low effort, high value for the user's daily workflow.

nice

### Review Cadence Default (Q15)

**>> Recommendation:** Default review cadence of **30 days** (industry standard for automation governance). The "overdue review" badge appears when `lastReviewDate + reviewCadenceDays < today`. Users can adjust per automation.

ok

### Governance Signal Thresholds (Q7)

Proposed global defaults:
- **Documentation outdated**: triggered when `automationLastUpdated > documentationLastUpdated` (i.e., the workflow changed after docs were last updated)
- **Automation stale**: triggered when automation hasn't been updated in **14 days** (1 week felt too aggressive — active workflows often go untouched for a week without issue; 2 weeks better signals genuine staleness)
- **Overdue review**: triggered when `lastReviewDate + reviewCadenceDays < today` (default cadence: 30 days)
- **No owner assigned**: triggered when owner field is null
- **Inactive**: derived from n8n workflow active/inactive status

Do these thresholds feel right, or do you want to adjust any?

feel right

### Remaining Clarification

21. When automations are imported from n8n, should existing automations in the database be **updated** if their workflow JSON changed, or should each sync create a **new snapshot/version**? (Simpler: upsert by n8n workflow ID. More powerful: version history.)

please specify futher. i do not understant. 

22. Does the MVP need a **delete** action for automations? Since data comes from n8n, deleting in Expliq doesn't delete the actual workflow. Should "delete" mean "hide/archive from Expliq" or should automations only disappear when removed from n8n?

only when removed from n8n

---

## Round 3 — Final Clarifications

### Q17 — n8n Connection Setup

Agreed — a simple settings page where the user enters their n8n instance URL + API key. This gets stored securely in the database (encrypted at rest). The settings page would also show the sync button and last sync timestamp.

### Q19 — What does Emma actually need from the LLM?

Going back to the PRD, Emma's core needs are:

1. **"Understand what each automation actually does in simple business terms"** — she doesn't want to read workflow JSON or node configs
2. **"Which automations are important (high business impact if they fail)"** — she needs impact classification
3. **"Which ones are risky"** — she needs governance/risk signals
4. **"Which ones are missing ownership"** — she needs clear ownership gaps surfaced

So the LLM's job is to **translate a technical workflow JSON into business-readable intelligence**. Here's what I think the LLM should extract/generate per automation:

| Field | Purpose for Emma | Source |
|-------|-----------------|--------|
| **Name** | Quick recognition (e.g., "CRM → Slack Escalation") | LLM-generated from workflow structure |
| **Description** | 1-2 sentence business summary of what this automation does | LLM-generated |
| **Trigger** | What starts this automation, in plain language | LLM-generated from trigger node |
| **Core Logic** | Step-by-step bullets of what happens | LLM-generated from node sequence |
| **Systems Touched** | Which external tools are involved (Slack, Salesforce, etc.) | LLM-extracted from node types |
| **Data Types** | What data flows through (Case Number, Deal Amount, etc.) | LLM-extracted from node configs |
| **Business Context** | Why this automation matters — what breaks if it fails? | LLM-generated (this is the key insight for Emma) |
| **Impact Proposal** | Classification: Critical / High / Medium / Low with reasoning | LLM-generated based on systems, data types, and business context |
| **Side Effects** | What this automation writes/modifies in other systems | LLM-extracted — important for risk |

The **Business Context** and **Impact Proposal** are what differentiate Expliq from just reading the n8n workflow editor. Emma gets "This automation ensures high-priority Salesforce cases reach the right people within seconds — if it fails, critical customer escalations go unnoticed" instead of seeing a chain of HTTP nodes and IF conditions.

Does this set feel complete for what Emma needs? Anything missing?

yes

### Q21 — Sync Behavior (Simplified)

Let me rephrase with a concrete example:

Emma syncs her n8n instance on Monday. Expliq imports 20 workflows. On Wednesday, her team edits 3 of those workflows in n8n (changes the logic, adds nodes, etc.). On Thursday, Emma clicks "Sync" again.

**What should happen to those 3 changed workflows in Expliq?**

- **Option A (Upsert):** The 3 automation records in Expliq get overwritten with the new workflow JSON. The LLM re-generates the description and fields. The old version is gone — Expliq always shows the latest state. Simple to build.

- **Option B (Version history):** Expliq keeps both the Monday version and the Thursday version. Emma can see "this automation changed" and compare what's different. More powerful, but more complex to build.

**>> Recommendation for MVP:** Option A (upsert). Always show the latest state. We can track `automationLastUpdated` timestamps to surface the "recently changed" governance signal, but we don't need full version history for MVP.

oke

---

## Round 4 — E2E Testing Strategy (Post Epic 05)

### Context

Through epics 01–05, e2e verification has been ad-hoc:
- **Epic 02 (Auth)**: Playwright created a test account via signup flow
- **Epic 04 (LLM Pipeline)**: Playwright created another test account, connected real n8n, synced 10 workflows, ran LLM processing
- **Epic 05 (Risk Engine)**: Used a `scripts/verify-risk-engine.ts` script against the real DB (no browser)

This left 2 test workspaces in Supabase with 10 real n8n automations each — all with LLM-generated fields, governance signals, and risk data. Useful, but accidental.

### Problem

Epics 06–09 are all UI-heavy screens that display real data (governance badges, risk levels, exposure rankings, filters, cards). Testing them meaningfully requires:
1. A known test account with predictable credentials
2. Real synced automations with LLM-generated fields (not mocked)
3. Variety in the data — some automations with owners, some without; different impact levels; different review states — so filters, badges, and rankings actually exercise all states

Right now the test data is homogeneous (all "high" impact, no owners, all overdue) which means filters like Impact and Owner have flat distributions. The exposure rankings would all cluster.

### Questions

23. Should we formalize a persistent test account with known credentials (stored in `.env.test` or similar) and update the `/dev` skill's verification step to use it for browser-based e2e testing of epics 06–09?

24. Should we seed the test data with variety (assign owners to some automations, set different impact overrides, mark some as reviewed, etc.) before running epic 06? This would make filter/ranking testing meaningful. Options:
    - (a) Write a one-time seed script that diversifies the existing test data in the DB
    - (b) Have the `/dev` skill's verification step set up data as a first step before testing the UI
    - (c) Both — a seed script for local dev, plus verification step sets up its own data

please give me your recommendations on these questions. but let me go further: should the set up of a real test account not have been an individual epic itself?

### Recommendations

**Q23 — Formalize a test account: Yes.**

Store credentials in `.env.test` (or `.env.local` with a `TEST_` prefix). The `/dev` skill's verification step logs in with these known credentials instead of creating throwaway accounts via signup. This gives repeatable, debuggable e2e runs.

**Q24 — Seed data with variety: (c) Both.**

A seed script creates the right data distribution once; the verification step can assume it exists. The seed script is also useful for manual dev testing. The verification step should validate the data is present (not blindly create it again).

**On your deeper question — should this have been its own epic?**

Honest answer: in a traditional project, yes — this is often called "Epic 0" or a "Test Infrastructure" epic. But in our case, the practical impact is small. Here's why:

1. **Epics 01–05 are backend-heavy.** Their e2e verification was lightweight — signup, connect n8n, sync, check data. A formalized test account wouldn't have changed the implementation of those epics.

2. **Epics 06–09 are where it matters.** These are UI screens displaying real data with filters, badges, rankings. Having diverse, predictable test data makes the difference between "page renders" and "all 6 filter rows work correctly with realistic distributions."

3. **The cost of adding it now is tiny.** A seed script (~50 lines) + a `.env.test` file + a small update to the `/dev` skill. No schema changes, no new infrastructure. Maybe 30 minutes of work.

So: **it would have been ideal as a pre-epic-06 task, but it's not worth a full epic.** I'd recommend a lightweight approach:

- **Option A — Standalone seed script**: Write `scripts/seed-test-data.ts` that takes an existing test workspace (from the epic 02/04 Playwright runs) and diversifies it: assigns owners to 6/10 automations, sets different `impactOverride` values, marks 3 as reviewed, sets one `statusOverride = deprecated`. Run it once before epic 06. Update the `/dev` skill to reference the test credentials.

- **Option B — New micro-epic "05.5"**: A tiny spec (`specs/05.5-test-infrastructure.md`) that formalizes the test account, seed script, and `/dev` skill update. More process overhead but keeps the audit trail clean.

**>> Recommendation:** Option A. The seed script is too small to justify epic ceremony. Document the test credentials in `.env.example` and update the `/dev` skill. Ship it as a `chore:` commit before starting epic 06.

What do you think? And do you want to go with the existing test workspace from the epic 04 Playwright run, or create a fresh one?

i go with all your recommendations, except on the last one. i think we should create a new small epic that sets up a test account. however two questions result in general:
- should we update the dev skill to always use this test account data, at least in the last e2e playwright test stage? but then the dev skill could not have applied this to epic01 because there was nothing to test. the dev skill would then need a way to find out in which epics applicable ... 
- to create new epics we need another spec skill such as /spec_ind to create individual/additional specs. similar logic to the existing spec skill but as an outcome just creating specific spec. the brainstorming of phase 1 could then directly take place in the spec specific brainstorming file. i wanted to have this skill for a while now, as we have already added an additional epic09.
- what do you think?

### Response

Good instincts on both points. Let me address them:

**1. Dev skill + test account: conditional e2e stage**

Yes — the `/dev` skill should use the test account for its Playwright e2e stage, but only when it makes sense. The logic is straightforward:

- **Condition**: The e2e stage uses the test account **if the epic being implemented has UI output** (pages, components). Backend-only epics (like epic 05 — risk engine) use the script-based verification instead.
- **How to detect**: The simplest approach is a marker in the spec itself. Add an optional field to specs like `e2e: browser` or `e2e: script-only`. The `/dev` skill reads this and decides which verification path to take.
- **Alternatively**: The `/dev` skill's verifier agent already makes a judgment call about what to test. We could just add to its instructions: "If a test account exists (`.env.test` or test credentials in env), use it for browser-based e2e verification. If the epic is backend-only with no UI changes, use script-based verification instead."

**>> Recommendation:** The second approach (instruction-based, not marker-based). The verifier agent already reads the spec to decide what to verify. Adding "use the test account for browser testing when the epic has UI" to its instructions is simpler than adding metadata fields to every spec. No per-epic configuration needed.

**2. `/spec_ind` skill for individual/additional specs**

Agreed — this is a real gap. The current `/spec` skill was designed for the initial PRD-to-epic-specs flow (reads the full PRD, produces all epics at once). It can't produce a single new spec in isolation.

A `/spec_ind` skill would:
- Take a brief description of what the new epic should accomplish (from the user, in chat or via a brainstorming file)
- Read existing specs + results files to understand what's already built and what conventions to follow
- Brainstorm in the epic-specific brainstorming file (e.g., `specs/05.5-test-infrastructure-brainstorming.md`)
- Produce a single spec file following the established structure (Scope, Dependencies, ACs, Out of scope, Domain terms, Open questions)
- Assign the next available epic number (or a sub-number like 05.5)

**>> Recommendation:** Build the `/spec_ind` skill first, then use it to create the test infrastructure epic. This way the skill is immediately useful and battle-tested. The skill is small — mainly adapting the existing `/spec` skill's Phase 2 (spec writing) with a different input mechanism.

**Proposed order of work:**
1. Create `/spec_ind` skill
2. Use `/spec_ind` to create epic 05.5 (test infrastructure)
3. Update `/dev` skill to use test account for browser e2e
4. Run `/dev` on epic 05.5 to implement the seed script + test account
5. Continue with epic 06

Does this sequence work? And for the `/spec_ind` skill — should I build it now, or do you want to review/refine the skill design first?

the /spec_ind skill should have to phases like the spec skill and in phase 1 immediately generate the spec respective brainstorming file, in which then the content of the new spec can be discussed. everything else remains. i agree an all other issues and the proposed order of work.

---

## Related

- [Epic 01: Project Setup](01-project-setup.md)
- [Cross-Epic Review](cross-epic-review.md)

---

# PRD 2.0 Brainstorming (R2 Pivot — Epics 10–16)

> Upstream: [PRD 2.0](../prd-2.0.md) | [Decisions](../prd-2.0-decisions.md) | [Research Spike](research-spike.md)

## Round 1 — Questions

The PRD 2.0, decisions document (16 sections + amendments N–S), and research spike (v1–v8) are extraordinarily detailed. These questions target only gaps that cannot be inferred from the existing documentation.

### Sync & Data Lifecycle

1. **Re-sync: delete-and-recreate vs upsert for LLM-generated entities.**
   On re-sync, the pipeline runs the workspace LLM call again and gets new BusinessProcess, Recommendation, and ProcessSuggestion records. Unlike Automation records (which have a stable `externalId` from n8n), these LLM-generated entities have no stable external identifier — the LLM might rename a process or restructure recommendations.

   Options:
   - (a) **Delete all + recreate**: Clear all BusinessProcess, Recommendation, ProcessSuggestion, and CompanyProfile records for the workspace before inserting new ones. Simple, clean. Loses any user-side state (e.g., if we ever add "dismiss recommendation" or "pin process").
   - (b) **Upsert by LLM-generated ID**: Attempt to match by name or content. Complex, fragile — LLM may rename "Ticket Lottery Lifecycle" to "Fair Queue Lottery System" on re-run.
   - (c) **Soft versioning**: Keep old records with a `version` or `analysisRun` timestamp, mark the latest set as current. More data, but enables delta comparison.

   **>> Recommendation:** (a) Delete all + recreate for MVP. The LLM output is the source of truth; there's no user-editable state on these entities yet. The previousSnapshot on CompanyProfile captures the pre-sync state for delta banner generation before deletion.

2. **Execution history on re-sync.**
   The spec says to cap at 250 executions per workflow (newest-first) and aggregate to `runsPerWeek`, `errorRate`, `lastExecutedAt`, `avgDurationMs` on the Automation model.

   On re-sync, do we:
   - (a) Re-fetch all 250 most recent executions per workflow (simple, always current)
   - (b) Only fetch executions since `lastExecutedAt` from the previous sync (incremental, lower API load)

   **>> Recommendation:** (a) Re-fetch all 250. The n8n executions API doesn't guarantee a reliable `since` parameter, and the 250-per-workflow cap keeps the total bounded. For 50 workflows that's 50 API calls — manageable.

### Existing Code Adaptation

3. **Risk engine (epic 05) fate.**
   The MVP risk engine computes governance signals: documentation outdated, no owner assigned, automation stale, overdue review, inactive. These drive the "governance dots" (healthy/attention/critical) shown on workflow rows in Process Map and Detail.

   R2 reframes everything as business intelligence but still shows governance dots on workflow rows (section 4: "Governance dot (healthy / attention / critical)" from "Risk engine"). The risk engine inputs (documentation timestamps, owner, review cadence, active status) still exist on the Automation model.

   Does the risk engine:
   - (a) Stay exactly as-is — governance dots remain derived from the existing signals
   - (b) Get extended with new inputs (detectability, error rate, LLM-assessed impact) to produce richer governance classification
   - (c) Get replaced by a simpler derivation from the new LLM fields

i dont know. whats you recommendation? i dont care as long as we only show one gov signal per automation in the wfs page and everything else in the details view. owner for example can be directly queried from the n8n api. and you are right we now have these super important new monitoring fields like error rate and runs! :) that probably have more value than some of our old gov/risk signals. 

4. **Automation model field migration.**
   The MVP Automation model has LLM-generated fields: `name` (LLM), `description`, `coreLogic`, `businessContext`, `trigger`, `triggerType`, `systemsTouched`, `dataTypes`, `sideEffects`, `impactLevel`, `impactReasoning`. The R2 per-automation schema (v8) replaces these with: `businessNarrative`, `dataFlow`, `impact.reasoning` + `impact.level` + `impact.failureScenario` + `impact.revenueConnection`, `detectability`, `timeSavingsEstimate`, `revenueImpactEstimate`, `technicalEvidence`.

   Approach:
   - (a) **Migration**: Rename/replace fields in Prisma schema. Drop old columns, add new ones. Existing data requires re-running LLM on all automations.
   - (b) **Additive**: Keep old fields, add new ones alongside. Run new LLM pipeline, old fields become unused but don't break anything.

   **>> Recommendation:** (a) Clean migration. The old fields serve no purpose once R2 launches — keeping them creates confusion. The seed data and test workspaces will need LLM re-processing anyway after schema changes.

### LLM Pipeline Architecture

5. **Connected automations: matching by name vs ID.**
   The workspace LLM call outputs `connectedAutomations` referencing workflows by name (e.g., `{ fromWorkflow: "Lottery Winner Notification", toWorkflow: "Error Alert System" }`). We need to populate `upstreamIds`/`downstreamIds` on Automation records.

   The LLM-generated names may not exactly match the n8n workflow names or the LLM-generated `name` field from per-automation analysis. How do we resolve this?

   Options:
   - (a) Fuzzy match by name (fragile)
   - (b) Pass workflow database IDs or externalIds in the workspace call input, instruct the LLM to reference by ID
   - (c) Use `errorWorkflow` and `callerIds` from n8n settings for deterministic connections, use LLM-generated connections as supplementary/best-effort

   **>> Recommendation:** (c) — deterministic connections from n8n settings are reliable. LLM-generated logical connections are best-effort. Use (b) as a refinement: include the `externalId` in per-automation summaries so the LLM can reference workflows by ID in its output.

6. **Deploy JSON generation context.**
   Amendment P says deploying triggers a separate LLM call. What context does this call receive?

   **>> Recommendation:** The recommendation record (name, businessCase, implementationNotes, affectedScope) + related workflow JSONs (existing workflows in the same process) + system information (credentials available, systems connected). This gives the LLM enough to generate a realistic scaffold. The output is a valid n8n workflow JSON ready for POST to the API.

### Epic Structure

7. **Epic 10 size and splitting.**
   Epic 10 as described covers: two-phase sync pipeline (Discover + tag selection UX + Sync), 4 new Prisma models + field migration, per-automation LLM rewrite, workspace-level LLM call (new), deploy endpoint, deploy JSON generation (new LLM call type). This is significantly larger than any previous epic.

   Options:
   - (a) Keep as one large epic with clear sub-phases in the spec
   - (b) Split into 10a (Schema + Sync) and 10b (LLM Pipeline + Deploy)
   - (c) Split into 10a (Schema), 10b (Sync pipeline), 10c (LLM pipeline)

   The PRD suggests Epic 10 and 11 run in parallel (Phase 1). Splitting 10 further could allow even more parallelism.

you decide. you may actually change the suggested epics to your liking if you feel so. i wanted to discuss this with you anyway. see below

8. **Epic 11 (Design System) and existing pages.**
   Epic 11 covers: dark theme, sidebar nav, shared components. But the existing pages (Dashboard, Portfolio, Detail) are being replaced in epics 12–15. Should Epic 11:
   - (a) Only set up the design system infrastructure (theme, tokens, shared components) without touching page content
   - (b) Also convert the app shell (sidebar, layout) to the new design, leaving old page content inside the new shell
   - (c) Replace existing pages with empty placeholder pages that have the correct routes and navigation

   **>> Recommendation:** (b) — Convert the app shell (sidebar with new nav items, dark layout) and set up shared components. Old page content can exist inside the new shell temporarily. Epics 12–15 replace page content.

### Routes & Navigation

9. **URL structure for R2 screens.**
   Current: `/` (Workspace Snapshot), `/automations` (Portfolio), `/automations/[id]` (Detail), `/settings`.
   R2 screens: Dashboard, Process Map, Priorities, Detail.

   Proposed:
   - `/` → Dashboard (replaces Workspace Snapshot)
   - `/processes` → Process Map
   - `/priorities` → Priorities
   - `/automations/[id]` → Detail (keep existing route — it's still per-automation)
   - `/settings` → Settings (keep)

   Does this feel right, or different paths preferred?

   yes, but maybe we should rename priorities? eg (business) opportunities? how would mckinsey/celonis name them? 

### Testing & Seed Data

10. **R2 seed data strategy.**
    The existing seed script (epic 05.5) creates mock data for the MVP schema (19 automations with governance fields). R2 adds BusinessProcess, Recommendation, ProcessSuggestion, CompanyProfile models and changes Automation fields.

    Options:
    - (a) Extend existing seed script after schema migration — add new model seeding
    - (b) Create a new R2 seed script that runs the actual LLM pipeline against test data (like the research spike scripts do)
    - (c) Both — a fast deterministic seed for tests + an LLM-powered seed for realistic demo data

    **>> Recommendation:** (c). A deterministic seed script for Vitest and dev (predictable, fast, no API keys needed). Plus the research spike scripts already produce realistic LLM output that can be used to populate demo data.


oke. as mentioned feel free to change the suggested epics as you think is best. what do you think in general about the prd, the decisions and the spike tests/results? anything to evaluate/add and so on? please be honest. 

---

## Round 2 — Responses, Evaluation, and Proposed Epic Structure

### Q1 (Re-sync): Confirmed — (a) delete-and-recreate.

### Q2 (Execution re-fetch): Confirmed — (a) re-fetch all 250.

### Q3 (Risk engine): Recommendation — (b) Extended, but simplified.

You're right — error rate, runs/week, and detectability are far more valuable signals than "documentation outdated" or "overdue review." Those governance signals were designed for a governance dashboard; R2 is an intelligence platform.

**New governance dot derivation for R2:**

| Dot | Criteria | Rationale |
|-----|----------|-----------|
| **Critical (red)** | Error rate >20% on an active workflow, OR critical impact + silent detectability, OR active error workflow has high error rate itself | Something is actively broken or invisibly fragile |
| **Attention (amber)** | Error rate 5-20%, OR inactive but has recent execution history (should be active?), OR no error workflow linked on a customer-facing workflow | Something needs a look |
| **Healthy (green)** | Low error rate, monitored or partially-monitored, operating as expected | Working as intended |

**Drop from the governance dot calculation:**
- "Documentation outdated" — not tracked in R2 (no manual documentation workflow)
- "Overdue review" — no review cadence in R2
- "Automation stale" — replaced by execution recency data (runsPerWeek)
- "No owner" — owner comes from n8n `shared[]` data, shown as metadata but not a dot-level signal

**Keep/add:**
- Active/inactive status (from n8n)
- Error rate (from execution aggregation — new)
- Detectability level (from LLM — new)
- Error workflow linked (from n8n settings — existing)

One dot on the Process Map workflow row. Full breakdown (error rate, detectability reasoning, execution stats, error handling quality) in the Detail page's "How We Know This" section.

The risk engine module itself can be refactored to use these new inputs. The pure-function architecture from epic 05 stays — we just swap the signal inputs.

### Q4 (Field migration): Confirmed — (a) clean migration.

### Q5 (Connected automations): Confirmed — (c) deterministic + LLM with IDs.

### Q6 (Deploy context): Confirmed.

### Q7 + Q8 (Epic structure): Proposed below.

### Q9 (Screen naming): **"Opportunities"**

Researched how the major consultancies name this:

| Framework | What they call "actionable recommendations ranked by impact" |
|-----------|--------------------------------------------------------------|
| **Celonis** | **"Opportunities"** — literally their core feature name for identified process improvements |
| **McKinsey** | "Priority actions", "Value levers" |
| **BCG** | "Value drivers", "Strategic initiatives" |
| **Bain** | "Value creation plan" |
| **UiPath** | "Automation opportunities" |

**"Opportunities"** is the winner:
- Celonis uses it for exactly the same concept — identified improvements ranked by business impact
- It encompasses all three tiers naturally: Act Now opportunities, Investigate opportunities, Explore opportunities
- It's business-forward (not governance-forward, not task-forward)
- It aligns with the PRD vision: "business opportunity detection"
- Route: `/opportunities`

### Q10 (Seed data): Confirmed — (c) deterministic + LLM-powered.

---

### Honest Evaluation of PRD, Decisions, and Spike

**What's genuinely excellent:**

1. **Decision documentation is world-class.** The brainstorming → decisions → amendments flow creates a complete audit trail. Every "why" is recorded. When a future developer asks "why two calls instead of three?" — the answer is in Amendment N with the research that led there. Most products at this stage have none of this.

2. **The research spike is the best prompt engineering work I've seen.** 8 versions, systematic A/B across two models, quantitative comparison tables, and — critically — honest admission when approaches failed. The v2 overfitting recognition ("answers disguised as instructions") shows rigorous self-evaluation. The core insight — "data > methods > prompt engineering" — is genuinely counterintuitive and earned through disciplined experimentation.

3. **The honest framing framework is sophisticated product thinking.** Three frames for uncertain recommendations (clearly n8n domain / may be elsewhere / connect for visibility) is something most products never attempt. Instead of hiding uncertainty, Expliq makes it a trust signal. This is what separates "dashboard" from "consultant."

4. **Product vision is clear and defensible.** Two real differentiators (deploy button, LLM analysis) that a competitor can't just copy by adding a chart. The consulting framing (McKinsey pyramid, Celonis process intelligence) elevates the product. The tagline works.

5. **Schema design is tight.** 4 new models cover everything without over-engineering. CompanyProfile with previousSnapshot + deltaSummary is elegant — one model handles caching, delta tracking, and the "re-sync story" for the demo.

**Areas worth flagging (not problems — things to keep in mind):**

1. **Token budget at scale.** v8 workspace call uses ~50K input tokens for 8 workflows (full JSONs). At 50 workflows: ~300K. At 100+: exceeds context windows. The PRD correctly calls this "a scaling problem, not a prompt problem" — but for epic specs we should document the ceiling (~30-40 workflows per single workspace call with current architecture) and note that a compression/chunking strategy will be needed for larger instances. For the FairTix demo (8-9 workflows), this is a non-issue.

2. **Non-winner gap remains stochastic.** No prompt version reliably discovers this across all runs and models. v8's suggestion ("add a single sentence nudge") wasn't tested. For the demo this is fine — the FairTix data produces plenty of valuable findings. But this represents a class of "complementary outcome" gaps the LLM will sometimes miss. The honest framing partially addresses it ("we analyze what we can see"), and the product could add a lightweight nudge to the workspace prompt without over-engineering: "For each automated outcome, consider whether non-recipients also deserve communication." One sentence, not a method.

3. **The Understand/Advise merge (Amendment N) has a latent scaling risk.** One call doing landscape synthesis AND creative opportunity-finding works for 8 workflows. At 50+ workflows, the combined call may hit quality limits where analytical rigor and creative exploration compete for model attention. If quality degrades at scale, re-splitting is straightforward (the v3-v6 architecture already exists). Not a problem now — just an observation for the future.

4. **Owner field from n8n API.** The `shared[]` array gives collaborators with roles, not a single "owner." For the UI we need one owner display or none. Simplest approach: the user with the highest role in `shared[]` (owner > editor > viewer), or the workflow creator if `shared` is empty. Not a spec question — just an implementation detail to remember.

5. **Missing from the spike: error handling for LLM calls.** The research spike tested happy paths. In production, LLM calls fail (rate limits, timeouts, malformed JSON responses, JSON wrapped in markdown fences — we already hit this in epic 04). The pipeline needs:
   - Retry with backoff for per-automation calls
   - Partial success handling (7/8 per-automation calls succeed — proceed with workspace call using what we have?)
   - User-facing error states in the sync progress UI
   - JSON fence stripping (already implemented in epic 04 — reuse)

6. **Missing: removed workflow handling in processes.** The MVP uses `isRemoved` flag when a workflow disappears from n8n. In R2, a removed workflow might belong to a BusinessProcess — the process step should show as "was automated, now removed" rather than silently disappearing. Since we delete-and-recreate BusinessProcess records on re-sync, the LLM will handle this naturally (it won't see the removed workflow, so it won't include it in a process). But the user loses the "this used to be automated" context. For MVP: acceptable. Future: could track in previousSnapshot.

7. **Demo timeline.** "Next week" is aggressive. The critical path is Schema → Sync → LLM → Pages (inherently sequential). Design system parallels this but pages can't start until both LLM data and design components exist. Realistic prioritization: Dashboard and Process Map are the highest-value demo screens. Opportunities and Detail are next. Settings polish is last. If time is short, one of the pages could ship with less polish.

---

### Proposed Epic Structure

The PRD's suggested sequence (10-16) is good but Epic 10 is too large. I'm splitting the backend into Schema+Sync and LLM, moving design system earlier for maximum parallelism, and renaming the screen to Opportunities.

```
10 (Schema+Sync) ──→ 11 (LLM Pipeline) ──→ 13, 14, 15, 16 (Pages) ──→ 17 (Polish+Seed)
12 (Design System) ───────────────────────↗
```

| Phase | Epic | Name | Scope |
|-------|------|------|-------|
| 1a | **10** | **Schema + Extended Sync** | Prisma migration (4 new models, Automation field changes, drop old LLM fields). Extended n8n-client (discover, tags, executions, credentials, users, projects, variables, deploy endpoints). Two-phase sync pipeline with tag selection UX on Settings page. Execution data aggregation (runsPerWeek, errorRate, lastExecutedAt, avgDurationMs). Graceful degradation for 403 endpoints. |
| 1b (parallel with 10) | **12** | **Design System + App Shell** | Dark advisory theme (globals.css, color tokens, typography). Shared components: StatusDot (new governance derivation), SystemFlow, Badge (confidence variants: solid/dashed/outline), CollapsibleRow, SlideOverPanel. Sidebar conversion (new nav: Dashboard, Process Map, Opportunities, Settings). Route scaffolding (`/`, `/processes`, `/opportunities`, `/automations/[id]`, `/settings`). Empty page shells with correct layouts. Login page dark theme. |
| 2 (after 10) | **11** | **LLM Pipeline V2** | Per-automation enrichment (v8 prompt, parallel execution). Workspace analysis (v8 single call, full JSONs). Connected automations resolution (deterministic from n8n settings + LLM with IDs). CompanyProfile creation (systemLandscape, nextMove, processMetrics, aggregateEstimates). BusinessProcess + Recommendation + ProcessSuggestion population. Delta generation (previousSnapshot → deltaSummary). Risk engine adaptation (new governance dot derivation). Progressive loading status (pending → analyzing_workflows → analyzing_workspace → complete → failed). Error handling (retry, partial success, JSON fence stripping). |
| 3a (after 11 + 12) | **13** | **Dashboard** | Your Next Move banner, facts bar (workflow/process/system/active/recommendation counts + aggregate estimates), attention section (existing workflows with issues), top opportunities section (top 3 recommendations), process coverage table, systems compact row, delta banner (on re-sync). Empty state ("Connect your n8n instance in Settings"). |
| 3b (after 11 + 12) | **14** | **Process Map** | Process collapsible rows (name, summary, maturity, coverage bar, reliability, value at stake, recommendation count). Expanded: workflow rows (status dot, name + step, brief, system flow, impact badge) + gap indicators. Show-gaps toggle. Search bar (client-side filter on process + workflow names). Click → Detail page. Gap indicator click → Opportunities (filtered). |
| 3c (after 11 + 12) | **15** | **Opportunities** | Recommendation rows grouped by tier (Act Now / Investigate / Explore). Row: title, business case, confidence badge, affected scope, deploy button. Slide-over panel (full business case, evidence chain, assumptions, honest framing, implementation notes). Process suggestion collapsible sections with child recommendations. Deploy modal (LLM-generated n8n JSON preview, copy button, deploy-to-n8n button → POST + activate). Deep-linking (`/opportunities?highlight={id}`). |
| 3d (after 11 + 12) | **16** | **Detail** | Header (name, governance dot, platform badge, system flow, process step). Business narrative section. Business case card (3 columns: failure impact, time savings, revenue connection). Recommendations for this workflow (in-page list from Recommendations linked to this automation). Process position visual. Connected automations (upstream/downstream, clickable). "How We Know This" expandable evidence (execution stats, node config, credential info, detectability, deductive reasoning chain). |
| 4 | **17** | **Settings + Seed + Polish** | Settings page polish (sync progress steps UI: "Fetching workflows... Analyzing..."), loading/skeleton states for analysis-in-progress, R2 seed script (deterministic for tests + LLM-powered for demo data from research spike results), login page polish, any remaining UX gaps. |

**Key differences from PRD's suggested sequence:**
1. Epic 10 split in two: Schema+Sync (10) and LLM (11)
2. Design system renumbered to 12 (parallel with 10, not blocking on it)
3. "Priorities" renamed to **"Opportunities"**
4. Deploy feature moved INTO the Opportunities epic (15) — it's UI + one LLM call, tightly coupled to that page
5. Settings UX for two-phase sync moved INTO epic 10 (it's the sync pipeline's user-facing surface)
6. Risk engine adaptation moved INTO LLM epic (11) — depends on new LLM fields
7. Added polish+seed epic (17) as a catch-all for demo prep

**Phase 3 epics (13-16) are all parallel** — they only read data and use shared design components. This is the maximum parallelism point.

**Critical path for demo:** 10 → 11 → 13 (Dashboard) is the minimum viable demo. If time is short, 14 (Process Map) is the second priority, then 15 (Opportunities with deploy), then 16 (Detail).

good that you noted error handling in the llm pipeline because in the spike testing opus had some errors once and the analysis had to be restarted. there must be solutions for this in the product. this cant happen in the demo in front of industry experts. 
one last question: with the llm results we get and the pages structure, are we able to show results for automations that resemble those of mckinsey and those of celonis for process mining?

---

## Round 3 — McKinsey/Celonis Comparison and LLM Resilience

### LLM Error Handling — Demo-Grade Resilience

Agreed — this is non-negotiable for the demo. The LLM pipeline must be robust enough that a live sync in front of industry experts never shows an error screen. Here's what Epic 11 (LLM Pipeline V2) must include:

**Per-automation calls (parallel):**
- Retry with exponential backoff (3 attempts, 2s → 4s → 8s)
- Individual failure isolation — if 1 of 8 workflows fails after retries, proceed with the other 7. The workspace call works with whatever per-automation results succeeded. Mark the failed automation with a status flag (e.g., `analysisStatus: "failed"`) so the UI can show "Analysis unavailable for this workflow" instead of breaking.
- JSON fence stripping (reuse from epic 04 — some models wrap JSON in markdown code fences)
- Response validation — verify the JSON matches the expected schema before storing. If invalid, retry once more.

**Workspace call (single):**
- Same retry logic (3 attempts with backoff)
- If workspace call fails after retries: per-automation data is still available. Dashboard and Detail pages can render with per-automation data (business narratives, impact, evidence). Process clustering, recommendations, and "Your Next Move" show as "Analysis in progress..." with a retry button.
- Timeout handling — workspace call for 8 workflows takes 2-3 minutes. Set a generous timeout (5 min) but show progress ("Analyzing your automation landscape...").

**Deploy JSON call (on-demand):**
- Same retry logic
- If it fails: "Generation failed. Try again." button. The user is already looking at the recommendation — they can wait.

**For the demo specifically:** Run the sync once before the presentation to warm the cache. The delta banner feature means a second sync during the demo shows the "loop" — and both syncs have already been tested. The risk of a live failure drops to near-zero if the first sync succeeded during prep.

### Can Expliq Deliver McKinsey + Celonis Quality?

**Short answer: McKinsey — yes. Celonis — partially, but with unique strengths Celonis doesn't have.**

#### McKinsey Comparison

McKinsey automation assessment deliverables map almost directly to Expliq's page structure:

| McKinsey Deliverable | Expliq Equivalent | Quality Match? |
|---------------------|-------------------|----------------|
| Executive summary ("the answer") | Dashboard → Your Next Move banner | **Yes** — v8 "Your Next Move" produces McKinsey-pyramid answer-first narratives citing workflow names and numbers |
| Impact-ranked recommendations with evidence | Opportunities page → tiered rows with slide-over panels | **Yes** — three tiers (Act Now / Investigate / Explore) with evidence chains and honest framing |
| Per-item deep dive with business case | Detail page → narrative + business case card + evidence | **Yes** — v8 per-automation output produces consulting-grade business narratives with deductive reasoning |
| Process maturity assessment | Process Map → coverage, reliability, maturity levels | **Yes** — coverage bars, maturity levels (Prototype → Optimized), and reliability percentages |
| "Supporting evidence" appendix | Detail → "How We Know This" expandable section | **Yes** — execution stats, node configuration, credential info, deductive reasoning chain |

The design system reinforces this: dark advisory theme, McKinsey-style typography hierarchy (answer bold/white, evidence regular/gray), monospace numbers, tables over cards. The visual language says "consulting deliverable," not "SaaS dashboard."

**What makes it credibly McKinsey-like:** Every insight traces back to the user's own data. The evidence chains cite specific execution stats, node configurations, and workflow inventory facts. The honest framing ("we don't see this in your n8n workflows") is more transparent than most consulting reports.

#### Celonis Comparison

This is where it gets nuanced. Celonis and Expliq solve related but fundamentally different problems:

| Dimension | Celonis | Expliq |
|-----------|---------|--------|
| **Input data** | Event logs (millions of actual execution events with timestamps) | Workflow definitions + execution stats (~50-250 executions/workflow) |
| **Process discovery** | Statistical — discovers processes from actual event sequences | Analytical — LLM clusters workflows into business processes from definitions |
| **Conformance** | "Your process runs differently than designed 30% of the time" | "You've automated 3 of 5 steps in this process" |
| **Variants** | Shows actual paths taken by cases (data-driven) | Shows intended paths from workflow logic (definition-based) |
| **Bottlenecks** | Per-step timing from event logs (statistically significant) | Per-workflow error rates + LLM-estimated impact (hybrid) |
| **Scale** | Designed for millions of events | Designed for <50 workflows |
| **Output** | "Here's what's happening" (diagnostic) | "Here's what to DO about it" (prescriptive) |

**What Expliq delivers that's Celonis-like:**
- Process coverage visualization (existing + gap steps) — analogous to Celonis conformance
- Maturity levels — analogous to Celonis process maturity scoring
- System landscape narratives — analogous to Celonis system integration analysis
- Cross-workflow pattern detection — analogous to Celonis variant analysis
- The Process Map with collapsible process rows → workflow rows gives a visual feel similar to Celonis process explorer

**What Expliq does NOT have (and Celonis does):**
- Flow diagram visualization (actual node-by-node process map with arrows)
- Per-node execution timing and bottleneck highlighting
- Statistical significance from large event volumes
- Automated root cause analysis from event patterns

**What Expliq does that Celonis CANNOT:**
- **Deploy button** — from recommendation to running workflow in one click. No process mining tool generates deployable code.
- **Business narrative** — Celonis shows data. Expliq explains what the data means for the business in natural language.
- **Honest framing** — Celonis assumes data completeness. Expliq acknowledges what it can't see and differentiates confidence levels.
- **Deductive reasoning** — Expliq reads email templates, AI prompts, and field mappings to understand what the business DOES, not just how processes flow. "This email template contains a 24-hour purchase CTA, therefore a time-limited conversion window exists, therefore reminders are missing." Celonis can't reason about workflow content.
- **Recommendation specificity** — "Enable retryOnFail on the 'Send a message' Gmail node with 3 retries and exponential backoff." Celonis identifies WHERE the problem is. Expliq says WHAT to do about it.

#### Verdict

For the demo audience (industry experts, trainers, mentors):

The **McKinsey angle is fully credible.** The page structure, content quality, and visual design deliver a consulting-grade automation assessment. A trainer who has seen McKinsey slide decks will recognize the pattern: answer first, evidence second, honest about uncertainty.

The **Celonis angle is partially credible but differently positioned.** Expliq is not process mining — it's automation intelligence. The Process Map shows process coverage and maturity (Celonis territory), but the real differentiator is the prescriptive layer: "here's what to build next, and here's the deploy button." A trainer familiar with Celonis will see the overlap in process assessment but immediately notice the "act on it" capability that Celonis lacks.

**Recommendation for the demo pitch:** Position Expliq as "the consulting engagement, automated." McKinsey-grade analysis + Celonis-style process assessment + something neither offers: one-click deployment. Don't claim to be a process mining tool — claim to be the tool that makes process mining actionable.

thank you for this assessment - thats great! but my question was more into the direction:
---
"Your Next Move" produces McKinsey-pyramid answer-first narratives citing workflow names and numbers
Impact-ranked recommendations with evidence
Opportunities page → tiered rows with slide-over panels
three tiers (Act Now / Investigate / Explore) with evidence chains and honest framing
---
does mckinsey show revenue and (time) savings numbers for this? and/or do they show more? and what can and should expliq actually show? ie can we hit as hard as mckinsey/celonis with our recommendations/suggestions?

---

## Round 4 — Revenue/Savings Numbers: McKinsey vs Celonis vs Expliq

### What McKinsey Shows Per Recommendation

A McKinsey automation/process assessment typically includes:

| Metric | Example | Source |
|--------|---------|--------|
| **Revenue impact** | "Reducing error rate from 31% to <5% recovers $120K/year" | Client financial data + error rate analysis |
| **Time savings (FTE)** | "Automating support classification saves 2.3 FTE (~$180K/year)" | Client HR costs + process timing |
| **Payback period** | "Investment: $40K. Payback: 3.2 months" | Implementation cost estimate |
| **Risk-adjusted value** | "Even at 50% realization: $60K/year" | Conservative scenario modeling |
| **Total addressable value** | "Total automation opportunity: $1.4M/year across 12 initiatives" | Rollup of all recommendations |
| **Implementation timeline** | "Quick wins (0-3mo), medium-term (3-6mo), strategic (6-12mo)" | Effort estimates |

**How they get these numbers:** Access to the client's actual financial data (revenue per transaction, hourly costs, employee headcount, P&L). Validated through interviews with stakeholders. Backed by proprietary benchmarks from hundreds of similar engagements.

### What Celonis Shows

| Metric | Example | Source |
|--------|---------|--------|
| **Value at stake per process** | "Order-to-cash inefficiency costs €2.3M/year" | Event log timing × transaction values |
| **Automation rate** | "68% of activities can be automated" | Activity classification |
| **Throughput improvement** | "Reducing average case time from 12 to 7 days" | Event log statistics |
| **Conformance cost** | "Non-conformant cases cost 3.2× more" | Variant analysis × cost data |

**How they get these numbers:** Millions of event log entries with timestamps. Connected to ERP/financial systems for actual transaction values.

### What Expliq CAN Show (Already in the Architecture)

The v8 LLM output + Amendment R already produce these:

**Per-automation (Detail page business case card):**
- `revenueImpactEstimate`: "Each failure loses one ticket sale at €15-200. At 36% failure rate across ~50 winners/event = €270-3,600 lost per event." (v8 Opus actual output)
- `timeSavingsEstimate`: "~3 min/notification at scale — replaces manual email composition and status tracking"
- `impact.failureScenario`: cascading business consequences
- `impact.revenueConnection`: "Direct / Indirect / N/A" with reasoning

**Per-recommendation (Opportunities page slide-over):**
- `businessCase`: "This IS the revenue conversion trigger — fixing the 36% error rate recovers €X/cycle"
- `evidenceChain`: specific data points
- `implementationNotes`: specific technical guidance with named nodes and config values

**Aggregate (Dashboard facts bar):**
- `aggregateEstimates.totalTimeSavings`: "Your automations save approximately X hrs/wk"
- `aggregateEstimates.totalValueAtRisk`: "Current reliability issues put €Y/month at risk"
- `aggregateEstimates.totalOpportunityValue`: "Implementing all recommendations could recover €Z/month"

**Confidence labels on every number:**
- "Data-driven" (€15 ticket price from email template — the user's own data)
- "Benchmark-based" (10-15% conversion lift from reminders — industry knowledge)
- "AI-suggested" (inferred from patterns — might be wrong)

### The Gap: What Expliq CANNOT Show

| Metric | Why not |
|--------|---------|
| **FTE savings** | No employee headcount or hourly cost data |
| **Payback period** | No implementation cost estimates |
| **Company-wide financial projections** | Scope is automation, not the entire business |
| **Risk-adjusted scenarios** | Would need user input on probability and cost assumptions |

### The Expliq Advantage McKinsey Doesn't Have

Here's the counterintuitive part: **Expliq's transparency about methodology is actually a STRONGER trust signal than McKinsey's authority-based numbers.**

McKinsey says: "Savings of $2M." You trust the brand.
Expliq says: "Savings of ~€2K/cycle — here's exactly how we calculated it: 36% error rate × ~50 winners/event × €15-200 ticket price. Source: your execution stats + your email template. Confidence: data-driven."

For a technical audience (your demo — industry experts, trainers), the methodology transparency IS the value proposition. They can verify. They can challenge. They can refine. A McKinsey number is a black box; an Expliq number is an open calculation.

### Can We Hit as Hard? Honest Assessment

**80% there with the current architecture.** The per-recommendation revenue/savings estimates, evidence chains, and aggregate estimates create a compelling value story. The FairTix demo data produces specific numbers ("€195-2,600 lost per lottery cycle") that are impressive and verifiable.

**The 20% gap** is: McKinsey validates numbers with client financial data; Expliq infers from automation data. Celonis works with millions of event-level records; Expliq works with workflow definitions + summary stats. This gap is honest and acknowledged — it's literally what the confidence labels exist to communicate.

**For the demo audience specifically:** The transparent reasoning hits harder than inflated numbers would. These are industry experts — they've seen vendors overpromise. An estimate that says "€2K/cycle, here's the math, from your own data, confidence: data-driven" is more persuasive than "$500K/year, trust us."

### Suggested Addition to the Opportunities Page

One thing I'd recommend adding to maximize the "hit hard" factor: **a value indicator on the recommendation row itself** — not just in the slide-over. Something scannable:

```
[status] [title]                              [value badge]   [confidence] [action]
  ●      Fix Lottery-Win Notification         ~€2K/cycle      Data-driven  [Fix →]
  ●      Add Lottery-Loss Notification        ~€5K/event      Benchmark    [Deploy ▶]
  ┈      Connect Ticketing Platform           Strategic        —            [Learn →]
```

The value badge gives instant scan value — the user sees which recommendations have the highest quantified impact without clicking into the detail. McKinsey's recommendation deck always has the number visible at the top level; the reasoning is in the appendix.

This would be a small addition to the Recommendation model: a `valueBadge` or `impactSummary` field (one-liner like "~€2K/cycle" or "~15 hrs/month" or "Strategic") derived from the LLM recommendation output. The LLM already produces this reasoning — we'd just add a field for the condensed version.

### What This Means for the Specs

The v8 architecture already produces everything needed. The additions:

1. **Value badge on recommendation rows** — add `impactEstimate` field to Recommendation model (short string, e.g., "~€2K/cycle"). LLM produces it as part of the workspace call output schema.
2. **Methodology link** — Dashboard facts bar shows "est. ~X hrs/wk" with a (methodology →) link that expands to show the calculation. Already described in PRD decisions section 3 — just confirming it's in scope.
3. **"If you fix this" framing** — recommendations should frame the value as what's RECOVERED by acting, not just what's AT RISK. The LLM already does this naturally ("fixing the 36% error rate recovers...") but the output schema should have a field for it.

These are small schema additions, not architectural changes. I'll include them in the epic specs.
