# Brainstorming

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