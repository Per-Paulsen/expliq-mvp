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

### Competitive Moat Insight (from Exercise 19 testing, 2026-03-25)

During exercise 19 testing, the n8n AI workflow naturally generated prescriptive advice ("set up error notifications") from the governance change payload alone. This means n8n could theoretically build a governance dashboard itself — they have native access to all workflow data plus execution logs and real-time status.

**Where n8n CAN'T compete with Expliq:**

1. **Multi-platform governance** — Expliq governs n8n + OpenClaw + Zapier + Make + Salesforce Flows. n8n only knows n8n. A company with automations across platforms needs Expliq. n8n will never govern a competitor's workflows.

2. **Independence** — Expliq is a neutral governance layer. n8n has a conflict of interest (wants you to build MORE workflows, not govern existing ones). Expliq's incentive aligns with the user.

3. **Business intelligence layer** — n8n knows the technical graph. Expliq adds: impact classification, ownership, criticality, review cycles, lifecycle state, business context. n8n doesn't model "who owns this" or "what breaks if this fails."

4. **Platform-agnostic prescriptive advisor** — recommendations across ALL platforms, exportable templates for any platform.

**Conclusion:** The real moat = multi-platform + business intelligence + platform-agnostic advisor. OpenClaw as second connector is not just a demo feature — it IS the moat. The moment Expliq governs both n8n AND OpenClaw in one dashboard, n8n can't replicate that.

### Design Decision: Business-first detail page (2026-03-26)

The default automation detail view should show ONLY business intelligence:
- Business context / impact reasoning (the wow)
- Risk level with transparent drivers
- Prescriptive recommendations (new)
- Owner, review status, lifecycle (governance)
- Connected automations (dependency awareness)

Technical details (nodes, core logic, trigger type, data types, side effects) are **collapsed by default** — expandable for users who want to verify the LLM's understanding.

**Why:** The trainer's wow was the business understanding. The technical details are the most text-heavy part and were called out as overwhelming. Users already have n8n for the technical view — Expliq's value is what the workflow *means*, not what it *does*.

**Implementation:** Collapsible section at the bottom of the detail page, hidden by default.

### Future Vision: Direct SaaS connectors (2026-03-26)

Expliq already sees connected systems (Stripe, HubSpot, Slack, etc.) via n8n's `systemsTouched`. System exposure is already computed. The next logical step: connect directly to those systems' APIs to enrich the picture.

Current: "You have 4 automations touching Stripe" (from n8n data)
Future: "...AND Stripe has 3 built-in billing rules, 2 webhook endpoints, dunning retry set to 3 attempts. Here's your complete Stripe automation picture."

This means Expliq governs ALL automation — not just dedicated platforms (n8n, Make) but also automations embedded inside SaaS tools themselves. Cross-system advisory becomes: "Your Stripe dunning retry is set to 3 attempts, but no HubSpot workflow notifies the account manager after 3 failures."

Post-presentation growth path. Not for the 2-week sprint.

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

---

## Figma Vision vs. TODO Comparison (2026-04-02)

Systematic cross-reference of every TODO item against the current Figma Make design (latest version). Items marked with how the Figma vision addresses them — or doesn't.

### Checkin-Session Feedback

| # | TODO Item | Figma Vision Status |
|---|-----------|-------------------|
| 17 | Auth forms more professional | Figma has a clean Login page with gradient background — addresses this |
| 18 | Loading states / waiting screens | Not explicitly in Figma — still needs implementation |
| 19 | Multiple instances / multi-workspace | Not in Figma — future feature |
| 20 | Settings page confusing | Figma has "Settings coming soon" placeholder — not addressed yet |
| 21 | Dashboard overwhelming and asymmetric | **Fully addressed** — new Dashboard is "Automation Command Center" with Portfolio Value bar, 3-column layout, Process Coverage table |
| 22 | DB security | **Done** — RLS migration applied 2026-03-25 |
| 23 | Query more n8n fields (creator) | Figma shows technical metadata (error rate, execution time, runs/week) — implies richer n8n data extraction needed |
| 24 | Internal node-logic / LLM transparency | Figma Governance view shows Core Logic with node-level detail + improvement markers — addresses this, but we may sacrifice node visualization for scope |
| 25 | Search function broken | Not addressed by Figma — still a code fix needed |
| 26 | Much better modern SaaS dashboard | **Fully addressed** — professional design with teal accent, process-centric layout, AI banners |
| 27 | Actionable advice + business perspective | **Core of the Figma vision** — "Your next move" AI banner, Top Opportunities, Roadmap page, Company Intelligence, Deploy to n8n |
| 28 | Additional scope files (lifecycle, risk, exposure) | **Superseded** — Figma vision goes far beyond those files. Feature Index in this brainstorming file captures everything |

### n8n Evening Session Insights

| # | TODO Item | Figma Vision Status |
|---|-----------|-------------------|
| 32 | Monitoring | Figma Dashboard shows "Recent Activity" with status dots (healthy/error) — partial monitoring via activity feed |
| 33 | Re-run LLM on sync | Not addressed by Figma — implementation detail |
| 34 | Status filter or sort | Figma Workflows page has extensive filtering (governance, impact, domain, platform, status) — **fully addressed** |
| 35 | Duplicate automations | Not addressed — still needs investigation |
| 36 | Risk classification nuance | **Fully addressed** — Figma uses Impact Tiers (critical-path / high-impact / supporting) + Domain Tags (revenue / compliance / efficiency / experience) instead of simple high/medium/low. Business/Governance toggle separates business risk from governance signals |
| 37 | Automation names from JSON | Not addressed — still needs investigation |
| 38 | Sync history | Not in Figma — still a feature gap |
| 39 | Business context was great, do more | **Core of vision** — Company Intelligence page, benchmark comparison, process-level business cases, ROI per automation |
| 40 | Too much text, need visualization | **Addressed** — Figma detail page has Business view (concise) vs. Governance view (technical). Business view is clean: description, business case, process position. Workflow Visualization in governance view is simplified node flow |
| 41 | Connected automations (error handler) | **Addressed** — Detail page has Connections section: upstream (feeds this) / downstream (this feeds) with dependency badges |
| 42 | Fairtix instance as test data | Not a Figma concern — operational decision |
| 43 | Fairtix .env credentials | Info item — not a Figma concern |
| 44 | Fairtix account | Info item |
| 45 | Detail page crowded, risk context too small | **Fully addressed** — Business view is clean with prominent business case card. Governance view separates technical details |

### Claude Workflow / Dev Process Items

These are development process questions, not product features. The Figma vision doesn't address them. **All remain open** — to be discussed separately.

### Exercises

| Exercise | Figma Vision Status |
|----------|-------------------|
| Exercise 19 (webhook) | **Done** — governance change notifier implemented on feature branch |
| Exercise 20 (agent design) | Design-only doc — not a Figma concern |
| Exercise 22 (chatbot) | Figma doesn't show a chatbot — aligns with our decision that prescriptive insights should be **visible by default**, not in a chatbot. Exercise 22 requirement can be met with a minimal chatbot that drills into the visible insights |

### Key Observations

**What the Figma vision adds that was NOT in the TODO:**

1. **Process-centric organization** — grouping automations by business process (Lead-to-Close, Billing & Dunning, etc.) was never discussed in the TODO. This is the biggest new idea.

2. **Company Intelligence page** — inferring company profile, industry benchmarks, maturity assessment from automation data. Completely new concept.

3. **Business/Governance toggle** — dual-lens approach throughout the app. Not in any TODO or brainstorming before Figma.

4. **"Your next move" AI banner** — single prioritized recommendation. New concept.

5. **Process Coverage with maturity levels** — Advanced / Developing / Early per process. New.

6. **ROI per automation** — time saved, revenue impact, ROI ratio, failure impact. The TODO hinted at "actionable advice" but never articulated ROI quantification.

7. **Technical Improvements with "Apply" button** — specific n8n improvements (add retry logic, parallelize branches) per workflow. New.

8. **Deploy to n8n modal** — exportable workflow concept. Discussed in brainstorming but Figma makes it concrete.

9. **Roadmap page with priority tiers** — Recommendations organized as Immediate / Strategic / Future. Business view shows "what to build next" with ROI per recommendation. Governance view shows "what to fix now" with technical improvements per existing workflow. Each recommendation has: impact tier (critical-path / high-impact / supporting), domain tag (revenue / compliance / efficiency / experience), effort level (quick-win / medium / complex), time savings, business case, implementation notes, suggested platform, and dependencies.

10. **AI-suggested new process lanes** — Expliq doesn't just improve existing processes. It suggests entirely NEW business processes (Security & Compliance, Marketing Ops) based on the detected system landscape. Example: "You have Okta and BambooHR but no access review automation — here's a SOC 2 compliance process with 2 workflows."

11. **Workflow specifications ready for deployment** — Each recommendation includes source/destination systems, data in/out, implementation notes, and suggested platform (n8n/Make/Zapier). These are not vague suggestions but deployable workflow specs.

**What's in the TODO but NOT in the Figma vision:**

1. Search fix (broken search) — code bug, not a design issue
2. Loading states — implementation detail
3. Sync history — feature gap
4. Multi-workspace — future
5. Settings page clarity — Figma has placeholder only
6. Environment separation — dev process
7. CI/CD — dev process
8. OpenClaw integration — future (still planned for week 2)
9. Dark mode — Figma has dark sidebar but light content area

**Bottom line:** The Figma vision addresses ~70% of the product TODO items and adds 11 major new concepts that weren't in the TODO at all. The remaining ~30% are code bugs (search), dev process items, and future features (multi-workspace, OpenClaw).

---

## Figma Vision — Deep Architecture Analysis (2026-04-02, decomposed version)

After thorough review of the fully decomposed Figma Make prototype, here is a complete analysis of the product vision, its data model, and how it maps to implementation.

### Product Identity

**Expliq is an Automation Opportunity Engine.** It connects to your automation platforms, infers who your company is, shows you what you have, what's broken, what's missing, and what to build next — with business justification, prioritized implementation plans, and deployable workflow specs.

### Five Screens, One Story

1. **Dashboard** = "What needs my attention right now?" — command center with AI "Your next move" banner, attention items, top opportunities, process coverage
2. **Workflows** = "What do I have and what's possible?" — all existing + recommended workflows organized by business process, with Business/Governance dual lens
3. **Roadmap** = "What should I build and fix, in what order?" — prioritized implementation plan with ROI justification, deploy-to-n8n capability
4. **Company** = "Why should I trust these recommendations?" — AI-inferred company profile, industry benchmarks with published sources, methodology transparency
5. **AutomationDetail** = "Tell me everything about this one workflow" — business case, process position, connections, technical profile, improvements

### The Business/Governance Toggle — Core UX Innovation

Every page that shows workflows has a dual-lens toggle:

**Business lens (Map icon):**
- Workflows grouped by business process (Lead-to-Close, Billing & Dunning, etc.)
- Each workflow shows: step name in process, business brief, impact tier, domain tag, systems flow, data flow, ROI
- "Show Recommendations" reveals gaps: recommended new workflows appear inline where the gap is
- "Sort by Revenue" reorders processes by business impact
- AI summary explains strategic priorities

**Governance lens (Shield icon):**
- Same workflows grouped by severity (Critical → Needs Attention → Healthy)
- Each workflow shows: governance state, signals, platform, error rate, owner, technical details
- "Show Improvements" reveals technical fixes inline per workflow
- Sort by severity is default
- AI summary focuses on risk reduction priorities

This toggle is NOT two separate views — it's two lenses on the SAME data. The URL preserves the toggle state (`?view=governance`), and switching views on the detail page carries over when navigating back.

### Data Architecture (What the LLM Needs to Generate)

The prototype has a clean data layer that reveals exactly what Expliq needs to produce:

**Per-workflow (ExistingWorkflow):**
- Identity: name, stepName, process assignment, platform
- Business: impact tier (critical-path/high-impact/supporting), domain tag (revenue/compliance/efficiency/experience), systems flow (source→destination), data flow (dataIn→dataOut), runs/week
- Business value: timeSavings ("~6 hrs/wk"), revenueImpact ("$18K/mo")
- Governance: state (healthy/needs-attention/critical), signals array, owner, errorRate, lastRun
- Brief: one-sentence business-context description

**Per-recommendation (RecommendedWorkflow):**
- Same as ExistingWorkflow plus: effort level, description, businessCase, framework reference, implementationNotes, suggestedPlatform, dependencies
- Each recommendation sits at a specific stepName in a specific process — it fills a gap

**Per-technical-improvement (TechnicalImprovement):**
- Linked to a specific existing workflow (workflowId)
- Title, brief, effort, benefit, category (reliability/performance/architecture/monitoring)
- Description, implementationNotes, targetPlatform

**Per-process-suggestion (ProcessSuggestion):**
- Entirely new business process the AI recommends starting
- basedOn: why the AI suggests this ("Detected Okta, BambooHR in your stack")
- Comes with child RecommendedWorkflows

**Company Intelligence:**
- Inferred profile: industry, size, stage, signal
- Systems grouped by function (Revenue, Support, Operations, Data & Intelligence)
- Benchmarks: metric comparison against published industry data (with sources)
- Insights: actionable items with impact, confidence, methodology explanation
- Process maturity: per-process automation maturity level

### The Roadmap — Expliq's USP

The Roadmap page is the product's main deliverable. Two views:

**Business view — "What to build next":**
- Priority tiers: Immediate (quick wins, highest ROI) → Strategic (complex but high value) → Future (aspirational)
- Each tier contains WorkflowRecs and ProcessSuggestions
- Each item: ROI, effort, business case, implementation notes, systems, dependencies
- Deploy button → modal with n8n JSON preview → one-click deploy

**Governance view — "What to fix now":**
- Severity tiers: Necessary (broken, leaking value) → Recommended (degraded, at risk) → Optimization (nice-to-have improvements)
- Each tier shows TechnicalImprovements linked to parent workflows
- Each improvement: specific implementation instructions, affected nodes, effort, benefit
- Apply button for individual fixes

### Deploy Modal — Closing the Loop

The DeployModal generates n8n-compatible workflow JSON from recommendations. It shows:
- Node count, estimated impact
- Full JSON preview with copy button
- "Deploy to n8n" button that simulates pushing to connected instance
- "Generated by Expliq AI" attribution

This is the "drop the mic" feature — Expliq doesn't just tell you what to build, it builds the scaffold for you.

### What an LLM Can Credibly Produce from n8n Data

Mapping the prototype's data requirements to what's actually derivable:

| Data Field | Source | LLM Role |
|-----------|--------|----------|
| Workflow name, nodes, connections | n8n API (existing) | Clean up / make business-readable |
| Business process assignment | LLM infers from systems + naming | **Core LLM task** — cluster workflows into business processes |
| Step name in process | LLM assigns position in process flow | **Core LLM task** |
| Impact tier | LLM + rules (revenue systems = critical-path) | **Core LLM task** |
| Domain tag | LLM infers (Stripe = revenue, Zendesk = experience) | **Core LLM task** |
| Systems flow (source → destination) | Parseable from n8n node types | Deterministic + LLM normalization |
| Data flow (dataIn → dataOut) | LLM infers from node parameters | **LLM task** |
| Business brief | LLM generates from workflow structure | **Core LLM task** (already proven in MVP) |
| Time savings | LLM estimates from complexity + frequency | **LLM task** — approximate |
| Revenue impact | LLM estimates from system type + domain | **LLM task** — approximate, must show reasoning |
| Governance state | Deterministic from signals | Existing risk engine |
| Error rate, runs/week | n8n execution API (if available) | Not LLM |
| Recommended workflows | LLM identifies gaps in process flow | **Core LLM task** — the wow feature |
| Technical improvements | LLM analyzes workflow structure for anti-patterns | **LLM task** |
| Process suggestions | LLM identifies missing business processes from system landscape | **Core LLM task** |
| Company profile | LLM infers from systems + workflow patterns | **Core LLM task** |
| Benchmark comparisons | LLM's general knowledge + reasoning | **LLM task** — must cite sources transparently |

**Key insight:** ~70% of the prototype's data is LLM-generated. The remaining 30% comes from the n8n API (workflow definitions, node types) and the existing risk engine (governance signals). This is not a data engineering challenge — it's a prompt engineering challenge.

### Implementation Priority for Presentation

Based on wow-per-effort and the principle "Roadmap IS the product":

**Must have (the demo story):**
1. Company Intelligence — who you are, why we recommend what we recommend
2. Workflows page with Business toggle — process-centric view with recommendations inline
3. Roadmap page with Business toggle — prioritized implementation plan
4. Dashboard with "Your next move" AI banner
5. Deploy modal (even if deploy is simulated)

**Nice to have:**
6. Governance toggle on Workflows + Roadmap
7. Technical improvements inline
8. AutomationDetail with Business/Governance views
9. Process suggestions modal

**Can sacrifice:**
10. Full filter/search system
11. Editable process names
12. Sort by revenue
13. Node-level workflow visualization on detail page

---

## Decisions & Next Steps (2026-04-02)

### Critical Evaluation of Figma Prototype

The Figma prototype is brainstorming, not final design. Before implementing, evaluate critically:

**ROI framing needs rework:**
- There is no monetary "investment" — reframe as "estimated business impact" not "ROI"
- Time savings ("~6 hrs/wk") = credible, LLM can estimate from complexity + frequency
- Revenue impact ("$18K/mo") = speculative, chain of assumptions — must show reasoning transparently
- Annual value ("$31K/yr") = industry benchmark applied to inferred profile — label as estimate, not fact
- Always show the reasoning chain: "Based on your 520 invoices/week and industry 3-5% failure rate..."

**Benchmark sources:**
- LLM knows general industry stats but shouldn't fabricate specific report titles
- Better: cite the insight + general source without inventing exact report names
- Company Intelligence page must explain methodology transparently

**Process clustering:**
- LLM can reliably group obvious cases (Stripe workflows → Billing)
- Edge cases will be fuzzy — users must be able to correct/rename processes
- Editable process names are in the Figma prototype (good)

**n8n API data availability:**
- Verify: does n8n API expose execution stats (runs/week, error rate)?
- If not, these fields become LLM estimates or "unknown"

### Design Evaluation Needed

The Figma prototype optimized for **completeness** (show everything), not **clarity** (show what matters). Most pages feel cluttered:

- Dashboard: 5+ sections stacked vertically
- Workflows: 8+ layers before seeing an actual workflow
- Company Intelligence: 6 sections on one page
- AutomationDetail governance: 7 sections all visible at once

**Decision:** Create `specs/design-evaluation.md` BEFORE implementing. For each screen: what's the ONE thing the user came here to see? Everything else is secondary or hidden.

**Approach:** Write the evaluation in markdown first (thinking exercise), then redesign in Figma Make with constraints, then review via MCP.

### How to Proceed — Agreed Roadmap

1. **Merge feature branches** — exercise 19 + exercise 21 to main
2. **Write `specs/design-evaluation.md`** — critical evaluation of each Figma screen, simplify
3. **Write `prd-2.0.md`** — extension PRD capturing the opportunity engine vision with honest data requirements
4. **Derive specs per screen** via `/spec` skill — Dashboard, Workflows, Roadmap, Company, AutomationDetail
5. **Implement incrementally** — one screen per feature branch, Figma MCP as design reference
6. **Screen order:** Dashboard → Company Intelligence → Workflows → Roadmap → AutomationDetail

### What Stays from Current MVP

- Auth system (Auth.js, sessions, middleware)
- n8n connector (API client, sync pipeline, encrypted credentials)
- LLM pipeline (OpenRouter, processAutomation) — will be EXTENDED with new prompts
- Prisma schema — will need NEW fields/models for process assignment, recommendations, company profile
- Risk engine — stays as governance foundation, deprioritized in UI
- Exercise 19 webhook notifier — stays
- Exercise 21 dashboard redesign — will be superseded by new dashboard but components (MetricCard, ExpliqCard, ProgressBar, ExpliqBadge) reusable

### What's New

- Process clustering LLM task (group workflows into business processes)
- Company Intelligence LLM task (infer profile from automation landscape)
- Recommendations LLM task (identify gaps, suggest new workflows + processes)
- Technical improvements LLM task (analyze workflows for anti-patterns)
- Business/Governance toggle UI pattern
- Deploy modal with n8n JSON generation
- New Prisma models: Process, Recommendation, CompanyProfile (TBD in specs)
