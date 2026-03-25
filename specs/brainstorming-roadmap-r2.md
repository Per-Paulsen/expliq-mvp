# Roadmap Brainstorming — Round 2

> Related: [Roadmap v1](roadmap.md) | [TODO](../_TODO.md) | [Ultimate Vision](../ultimate-expliq.md) | [Semi-Ultimate Technical](../semi-ultimate-expliq-technical.md)

---

## What we agreed so far

- 2 weeks to final bootcamp presentation
- Exercises 19 (webhook) and 22 (chatbot) due this week
- Demo flow: fairtix n8n (known by everyone) -> prescriptive wow -> OpenClaw AI agents -> "governance for everything"
- Vision shift: Expliq goes from descriptive to **prescriptive**
- Dashboard needs to be cleaner, more professional, layered
- Heavy infra from semi-ultimate spec (evidence store, lineage, RBAC) is parked — invisible in demo

---

## Open for discussion

### 1. Prescriptive Advisor — the biggest wow feature

Expliq analyzes the FULL automation landscape and tells the user:

**A) What to improve in existing automations:**
- Technical: add error handling, add retries, add monitoring
- Governance: assign owner, set review cycle, update documentation
- Business: reclassify impact, connect related automations

**B) What automations are MISSING from a business perspective:**
- "You have Stripe but no failed payment recovery workflow"
- "You have CRM leads but no automated follow-up sequence"
- "You have no notification workflow for downtime events"

**C) Exportable output:**
- n8n-compatible JSON workflow templates the user can directly import
- Or at minimum: detailed prompts/specs the user can give to an LLM or developer
- Expliq = workflow architect, not executor

**Questions:**
- How deep should the suggestions go? High-level ("add error handling") or detailed ("here's the exact n8n JSON")?
- Should this be per-automation advice, workspace-level recommendations, or both?
- Where does this live in the UI? Chatbot? Dedicated page? Cards on dashboard?
- How do we ensure the LLM suggestions are grounded and not hallucinated?

---

### 2. Three-layer control model (from ultimate-expliq.md)

The files define three interconnected layers:

**Layer 1: Workspace-Level (Executive Control)**
- Total automations, high impact count, critical risk count
- Top action items, drift indicators (% without owner, % overdue review)
- System exposure overview
- This should be the FIRST screen — clean, immediate, "throw the potential at the user"

**Layer 2: System-Level (Infrastructure Exposure)**
- Per system: automations connected, high risk count, owner gaps
- Critical system flags (Stripe, Salesforce = critical infrastructure)
- System risk scores
- Drill-down from workspace level

**Layer 3: Automation-Level (Asset Governance)**
- Individual governance per automation
- Risk drivers, business impact, connected automations
- Prescriptive advice per automation
- The detail view

**Questions:**
- How does this map to the current route structure? Currently: `/` (Workspace Snapshot), `/automations` (Portfolio), `/automations/[id]` (Detail)
- Do we need a new `/systems` route for the system-level view?
- Or do systems appear as a section within the workspace dashboard?
- What goes on the first dashboard vs. what's drill-down?

---

### 3. Priority order — what creates max demo impact?

Current proposed order:
1. Risk model upgrade (transparent drivers) — foundation
2. Prescriptive business advisor — visible by default on dashboard + detail pages (NOT hidden in chatbot)
3. Missing automation suggestions + exportable JSON — "it builds workflows?!"
4. Connected automations (fairtix error handler) — dependency awareness
5. Webhook (exercise 19) — real-time story
6. OpenClaw connector — second-act wow
7. Dashboard redesign — wraps around features
8. Chatbot (exercise 22) — interactive drill-down layer on TOP of the visible insights

**But:** exercises 19/22 have bootcamp deadlines this week.

**Questions:**
- Should exercises come first regardless (deadline-driven)?
- Or can the risk model upgrade come first since it makes the exercises better?
- Is the "missing automation suggestions" feature more important than connected automations?
- Where does the dashboard redesign fit — after all features, or should a basic cleanup happen early?

---

### 4. Risk model — how far to go?

Current model: simple weights, 3 levels (low/medium/high), basic signals.

Semi-ultimate spec defines:
- Additive driver-based scoring with named keys (GOV_NO_OWNER = +20, etc.)
- 4 levels: Low / Moderate / High / Critical
- Separate Impact Category from Criticality
- Base Impact Weight from criticalityFinal
- Risk explanation always shows active drivers

**Questions:**
- Do we implement the full semi-ultimate risk model, or a pragmatic subset?
- The Category vs Criticality split requires schema changes — worth it for demo?
- Should risk drivers be persisted (new JSON column) or computed on read (current pattern)?

---

### 5. OpenClaw — scope and timing

Agreed: Week 2 feature, user sets up instance.

**Questions:**
- What OpenClaw workflows should we set up for the demo? (business-relevant ones that show risk)
- How does the connector work? Read YAML files from filesystem? API call? Manual upload?
- Do we need a running OpenClaw instance or just the workflow definition files?
- How much of the risk model applies to OpenClaw vs. n8n-specific?

---

### 6. Dashboard UX — what does "clean first impression" mean?

Current Workspace Snapshot is "overwhelming and asymmetric."

**The first screen should communicate in 5 seconds:**
- How many automations you have
- How healthy your automation landscape is (overall risk)
- Where the biggest problems are (top 3 action items)
- Clear paths to drill down

**Questions:**
- What's the visual style reference? (any SaaS dashboards you admire?)
- Should the first screen be mostly numbers/metrics, or include charts/visualizations?
- Dark mode for presentation?

---

## Claude's recommendations (for discussion)

1. **Ship exercises first** (days 1-2) — deadlines are deadlines.

2. **Risk model upgrade** (day 3) — this is the foundation. Every other feature (advisor, dashboard, connected automations) depends on having a credible risk model.

3. **Prescriptive advisor — visible by default** is the biggest differentiator. Build as always-visible dashboard cards + detail page sections. Chatbot (exercise 22) is the interactive drill-down layer on top, not the primary surface.

4. **Connected automations** (day 4) — high wow for fairtix demo specifically (the error handler).

5. **Dashboard redesign** (day 5) — can't be last, because the first impression matters. Do a focused cleanup after the core features work.

6. **OpenClaw** (week 2) — second act of the presentation.

7. **Exportable n8n JSON** — this is the "drop the mic" feature. Build it into the prescriptive advisor. The LLM generates the template, user clicks export, imports into n8n. The audience loses it.

---

## Round 2 Discussion Results

### Core Insight: What caused the actual wow

The trainer's wow moment was NOT a dashboard or metric. It was this (from the automation detail page):

> **High risk / High impact**
> "This automation directly impacts customer support response times and quality. It handles sensitive customer data and classifications that drive support routing decisions. Failure would mean manual email triage, significantly slowing support operations and potentially missing urgent issues."

That's `impactProposal.reasoning` from `llm-pipeline.ts` — the LLM understanding the *business meaning* of a specific automation. **The wow is in the depth of business understanding.**

### Key Decision: Prescriptive BUSINESS optimization > prescriptive risk reduction

"Assign an owner" = governance hygiene. Boring. Any compliance tool.
"You're missing a failed payment recovery workflow — here's what it looks like" = business intelligence. Nobody does this.

**Competitive landscape (verified):**
- GRC platforms (IBM OpenPages, Archer) — regulatory compliance, not automation understanding
- n8n built-in features — audit logs, RBAC, operational. No business intelligence.
- n8n community audit tool — technical checks only (security, error handling, performance)
- Process mining (Celonis) — analyzes process logs, not automation definitions

**Nobody uses an LLM to read an entire automation landscape and provide business-level intelligence about what's missing, what's fragile, and what to build next.** This is genuinely novel.

### Revised Focus: "Expliq understands your business better than you do"

The core value proposition, in priority order:

1. **Business insight depth** — make the LLM per-automation understanding even richer
2. **Workspace-level business analysis** — LLM looks at ALL automations and finds gaps, opportunities, fragilities
3. **Actionable output** — exportable n8n JSON templates for missing/improved workflows
4. **Transparent risk drivers** — supports the insight, explains the "why"
5. **Governance hygiene** — owner, review, docs (background, not headline)

### How This Changes the Exercises

**Exercise 22 (chatbot):** Satisfies exercise requirement (input -> LLM -> response, knowledge base, guardrail). But the prescriptive insights should be visible by default on dashboard + detail pages. The chatbot is the interactive drill-down layer, not the primary surface.

**Exercise 19 (webhook):** Governance change notifier — Expliq POSTs to n8n when governance state changes. n8n runs AI reasoning + Slack notification.

**Exercise 20 (agent design):** Design-only doc. Describes the full vision of Expliq as autonomous governance agent. Perfect alignment with prescriptive direction.

### Revised Priority Stack

1. **Prescriptive business advisor — visible by default** (core differentiator)
   - Dashboard: "Top 3 business gaps" cards — always visible, no interaction needed
   - Detail page: "Recommendations for this automation" section — always visible
   - Workspace-level: business gap analysis across all automations
   - Exportable n8n JSON for suggested workflows
   - Chatbot (exercise 22) = interactive drill-down layer on top, NOT the primary surface
2. **Risk model upgrade** (transparent drivers, 4 levels)
   - Foundation for credible insights
3. **UX fixes** (search is catastrophe, dashboard is messy)
   - Can't demo broken UX regardless of features
4. **Connected automations** (fairtix error handler)
5. **Webhook endpoint** (exercise 19)
6. **Dashboard redesign** (clean three-layer flow)
7. **OpenClaw connector** (week 2, second act)

### Key UX Decision: Prescriptive insights must be visible by default

The biggest wow should NOT be hidden in a chatbot widget that users have to actively open. The trainer's wow moment was text that was just *there* on the detail page (impactReasoning) — no interaction needed.

**Visible by default (no user action required):**
- Dashboard: "Top 3 business gaps in your automation landscape" — cards just sitting there
- Detail page: "Recommendations for this automation" section — always visible
- Dedicated recommendations page: full workspace analysis, missing automations, exportable JSON

**Chatbot = interactive drill-down layer on top:**
- "Tell me more about this recommendation"
- "What would that missing workflow look like?" → exports n8n JSON
- Satisfies exercise 22 requirement but is NOT where the core wow lives

The cake is the always-visible prescriptive insights. The chatbot is the cherry on top.

### Open: Execution Order vs Deadlines

Exercises 19/22 are due this week. The prescriptive advisor needs a PRD 2.0 first. Exercise 19 (governance change notifier) is being implemented now as a patch.

---

## Still open for discussion

- Exact exercise deadlines (which day this week?)
- Search fix: before or after exercises?
- Dashboard redesign: when? What does "clean" look like?
- OpenClaw: what workflows to set up for demo?
- How far to push the risk model (pragmatic subset vs full semi-ultimate)?
- n8n JSON export: how polished does it need to be for demo?

---

## UX & Product Backlog (from TODO, not yet prioritized)

Items from `_TODO.md` not covered elsewhere in this doc. Grouped by area.

### Auth & Onboarding
- Auth forms: show password requirements (min length, characters needed), better validation, more professional feel
- Loading states: explain always when there is a waiting screen/bar/spinner

### Settings Page
- Settings page is confusing: no explanation of what "sync" does, where, and why
- Permanent success feedback in settings is unclear

### Portfolio Page
- No status filter or sort — need filter by status, risk level, impact + sort options
- Possible duplicate automations bug — investigate if some automations shown multiple times and why
- Automation names: do they come from n8n JSON? Could be confusing if different from internal n8n names

### Detail Page
- Too much text, especially nodes section — consider collapsible or visualization
- Risk context too small in upper right corner — should be more prominent
- Workflow visualization: node graph with explanations next to nodes (high effort, high wow — undecided)
- LLM classification transparency: should Expliq show what it did internally? (prompts, classification logic)

### Sync Behavior
- Sync history: no record of what changed per sync, only immediate feedback — need history/changelog
- Re-run LLM on sync? Currently unclear if explanations + risk are regenerated on re-sync
- Query more n8n fields: creator, execution stats, other useful metadata from n8n API

### Monitoring (explicitly deprioritized)
- Discussed and decided: monitoring is expected/table-stakes, not the wow differentiator
- Revisit after prescriptive advisor is built

### Tooling & Infra (parked, discuss later)
- Environment separation: separate .env.development/.test/.production, separate Supabase projects or schemas
- Dark mode: quick win with shadcn/ui themes? Nice for presentation?
- REST API architecture: should server actions be REST endpoints instead?
- Bootcamp exercise data: other participants' n8n workflows as additional test data for Expliq

### Info / References (not action items)
- Fairtix n8n instance: credentials in .env (commented), URL + API key
- Fairtix account: abend@session.com / 123456789
- Plannotator: https://github.com/backnotprop/plannotator
- Questions for Marten: planning with Claude+Codex, multi-agent workflow best practices

---

## Feature & Capability Index (extracted from ultimate-expliq.md + semi-ultimate-expliq-technical.md)

Source files will be deleted from repo. This section preserves all feature-level ideas for PRD 2.0.

### Automation-Level Features

**Business Dimension:**
- Impact Category (enum): Revenue, Customer-facing, Finance, Internal Ops, Low Impact
- Impact Criticality (separate from category): Low, Medium, High, Mission Critical
- Category = business domain. Criticality = severity of failure. They are independent dimensions.
- LLM suggests category + confidence score; human can override (impactCategoryFinal)
- Criticality suggested by rules + LLM; must be human-confirmed (criticalityFinal + confirmedAt + confirmedByUserId)
- Impact drivers (json array of driver keys, e.g. CAT_FINANCE_STRIPE_PRESENT, CAT_REVENUE_CRM_PRESENT)
- Criticality drivers (json array, e.g. CRIT_MULTI_SYSTEM, CRIT_HIGH_COMPLEXITY)

**Operational State (derivable from workflow JSON):**
- Trigger type, schedule frequency, webhook presence
- Systems involved (normalized from node types)
- Active / Inactive status
- Last updated, change timestamp
- Node count, edge count, branching factor, complexity score
- Error handling modes, has retries, max retries
- Data retention settings (saveDataSuccessExecution, saveDataErrorExecution)
- Cross-workflow coupling (callerPolicy, callerIds, errorWorkflowId)
- Credential usage count, environment (prod/test/dev)

**Derived Operational Flags (rule-based, from above):**
- recentlyChanged (updated within 7 days)
- inactiveButHighImpact (inactive + high criticality)
- multiSystem (2+ distinct systems)
- crossPlatform (systems span 2+ integration categories)
- highComplexity (nodeCount >= 25 OR branchingFactor >= 3 OR edgeCount >= 40)
- crossWorkflowDependency (callerPolicy != none OR callerIds present OR errorWorkflowId present)
- highDataRetentionRisk (saveDataSuccess/Error = "all")
- externallyCoupled (webhook present)

**Governance State:**
- Owner + Backup Owner + Owning Team
- Owner confirmed at / source (manual / platform-import / mapped)
- Last review date + review interval (30/60/90 days)
- Review status (computed: up-to-date / due / overdue / no-cycle)
- Review required (boolean, auto-set for High/Mission Critical)
- Lifecycle state: Active / Experimental / Legacy / Deprecated / Critical Infrastructure
- Lifecycle confirmed at / by user
- Documentation status (computed: missing / present / outdated)

**Risk Model (transparent, additive, driver-based):**
- Base Impact Weight from criticalityFinal: Low=0, Medium=20, High=40, Mission Critical=60
- Governance Gap drivers: GOV_NO_OWNER(+20), GOV_NO_BACKUP_OWNER(+10), GOV_NO_REVIEW_CYCLE(+15), GOV_REVIEW_OVERDUE(+20), GOV_REVIEW_DUE(+10), DOC_MISSING(+15), DOC_OUTDATED(+10)
- Operational Drift drivers: OPS_RECENTLY_CHANGED(+10), OPS_HIGH_COMPLEXITY(+10), OPS_EXTERNALLY_COUPLED(+10), OPS_HIGH_DATA_RETENTION(+15), STATE_INACTIVE_BUT_HIGH_IMPACT(+25)
- Dependency drivers: DEP_MULTI_SYSTEM(+10), DEP_CROSS_PLATFORM(+10), DEP_CROSS_WORKFLOW(+10), DEP_TOUCHES_CRITICAL_SYSTEM(+10)
- Risk Score = Base + Sum of triggered drivers
- Risk Levels: 0-24 Low, 25-49 Moderate, 50-79 High, 80+ Critical
- Risk explanation always shows active driver keys — never a black box

**Explainability Artifacts:**
- Business summary (one-liner + purpose + primary outcome)
- Logic outline (trigger, steps[], decision points[], side effects[], failure handling)
- Side effects list (writes/notifications across systems)
- Artifacts are version-aware (linked to automation version, marked stale when definition changes)

### System-Level Features

**Systems as First-Class Entities:**
- Each system (Stripe, Salesforce, Slack, etc.) is its own entity, not just a string
- System type (CRM, payments, messaging, internal, etc.)
- isExternal flag
- System criticality: suggested + human-confirmed final

**System Exposure Aggregation:**
- Per system: total automations, high impact count, mission critical count
- High risk automations, critical risk automations
- Automations without owner, automations overdue review
- Recently changed automations

**System Criticality Auto-Detection:**
- Critical when: highImpactAutomations >= 3, OR missionCritical >= 1, OR systemType in (crm, payments, finance)

**System Risk Score:**
- Formula: (highRisk x 10) + (criticalRisk x 20) + (withoutOwner x 10) + (overdueReview x 10)
- Levels: 0-19 Low, 20-49 Moderate, 50-79 High, 80+ Critical

**System Driver Keys:**
- SYS_HIGH_IMPACT_CONCENTRATION, SYS_MISSION_CRITICAL_PRESENT
- SYS_HIGH_RISK_AUTOMATIONS, SYS_OWNER_GAPS_PRESENT
- SYS_REVIEW_GAPS_PRESENT, SYS_RECENT_CHANGE_CLUSTER

### Workspace-Level Features

**Impact Overview:**
- Total automations, high impact, mission critical, revenue category count

**Risk Overview:**
- High risk count, critical risk count
- High impact without owner
- High impact overdue review
- Recently changed high impact
- Inactive but high impact count

**System & Owner Exposure:**
- Critical systems count, systems with high risk, systems with owner gaps
- Top-N systems by risk score

**Owner/Bus-Factor Analysis:**
- Per owner: automation count, high impact count, high risk count, overdue review count, missing backup count
- Driver keys: OWN_HIGH_IMPACT_CONCENTRATION, OWN_HIGH_RISK_CONCENTRATION, OWN_REVIEW_GAPS_PRESENT, OWN_NO_BACKUP_OWNER

**Drift & Hygiene Indicators (percentages):**
- % without owner, % overdue review, % no review cycle
- % docs missing, % docs outdated, % legacy
- % multi-system, % cross-platform, % high complexity, % cross-workflow dependency
- Upcoming review due count (forward-looking)

**Workspace Risk Score (optional composite):**
- Formula: (criticalRisk x 20) + (highRisk x 10) + (highImpactNoOwner x 10) + (highImpactOverdueReview x 10)
- Levels: 0-49 Low, 50-99 Moderate, 100-199 High, 200+ Critical

### Dependency & Cross-Cutting Features

**Dependency Exposure:**
- Multi-system automations flagged
- Cross-department flows
- Cross-platform flows
- "Multi-System Automation" label — more systems = higher structural fragility

**Connected Automations:**
- errorWorkflowId links (error handler for other workflows)
- callerIds links (workflows that call other workflows)
- Cross-workflow dependency graph

**Lifecycle Control:**
- Review overdue / due in X days / no review cycle defined
- Maintenance awareness indicators

### Collaboration Features (future)

- Workspace memberships with RBAC (admin/editor/viewer)
- Shared dashboards and saved views (filters, sort, groupBy)
- Activity log (human actions: owner assigned, criticality confirmed, review completed)
- Dashboard sharing (per user or team, view/edit permissions)

### Multi-Platform Features (future)

- Platform-agnostic automation model (n8n, Zapier, Make, Salesforce, OpenClaw)
- Per-platform connector with parser version
- Schema drift detection (fingerprint changes trigger alerts)
- Unified governance across platforms

### Control Experience Principles

The system should make immediately visible:
1. What is important (Impact — domain + criticality)
2. What is exposed (Risk — level + explicit drivers)
3. Where exposure concentrates (Systems — critical infra, risk concentration)
4. Who is responsible (Ownership — distribution, bus-factor)
5. Whether it is maintained (Lifecycle — review status, docs, lifecycle state)
6. Structural & Dependency Exposure (multi-system, cross-platform, complexity)

Control = deterministic + explainable + reproducible + non-opaque + action-oriented
