# PRD 2.0 — Brainstorming

> Append-only. All product decisions for the Expliq R2 pivot are discussed and captured here.
> When this brainstorming is complete, `prd-2.0.md` will be derived from it.

---

## Context

Expliq MVP (epics 01-08) is deployed on Vercel: 3 screens (Workspace Snapshot, Portfolio, Automation Detail), n8n connector, LLM pipeline (per-automation analysis), risk engine, auth.

The product is pivoting from **governance dashboard** to **automation opportunity engine**. The core value proposition: Expliq uses LLMs to understand your entire automation landscape and tells you what's important, what's broken, what's missing, and what to build next.

A Figma Make prototype exists (file key `3bG7mlpucVffGMdoAFPcgc`) with 5 screens. It was AI-generated and contains both excellent ideas and questionable design choices. This brainstorming critically evaluates each screen before it becomes a reference.

**Demo target:** Next week. Industry experts, trainers, and mentors. Using the fairtix n8n instance (known to the audience) as live demo data.

**Agreed scope cuts:** No governance toggle, no technical improvements inline, no editable process names, no full filter system, no sort by revenue, no workflow visualization. Business process suggestions stay. Connected automations stay. Deploy modal stays.

---

## Section 1: Product Identity & Positioning

### Claude's framing

Expliq is an **Automation Opportunity Engine**. It connects to automation platforms, uses LLMs to understand the full landscape, and delivers:

1. **Business insight** — what each automation does, why it matters, what breaks if it fails
2. **Gap detection** — what automations are missing from a business perspective
3. **Actionable roadmap** — prioritized recommendations with deployable workflow specs
4. **Company intelligence** — AI-inferred company profile that grounds all recommendations

The tagline: **"Expliq understands your automation landscape better than you do."**

### Questions for Per

1. Does this framing resonate? Or would you position it differently for the presentation?

thats excellent. but the vision is to think of it even as "expliq understands your business (business processes) better than you do"

2. Is "Automation Opportunity Engine" the right label, or do you prefer something else?

"business opportunity engine"

3. For the presentation, what's the one-sentence elevator pitch you'd use?

"expliq uses AI to discover your hidden business opportunities to save you time and deliver money." but lets maybe not discuss the presentation yet.   

---

## Section 2: Dashboard — Critical Evaluation

### What the Figma prototype shows

- **Portfolio Value bar** — total hrs/wk saved, $/mo impact, active count, recommended count, process count
- **"Your next move" AI banner** — single prioritized recommendation with reasoning, links to Workflows and Roadmap
- **Three-column body:** Requires Action (attention items) | Top Opportunities (recommended workflows) | Recent Activity (last 7 days)
- **Process Coverage table** — per-process: progress bar, hrs/wk, $/mo, maturity level (Advanced/Developing/Early)
- **Footer** — methodology disclaimer linking to Company Intelligence

### What works well

- **"Your next move" banner** — single prioritized recommendation, no user action needed. This is the trainer's wow moment replicated at workspace level.
- **Three-column layout** — clean information hierarchy: problems → opportunities → activity.
- **Process Coverage table** — immediately shows where automation is mature vs. gaps exist.

### What's questionable

- **Portfolio Value bar** — "~50 hrs/wk saved" and "$9K/mo impact" are LLM estimates that could feel hand-wavy. The brainstorming-r2 already flagged that revenue impact is speculative. Do we show this prominently, or tone it down?

one really important point on these llm estimates: they are fine as long as we make clear that they are estimates and reference the company intelligence page. so we should write "comparable companies, of similar size, development stage and market tend to "~50 hrs/wk saved" and "$9K/mo impact" with comparable workflow portfolios ..." and so on. that is totally fine for the wow moment. nobody expects exact numbers, but transparency, deep business insisghts, advisor/consulting insights and this is exactly what llms can deliver. do you understand this point? this is super important! 

- **Recent Activity column** — this requires execution data from n8n (runs, errors, deployments). Does the n8n API expose this? If not, this column is empty or fake.

we really have to check out the n8n api in detail and see what is actually possible to discover. as far as i know, we can query everything we need and even much more. it is really a hidden treasure. but we really have to evaluate and test. maybe this can even be its own epic? because we also need to think about which business and wf insights are actually realistically discoverable by llms given the api response jsons. do you understand? thats almost our most important task :)

- **Maturity levels** — "Advanced / Developing / Early" per process. What's the basis? Number of workflows? Coverage percentage? This needs to be grounded, not arbitrary.

i think the basis is coverage. 

i actually only want this here:
- **Portfolio Value bar** — total hrs/wk saved, $/mo impact, active count, recommended count, process count
- **"Your next move" AI banner** — single prioritized recommendation with reasoning, links to Workflows and Roadmap (for more recommendations), maybe we can give one highlighted main recommendation/opportunity and a two further ones ...
- **opportunity Value bar** — ...
- **Two-column/section body:** workflows | Top Opportunities (recommended workflows) 
- **Process Coverage table** — per-process: progress bar, hrs/wk, $/mo, maturity level (Advanced/Developing/Early)
- **Footer** — methodology disclaimer linking to Company Intelligence

### Questions for Per

4. The Portfolio Value bar shows monetary estimates ($9K/mo). Are you comfortable showing these prominently, knowing they're LLM estimates based on inferred company profile? Or should we frame them more cautiously (e.g., smaller, labeled "AI estimate")?

s.o.

5. The Recent Activity column: do we have execution data from the fairtix n8n instance (last run times, error events)? If not, should we replace this column with something else, or show only sync-based activity?

no recent activity in my opinion, totally useless for the demo

6. Is the three-column layout (Action | Opportunities | Activity) the right split? Or would you prefer a different arrangement?

s.o.
---

## Section 3: Company Intelligence — Critical Evaluation

### What the Figma prototype shows

- **AI Profile Banner** — "Based on your 18 workflows across 13 systems, you appear to be a mid-market B2B SaaS / ticketing company with 50-200 employees..."
- **Profile Chips** — Industry, Size, Stage, Signal (4 cards)
- **System Landscape** — 2x2 grid grouped by function (Revenue, Support, Operations, Data & Intelligence), each system with role and workflow count
- **Benchmark Comparison** — Strengths (3 cards, green) vs Gaps (3 cards, amber), each with "yours vs benchmark" and source citation
- **Automation Maturity** — per-process progress bars with percentage and label
- **Actionable Intelligence** — expandable insights with methodology, confidence level, impact estimate, linked recommendation

### What works well

- **AI Profile Banner** — the "it figured out who you are" moment. High wow, grounded in real data (system count, workflow count).
- **System Landscape** — clean visualization of what's connected. Directly derivable from n8n workflow data (systems already extracted by current LLM pipeline).
- **Actionable Intelligence with methodology** — each insight shows HOW the estimate was derived. This is the trust-building mechanism.

### What's questionable

- **Benchmark Comparison** — "Workato 2025 State of Automation", "Zapier Enterprise Report 2024", "MuleSoft Connectivity Report". These are specific report titles. The LLM may hallucinate these. Better approach: cite the general insight with confidence level, don't fabricate specific report names.

agree for demo

- **Profile Chips** are very specific ("50-200 employees", "Growth / Scale-up"). These are educated guesses from workflow patterns. Fine if labeled as "AI-inferred", misleading if presented as facts.

s.o. needs to be made transparent that these are benchmark values based on guessing company in relation to benchmark s.o. do you understand? writing estimate is not enough. explain where they come from and the reasoning behind it. thats more valuable than any estimated number. thats key. could be sth like this: "based on you workflows, your used systems, data (types), #runs, naming and so on ... you appear to be a small company (<50 employees), tech heavy, in the xyz industry, that does this and that ..." do you understand where i am going. this is the most essential point and it is easily doable for the best llms. they already did that for business impact in the mvp wihtout me even really asking for it or implementing it ... whats also important is an explanation of each wf its business importance, and its benchmark business case, time save, revenue generated, costs generated and so on even for existing wfs and then for the business processes behind and so on... llm can do so much transparent and valubale explanation here given individual wf jssons hold so much info, and then having an entire wf instance with different wf jsons info .... this is a rea treasure that has not yet beeen recovered yet at all ... even telling a company, "you appear to have you ticket sales automated, thats important to sell more tickets and a good practive" is a hughe wow for a company. sorry, the last example is a bit exaggerated, but you get my point!!! just showing that expliq understands whats done is hughe !!!!

- **Automation Maturity percentages** — "80%" for Lead-to-Close. Percentage of what? This needs a clear formula, not a vibes number.

you are right. 

### Questions for Per

7. Are you comfortable with the AI inferring company profile (industry, size, stage)? For the fairtix demo, this should work well since the audience knows the company. But should we add an "edit" option for when the AI gets it wrong?

s.o. yes, we can edit a dummy button for this. you see: its not about the llm getting everything right. its about the llms reasoning and insights. even if they are not right. many economists say that companies only employ consulting firms for industry espionage and wanting to know what the competitors do .... its the same here :) its not about exact numbers/estimates, but about the reasoning behind (evey wf and the company). of yourse we should give real estimates or ranges as numbers at some point, simply due to simplicity, visual appearance, wow effect and marketing ...

8. Benchmark citations: should we (a) let the LLM cite specific reports (risk of hallucination), (b) cite general industry knowledge without specific report names, or (c) skip benchmarks entirely and focus on the insights themselves?

general industry knowledge and standards? but maybe for the demo it might not be a poblem if the llm makes up reports ... its about the wow moment on the audience ...

9. Is Company Intelligence a standalone page, or could it be a section within the Dashboard? The Figma has it as a separate page — do you agree?

separate page. it will be massive! its our most important page actually/next to roadmap. but its what expliq reall is in its core. 

10. How much of this page do you actually want for the demo? The full page is 6 sections. We could start with just: AI Profile Banner + System Landscape + Actionable Intelligence (3 sections, highest wow-per-effort).

i actually want as much as possible but the most important insights and categories at the top. lets maybe discuss this in the second brainstorming round after we have incorporated my view on advice, consulting, estimates and expliqs core intelligence and value and so on ....

---

## Section 4: Workflows Page — Critical Evaluation

### What the Figma prototype shows (business view only, governance cut)

- **Header** with page title
- **AI Summary** — collapsible, narrative summary of the workflow landscape
- **Legend** — status dots (Healthy, Needs attention, Critical, Inactive)
- **Toolbar** — search + Filters button + Recommendations toggle + (Sort by Revenue — cut)
- **Filter Panel** — multi-category filter (governance, impact, domain, platform, status) — CUT to search-only
- **Portfolio Summary bar** — same as Dashboard portfolio value
- **Process Groups** — collapsible sections per business process:
  - Process header: name, summary, workflow count, recommended count, coverage %, hrs/wk, $/mo, system flow (source -> destination), data flow
  - Workflow cards inside: name, brief, step name, impact tier badge, domain badge, governance dot, platform badge, owner, system flow, runs/week, time savings, revenue impact
  - Recommended workflow cards (dashed border, teal accent): same fields + effort badge
  - "Suggest more workflows" button per process
- **Recommended Process Group** — AI-suggested entirely new business processes (e.g., "Security & Compliance") with child workflow cards
- **Process Suggestions Modal** — modal listing AI-suggested new processes with "Add" button

### What works well

- **Process grouping** — this IS the product innovation. Grouping automations by business process instead of flat list. Nobody else does this.
- **Collapsible process sections** — handles the information density well.
- **Recommended workflows inline** — gaps visible right where they belong in the process flow.
- **Process suggestions** — "You should have a Security & Compliance process" is the big "it thinks bigger than you" moment.

### What's questionable

- **Information overload per workflow card** — each card shows: name, brief, step name, 4 badges, owner, system flow, runs/week, time savings, revenue impact. That's ~12 fields per card. Too dense?
- **AI Summary** — a narrative paragraph that will vary in quality. If it's generic ("you have 18 workflows across 5 processes"), it adds nothing. If it's specific ("your Billing process is your biggest risk — 12.4% error rate on invoicing"), it's valuable. Quality depends entirely on prompt engineering.
- **Portfolio Summary bar** on BOTH Dashboard and Workflows — redundant? Or useful context?
- **Coverage percentage** per process — same concern as maturity: percentage of what? Total steps the LLM thinks should exist? That's circular reasoning (LLM defines the ideal, then measures against its own ideal).

### Questions for Per

11. The workflow card density: do you want all 12 fields visible, or should we simplify? My recommendation: name, brief, impact badge, domain badge, governance dot, system flow. Keep the rest for the detail page.

for the demo we can make shorter: name/business process step, business impact/importance and/or business case with time and money savings and revenue gains, active/non-active? 

12. Coverage percentage per process: the LLM decides how many workflows a process "should" have, then measures how many exist. Are you comfortable with this framing, or does it feel like the tool is grading itself?

no the tool recommends important wfs if there are important gaps and then measures the coverage. coverage is 100% is the llm finds no significant business gaps. 

13. Process suggestions (entirely new processes like "Security & Compliance"): this is high-wow but also high-risk for hallucination. Should we include this in the first release, or add it after the core process grouping works?

first phase. its actually a no-brainer. its just a special form of business prcess grouping ...

### Claude's recommendation on #13

Include process suggestions. It's the "drop the mic" moment on the Workflows page and directly supports the demo narrative. The risk of hallucination is manageable: the LLM bases suggestions on detected systems (you have Okta + BambooHR = suggest Security & Compliance). For the fairtix demo, the suggestions should be grounded because we know the system landscape.

agree. 

---

## Section 5: Roadmap Page — Critical Evaluation

### What the Figma prototype shows (business view only)

- **Header** with stats: workflow count, new processes count, quick wins count, estimated impact
- **AI Summary** — collapsible narrative of strategic priorities
- **Priority tiers** — Immediate (quick wins, highest ROI) → Strategic (complex but high value) → Future (aspirational)
- **Per tier:** Workflow recommendation cards + Process suggestion cards
  - Each rec card: name, brief, process, impact badge, domain badge, effort badge, time savings, system flow, "Deploy" button
  - Process suggestion cards: name, description, based-on reasoning, connected systems, child workflows
- **Deploy Modal** — n8n JSON preview with copy button, node count, impact estimate, "Deploy to n8n" button

### What works well

- **Priority tiers** — clean prioritization. Users immediately see what to do first.
- **Deploy Modal** — the closer. "We don't just tell you what to build, we build the scaffold." Even if the JSON is a template, the presentation impact is huge.
- **Effort badges** (quick-win / medium / complex) — helps users assess feasibility.

no effort badges please. effort is always zero with "deploy to n8n" button :) thats also why i dont understand roi ... there is no investment ...

### What's questionable

- **The Roadmap page might be redundant with Workflows page** — Workflows (with recommendations toggle on) already shows recommendations inline per process. Roadmap shows the same recommendations reorganized by priority. Is both pages needed?

yes. workflows shows estimated benchmark business case per existing wf. thats already hughe s.o. here recommendations show where exctly the opportunities lie ... 

roadmap shows the prioritized recomendations implementation plan, with much more detaill for recommendations, totalle separated from the existing wfs and processes. so the focus existing vs opportunity is different, but also the goal of each page. but if you have a clever way to put them together, i would like to hear it. 


- **Deploy to n8n** — the prototype currently generates generic JSON (webhook → HTTP request → filter → Slack + Sheets). For the demo, should we generate more specific JSON based on the actual recommendation? The LLM could generate context-aware n8n JSON. But the quality bar is high — broken JSON would be embarrassing.

of course it must be context aware. i let all may n8n wf be generated by ai. thats actually no thing anymore. please do not ask these ai capability questions. ai can do everything. point. 

- **Impact estimates on recommendations** — "$31K/yr" for Payment Failure Recovery. Same concern as Dashboard: these are LLM estimates. How prominently do we present them?

very prominently, but as benchmark range estimates with explanations and so on s.o. 

### Questions for Per

14. Do we need BOTH a Workflows page (with inline recommendations) AND a separate Roadmap page? Or could the Roadmap be a view/tab within Workflows? My recommendation: keep both — Workflows is "what do I have", Roadmap is "what should I build next". Different user intents.

s.o. 

15. Deploy modal: should the generated JSON be (a) generic template (current Figma behavior — fast to build, lower wow), (b) context-aware based on the recommendation description (medium effort, higher wow), or (c) fully specified based on actual system connections (hard, highest wow)?

c

16. For the demo, would you actually click "Deploy to n8n" live? If so, we need the n8n API integration to actually create workflows. If not, the modal can be display-only with a simulated deploy animation.

of course. i also click query n8n instance live. i literally did this for the mvp demo. deploy is even easier. 

---

## Section 6: Automation Detail — Critical Evaluation

### What the Figma prototype shows (business view only)

- **Back link** + Process context bar (process name, coverage %, hrs/wk, $/mo)
- **Header** — workflow name, status dot, platform badge, impact tier badge, system flow
- **Two-column layout:** main content (2/3) + sidebar (1/3)
- **Main content — Business view:**
  - Description section (narrative business context)
  - Business Case card (time savings, revenue impact, failure impact, ROI, dependents count)
  - Process Position (step name in process, upstream/downstream connections)
  - Connected Automations (upstream feeds this, downstream this feeds)
- **Sidebar:**
  - Quick Stats (runs/week, error rate, last run, avg execution)
  - Owner card
  - Governance signals
  - Connected systems

### What works well

- **Business Case card** — the "why this matters" card. Failure impact is especially powerful: "If this breaks, manual email triage, 3-hour response time increase."
- **Connected Automations** — upstream/downstream. This is the fairtix error handler payoff.
- **Process Position** — shows where this workflow sits in the larger process flow. Context that no other tool provides.

### What's questionable

- **ROI on the Business Case card** — again, LLM estimates. "ROI: 4.2x" is very specific for a guess.

s.o. 

- **Quick Stats (runs/week, error rate, avg execution)** — these require execution data from n8n. Same question as Dashboard Recent Activity.

we dont need them for the demo. this is more gov anyway. 

- **Two-column layout** — is the sidebar too thin? 1/3 of the page for quick stats + owner + governance is a lot of vertical space with little content.

we only need business and no gov. here. lets discuss later. 

### Questions for Per

17. Connected automations: the Figma shows explicit upstream/downstream links. In the current LLM pipeline, we don't detect cross-workflow dependencies. The n8n workflow JSON does contain `errorWorkflow` references and `callerIds`. Should we (a) parse these from the JSON deterministically, (b) have the LLM infer connections, or (c) both?

sorry, i dont understand. please specify further. but as we do not show gov in the demo, we might not need error rates at all. 

18. Business Case card: which fields are must-have? My recommendation: description + failure impact + time savings. Revenue impact and ROI can be added later if the LLM estimates are trustworthy enough.

also add revenue impact. what does roi mean here?

19. Do we need execution stats (runs/week, error rate) for the demo? If the n8n API doesn't expose them, we have two choices: omit them, or estimate from the workflow definition (schedule trigger = X runs/week).

we do not need them here. active/non-active is enough


generally for the existing wf card layout and detail view if we only do business toggle/view we can orientate ourselves nicely on the current layout and content of the recommended wfs and processes, because they are alreafy business case first. shall i also give you screenshot of the figma prototype?

---

## Section 7: Data Architecture — The LLM Challenge

### Current state

The LLM pipeline (`llm-pipeline.ts`) does ONE task: per-automation analysis. It takes a single workflow JSON and produces:
- name, description, trigger, triggerType, coreLogic, systemsTouched, dataTypes, businessContext, sideEffects, impactProposal, impactReasoning

### What's needed for the new screens

| LLM Task | Input | Output | Used By |
|----------|-------|--------|---------|
| **Per-automation enrichment** (extend existing) | Single workflow JSON | + stepName, process assignment, businessBrief, timeSavings estimate, revenueImpact estimate, failureImpact, dataIn, dataOut | All screens |
| **Process clustering** | All workflows in workspace | Process names, process summaries, workflow-to-process assignments, step ordering | Workflows, Dashboard |
| **Company profiling** | All systems + workflow patterns | Industry, size, stage, signal, system landscape grouping | Company Intelligence |
| **Gap detection** | All workflows grouped by process | Recommended workflows with business case, implementation notes, effort, suggested platform | Workflows, Roadmap |
| **Process suggestions** | All detected systems + existing processes | New process names, descriptions, basedOn reasoning, child workflow specs | Workflows, Roadmap |
| **Benchmark analysis** | Inferred company profile + process coverage | Strengths, gaps, methodology, confidence level | Company Intelligence |
| **"Your next move" synthesis** | Full workspace analysis results | Single prioritized recommendation with reasoning | Dashboard |
| **n8n JSON generation** | Recommendation spec + connected systems | n8n-compatible workflow JSON template | Deploy Modal |
| **Connected automations** | All workflow JSONs (errorWorkflow, callerIds) | Upstream/downstream links per automation | Detail page |

### Questions for Per

20. The per-automation enrichment adds ~6 new fields. Should we extend the existing LLM call (one bigger prompt per automation), or add a second pass after the initial analysis?

i dont know. whats your recommendation?

21. Process clustering is the hardest task — it needs to see ALL automations at once to group them. This likely requires a single large prompt with all workflow summaries. Are you comfortable with a potentially expensive LLM call (large context window)?

yes

22. Should all workspace-level analysis (process clustering, company profiling, gap detection, process suggestions, benchmarks, "your next move") happen in ONE big LLM call, or separate calls? One call = more coherent output. Separate calls = easier to debug and iterate.

i dont know. maybe iteratively? or one big call? what do you recommend?

23. When should workspace-level analysis run? Options: (a) on sync (automatic, but slow), (b) on-demand via a button ("Analyze my workspace"), (c) on first page load if stale. My recommendation: on-demand button, with results cached in DB.

on button. so in the settings page the user has to click connect to my n8n instnace anyway to query his instance. and then he can press sync to query again manually. i think for the demo that is enough. 

one general thing i would like to add: do not worry about llm costs or time or being overwhelmed. modern llm can do magic!!!!

---

## Section 8: Schema Changes

### Current Automation model fields that stay

id, workspaceId, externalId, platform, rawWorkflowJson, name, description, trigger, triggerType, coreLogic, systemsTouched, dataTypes, businessContext, sideEffects, impactProposal, impactReasoning, impactOverride, owner, reviewCadenceDays, lastReviewDate, automationLastUpdated, documentationLastUpdated, status, statusOverride, createdAt, updatedAt

### New fields on Automation (proposed)

- `stepName` — position label in process (e.g., "Lead Scored")
- `processId` — FK to BusinessProcess
- `businessBrief` — one-sentence business context (distinct from `businessContext` which is longer)
- `timeSavingsEstimate` — e.g., "~6 hrs/wk"
- `revenueImpactEstimate` — e.g., "$18K/mo"
- `failureImpact` — what breaks if this fails
- `dataIn` — input data description
- `dataOut` — output data description
- `runsPerWeek` — estimated from trigger/schedule
- `upstreamIds` — String[] (automation IDs that feed this)
- `downstreamIds` — String[] (automation IDs this feeds)

### New models (proposed)

**BusinessProcess** — groups automations into business processes
- id, workspaceId, name, summary, order, createdAt

**Recommendation** — suggested new workflows
- id, workspaceId, processId, stepName, name, brief, description, businessCase, implementationNotes, effort, impact, domain, suggestedPlatform, systemSource, systemDestination, dataIn, dataOut, timeSavingsEstimate, priorityTier, createdAt

**ProcessSuggestion** — entirely new recommended processes
- id, workspaceId, name, description, basedOn, businessCase, connectedSystems (String[]), createdAt

**CompanyProfile** — AI-inferred company identity
- id, workspaceId, industry, companySize, stage, signal, profileNarrative, createdAt, updatedAt

**WorkspaceAnalysis** — cached workspace-level analysis results
- id, workspaceId, nextMoveText, nextMoveReasoning, benchmarks (Json), insights (Json), maturityScores (Json), analyzedAt

### Questions for Per

24. Are you comfortable with this schema, or do you want to simplify? We could start with fewer models and store more as JSON fields on WorkspaceAnalysis.
25. Should Recommendation and ProcessSuggestion be separate models, or one model with a `type` discriminator?

i dont know. you decide/recommend or we discuss.

---

## Section 9: Demo Flow

### Proposed demo narrative

1. **Login** — clean auth screen
2. **Dashboard** — "Here's your automation command center. 18 workflows, 5 business processes. Your next move: fix the invoice pipeline, then build Payment Failure Recovery."
3. **Company Intelligence** — "Expliq figured out you're a mid-market B2B SaaS / ticketing company. Here's your system landscape. Here's how you compare to industry benchmarks."
4. **Workflows** — "Here are your workflows organized by business process. See the gaps? Toggle recommendations to see what's missing. And look — Expliq suggests you need a Security & Compliance process."
5. **Click a recommendation → Roadmap** — "Here's your prioritized implementation plan. Quick wins first. Click Deploy — here's the n8n JSON, ready to import."
6. **Click an existing workflow → Detail** — "Here's what this automation does in business terms. Here's what breaks if it fails. And here are the automations connected to it."

### Questions for Per

26. Does this demo flow work? Would you reorder anything?
27. Should we have a "sync" moment in the demo (show the n8n connection, trigger a sync, watch it analyze)?
28. How long is the presentation slot? This affects how many screens we can meaningfully show.

lets not discuss demo flow at this point please

---

## Section 10: Open Decisions

29. **Design system**: The Figma prototype uses a specific color palette (teal `#14b8a6` as accent, neutral grays, minimal color). The current MVP uses shadcn/ui defaults. Do we adopt the Figma palette, or keep the current look?

we adopt the figma look. it has a theme site and so on, as far as i know. but if you see quick ui wins, lets discuss them. the teal is a bit light and so is the text. 

30. **Dark mode**: The Figma has a dark sidebar with light content. Worth doing for presentation aesthetics?

yes, dark mode too

31. **Login page**: The Figma has a gradient login page. Current MVP has a simple centered form. Worth polishing?

yes

32. **Settings page**: The Figma shows "Settings coming soon." Our current settings page has the n8n connector config. Keep it as-is?

yes. but we need explanations of whats happening on every page the user has to click or wait. eg. sync to sync your n8n instance and wait for syncing and so on. also on login. ie 8 characters needed and wait to be signed in and so on ...

33. **Mobile responsiveness**: The Figma is desktop-only. Skip mobile for now?
skip
---

## Answers

> Per: please write your answers below, referencing question numbers. I'll respond with follow-ups appended after your answers.
my answers are above chaotically inserted within your text and questions. go figure out. 

---

## Round 2 — Claude's Synthesis & Follow-ups (2026-04-02)

### Decisions Locked In

Based on Per's answers, the following are decided:

**Product Identity:**
- Expliq is a **Business Opportunity Engine** (not "Automation" — the scope is business processes, not just workflows)
- Core value: "Expliq understands your business better than you do"
- The LLM's REASONING and INSIGHT is the product — not the numbers themselves. Transparency of how estimates are derived matters more than accuracy. This is consulting/advisory intelligence, not accounting.

**Dashboard:**
- Portfolio Value bar (with benchmark framing: "comparable companies...")
- "Your next move" AI banner — 1 main recommendation + 2 secondary
- Two-section body: Workflows summary | Top Opportunities
- Process Coverage table with maturity (based on coverage %)
- Methodology footer linking to Company Intelligence
- CUT: Recent Activity column

**Company Intelligence:**
- Separate page — one of the two most important pages
- AI Profile Banner with transparent reasoning ("based on your workflows, systems, data types, naming...")
- System Landscape grouped by function
- Benchmark comparison — general industry knowledge, not fabricated specific report names
- Actionable Intelligence with methodology explanations
- Dummy "edit" button for correcting AI inferences
- Automation Maturity per process
- As much content as possible, most important at top

**Workflows:**
- Process grouping with collapsible sections
- Simplified workflow cards: name/step, business brief, impact/importance, business case (time + money), active/inactive
- Recommendations inline (dashed cards within process groups)
- Process suggestions (new business processes) = first phase, same as process grouping
- Coverage = 100% when LLM finds no significant gaps
- CUT: AI Summary narrative (questionable quality), Portfolio Summary bar (redundant with Dashboard)

**Roadmap:**
- Separate page from Workflows — different focus (implementation plan vs. landscape view)
- Priority tiers (Immediate → Strategic → Future)
- Recommendation cards with business case, time/money estimates as benchmark ranges
- Deploy Modal with context-aware n8n JSON (not generic templates)
- LIVE deploy to n8n in demo — needs actual n8n API create workflow integration
- CUT: Effort badges, ROI framing (no investment = no ROI)

**Automation Detail:**
- Business view only
- Business Case card: description, failure impact, time savings, revenue impact
- Process Position + Connected Automations (upstream/downstream)
- Active/inactive status (no execution stats)
- Layout inspired by recommended workflow cards (business-case first)
- CUT: Quick Stats sidebar, governance signals, error rate

**Data Architecture:**
- Expensive LLM calls are fine — "modern LLM can do magic"
- Workspace analysis triggered on-demand via button in settings (connect → sync → analyze)
- Don't worry about LLM costs or context window size

**Design:**
- Adopt Figma palette but adjust: teal is too light, text is too light — darken both
- Dark mode yes
- Login page polish yes
- Settings page: keep current, add loading states and explanations
- Skip mobile

### Key Insight Per Emphasized (applies everywhere)

Per made this point repeatedly and it's central to the product:

> It's not about the LLM getting exact numbers. It's about the LLM's reasoning and insights. The transparency of WHERE estimates come from and WHY is more valuable than the estimate itself. "Based on your workflows, your used systems, data types, #runs, naming... you appear to be a small company in the XYZ industry that does this and that" — THAT is the wow. Even showing that Expliq UNDERSTANDS what's being done is huge.

This means every estimate in the UI needs:
1. The number/range itself (for visual impact and marketing)
2. The reasoning behind it (for trust and insight value)
3. A link to methodology (Company Intelligence page)

Framing: "Comparable companies of similar size, stage, and market tend to see X with Y" — not "you will save X."

### Follow-up Questions

**F1. n8n API deep dive — should this be its own epic?**

Per said: "we really have to evaluate and test [the n8n API]. maybe this can even be its own epic? because we also need to think about which business and wf insights are actually realistically discoverable by llms given the api response jsons."

I agree this is critical. The quality of everything downstream depends on what data we can actually extract. Proposal: make the first epic (Epic 10) an n8n API exploration + extended LLM pipeline. This epic would:
- Document all available n8n API endpoints and their response shapes
- Determine which fields are available (execution stats? creator? tags? credentials used?)
- Test the LLM with real fairtix workflow JSONs to see what business insights are actually extractable
- Extend the per-automation LLM prompt with the new fields (businessBrief, timeSavings, revenueImpact, failureImpact, etc.)
- Build the workspace-level LLM tasks (process clustering, company profiling, gap detection, recommendations)

Does this sound right? Or do you want to split the n8n API exploration from the LLM pipeline work?

**F2. Connected automations — clarification**

Per said he didn't understand Q17. Let me explain more clearly:

n8n workflow JSONs contain fields like:
- `settings.errorWorkflow` — the ID of another workflow that handles errors for this one
- `settings.callerIds` — IDs of workflows that are allowed to call this one

The fairtix "global error handler" workflow is connected to other workflows via `errorWorkflow`. Expliq already sees this data in `rawWorkflowJson` but doesn't extract it.

The question is: to show "Connected Automations" on the detail page (upstream/downstream), should we:
- **(a)** Parse `errorWorkflow` and `callerIds` directly from the JSON (deterministic, reliable, but limited to these two connection types)
- **(b)** Also have the LLM infer connections by analyzing workflow logic (e.g., "this workflow writes to the same Salesforce object that another workflow reads" = logical connection)
- **(c)** Both

My recommendation: start with (a) — it's deterministic and reliable. The fairtix error handler will show up correctly. Add (b) later if needed.

**F3. LLM call strategy — my recommendation**

Per asked for my recommendation on Q20 and Q22.

**Q20 (per-automation enrichment):** Extend the existing LLM call. One bigger prompt per automation is simpler than two passes, and the new fields (businessBrief, timeSavings, etc.) are closely related to what the LLM already produces. The prompt just gets richer.

**Q22 (workspace-level analysis):** I recommend a **two-call approach**:

**Call 1: "Understand" call** — takes ALL workflow summaries (not full JSONs — just the LLM-produced summaries from per-automation analysis) and produces:
- Process clustering (names, summaries, assignments)
- Company profile (industry, size, stage, reasoning)
- Connected automation links

**Call 2: "Advise" call** — takes the process clustering + company profile + all workflow summaries and produces:
- Gap detection (recommended workflows per process)
- Process suggestions (new business processes)
- Benchmark analysis
- "Your next move" synthesis
- Priority tier assignments

Why two calls: Call 1 establishes the shared understanding (processes, company). Call 2 uses that understanding to generate recommendations. This is more coherent than one giant call and more debuggable than 6 separate calls.

Does this approach make sense?

**F4. Schema — my recommendation**

Per deferred Q24/Q25 to me.

**Q24:** I recommend keeping the separate models (BusinessProcess, Recommendation, ProcessSuggestion, CompanyProfile, WorkspaceAnalysis). The alternative (dump everything into JSON fields) makes querying harder and loses Prisma's type safety. The models are simple and map cleanly to the UI.

**Q25:** Keep Recommendation and ProcessSuggestion as separate models. A ProcessSuggestion has child Recommendations (one-to-many). A type discriminator would make this relationship awkward.

One simplification: merge WorkspaceAnalysis fields into CompanyProfile (they're always generated together and scoped to one workspace). So: 4 new models instead of 5.

**F5. Figma screenshots**

Per offered to provide Figma screenshots for the detail page layout. That would be helpful — specifically for the recommended workflow card layout that should inspire the existing workflow cards. Can you share those?

**F6. Dark mode scope**

Per said yes to dark mode. To clarify: do you want full dark mode (toggle in sidebar, both modes available), or should the app simply BE dark by default (no toggle)?

For the demo, a single dark theme is faster to build and avoids the toggle complexity.

**F7. n8n API for deploy**

Per confirmed live deploy to n8n during the demo. This means we need the n8n API's workflow creation endpoint integrated. The current `n8n-client.ts` has `getWorkflows()` and `getWorkflow()` but no `createWorkflow()`. This is a small addition but needs to be in scope.

---

> Per: please respond to F1-F7 when ready. After that, I think we're close to deriving the PRD 2.0.

---

## Round 2.5 — Claude Challenges Per's Decisions (2026-04-02)

Per asked for more critical discussion. Fair. Here are the places where I think we're moving too fast, cutting too deep, or being overconfident.

### Challenge 1: "Business Opportunity Engine" may overpromise

You shifted from "Automation Opportunity Engine" to "Business Opportunity Engine." I understand the ambition — but the product connects to n8n and reads workflow JSONs. It doesn't connect to Salesforce directly, it doesn't read your P&L, it doesn't know your revenue numbers. Everything it knows about your business, it infers from automation definitions.

That's powerful — but it's not the same as "understanding your business." It understands your **automation landscape** and makes business inferences from it. If we call it a "Business Opportunity Engine" and someone asks "what's my churn rate?" — we can't answer that. We can say "you don't have a churn detection workflow, and companies like yours lose ~$45K/yr without one."

**My concern:** Setting expectations too high for the demo audience. If the LLM says "you appear to be a 50-person ticketing company" and the trainer says "we're actually 120 people and we do events, not just ticketing" — does the product look smart or dumb?

**Counter-argument to myself:** For the fairtix demo specifically, the audience KNOWS the company. The LLM's inference will either be impressively close (wow) or interestingly wrong (still interesting, shows the reasoning). And Per's point about consulting firms is valid — the reasoning is the value, not the precision.

**Question for Per:** Are you prepared for the LLM to get the company profile partially wrong in the demo? And is your response "look at the reasoning, that's the value" — or would that undermine credibility?

you are right. maybe company profile is wrong. maybe we should not talk about company size and industry and so on. but simply stick to what we know with certainty. which automations are used, what they do, and then why they are used, which systems are connected, which data flows, what these systems do, especially with this data and so on ... alone focusing on what is clearly possible to derive might be inside enough. based on this we can still give recommendations and suggestions. i think thats for sure. so we eliminate the risk of unnecessary halucination without losing any of the benefits. do you agree? but the more important it becomes to work out what is certainly inferable without halucination. and i think that is already really enough. what do you think? so expliq is more of an "automation or workflow/business process opportunity engine" but thats oke as long as it can give sufficient consulting advice. 

### Challenge 2: Company Intelligence as "most important page" is risky

You said Company Intelligence is "our most important page, next to roadmap." But this is also the page with the HIGHEST hallucination risk:

- Company profile could be wrong
- Benchmark comparisons could cite non-existent studies
- Industry estimates could be wildly off
- Automation maturity percentages have no grounded formula

Every other page (Dashboard, Workflows, Roadmap, Detail) is grounded in REAL data — actual n8n workflows that actually exist. Company Intelligence is almost entirely LLM inference and general knowledge applied to inferred context.

**My concern:** If we make this the centerpiece and the LLM produces a mediocre company profile for fairtix, the demo loses credibility for everything that follows. "If it got the company wrong, why would I trust its workflow recommendations?"

**Counter-argument:** If we nail the prompts against the fairtix data and the profile is impressively accurate, this IS the wow moment. The audience will think "it figured us out from just our n8n workflows?!"

**Recommendation:** Company Intelligence should be impressive but NOT make claims it can't back up. The page should lead with what it KNOWS (systems detected, workflow patterns) and be transparent about what it INFERS (industry, size, stage). The Figma prototype's "AI-inferred" badge is exactly right — but it needs to be more prominent than a tiny chip.

**Question for Per:** Should we test the LLM against the fairtix data BEFORE committing to Company Intelligence as a centerpiece? Maybe an early spike (epic 10) where we actually run the prompts and evaluate the output quality?

i think we now reduced our ambition with the "automation opportunity engine" so if we extend this to the company intelligence page we should be fine. and maybe we can simply call it automation/workflow intelligence page?

### Challenge 3: Cutting ALL governance from the demo throws away proven value

You cut governance toggle, execution stats, error rates, governance signals — essentially everything from the risk engine (epic 05). But the trainer's original wow moment WAS about governance: "High risk / High impact — this automation directly impacts customer support..."

The business pivot is correct — lead with business value. But completely hiding governance means:
- The risk engine (37 tests, E2E verified) does nothing visible
- The "needs attention" / "critical" signals that made the trainer react are gone
- Every workflow looks the same in the cards (no health indicator)

**My recommendation:** Keep a MINIMAL governance signal on workflow cards — just the colored dot (healthy/needs-attention/critical). One dot, no text, no explanation in the card. It's already in the Figma prototype (the legend shows status dots). This gives the audience a visual "something's wrong here" signal without turning the page into a governance dashboard. The detail page can explain why if they click through.

**Question for Per:** Would you accept a single governance dot per workflow card? It's zero extra UI complexity (already in the Figma design) and preserves the risk engine's value.

yes. you are right. thats also a valid point. we know for a fact that governance actually does work and does offer some value. so having an active/inactive dot that can also become yelllow for needs attention and red for critical might help our serious value propoisition a lot. we can also have an owner assigned to every wf. thats already some gov signs.

### Challenge 4: Coverage percentage is circular and you dismissed it too fast

You said "coverage is 100% if the LLM finds no significant business gaps." But think about what this means:

1. LLM analyzes your workflows
2. LLM decides "you should also have X, Y, Z"
3. Coverage = existing / (existing + LLM suggestions)

The LLM is both the judge and the standard-setter. A different LLM prompt would produce different suggestions and therefore different coverage numbers. A more aggressive prompt finds more gaps = lower coverage. A conservative prompt finds fewer = higher coverage.

This isn't inherently wrong — consulting firms do the same thing (they define the ideal state and measure against it). But the audience might notice: "Who decided we need 5 workflows in Billing? We only have 2 and they work fine."

**Recommendation:** Keep coverage BUT always show the denominator: "3 of 5 workflows (2 recommended by Expliq)". This makes the LLM's role transparent. The number still communicates "there's room to grow" without pretending it's an objective measurement.

**Question for Per:** Does "3 of 5 (2 recommended)" work better than a bare "60%"?

but wait. we always show the number of existing wfs and the number of recommended wfs with explanation and a coverage % and a coverage bar. the bar is for visibility. of course we can argue how much to recommend, thats clear, but thats not what its about actually. just let the llm recommend "obvious" gaps. it will recommend sth... dont be unnecessarily strict on points that are clearly not perfectly solvable anyway! 

### Challenge 5: "AI can do everything" — not in a live demo it can't

You said "please do not ask these AI capability questions. AI can do everything." I understand the confidence, but for a LIVE demo, these risks are real:

**Context-aware n8n JSON generation (option c):** The LLM needs to generate valid n8n JSON with correct node types, correct parameter schemas, correct connection formats. If the JSON is broken and you click "Deploy to n8n" live — the API returns an error in front of the audience. That's not a capability question, it's a reliability question.

**Live deploy:** What if the fairtix n8n instance is slow? What if the API key expired? What if the generated workflow has a node type that doesn't exist on that n8n version?

ah sorry, thats a missunderstanding. i am not saying i want to go live with the created wf json in the demo. i want to be able to import it into n8n or let it be deployed there automatically via post request. it doesnt matter wheter it works. it just matters whether sth that looks reasonable enough is automatically deployed to n8n. thats it. 

**LLM response time:** Workspace-level analysis (all workflows → process clustering → company profile → recommendations) could take 30-60 seconds. In a demo, 60 seconds of silence is death.

**I'm NOT saying we shouldn't do these things.** I'm saying we need fallback plans:

1. **Pre-generate the workspace analysis before the demo** (run sync + analyze the night before, show cached results)
2. **Pre-validate the deploy JSON** (test the generated JSON against the n8n API before the demo)
3. **Have a "just synced" state ready** so we don't wait for LLM processing live

of course i will do this. but this is not relevant right now. 

**Question for Per:** Are you planning to run the full sync + analysis LIVE in the demo, or arrive with pre-synced data and show the results? This changes the architecture (caching strategy, loading states).

i will show the empty workspace, sync live and then show the insight for the demo company fairtix that all bootcamp participants already know. and therefore we have to naile the intelligence and recommendations. but i already did that in one check in session. so dont be so worried. the llm already nailed business impact and criticality for every single fairtix automation!!!!! do you actually understand this?!?!?! i already have the proof that this is ridiculously obvious to do!

### Challenge 6: Workflow cards may be TOO simplified

You want: name/step, business brief, impact/importance, business case (time + money), active/inactive.

But without **system flow** (e.g., "Stripe → QuickBooks"), the card loses the tangible "what does this actually connect" context. System flow is:
- Derivable from existing data (already in `systemsTouched`)
- Very compact visually (two words + arrow)
- Immediately grounding ("oh, this is the Stripe-to-QuickBooks pipeline")

Without it, every card is just text. The system flow is the one visual element that anchors the LLM's business narrative to something concrete.

**Recommendation:** Add system flow back to the card. It's one line: `Stripe → QuickBooks`.

**Question for Per:** Would you accept adding system flow (source → destination) back to the workflow cards?

yes sure. also with input data/item and output data/item. no worries. 

### Challenge 7: Detail page needs more thought than "discuss later"

You said "lets discuss later" for the detail page layout. But the detail page is where:
- The trainer's ORIGINAL wow moment happened (impactReasoning text)
- Connected automations (the fairtix error handler) will be shown
- The business case card lives

If we don't decide the layout now, we can't spec it. And "orientate on recommended workflow cards" is vague — recommended cards in the Figma are compact summary cards, not detail pages. The detail page needs to be richer than a card.

**Minimum detail page for demo:**
1. Header (name, status, platform, system flow)
2. Business narrative (extended description — the text that made the trainer laugh)
3. Business Case card (failure impact, time savings, revenue impact with reasoning)
4. Process Position (which step in which process)
5. Connected Automations (upstream/downstream — the fairtix error handler)

yes of course. just look at the detail page of the recommended wfs in the figma prototype. thats more than enough i would say?

**Question for Per:** Can we lock this minimum set for the detail page? Or do you want to add/remove something?

yes

### Challenge 8: Settings page UX improvements compete for time

You want explanations and loading states on every page ("sync to sync your n8n instance", "8 characters needed for password", "wait to be signed in"). These are all good UX improvements. But each one is implementation work that competes with the 5 new screens.

**Recommendation:** Do the settings/auth polish as the LAST epic, not the first. If time runs out, the demo still works — you just don't dwell on the login screen. The audience cares about Dashboard → Company → Workflows → Roadmap → Deploy, not the login form.

**Question for Per:** Are you OK with settings/auth polish being the lowest priority epic?

yes

---

> Per: respond to challenges 1-8 in this file. Push back on my pushbacks if you disagree — that's the point of brainstorming.

---

## Round 3 — Final Synthesis (2026-04-02)

### What Changed After the Challenges

The challenge discussion sharpened the product significantly. Here are the shifts:

**1. Product positioning pulled back to solid ground.**

Per agreed: don't infer company profile (industry, size, stage) — that's hallucination territory. Instead, stick to what's **certainly derivable** from workflow JSONs:
- Which automations exist and what they do
- Which systems are connected
- What data flows between them
- Why these automations matter (business impact)
- What's missing (gaps in the automation landscape)

This is still enormously valuable. The shift is: we're an **Automation Opportunity Engine**, not a "Business" one. The business insight comes from understanding the automations deeply, not from guessing company demographics.

**2. "Company Intelligence" → "Automation Intelligence"**

The page refocuses:
- KEEP: System Landscape (what's connected — derived from real data)
- KEEP: Actionable Intelligence with methodology (grounded in workflow analysis)
- KEEP: Automation Maturity per process (based on coverage)
- RETHINK: AI Profile Banner — instead of "you appear to be a 50-person SaaS company", it becomes "your automation landscape shows X workflows connecting Y systems, with strong coverage in Z and gaps in W." Ground it in facts, not guesses.
- RETHINK: Benchmark Comparison — instead of "you vs industry benchmark", frame as "companies with similar automation patterns typically see..." General industry knowledge, not fabricated reports.
- CUT: Company size, industry, stage inference (unless the LLM can derive it with certainty from the data — which we'll test)
- KEEP: Dummy edit button for corrections

**3. Governance dots stay.**

Workflow cards show a colored status dot (healthy / needs-attention / critical) + owner. The risk engine (epic 05) remains valuable. This is zero extra UI work (already in Figma) and preserves proven value.

**4. Coverage stays as-is with transparency.**

Show: existing count + recommended count + coverage bar. The coverage is a visual communication tool, not a scientific metric. The LLM recommends "obvious" gaps; coverage measures against that. Don't overthink it.

**5. Deploy = POST to n8n, doesn't need to be production-ready.**

The goal is: generate something that looks reasonable, automatically deploy it to the connected n8n instance via API. It doesn't need to work as a production workflow. The wow is the automation of the full cycle: analyze → recommend → generate → deploy.

**6. Workflow cards: add system flow + data in/out back.**

Cards show: name/step, business brief, impact badge, governance dot, system flow (source → destination), data in/out, time savings, revenue impact, active/inactive, owner.

**7. Detail page: locked.**

Header (name, status, platform, system flow) → Business narrative → Business Case card (failure impact, time savings, revenue impact with reasoning) → Process Position → Connected Automations. Reference: recommended workflow detail view in Figma.

**8. Settings/auth polish = last epic.**

### Closing the Follow-up Questions

Per didn't explicitly answer F1-F7 from Round 2. Here's where they stand after the challenge discussion:

**F1 (n8n API exploration as its own epic):** Per's emphasis on "we really have to evaluate the n8n API" + "work out what is certainly inferable" reinforces this. My proposal: **Epic 10 = n8n API deep dive + LLM pipeline v2.** This epic explores the API, tests prompts against fairtix data, and builds all the new LLM tasks. It's the foundation everything else depends on. Per, confirm or object?

shall we really have this already as an epic or is this just preparation?

**F2 (Connected automations approach):** My recommendation stands: start with deterministic parsing of `errorWorkflow` and `callerIds` from the JSON. The LLM can add logical connections later. This gives us the fairtix error handler connection reliably. Per, confirm or object?

oke. im fine. but look: we might need sth like an infrastrucute process for "global" wfs like this? and how do we actually show wf connections?

**F3 (LLM call strategy):** Two-call approach — Call 1 "Understand" (process clustering, system landscape) → Call 2 "Advise" (recommendations, gap detection, benchmarks, "your next move"). Per, confirm or object?

confirm

**F4 (Schema):** 4 new Prisma models: BusinessProcess, Recommendation, ProcessSuggestion, CompanyProfile (includes workspace analysis fields). Per, confirm or object?

confirm

**F5 (Figma screenshots):** Per pointed to the recommended workflow detail view in Figma as the reference for both existing workflow cards and detail page layout. I have access via MCP — no screenshots needed.

**F6 (Dark mode):** Still open. Single dark theme (no toggle) or full dark/light toggle? My recommendation: single dark theme for demo speed. Per, confirm or object?

confirm

**F7 (n8n deploy API):** Clarified by Challenge 5. Deploy = POST generated JSON to n8n API. Doesn't need to work as production workflow. Just needs to show up in n8n. Small addition to `n8n-client.ts`.

### Proposed Epic Sequence

Based on everything decided:

| Epic | Name | What It Does | Depends On |
|------|------|-------------|------------|
| 10 | n8n API + LLM Pipeline V2 | Explore n8n API, extend per-automation LLM, build workspace-level LLM tasks (process clustering, system landscape, gap detection, recommendations, benchmarks, "your next move"), new Prisma models, deploy-to-n8n API | — |
| 11 | Design System + Layout | Adopt Figma palette (darkened teal, darker text), dark mode, sidebar nav update, shared components (StatusDot, SystemFlow, ExpliqBadge, ExpliqCard), login polish | — |
| 12 | Dashboard | Portfolio Value bar, "Your next move" banner, workflows/opportunities sections, process coverage table | 10, 11 |
| 13 | Automation Intelligence | System landscape, actionable intelligence, automation maturity, benchmark comparison, methodology transparency | 10, 11 |
| 14 | Workflows | Process grouping, workflow cards, inline recommendations, process suggestions, search | 10, 11 |
| 15 | Roadmap + Deploy | Priority tiers, recommendation cards, process suggestion cards, deploy modal with n8n JSON generation + live deploy | 10, 11 |
| 16 | Automation Detail | Business narrative, business case card, process position, connected automations, governance dot | 10, 11 |
| 17 | Settings + Auth Polish | Loading states, explanations, password hints | — |

Note: Epics 12-16 can potentially be parallelized after 10+11 are done (they're independent pages). Epic 17 is lowest priority.

### Are We Ready for PRD 2.0?

I believe so. The brainstorming has covered:
- Product identity and positioning (settled)
- All 5 screens evaluated and scoped (settled)
- Data architecture and LLM strategy (settled, pending F1-F4 confirmations)
- Design decisions (settled)
- Epic sequence (proposed)
- Scope cuts (locked)

**Remaining before PRD 2.0:**
1. Per confirms or objects on F1, F2, F3, F4, F6
2. Per confirms or adjusts the epic sequence

After that, I'll write `prd-2.0.md`.

---

> Per: confirm/object on F1-F4, F6, and the epic sequence. Then we write the PRD.

wait. a couple of last thoughts. if we have an automation that send deal state changes from salesforce to slack as team notifications we know roughly/likely what happened in salesforce and what is goint to happen in slack. this gives us system insight that goes beyond n8n and into salesforce and slack and we should write this. we could even go so far as to give recommendations of the form: "connect you salesforce (internal) automations for a better picture/overview of your automations (or even then maybe at some point) business landscape" as far as i know internal salesforce automtions can also be queried similar to n8n automations. so no problem for expliq. and we should not hold this back. this is not hallucination. then, llms can already give super valuable technical improvements for n8n wfs. i alredy did this myself several times. even in my bootcamp exercises. so this is a sure gov feature. but my point is, that despite always being able to get back more to the gov strength of expliq, sth like this should and must also be possible for business improvements. 
finally, how do we get the new figma prototype style into the existing mvp?

---

## Round 4 — Claude's Final Responses (2026-04-02)

### On F1: Epic vs. preparation

Good question. The n8n API exploration IS preparation — but the LLM pipeline v2 that follows it IS code (new Prisma models, new server actions, new prompt functions, extended `n8n-client.ts`). The exploration feeds directly into implementation.

My proposal: **keep it as one epic, but structured in two phases within the spec:**

- **Phase A (research):** Explore n8n API endpoints against fairtix, document what's available, test LLM prompts manually against real workflow JSONs, evaluate output quality. This produces a findings document, not code.
- **Phase B (build):** Based on findings, implement the new Prisma models, extended per-automation LLM prompt, workspace-level LLM calls (2-call strategy), deploy-to-n8n endpoint. This produces code.

The reason it's one epic: Phase B decisions depend entirely on Phase A findings. If we discover that n8n exposes execution stats, we add `runsPerWeek` and `errorRate` as real data instead of LLM estimates. If we discover it doesn't, we estimate or omit. The spec can't be finalized before exploration.

This does mean Epic 10 is bigger than typical epics. But splitting it would create an artificial boundary — "Epic 10a: explore" then "Epic 10b: build based on 10a" is just one epic with extra paperwork.

**Alternative:** If you prefer, the research phase could be a standalone brainstorming session (not a formal epic) — just you and me testing the n8n API in this conversation or a dedicated one, documenting findings in a markdown file. Then Epic 10 becomes pure implementation with the findings as input. This might actually be faster and more interactive. Your call.

i think we should do the alternative approach to better distinguish between interactive vibe coding api testing and formalized/planned n8n testing. 

### On F2: "Infrastructure" processes and showing connections

**Infrastructure processes:** Great point. A global error handler doesn't belong in "Lead-to-Close" or "Billing." It's cross-cutting. The LLM should be able to create an "Infrastructure" or "Platform Operations" process category for workflows that serve ALL other processes (error handlers, logging, monitoring, scheduling). This is just another process in the process clustering — the LLM assigns it naturally if we tell it that cross-cutting workflows exist.

nice. this might be more relevant than we think. especially if many wfs cannot clearly be categorized into a business process. 

**Showing connections in the UI:** Two levels:

1. **On the detail page** — a "Connected Automations" section showing:
   - "Error handler for: [Workflow A], [Workflow B], [Workflow C]" (from `errorWorkflow` parsing)
   - "Called by: [Workflow X]" (from `callerIds` parsing)
   - Each linked workflow is clickable → navigates to its detail page

2. **On workflow cards** — a small badge: `⟷ 5 connected` (just a count, clickable to see the detail page). Not essential for the demo but nice for the fairtix error handler to visually stand out.

The detail page is the important one. The card badge is optional.

i like both. actually especially also on the card for first impression and relevance of certain workflows within the wf collection. 

### On system insight beyond n8n — this is a key product insight

Per's point: if a workflow sends deal state changes from Salesforce → Slack, we KNOW things about both Salesforce and Slack usage. This is NOT hallucination — it's inference from real data.

What the LLM can certainly derive per-automation:
- **Source system behavior:** "Salesforce has deal stages configured, and stage changes trigger events" → the company has an active sales pipeline
- **Destination system behavior:** "Slack receives team notifications on deal changes" → sales team uses Slack for real-time updates
- **Data types flowing:** "Deal objects with stage, amount, owner fields" → revenue tracking is structured
- **Business implication:** "Real-time sales pipeline visibility matters enough to automate it"

And at the workspace level, aggregated:
- "Your sales pipeline (Salesforce) is well-connected: 6 automations touch it. Your support stack (Zendesk) has only 2. Gap: no automated escalation or SLA tracking."
- "Slack is your most connected system (8 workflows) — it's your operational nervous system."

This is the kind of insight that makes the Automation Intelligence page powerful WITHOUT any hallucination. Every claim traces back to a real workflow.

yes! you see. now you get the point. llms can really say much more with certainty than we think here. llms actually know for a fact what exactly must be happening in salesforce, technically and business, for a deal state change to happen (you see it can even go beyon the system and recognize that one out of knwon external "triggers" must have happened) and then to trigger the n8n workflow to slack. this is not hallucination, but it is such a strong overview, expressible via expliq in business terms, no human user or business user or power user could ever have. do you get the implication of this point? we cannot exaggerate this!

**And the connector recommendation idea:** "Connect your Salesforce Flows for deeper business process visibility" — this is a natural extension and also a product growth story. Not for the demo sprint, but worth noting in the PRD as future direction.

why not for the demo? if not for the demo, then when? it is an obvious treasure!

### On technical improvements

Per says he's done this with LLMs (generating technical improvement suggestions for n8n workflows). I originally cut this from scope. But if it's proven and valuable, we could add it back as an optional section on the detail page — collapsed by default, "Technical suggestions" accordion. It doesn't need its own page or card layout. Just a list of improvement bullet points per workflow.

**Question for Per:** Do you want technical improvements on the detail page (collapsed section), or is this out of scope for the demo sprint? If in, it's low extra effort — just an additional LLM output field per automation.

i just made this point to underline that if technical recommendations are possible as a fact, also business recommendations must be. and we know that if we get stuck with our automaion/business opportunity engine, than we might always be able to actually include valuable prescriptive technical recommendations even in a roadmap format!

### On getting the Figma style into the existing MVP

This is what Epic 11 (Design System + Layout) does. Concretely:

**Step 1: Read the Figma theme.** The prototype has `src/styles/theme.css` and `src/styles/tailwind.css`. Let me check what's in there.

**Step 2: Apply to the existing MVP.** The MVP uses Tailwind v4 with CSS-first config in `src/app/globals.css`. The migration is:
- Update CSS custom properties (colors, fonts, spacing) in `globals.css`
- Update the shadcn/ui theme variables to match the Figma palette (with our darkened teal + darker text adjustments)
- Add dark mode class/media query
- Update the sidebar component to match Figma layout (dark sidebar)
- Update the login page layout

**Step 3: Shared components.** The Figma prototype defines reusable components (ExpliqCard, ExpliqBadge, StatusDot, SystemFlow, MetricCard, ROIMetric, DependencyBadge). We either:
- **(a)** Create new components in `src/components/` adapted from the Figma source
- **(b)** Modify existing shadcn/ui components where they overlap

Option (a) is cleaner — new components alongside existing ones. The old page-specific components (from Portfolio, Snapshot) get deleted when those pages are replaced.

**The sequence matters:** Epic 11 must run BEFORE or IN PARALLEL with Epic 10. It produces the visual foundation that all new pages build on. Epic 10 produces the data foundation. Epics 12-16 need both.

Actually — Epic 10 (LLM pipeline) and Epic 11 (design system) have ZERO dependencies on each other. They could run simultaneously if we use team mode. That would save significant time.

### Updated Epic Sequence (with parallelization)

```
Phase 0 (optional): n8n API research spike (interactive session, not formal epic)

Phase 1 (parallel):
  Epic 10: LLM Pipeline V2 + Schema  (data foundation)
  Epic 11: Design System + Layout     (visual foundation)

Phase 2 (parallel after Phase 1):
  Epic 12: Dashboard
  Epic 13: Automation Intelligence
  Epic 14: Workflows
  Epic 15: Roadmap + Deploy
  Epic 16: Automation Detail

Phase 3 (if time):
  Epic 17: Settings + Auth Polish
```

but i dont think you should already write the specs here? just prepare the prd 2.0? or should we also include specs recommendations in the prd 2.0?

### Remaining Open

1. Per: confirm/object on Epic 10 structure (one epic with two phases, or research spike + implementation epic?)
2. Per: technical improvements on detail page — in or out for demo?
3. Per: anything else before PRD 2.0?

---

> Per: respond to these last items, then I write the PRD.

---

## Round 5 — Deepening the Core Insight (2026-04-03)

### The system insight depth — I was undervaluing this

Per's right and I need to fully internalize this point because it changes the product.

I was thinking of system landscape as: "Salesforce — 6 workflows connected." A flat list. Per is saying something much deeper:

If a workflow sends deal stage changes from Salesforce to Slack, the LLM can **deductively reason** about what must be true:

**What MUST be true in Salesforce:**
- Deal stages exist and are configured
- Stage transitions are tracked (events/triggers exist)
- Deals have associated fields (amount, owner, stage, close date — otherwise why notify?)
- The company has a structured sales pipeline, not ad-hoc deal tracking

**What MUST be true in Slack:**
- A channel exists for sales notifications
- The sales team monitors Slack (otherwise why automate notifications there?)
- Real-time visibility into pipeline movement matters to the team

**What this MEANS for the business:**
- Sales pipeline management is operationally important enough to automate
- There's a handoff pattern: Salesforce (record of truth) → Slack (team awareness)
- The company values speed of information flow in sales

None of this is hallucination. It's deduction from observable facts. And a human looking at the n8n workflow JSON would NEVER articulate this — they'd say "it sends Salesforce stuff to Slack."

**Now multiply this across 18 workflows in the fairtix instance.** The LLM reads all of them and produces:

> "Your automation landscape reveals a company with a structured sales pipeline (Salesforce), active customer support operation (Zendesk), and centralized team communication (Slack). Your sales process is the most automated area — deal stage changes, lead scoring, and revenue reconciliation are all automated, indicating that sales velocity and pipeline visibility are core operational priorities. Your support operation has real-time ticket routing and escalation but lacks proactive monitoring — no automation detects declining satisfaction trends before they become escalations. Your billing process (Stripe → QuickBooks) handles high volume (520 invoices/wk) but has no failure recovery automation, meaning failed payments silently leak revenue."

Every sentence traces back to real workflow data. Zero hallucination. And no human in that company has ever seen their operations described this way.

**This changes the Automation Intelligence page.** It's not a system list. It's a NARRATIVE ANALYSIS of the company's operational DNA, derived from automation definitions. The system landscape becomes:

Per-system, instead of "Salesforce — 6 workflows":

> **Salesforce** — CRM & Pipeline Management
> Your sales operation's record of truth. 6 automations connect here. Based on the data flowing through these workflows, Salesforce tracks deal stages, lead scores, and revenue figures. Stage transitions trigger real-time team notifications (→ Slack) and revenue reconciliation (→ QuickBooks). Your pipeline is actively managed — changes propagate automatically within minutes.
> 
> **Insight:** Your Salesforce integration is strong for pipeline execution but missing on the nurture side. No automation moves leads through early-stage engagement before they hit the pipeline.

THAT is the product. Not a dashboard. A business analyst that reads your automation infrastructure and tells you what it reveals about your operations.

yes! exactly! i think now you are getting my point! yes! and trust me: with actual n8n wf json and your reasoing extended to the connected systems and data types shown, you can even do much more! thats a fact! thats not hallucination! that is the product basis! yes!

### On the connector recommendation in the demo

Per asked: "Why not for the demo? It is an obvious treasure!"

I said "not for demo sprint" because I was thinking about BUILDING a Salesforce connector. But Per's point is simpler: the LLM just RECOMMENDS it. "Connect your Salesforce Flows for deeper visibility" is text on the Roadmap page. It's a recommendation, not a feature. Zero implementation — just prompt engineering.

The LLM's "Advise" call can include recommendations of type:
1. **"Build this workflow"** — e.g., "Payment Failure Recovery" (with n8n JSON, deployable)
2. **"Create this process"** — e.g., "Security & Compliance" (new process suggestion)
3. **"Connect this platform"** — e.g., "Connect Salesforce Flows for deeper business process visibility"

Type 3 is just text + reasoning. Same as type 1 and 2, just without a deploy button. It costs nothing to include and it sells the product vision: Expliq is a multi-platform governance layer, and it TELLS you which platforms to connect next.

**Decision: include "connect additional platform" recommendations in the Roadmap.** It's pure LLM output, no new code.

yes! now you fully get it!

### On technical improvements — understood

Per's point was not "add technical improvements to scope" but rather: "if LLMs can give technical recommendations (proven), they can give business recommendations (our core bet). And if the business recommendation path struggles, technical recommendations are a proven fallback."

This is a good strategic insight for the PRD — note it as a fallback direction, not a feature to build now.

yep

### On PRD 2.0 structure

Per asked: "should we also include specs recommendations in the prd 2.0?"

The PRD should include a **suggested epic sequence** as guidance for `/spec`, but NOT detailed specs. The `/spec` skill's job is to brainstorm and derive detailed specs from the PRD. If we put too much detail in the PRD, we're doing `/spec`'s job and the brainstorming phase becomes a rubber stamp.

The PRD should contain:
- Product vision and identity
- Screen descriptions (what each shows, what data it needs)
- LLM task descriptions (what the LLM produces, at what level)
- What's kept from the current MVP
- Scope cuts
- Suggested epic sequence (guidance, not prescription)
- Future direction (connector recommendations, technical improvements as fallback)
- Design reference (Figma file key + what to adopt vs. what to change)

yes. i just dont want to bias the prd

### Things I want to challenge or explore further before the PRD

**C9: How deep should the per-system narrative go?**

The system insight discussion opened a big scope question. The Figma prototype shows a simple system grid (name, role, workflow count). What Per is describing is a per-system NARRATIVE with deductive reasoning. This is much richer — and much more LLM output to generate and display.

Options:
- **(a)** Simple grid (name, role, count) — like the Figma prototype. Fast to build, less wow.
- **(b)** Simple grid + one-sentence LLM insight per system — moderate. "Salesforce: your pipeline record of truth, 6 automations connected. Insight: strong on execution, weak on nurture."
- **(c)** Full narrative per system with deductive reasoning — the vision Per described. High wow, more LLM output, needs a good layout to not be overwhelming.

My recommendation: **(b)** for the grid on the Automation Intelligence page, with **(c)** available as an expandable detail per system (click to expand). This keeps the page scannable but lets the depth shine when you drill in during the demo.

**Question for Per:** (a), (b), or (c)? Or something else?

i dont understand this correctly i think. i want c at least on the details page but actually also on the (company) automation intelligence page. but of course not of the wf or recommendation page. on the latter just on the expandable details page. but that was not your point here or not?

**C10: The "Your next move" banner — how specific?**

The Dashboard banner is the first thing the user sees. The Figma version is very specific:

> "Invoice processing pipeline is running at a 12.4% error rate — that's 2.5× above threshold. Fix this first. Then look at Payment Failure Recovery — it's a quick win worth ~$31K/yr..."

This references specific workflows by name, specific numbers, and chains two actions together. The LLM needs to:
1. Know ALL workspace analysis results
2. Rank by urgency and impact
3. Write a coherent narrative connecting multiple recommendations

This is the LAST thing the LLM generates (it depends on everything else). It's also the FIRST thing the user sees. If it's generic ("you have some issues to address"), the dashboard falls flat. If it's specific and insightful, it's the hook.

**Question for Per:** How important is the "Your next move" banner to you? Is it a must-have for the demo, or could the dashboard work without it (just showing the process coverage table + opportunities)?

I ask because this banner depends on the ENTIRE workspace analysis being complete and coherent. If the workspace analysis has quality issues, this banner amplifies them. If the analysis is great, this banner is the perfect summary.

it is super important. but it is marketing in the demo. it does not matter if its perfect. as long as it is really justifiable to some extend. do you get this point? the wow effect does not come from accuracy but from intend and vision and traceability, almost empathy. but you raised a valid point. how important are numbers here anyway if we do not do a company profile but just automation opportunity? what numbers can we realistically even mention? is it enough to save: saves on avery one persons manual work? or maybe even: this wf improves you lead routing efficiency? 

**C11: How many recommendations should the LLM generate?**

The Figma Roadmap has 9 workflow recommendations + 2 process suggestions + 4 child workflows = ~15 total items. For 18 existing workflows, that's almost 1:1.

For the fairtix instance (how many workflows?), the LLM needs to generate a reasonable number of recommendations. Too few = underwhelming. Too many = feels like spam. 

**Question for Per:** Do you have a sense of how many workflows the fairtix instance has? And do you expect roughly 5-10 recommendations, or more?

hahhah, honestly. just let the llm decide and rank them and we just simply cut off after number x. honestly! what more can we do now?

**C12: What's the backup if the LLM produces poor workspace-level analysis?**

Per said: "the llm already nailed business impact and criticality for every single fairtix automation." That's per-automation analysis — proven.

But workspace-level analysis (process clustering, gap detection, company-wide narrative) is a different beast. It requires the LLM to synthesize across all workflows simultaneously. What if:
- Process clustering is messy (workflows assigned to wrong processes)
- Gap detection recommends irrelevant workflows
- The narrative is generic

Per's answer will probably be "LLMs can do this, trust it." And I mostly agree. But the question is: do we have time to iterate on prompts if the first attempt is mediocre? The research spike (Phase 0) is meant to catch this early. But if the research spike reveals problems, we need time to fix the prompts before the demo.

**Question for Per:** If the workspace-level LLM output is mediocre on first try, how many days do we have to iterate on prompts before the demo?

hahaha, i like you. you get me now. trust me, as long as we get transparency, traceability and explanations right we are super super fine or even successful. imagine if our analysis of the fairtix demo is: "we get all of you workflows, clear ticket selling company, but none are active and have only run once - you are clearly a demo copany, but i treat you as such and resommend a resell wf with highest priority nevertheless" - than expliq has won! 

no, honestly, than we implement technical advice in the roadmap and switch the focus to governance because we know that works: highest priority recommendation: "your most critical wf is X, so please assign an owner immmediately and review once every week" - done!

---

> Per: respond to C9-C12 and anything else on your mind. Then we close this brainstorming and write the PRD.

---

## Round 6 — Closing Synthesis (2026-04-03)

### All decisions finalized

**C9 resolved:** Full system narrative (option c) on the Automation Intelligence page and the Automation Detail page. On Workflows and Roadmap pages, system info stays compact (just the `source → destination` flow on cards, full narrative accessible via the detail page).

**C10 resolved:** "Your next move" banner is a must-have. It doesn't need precise numbers — it needs to show UNDERSTANDING. The wow comes from intent, vision, traceability. Even qualitative statements work: "Your lead routing workflow saves your team significant manual work" is fine. Numbers are a bonus, not a requirement. The banner should reference specific workflow names and chain recommendations.

**C11 resolved:** Let the LLM decide. Rank recommendations, display top N (we'll pick a reasonable cutoff like 10-15 during implementation). Don't overthink.

**C12 resolved:** Two fallback layers:
1. If the LLM recognizes the fairtix instance as a demo/test environment — that's ITSELF a win. Expliq showing self-awareness = trust.
2. If business recommendations are weak — fall back to governance-based recommendations in the Roadmap ("assign an owner to your most critical workflow", "set up review cycles"). This is proven value from the MVP.

The product is resilient: great LLM output = business opportunity engine. Mediocre LLM output = still shows understanding + governance fallback. Both work for the demo.

### What Per taught me in this brainstorming

Three insights that fundamentally shaped the PRD:

1. **The value is in reasoning, not numbers.** Every estimate needs transparent methodology. "This workflow saves ~6 hrs/wk" is marketing. "Based on the trigger frequency visible in your workflow definition and the manual steps this replaces, comparable organizations report saving ~6 hrs/wk on similar processes" is consulting. Expliq is a consultant, not a calculator.

2. **LLMs can deductively reason about connected systems.** If a workflow moves data from Salesforce to Slack, the LLM knows what MUST be true in both systems. This is not hallucination — it's deduction. This makes the Automation Intelligence page a narrative analysis of operational DNA, not a system grid.

3. **The product works at multiple quality levels.** Great LLM = prescriptive business advisor. Good LLM = insightful automation analyst. Mediocre LLM = governance recommender. All three are valuable. The architecture should surface whatever quality the LLM achieves, not hide behind a minimum bar.

### Final product definition for the PRD

**Expliq is an Automation Opportunity Engine.** It connects to automation platforms (starting with n8n), uses LLMs to deeply understand every workflow and the full automation landscape, and delivers:

1. **Deep understanding** — per-workflow business narrative, per-system deductive reasoning, cross-workflow dependency mapping
2. **Gap detection** — missing workflows within existing processes, missing processes based on detected systems
3. **Actionable roadmap** — prioritized recommendations with business case, deployable n8n JSON, platform connection suggestions
4. **Automation intelligence** — workspace-level narrative analysis with transparent methodology and benchmark-grounded estimates

**Five screens:**
- Dashboard (command center + "your next move")
- Automation Intelligence (system narratives, actionable insights, maturity)
- Workflows (process grouping, inline recommendations, process suggestions)
- Roadmap (priority tiers, deploy modal, platform connection recommendations)
- Automation Detail (business narrative, business case, process position, connections)

**Agreed scope cuts:** Governance toggle, technical improvements, editable process names, full filter system, sort by revenue, workflow visualization, company profile inference (industry/size/stage), mobile.

**Agreed inclusions beyond Figma:** Governance dots on cards, connection badges, per-system narrative depth, "connect additional platform" recommendations, infrastructure process category.

### Brainstorming complete

Per, if you're satisfied, I'll write `prd-2.0.md` now. It will be derived from everything in this file.

Confirm and I'll start.

---

## Round 7a — Consulting Recommendation Frameworks Research (2026-04-03)

Per asked: are there best practices from consulting on how to structure and present recommendations?

### Research Findings (distilled)

**The universal pattern from McKinsey/BCG/Bain:**
- Lead with the answer (recommendation), then evidence, then data — never the reverse
- Group into 3-5 named buckets — never a flat list
- Every recommendation gets a rough business value estimate (even a range)
- Handle uncertainty through language: **"recommend"** (high confidence) → **"consider"** (medium) → **"explore"** (low)
- List key assumptions explicitly — users trust recommendations more when they see what must be true
- **"No-regret moves"** concept: actions beneficial regardless of scenario. These always go first.

**The ICE framework (Impact × Confidence × Ease):**
- Dead simple scoring: each dimension 1-10
- Confidence calibration: 10 = proven from data, 8 = strong benchmark, 5 = hypothesis, 2 = gut feel
- Best for fast prioritization of 10-50 items — exactly our use case

**Celonis (process mining — closest to Expliq):**
- Finds process gaps and quantifies "value at stake"
- Every recommendation links to the specific data that triggered it
- Uses "automation rate" as metric — "this process is 40% automated, could be 80%"

**Evidence spectrum for AI-powered products:**

| Evidence Source | Label | Confidence |
|----------------|-------|-----------|
| Computed from user's own data | "Data-driven" | Highest |
| Matched against industry benchmark | "Benchmark-based" | High |
| Pattern matched from similar cases | "Pattern-based" | Medium |
| Inferred by AI analysis | "AI-suggested" | Medium-Low |
| General best practice | "Best practice" | Low |

**Key insight from Gartner:** Never use more than 2 dimensions for the primary sort. Users handle a 2x2 intuitively. A third dimension (bubble size or color) is max before cognitive overload.

### What This Means for Expliq's Roadmap Page

The research says: **Impact first, confidence as a visual modifier.**

1. Users care about "what matters most" (impact) not "what you're most sure about" (confidence)
2. Confidence is a trust signal, not a priority signal — it tells users HOW MUCH to trust the recommendation, not WHETHER to act
3. The consulting standard: group by impact tier, show confidence per recommendation

**Proposed structure for Expliq's Roadmap:**

Three named tiers:

**"Act Now"** — High impact, high confidence. No-regret moves.
- Fix lottery-win error rate (31% → <5%). Evidence: Data-driven (real execution stats).
- Add lottery-loss notification. Evidence: Data-driven (support categories prove gap).
- Add purchase window reminder. Evidence: Data-driven (24h window in email, no reminder exists).

**"Investigate"** — High impact, but Expliq can't fully verify.
- Purchase confirmation. Evidence: AI-suggested ("not seen in n8n, may be handled by platform").
- Event announcement. Evidence: AI-suggested ("no evidence of proactive notifications").
- Payment failure handler. Evidence: AI-suggested ("if not handled by payment provider...").

**"Explore"** — Valuable but lower urgency or requires platform expansion.
- Connect ticketing platform for full lifecycle visibility.
- Add Slack as second notification channel.
- Resale/transfer automation (if not handled by platform).

**Each recommendation card shows:**
1. Title + one-line business impact
2. Evidence label: "Data-driven" / "Benchmark-based" / "AI-suggested"
3. Confidence indicator (visual: solid/dashed/outline)
4. Affected scope ("3 automations" / "your lottery lifecycle")
5. Expandable: full reasoning, linked evidence, key assumptions
6. Deploy button (for n8n-deployable recommendations)

**How this connects to Per's insight:** Impact sorts the list. Confidence is shown per card but doesn't change the order. The tier names communicate both: "Act Now" = high impact + high confidence. "Investigate" = high impact + needs verification. "Explore" = interesting + uncertain or requires expansion.

---

> Per: does this framework work? If so, we carry it into the PRD.

---

## Round 7 — Evaluating the Fairtix Analysis Against Our Decisions (2026-04-03)

We ran the LLM analysis on real fairtix data (`n8n-api-examples/fairtix/reference/ANALYSIS.md`). Here's how it measures up against what we agreed in this brainstorming.

### What the analysis NAILS (aligned with our decisions)

**1. Deductive reasoning about connected systems — EXACTLY what Per wanted.**

From the Gmail node's HTML email template, the LLM deduced:
- FairTix operates a lottery-based ticket allocation ("Fair Queue")
- They price in EUR with zero hidden fees
- They enforce identity verification
- They cap resale at face value + 20%

None of this is hallucination — it's all literally in the node `parameters`. This is the "Expliq understands your business" proof point.

**2. Process clustering — works naturally.**

4 business processes identified: Customer Onboarding, Ticket Lottery Notification, AI-Powered Support, Operational Monitoring. Clean, intuitive grouping. The "Infrastructure" process category we discussed (for the error handler) maps to "Operational Monitoring."

**3. Connected automations — deterministic and correct.**

`errorWorkflow` links correctly identified: LotteryWin → Generic Error Workflow. The analysis even detected that the "improved" version (02b) DOESN'T link to the error workflow — which is itself a governance finding.

**4. Execution data used as FACTS.**

"31% error rate", "40 executions", "rapid-fire clusters every ~1 minute" — all from real API data, not estimates. Mixed beautifully with reasoning: "the clusters suggest a polling trigger failing on every cycle."

**5. "Your next move" — specific, actionable, reasoning-first.**

"Activate and harden the LotteryWin workflow. Revenue is at stake — 31% error rate, not active despite having a 'Published' version. Then add lottery-loss notifications." This is exactly the chained, specific recommendation we wanted.

**6. Gap detection — 13 specific recommendations.**

"No lottery-loss notification" is genuinely insightful — in a lottery system, losers outnumber winners. "No purchase window expiration" — the 24-hour CTA has no automated follow-up. These are real business gaps.

### What the analysis DEVIATES from or MISSES

**1. Company profile inference — we said cut this, but the analysis does it anyway.**

The analysis says: "FairTix is an early-stage European ticketing startup in prototype-to-production transition."

We agreed in Round 3: "CUT company size, industry, stage inference (unless the LLM can derive it with certainty from the data)."

Honest evaluation: "European" (from EUR pricing) and "ticketing" (from workflow content about tickets, events, lottery) ARE certainly derivable. But "early-stage" and "prototype-to-production transition" are JUDGMENTS about business maturity, not facts from the data. The workflows could be a demo instance for a mature company. We should keep the factual parts ("ticketing company, European market") and drop the speculative parts ("early-stage"), or at minimum label them clearly as inference.

**Question for Per:** The analysis infers "ticketing company" and "European" — both traceable to real data. Keep these? And should we label "early-stage" as an inference rather than a fact?

i actually think the analysis is fine. even if it was a demo instance for a mature company, "judgements" such as "early-stage" and "prototype-to-production transition" would not be totally wrong and quite nice and funny. 

**2. No time savings / revenue impact estimates.**

The brainstorming decided: every workflow should show business case with time savings and revenue impact as benchmark ranges with reasoning. The analysis doesn't estimate these. It says "business importance" and "what breaks if it fails" but never "this saves ~X min/run" or "comparable companies see ~$Y from similar automation."

This is a significant gap. The Dashboard's Portfolio Value bar needs aggregate time/money numbers. The Roadmap's recommendation cards need impact estimates. The Detail page Business Case card needs time savings + revenue impact.

For fairtix specifically, with `timeSavedPerExecution: 1 min` on two workflows and execution counts from the API, we could compute: "LotteryWin: 1 min saved × 36 runs = 36 min saved." But the LLM should also estimate for workflows WITHOUT `timeSavedPerExecution` set.

**3. Recommendations lean governance, not business opportunity.**

The brainstorming's core thesis: "Prescriptive BUSINESS optimization > prescriptive risk reduction."

But the analysis recommendations are mostly governance:
- "Add error handling on AI workflows" — technical governance
- "Consolidate duplicate workflows" — governance hygiene
- "Add a second notification channel" — operational governance

The business-opportunity recommendations exist but are buried:
- "No lottery-loss notification" — business opportunity
- "No payment/purchase confirmation" — business opportunity  
- "No event notification / on-sale alerts" — business opportunity

These should be LEADING. "You're missing a lottery-loss notification — in a lottery system, losers outnumber winners. Not notifying them drives support volume and erodes trust. Build this." THEN the governance stuff follows.

**4. No "connect additional platform" recommendation.**

We explicitly agreed: include recommendations like "Connect your ticketing platform for deeper visibility." The analysis notes "no connection to the actual FairTix product/platform" but doesn't frame it as an actionable recommendation on the Roadmap. It should say: "Connect your ticketing platform (the FairTix product itself) — Expliq can analyze your entire automation landscape when it sees both the n8n orchestration layer AND the internal platform automations."

**5. Systems landscape is a table, not a narrative.**

We decided (C9, Per's answer): full per-system narrative (option c) on the Automation Intelligence page.

The analysis has a table:
| System | Role | Integration Method | Credentials |
| Gmail | Email sending | OAuth2 | ... |

But Per wanted:
> **Gmail** — Your notification backbone.
> 8 workflows connect here. Gmail handles three distinct functions: winner lottery notifications, AI-generated support replies, and operational error alerts. All three use the same OAuth2 credential (DL-School-Automations), creating a single point of failure for all outbound communication.
> **Insight:** No alternative notification channel exists. If this Gmail account is suspended or the OAuth token expires, ALL automated communication — customer-facing and operational — goes silent simultaneously.

The analysis has this depth in the per-workflow sections but not aggregated at the system level.

**6. Analysis structure doesn't map to the 5 screens.**

The analysis is a flat report. But Expliq has 5 screens with specific data needs. To validate the product, the analysis should show what would appear WHERE:

- **Dashboard**: "Your next move" text, portfolio value, attention items, top opportunities, process coverage
- **Automation Intelligence**: system narratives, actionable insights, maturity per process
- **Workflows**: process groups with cards, inline recommendations
- **Roadmap**: priority-tiered recommendations with business case
- **Detail**: per-workflow business narrative, business case card, process position, connections

### Summary: The Analysis Proves the Product, But Needs Reframing

The raw intelligence is there. The LLM produced genuinely insightful analysis from real workflow data. But the FRAMING needs adjustment to match our product decisions:

| What the analysis does | What the product needs | Gap |
|----------------------|----------------------|-----|
| Governance-first risk assessment | Business-opportunity-first with governance as supporting | Reorder recommendations, lead with business value |
| Flat report format | Mapped to 5 specific screens | Restructure output for screen-specific data |
| System table | Per-system narrative with deductive reasoning | Aggregate system insights from per-workflow analysis |
| No time/money estimates | Benchmark-range estimates with transparent reasoning | Add time savings + revenue impact per workflow and aggregate |
| Company profile inference | Stick to certainly derivable facts | Label speculative inferences explicitly |
| No platform connection recommendations | "Connect your ticketing platform" on Roadmap | Add as a recommendation type |

**The good news:** These are all PROMPT ENGINEERING adjustments, not architecture changes. The underlying data extraction and analysis capability is proven. We just need to shape the output to match our product screens and business-first framing.

**This directly informs Epic 10 (LLM Pipeline V2):** The prompts need to be designed screen-by-screen, with explicit output schemas matching what each screen needs to display.

---

> Per: respond to this evaluation. Then I think we're truly ready for the PRD.

---

## Round 8 — Eliminating the Business/Governance Distinction (2026-04-03)

### Decision: There is no "governance view." There is only insight with business impact.

The fairtix analysis proved that the business/governance distinction is artificial:

| What the analysis found | "Governance" label | Actual meaning |
|------------------------|-------------------|----------------|
| 31% error rate | Technical risk | Every failed notification is a lost ticket sale |
| No error handling on AI pipeline | Governance gap | Customers get silence during API outage |
| No owner assigned | Governance hygiene | Nobody accountable when this breaks |
| Lottery-loss notification missing | Business gap | Users lose trust in the fairness promise |
| `retryOnFail: false` on Gmail node | Technical debt | Revenue-critical email has no retry = preventable failures |

**Every finding is just an insight with evidence and business impact.** The word "governance" adds nothing.

### What this eliminates

- The governance toggle (already cut — now confirmed unnecessary, even as a future feature)
- The business/governance framing tension throughout the product
- Duplicate UI components for two views
- The cognitive load of "which view am I in?"

### What replaces it

**One unified view per screen.** Each insight/recommendation shows:
1. **What** — the finding or recommendation
2. **Impact** — why it matters to the business
3. **Evidence** — the data (may be technical: error rates, missing config. Or business: missing workflow, support category proving a gap)
4. **Confidence** — how sure Expliq is
5. **Action** — what to do (fix, build, connect, investigate)

Technical details (nodes, connections, retry config, errorWorkflow links) live on the detail page — not behind a toggle, just lower on the page. Summary at top, evidence below.

The governance dots on workflow cards survive — they're just another visual signal (healthy/attention/critical), not a "governance feature."

### Impact on the 5 screens

| Screen | Before (with governance toggle) | After (unified) |
|--------|--------------------------------|-----------------|
| Dashboard | Would have needed two "Your next move" variants | One banner, one view |
| Automation Intelligence | Would have needed two system landscape views | One narrative with insights |
| Workflows | Would have needed business cards + governance cards | One card type showing impact + evidence |
| Roadmap | Would have needed business tiers + governance tiers | One recommendation list sorted by impact |
| Detail | Would have needed business view + governance view | One page: business narrative top, technical evidence below |

This is a significant scope reduction. The Figma prototype's most complex feature (the dual-lens toggle on every page) is gone — not deferred, but recognized as unnecessary.

---

> Per: this is captured. Go ahead with your questions.