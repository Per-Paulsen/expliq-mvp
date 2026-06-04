# Expliq — Offering Exploration: what can Expliq really be?

> A systematic WORKING doc to think through Expliq's offering, separate from the chronological log in `expliq-core-mcp-vision-brainstorming.md` (Parts 6-14). This one is a scaffold/matrix we fill in and iterate, NOT append-only. Honest cells, mark unknowns plainly.
>
> Per's four questions: (1) what use cases exist, (2) which can n8n do better itself, (3) what is actually needed/wanted, (4) who can Expliq orient by, or is it its own category. Plus a "directions to consider" plan.

## 0. The one-line anchor (what survived the whole arc)

"The layer that tells you, in business terms, what each of your automations does, how critical it is, how healthy it is, and who owns it, across your whole estate." Everything below tests variations and extensions of this.

Settled so far (Parts 6-14): comprehension is real help (not commodity); impact-PREDICTION is a mirage; governance-as-enterprise-headline is a vitamin; security is NOT Expliq's lane (Zenity owns it); the only real gate is DEMAND (felt pain proven, willingness-to-pay untested); the strongest moat is cross-platform.

## 1. Use-case inventory (the menu)

Ratings are first-draft hypotheses to challenge. n8n-own = will n8n likely build it natively (HIGH = bad for us). Demand = felt-pain + pay evidence. Feasible = can we do it reliably today.

| # | Use case | One-liner | n8n-own risk | Demand evidence | Feasible | Verdict |
|---|----------|-----------|--------------|-----------------|----------|---------|
| U1 | **Comprehension** | "what does each WF do, in business terms" | LOW (had Overview forever, never added) | FELT (community post) | HIGH | core |
| U2 | **Criticality** | "how business-critical is this WF" | LOW | felt-ish | MED (needs business context) | core |
| U3 | **Ownership** | "who owns / is accountable" | MED (could add a field) | MED | HIGH | supporting |
| U4 | **Dependency / estate map (static)** | "what connects to what" | MED (roadmap hints) | MED | HIGH (static) | supporting |
| U5 | **Reliability / silent-failure in business terms** | "this broke and here's the business impact" | MED-HIGH (n8n Insights) | HIGH (acute, felt) | HIGH | demand-backed painkiller |
| U6 | **Change-confidence (impact PREDICTION)** | "what breaks if I change this" | n/a | HIGH-if-worked | LOW (mirage, Part 12) | demote to static VIEW |
| U7 | **Semantic estate search** | "which automations touch customer PII?" | LOW | ? | HIGH | differentiator |
| U8 | **Dedup / consolidation** | "these 3 do the same thing" | LOW | ? | MED | differentiator |
| U9 | **Intent-drift ("does vs should")** | "this no longer matches its purpose" | LOW | HIGH-if-worked | LOW-MED (frontier) | ambitious bet |
| U10 | **Auto-docs / runbooks** | "generate the docs n8n lacks" | LOW | MED | HIGH | quick win |
| U11 | **Cost governance** | "this WF's spend jumped 40x" | MED | MED | MED | secondary |
| U12 | **Security posture (ASPM)** | "exposed webhooks, over-permissioned creds" | n/a | HIGH-niche | MED | NOT our lane (Zenity) |
| U13 | **AI-agent governance** | "what tools/autonomy per agent-workflow" | MED | HIGH-but-crowded | MED | avoid as primary |
| MCP | **Estate-data MCP door** | expose the above to agents | n/a | ? | HIGH | interface, not a use case |

## 2. The "can n8n do it better itself?" filter

The structural rule that emerged: **n8n will own anything SINGLE-PLATFORM + TECHNICAL** (execution status, lineage, killswitch, rollback, basic owner field, an "explain this" button). **n8n will NOT own anything CROSS-PLATFORM or BUSINESS-MEANING** (that is not their lens; they sell the builder, not a meta-layer over many tools).

- Safe ground for Expliq: business-meaning (U1, U2), cross-platform anything, semantic/dedup (U7, U8), the synthesis across workflows.
- Contested (n8n is moving / could move): reliability/observability (U5), dependency graph (U4), single-workflow explain.
- Evidence n8n is slow here: the Overview screenshot, unchanged for years, still no business layer. The gap persists in practice, not just in theory.

**Sharpening , MONITORING vs ANALYSIS (the cleanest form of the rule).** MONITORING (watching runtime signals: is it up, did it error, count dropped) is n8n's turf, they own the data + runtime; do not compete, read/integrate it. ANALYSIS / INTELLIGENCE (non-obvious business or structural insight: "you have duplicate workflows here AND in Salesforce", "this behaviour change implies an upstream business problem") is Expliq's turf, it needs the estate-comprehension model + cross-platform view n8n lacks. Even within ONE signal the line holds: the DETECTION ("count dropped 50%") is n8n's; the INTERPRETATION ("given what this WF does and its downstream, this is a business problem, not a metric blip") is Expliq's. So the runtime/dynamic angle is reframed from "monitoring" (D3 as I first wrote it, weak) to "behavioural ANALYSIS".

**The trade-off to respect (do not flee monitoring straight into a low-demand trap).** Monitoring-type pains are MORE demanded (acute) but LESS defensible (n8n). Analysis-type insights (dedup, cross-platform overlap) are MORE defensible but lower-frequency demand (periodic cleanup, not a daily fire). "n8n can't do it" is necessary but NOT sufficient (the bear-case lesson: defensible != wanted). The sweet spot is analysis that is ALSO acutely felt, which is why comprehension (U1, "what does this do") keeps winning: it is the rare both.

## 3. The demand filter (the real gate)

Honest status: only TWO use cases have documented felt-pain evidence.
- U1 comprehension ("I lost track") , community post. FELT.
- U5 reliability/silent-failure , practitioner posts. FELT, acute.
Everything else is inferred and unvalidated.

Painkiller <-> vitamin spectrum (place each): U5 and "I lost track" (U1) lean painkiller; U3/U4/U10/U11 lean vitamin; U7/U8/U9 unknown.

The whole exploration is gated on demand INTENSITY (does the pain convert to adoption/payment), which only real n8n-operator conversations answer, not more desk research. This is the next real step, not more analysis.

## 4. Analogues , who can Expliq orient by?

The richest question. Candidate role models, with what transfers:

1. **Code-comprehension / repo-walkthrough** (Sourcegraph, the newer AI "explain + visualize this repo" tools / Claude Code plugins, GitDiagram). Core job: ingest opaque code -> navigable map + plain-language explanation + diagram + onboarding tour. **Transfer: a no/low-code automation estate IS a codebase** (opaque workflow JSON = opaque code). Expliq = "the repo-walkthrough for your automation estate." STRONGEST resonance with U1 and Per's instinct. Verbs: explain, visualize, navigate, onboard. Implies Expliq is a comprehension/navigation layer, not a dashboard.

2. **SaaS management / shadow-IT discovery** (Zylo, Torii). Core job: discover ALL apps (incl. shadow) -> inventory + map usage/cost/ownership -> govern sprawl. **Transfer: discover/inventory all automations -> map what/own/cost/criticality -> flag orphans.** BUT difference: SaaS-mgmt is about THIRD-PARTY apps (procurement/cost/shadow-IT lens); Expliq is about automations YOU BUILT (operational/comprehension lens). Expliq borrows the SHAPE (inventory + map + govern sprawl), not the content. Verbs: discover, inventory, govern.

3. **Data catalog / lineage** (Atlan). Inventory + lineage + ownership + business glossary for data assets. Transfer: the same for automations. (Already the Core-MCP analogue.)

4. **Process intelligence** (Celonis). Understand business processes end-to-end. Transfer: workflows implement processes; understand them. Higher altitude, more enterprise, more of a stretch.

5. **APM / observability** (Datadog). For the reliability angle (U5) only.

6. **NOT security** (Zenity owns low-code/no-code security posture). Per agrees Expliq is not security.

**Synthesis:** Expliq sits at the intersection of **code-comprehension (explain/visualize opaque logic)** and **SaaS-management (inventory/govern sprawl)**, applied to the **automation layer**. Closest single sentence: "Sourcegraph / repo-walkthrough, but for your no/low-code automation estate."

## 5. Is Expliq its own category?

Working hypothesis: yes, a nascent one. Candidate name: **"Automation Estate Intelligence"** (or "the automation comprehension layer"). Definition: connect to your automation platforms -> continuously understand, in business terms, what every automation does, how they connect, how critical and healthy they are, who owns them -> across platforms.

- Borrows: inventory/govern (SaaS-mgmt), explain/visualize (code-comprehension), business-meaning (process intelligence).
- Is NOT: security (Zenity), the platform itself (n8n), an opportunity-engine (rejected overshoot).
- Risk of "own category": no existing budget line, hard to sell into. Mitigant: lead with the felt pain-phrase ("I have lost track of what my automations do") not the category label.

## 6. Directions to consider (the plan)

Distinct strategic directions, each a hypothesis to evaluate (NOT yet chosen). Not mutually exclusive.

- **D1 , "The automation walkthrough"** (comprehension-led, U1/U2/U4/U7). Analogue: repo-walkthrough. Highest feasibility + matches Per's instinct + the felt pain. Likely the wedge. Open: demand intensity.
- **D2 , "Automation sprawl management"** (inventory/govern-led, U1/U3/U4/U8). Analogue: SaaS-mgmt. Open: is the govern part a vitamin?
- **D3 , "Automation reliability with business meaning"** (U5). Analogue: APM. Demand-backed but platform-threatened (n8n Insights).
- **D4 , "Cross-platform estate intelligence"** (the moat-led extension of D1/D2 to Make/Zapier/Salesforce). Strongest moat (no single vendor builds it). Bigger build, likely later.

Provisional shape: **D1 is the wedge, D4 is the moat, D3 is the adjacent painkiller, D2 is the framing/positioning.** These are NOT four options to pick between, but four FUNCTIONS in one strategy:

- **Wedge** = the narrow, sharp ENTRY point (easiest to build, most clearly felt, lowest risk; how you land the first user). -> D1 comprehension: LLM-easy, felt pain, no feasibility risk.
- **Moat** = long-term DEFENSIBILITY, hard for n8n/competitors to copy; builds over time, not the launch. -> D4 cross-platform: n8n structurally only sees n8n.
- **Adjacent painkiller** = a neighbouring acute pain solved with the SAME foundation, with its own demand. -> D3 reliability: a DIFFERENT pain from comprehension ("it broke and I did not notice" vs "I do not understand what it does"), running on the same estate model. Concretely, D3 = silent-failure / health visibility translated into BUSINESS terms: not "node X errored" (n8n already shows that) but "your invoice-sync silently stopped producing output 3 days ago; business-critical; ~X invoices affected; likely the expired Stripe credential". Generic monitors (Cronitor, Datadog, n8n Insights) stop at execution status; the business-meaning + cross-workflow interpretation, enabled by the D1 estate model, IS the differentiation (and the necessity, since reliability is the most platform-threatened framing).
- **Framing** = how you POSITION the whole thing, the category story that makes the features legible; not a feature. -> D2 sprawl-management: "tame your automation sprawl."

Composed in one sentence: *Expliq tames your automation sprawl (framing) by showing you, in business terms, what every automation does (wedge), catching the ones that silently break (adjacent painkiller), across all your platforms (moat).* D1 = where you start, D2 = how you name it, D3 = how you broaden, D4 = how you defend. Provisional, gated on demand; the role assignments are hypotheses, not decided.

## 7. How we decide / next steps

1. Fill and challenge this matrix (this doc, iteratively).
2. Decisive gate = DEMAND: talk to real n8n power-users (the community-post archetype). Cheap test before building anything.
3. Then pick a direction (D1-D4) as the v1.
- Meta-question still governing everything: portfolio-vs-venture (Parts 11-13). It sets how hard the demand/moat gates bite.

## Open threads (add as they come up)

- Which analogue should the PRODUCT SHAPE copy most closely (repo-walkthrough vs SaaS-mgmt)? They imply different UIs and different first features.
- Does "does vs should" (U9) become the real differentiator, or stay a frontier bet?
- If cross-platform (D4) is the moat, does that mean n8n-first is just the wedge and the real product is multi-platform from the architecture up?
- Refinements under evaluation (2026-05-31, see chat -> next capture): Expliq-nodes across ALL platforms (distribution, not moat); a global runtime hook like the error-workflow pattern (telemetry plumbing for the behavioural layer); Expliq-as-MCP = brain (analysis) with n8n as hands (action).

## 8. Distribution & form-factor: node vs integration, and the hat

**Two different things, often conflated:**
- n8n NODE = a runtime step INSIDE a workflow, operates on the data flowing through one execution.
- n8n INTEGRATION / ecosystem app = an external app connecting via API, listed as a verified partner (basically what Expliq already is).

**The literal runtime-node form factor is mostly wrong for the core value:**
- Form-factor mismatch: Expliq's value is meta/estate-level (what does this WF do, how do my 50 relate, duplicates); a node sees only one execution's runtime data, not the estate's structure/meaning. (Ingestion does not need a node; the API already exposes workflows + executions.)
- It conflicts with the cross-platform moat: an n8n node lives in n8n and sees only n8n, throwing away the one thing n8n cannot build.
- Exception where a node IS clever: an intent-capture node (drop it in, describe what the WF SHOULD do; Expliq checks behaviour vs intent = drift, U9).

**The integration / ecosystem-native positioning is the real value of the idea:**
- Upside: distribution (found where users are), friendly-exit/acquisition path, and , strongest , the IDEAL portfolio artifact for the n8n AI Product Builder application.
- Honest limits: "we don't compete with n8n" is half-true (a value-add n8n could build competes with their roadmap regardless of form); it is NOT a moat (a popular add-on is a cleaner absorption/acquisition target); platform dependence (API/policy/roadmap).
- Tension: the more n8n-native, the less cross-platform, i.e. the weaker the moat.

**Clean middle path:** n8n-first AND ecosystem-native at launch (distribution + low friction + portfolio value), built as an API integration (not a runtime node), with cross-platform as the later expansion. Get the ecosystem upside without burning the moat.

**The hat (decide it):** every hard question this exploration hit resolves differently under PORTFOLIO (showcase for the n8n application: build the most impressive coherent thing; TAM/moat/demand do not gate it) vs VENTURE (a real business: demand/moat/defensibility DO gate it). We keep circling because the hat is unfixed and every idea gets double-evaluated against both. Per's stated goal is a real product (venture), under which the honest next step is demand validation, not more build. If it is actually portfolio-first, the node/MCP/analysis build is great regardless. It can be portfolio-first-then-venture, but that is still a conscious choice. NAIL THIS to unblock "what do we do next."

## 9. The hat (DECIDED) + the delivery model (refinements)

**Hat decision (2026-05-31): PORTFOLIO-FIRST.** Per: "natuerlich brauche ich es in erster linie als showcase." Expliq is primarily a showcase for the n8n AI Product Builder application. Crucial qualifier (Per): portfolio-first does NOT mean a fantasy product , it must solve a real, documented pain (the comprehension/sprawl pain, grounded in the community post) with features that genuinely make sense, so a reviewer sees a CREDIBLE product. 

Consequence: **demand / willingness-to-pay does NOT gate the work.** The bar is "grounded in real pain + a compelling working demo", not "paying users". This resolves the Parts 11-13 fork. Venture remains a possible later upgrade if it gets traction (a conscious choice, not the current frame).

What this changes about next steps: the honest next step is NO LONGER customer discovery (that was venture-hat thinking, and Per has no users to ask anyway). It is: **define a strong, grounded core-feature set by studying the best analogues, then build the showcase.** Demand-signal can still be mined cheaply (community/forum/Reddit pain threads, competitor reviews) but is optional, not a blocker.

**Delivery model (Per's refinements, 2026-05-31): Expliq = the cross-platform ANALYSIS BRAIN; the platforms are the HANDS.**
- **Nodes across ALL platforms** (n8n, Make, Zapier, Salesforce), the way Slack/Linear ship nodes: this is DISTRIBUTION / invocation, not the moat. The moat stays in the API-ingested, unified estate model (a node CALLING Expliq is not Expliq SEEING the estate). Multi-platform node upkeep (SDKs, certification) is heavy , later-stage, not v1.
- **A global runtime hook** (the n8n error-workflow pattern, one hook for all workflows): low-friction PUSH telemetry for the behavioural layer. But the API already exposes executions (poll), and it only feeds the runtime signal, not the comprehension core (which needs the definitions). Plumbing option, not core, n8n-specific.
- **Expliq-as-MCP** = the strongest refinement (the Part 1-5 Core-MCP vision realized): clean BRAIN/HANDS division , Expliq supplies the analysis ("your duplicates / most critical workflows"), n8n acts (create GitHub issue, Slack the business owner). Read-mostly for Expliq, writes delegated to n8n. Resolves "don't compete with n8n" elegantly. But MCP is an INTERFACE on the analysis, not new value/moat; demand is power-user/agentic, unvalidated.
- Honest meta: all three are distribution/architecture, none answers demand , under the now-chosen PORTFOLIO hat that is acceptable (build the credible demo), but stay aware if the venture upgrade ever comes.

-> Next: study the analogues (SaaS-management + repo-walkthrough + data-catalog) to derive concrete candidate core features. Results to a research file + synthesized here.

## 10. Candidate core-feature set (derived from the analogue teardown)

From the 3-analogue teardown (`_resources/expliq-analogue-feature-teardown-research-2026-05-31.md`), filtered through this session's learnings. Hat = portfolio-first, so the test is "credible + grounded + demo-able", not "will-they-pay". All three analogue families converged on the same core, which is strong signal.

**Tier 1 , the core (feasible, felt, showcase-gold):**
- **F1 Auto-discovery + sync** of the whole estate (surface orphaned/shadow workflows). [all 3]
- **F2 Per-workflow business-meaning** (LLM "what does this do, why"). The comprehension core. [repo + catalog]
- **F3 Per-workflow card**: owner, criticality, run-frequency, error-rate, last-edit, business-meaning. [SaaS-mgmt + catalog]
- **F4 Interactive dependency MAP** (cross-workflow, navigable, not a folder tree). Shows downstream DEPENDENTS, NOT "predict what breaks" (mirage, Part 12). [all 3]
- **F5 Knowledge-loss / black-box-risk flag** (single-owner, no docs, owner-left). Directly hits the community-post pain. [CodeScene]
- **F6 Onboarding tour + persona-adaptive views** (business vs technical vs compliance). The showcase UX. [repo]

**Tier 2 , strong adjacent (defensible; some demand-uncertainty):**
- **F7 Semantic estate search** ("which automations touch customer PII / run Mondays"). [repo + catalog]
- **F8 Duplicate/redundancy detection -> consolidation** (cross-platform = the flagship "n8n can't do this"). Defensible; demand periodic. [SaaS-mgmt + repo]
- **F9 Ownership assignment + escalation** flow. [SaaS-mgmt + catalog]
- **F10 Health/criticality signals as INPUT to comprehension** (NOT a standalone monitor; monitoring is n8n's turf). [catalog active-metadata]

**Tier 3 , extensions / later:**
- F11 Auto-generated docs/runbooks [Swimm/catalog]; F12 Maturity tiers (Stable/In-Testing/Deprecated) [catalog]; Cross-platform (Make/Zapier/Salesforce) = the structural moat, later; MCP door (brain/hands) = additive agentic interface; Intent-drift ("does vs should", U9) = frontier bet.

**The v1 portfolio-demo shape (concrete):** connect n8n -> estate auto-synced -> land on an interactive MAP + per-workflow business explanations + criticality/owner + black-box-risk flags + "you have 2 near-duplicates" + semantic search. Verbs: connect, see, understand, navigate. This is "the repo-walkthrough for your automation estate": grounded in the felt pain, visually demo-able, and F1-F6 mostly feasible today (Expliq's v8 pipeline already produces F2/F3-type fields).

**Filters carried from the session (do not re-litigate):** dependency = MAP/dependents (yes), not change PREDICTION (mirage); health = comprehension input, not a monitoring product (n8n's turf); dedup/cross-platform = defensible flagship, demand periodic; security posture = out (Zenity); opportunity-engine = out (overshoot).

### Open
24. v1 demo scope: is it F1-F6 (the comprehension walkthrough), with F7/F8 as the "wow" extras? Pick the demo's spine.
25. Which single feature is the demo's HERO moment (the map? the black-box-risk flag? the "you have duplicates"?) , the thing a reviewer remembers.

## 11. Feature validation: scored matrix + v1 spine + hero (2026-05-31)

Combined demand-grounding + skeptical-critique pass (4 clusters; evidence in `_resources/expliq-feature-demand-validation-research-2026-05-31.md`). Scored under the PORTFOLIO hat (test = credible + grounded + demo-able).

| Feature | Demand (voiced?) | Feasible | Demo-able | n8n-redundant | Verdict |
|---|---|---|---|---|---|
| F5 Black-box / knowledge-loss risk | REAL, acute (owner-left outage threads; CodeScene-validated) | Yes (heuristic, low effort) | Excellent | No (n8n has owner, not risk-judgment) | **CORE + HERO** |
| F4 Dependency map (dependents) | REAL (42+ upvote request) | Yes (static) | Strong (visual) | Partial (n8n roadmap hints lineage) | **CORE + HERO** |
| F2 Business-meaning | REAL (user-built "Document My Workflow"; Zapier step-notes) | Yes | Strong ("explain 50 instantly") | No native AI-explain | **CORE** |
| F1 Auto-discovery / sync | WEAK (structural, unvoiced) | Yes | Boring but necessary | n8n has basic list | **CORE-scaffold** |
| F7 Semantic search | WEAK (passive, not acute) | Yes (embeddings) | Strong ("ask your estate") | n8n search weak | **v1 wow-extra (optional)** |
| F9 Ownership assign/escalate | REAL ("transfer ownership" threads) | Yes | Medium | n8n could add field | **light; painkiller only w/ enforcement** |
| F3 Per-WF card | WEAK (no voice for "a card") | Yes | Table-stakes | Partly (n8n Insights) | **vessel for F2/F4/F5, not a feature** |
| F8 Dedup / consolidation | VERY WEAK (n8n talk = dup executions, not redundant WFs) | HIGH RISK (semantic equivalence, false positives) | Moderate (if accurate) | No | **DEFER , weakest demand + riskiest** |
| F6 Onboarding tour / persona | UNVERIFIED (no n8n voice; generic only) | Messy | Low (tour != wow) | No | **DEFER** |
| F10 Health as input | UNVERIFIED-as-input | Yes (read n8n) | n/a | REDUNDANT (n8n Insights) | **mirror n8n, do not build a monitor** |
| F12 Maturity tiers | VITAMIN (confirmed; no organic demand) | Yes | Low | No | **CUT from v1 (unless auto-deprecate)** |

**The v1 spine (evidence-grounded):** **F1 (sync) + F2 (business-meaning) + F4 (dependency map) + F5 (black-box risk)**, with **F7 (semantic search)** as the optional wow and **F9 (ownership)** light. F3 is just the card UI that holds F2/F4/F5.

**The HERO moment:** the **map + black-box-risk, combined** , "here is your estate map, and these 3 workflows are critical black-box risks (single owner who left, no docs, feeds 8 others)." Acute (real outage stories), visual, low-effort, market-validated (CodeScene), and n8n does not do it. F2 ("instant business explanations of 50 workflows") is the opening hook.

**Honest surprises (the adversarial pass earning its keep):**
- **F8 dedup , Per's favourite "n8n can't do this" , is the WEAKEST**: demand almost entirely inferred (n8n users discuss duplicate EXECUTIONS, not redundant workflows) AND the highest feasibility risk (reliable semantic equivalence is hard; false positives kill trust). The defensible-but-unwanted trap, confirmed. Defer.
- **F6 onboarding tour , the earlier "showcase-gold" pick , is UNVERIFIED + high-effort + low-demo.** Over-rated. Defer.
- **The validated winners (F5 + F4 + F2) ARE the original community-post pain** ("I lost track / scared to change / owner left"). The thing Per started with is the validated core , the session ends where it began, now with evidence.
- Health / maturity / card = scaffolding / vitamin / redundant , minimize, do not headline.

### Open
26. v1 demo scope locked = F1 + F2 + F4 + F5 (+ F7 optional)? Build it?
27. Hero confirmed = map + black-box-risk (with F2 as the opening hook)? Or lead with F2 "explain everything"?

### Note , what is CodeScene (and what "validated" means here)
CodeScene is a commercial (paid) code-analysis tool that does "behavioural code analysis": it analyses code PLUS git history (who changed what, when, how often) to surface hotspots and , key for us , KNOWLEDGE-LOSS risk: code only one person understands, or written by someone who has LEFT (so nobody remaining understands it). Expliq's F5 (black-box risk) is the SAME insight-type, for automations instead of code. So "CodeScene-validated" = a paying market for this exact insight already exists next door (in code), which de-risks the bet that it is valuable for automations too. It is validation BY ANALOGY, not proof that n8n users will pay , but a strong signal the idea is not a fantasy. And why F5 is cheap to build: it is a HEURISTIC over metadata Expliq already syncs (single owner? owner gone/unknown? no docs? complex? stale? -> RED/YELLOW/GREEN), no unreliable ML or prediction (unlike the change-impact mirage of Part 12).

## 12. AI-native scan , the last pass before locking (2026-05-31)

Final recency-biased scan (evidence: `_resources/expliq-ai-native-landscape-scan-2026-05-31.md`). Two encouraging results, both corroborating earlier passes:
- **v1 spine still OPEN.** No integrated AI-native estate-intelligence product for n8n; only fragments ("Document My Workflow" single-WF docs, a GitHub catalog/audit lib, the "AI-BOM" security scanner, n8n's own within-platform audit; TectoAI YC-S25 = watch).
- **n8n's AI is EXECUTION-centric, NOT estate-intelligence** (AI builder, agent nodes, human-in-the-loop; Insights = ops metrics; 2.0 = security infra, estate-blind). So encroachment on the v1 spine is LOWER than the bear case feared , Expliq's spine is orthogonal to n8n's AI direction. (Good news; partially walks back the Part-8/11 encroachment severity for THIS specific spine.)
- **Role-models to borrow** (data-estate world): Atlan AI, Select Star MCP, Secoda, dbt Developer Agent, Torii Eko , converging on conversational estate Q&A, MCP-native design, and an agentic "assist -> insight -> act" UX. These enrich the LATER MCP/agentic extensions, not the v1 core.
- **Gap:** the code-comprehension-UX strand failed to execute; partially covered by the Section-4 analogue teardown. Re-run optional before building the demo UI; not load-bearing for the lock.

Net: nothing changes the v1 spine; it is confirmed OPEN + de-risked on encroachment. Ready to lock.

### Open
28. This was the planned last research pass. LOCK v1 (F1 + F2 + F4 + F5; hero = map + black-box-risk)? Re-run the failed UX strand first, or proceed to a build/spec plan?

## 13. UX patterns to borrow + the F4 encroachment update (2026-05-31)

The failed UX strand was re-run (evidence: `_resources/expliq-code-comprehension-ux-patterns-research-2026-05-31.md`) and tecto.ai was reviewed directly.

**Tecto (tecto.ai) verdict:** NOT a direct competitor. It is "AI governance for regulated industries" (legal) , governs the AI TOOLS/AGENTS employees USE + on-device PII redaction + compliance (SOC2/EU AI Act), with an "AI Control Room" + shadow-AI Discovery. Same SHAPE (discover -> control-room -> monitor), different OBJECT (AI-tool-usage vs automation estate) and BUYER (compliance/legal vs automation operators). It is in the crowded AI-agent-governance lane we decided NOT to lead with, plus the regulated-vertical angle (a venture escape-hatch). Partial role-model for the Control-Room/Discovery shape. Details in the AI-native scan file.

**UX patterns to steal for the v1 demo** (from Cody / Greptile / Devin-DeepWiki / Swimm / GitDiagram):
1. **"Ask your estate" chat** ("what does this do?", "where is error handling failing?") grounded in real nodes , upgrades F7 from a search box to a conversational interface.
2. **Auto-generated + SHAREABLE estate diagram** (GitDiagram-style, URL-native), kept fresh , a demo wow.
3. **Dependency graph with clickable drill-down** to the node/config.
4. **Semantic annotations that live in the config + flag stale** (F2 + intent-drift seed).
5. **Guided onboarding that surfaces risky/undocumented FIRST** + templated questions , F5 as the entry point.
6. **Index-once, query-constantly** , build the semantic estate graph once.

**IMPORTANT , the F4 encroachment update (adjusts Section 11):** n8n ALREADY SHIPPED a basic workflow dependency graph in Feb 2026 (PR #22371, force-directed D3, colored by credential). So F4 was over-scored as "n8n only hints at lineage." Reality:
- **F4-as-a-raw-map = now table-stakes / partly redundant** with n8n native.
- Differentiation moves to the OVERLAY on the map: **business-meaning (F2) + black-box-risk (F5) + criticality + the conversational "ask" layer** , none of which n8n's graph has.
- **Refined hero: F5 (black-box risk) is the stronger hero; the map (F4) is the CANVAS, not the differentiator.** F2 + F5 + "ask your estate" are the durable value.

Net v1 (refined): F1 (sync) + F2 (business-meaning) + F5 (black-box risk) as the differentiating core, F4 (map) as the canvas they render on, F7 (ask-your-estate, conversational) as the optional wow. Hero = the risk-annotated map / the black-box-risk callout, NOT the bare map.

### Open
29. Lock the REFINED v1 (F1 + F2 + F5 core, F4 canvas, F7 conversational wow; hero = black-box-risk on the map)? Then commit + handoff or move to a build/spec plan.

## 14. DECISION LOCKED (2026-05-31)

**Hat:** PORTFOLIO-FIRST , a real, grounded showcase for the n8n AI Product Builder application; not a fantasy product. (Venture is a possible later upgrade if it gets traction.)

**Product (one line):** "Expliq , automation estate intelligence: connect your n8n (later Make/Zapier/Salesforce) and understand, in business terms, what every automation does, how critical it is, how it connects, and who owns it , the repo-walkthrough for your automation estate."

**Refined v1 (locked):**
- Core differentiators: **F2 business-meaning** + **F5 black-box / knowledge-loss risk**.
- Canvas: **F4 dependency map** (n8n shipped a basic one Feb 2026; Expliq's value is the F2+F5 overlay + the "ask" layer on it, not the bare map).
- Scaffold: **F1 auto-discovery / sync**.
- Optional wow: **F7 "ask your estate"** (conversational).
- **Hero moment:** the black-box-risk callout on the map ("3 critical black-box risks: owner left, no docs, feeds 8 others").
- Demote/defer: F8 dedup (weak demand + risky feasibility), F6 onboarding-tour (unverified), F3/F10/F12 (scaffold/vitamin/redundant), and , out , the opportunity-engine, impact-PREDICTION (mirage), and security-posture (Zenity's lane).

**UX patterns to borrow:** ask-your-estate chat, shareable auto-diagram, risk-first onboarding, index-once-query-constantly.

**Validation basis:** problem-signal voiced in the n8n community (F2/F4/F5), CodeScene as market-proxy for F5, competitor + AI-native scans show the spine still OPEN and n8n's AI is execution-centric (orthogonal). Willingness-to-pay not validated , acceptable under the portfolio hat.

**Next (future session):** build the v1 showcase (the spine above), borrowing the UX patterns; optionally a build/spec plan. Full reasoning arc: `expliq-core-mcp-vision-brainstorming.md` Parts 6-14 + this file Sections 0-13 + 8 research files in `Dev/_resources/` (dated 2026-05-31).

## 15. Post-v1 roadmap candidates: F13 + F14 (2026-05-31)

Added AFTER the v1 lock , candidates for after v1 (unless OQ 30 folds a cheap slice in). Both reuse the estate model.

**F13 , AI-inventory + risk lens.** Identify the AI INSIDE your workflows: which WFs use AI, which model/provider, what the AI does (business terms), and the risk. Object = the AI in YOUR built workflows (NOT Tecto's "AI tools employees use") , so it stays in Expliq's lane, not a Tecto pivot. Honest scope:
- Feasible/trustworthy: detection + classification + business-meaning + STRUCTURAL security-risk (lethal-trifecta = AI + external input + outward action + broad credential).
- NOT a compliance oracle: data-privacy/legal = "flag for human review" ONLY (dynamic-data problem + false-confidence + legal-liability trap). Never claim "GDPR / EU-AI-Act compliant."
- Timely (agentic n8n + EU AI Act); strong portfolio-demo. Feature/lens, NOT headline (else drift into the crowded AI-governance lane = Tecto/Zenity). Demand for n8n operators unvalidated; buyer may skew compliance. Partial precedent: the AI-BOM scanner.

**F14 , best-practices / structural linter for the estate** (the generalization of F13's structural-risk). Check each workflow + the estate against best practices / policy: error handling present? hardcoded secrets? lethal-trifecta? overly complex (no sub-workflow decomposition)? missing retries/timeouts? deprecated/risky nodes? -> flag violations + an estate "health score", explained in business terms, prioritized by criticality.
- n8n PUBLISHES best-practice guidance (docs/courses) but does NOT enforce/check it , a real gap (like ESLint/Spectral exist because style guides do not self-enforce). n8n's native "validation" = config/parse validity, not best-practice quality.
- KEY STRENGTH (feasibility): this is DETERMINISTIC structural rule-checking on the static JSON , trustworthy, low false-positive, the OPPOSITE of the impact-prediction mirage and the legal-certainty trap. The LLM adds explanation + prioritization, not the core check.
- Escape the vitamin trap by tying violations to CONSEQUENCES ("no error handling -> silent failures", the validated pain), not abstract hygiene.
- Caveats: vitamin risk; n8n could add a native linter (platform-encroachment, like it did the dep-graph); keep it a lens, not a standalone "linter product" identity.

**The unifying principle (the important takeaway):** F5 (black-box risk) + F13 (AI risk) + F14 (best-practice/security lint) are ONE FAMILY , trustworthy, DETERMINISTIC, structural risk/quality checks over the estate, explained in business terms. They are the FEASIBLE, DEFENSIBLE counterpart to the rejected INFERENTIAL bets (impact-PREDICTION, legal-CERTAINTY). The line separating Expliq's good bets from its traps: **deterministic structural checks (trustworthy) vs inferential predictions/judgments (false-confidence trap).** Together with F2 (comprehension) + F4 (map), this family = a coherent "understand + ASSESS your automation estate" product, all on the one estate model.

### Open
30. Do F13/F14 stay strictly post-v1, or does a cheap deterministic slice (e.g. lethal-trifecta + no-error-handling flags) fold into the v1 demo as part of F5's risk family (low effort, demo-strong, reuses the estate model)?

## 16. The MCP-commoditization question: why does Expliq exist if Claude Code + n8n-MCP can do it? (2026-06-04)

The sharpest bear-case yet, raised by Per: a user can connect Claude Code / Claude Desktop to their n8n instance via the existing **n8n MCP server** and just say "analyze my automations for risk." Claude Code's agentic loop is genuinely better than a single-shot pipeline (established this session). So why should Expliq build its own agent / exist at all, instead of being a worse version of what the user already has for free? This is the "thin-wrapper / GPT-wrapper" critique generalized to the agent era.

**The load-bearing unbundling: two independent questions that were being conflated.**
- **(a) Internal:** should Expliq's analysis be *agentic* (tool-loop + on-demand context) rather than single-shot? -> Yes, it is strictly better (the n8n-client methods + Prisma queries become tools the model drives, instead of a prompt-stuffing `runAnalysisPipeline`).
- **(b) External:** should Expliq *exist as a product* given Claude Code + n8n-MCP? -> Depends entirely on WHAT Expliq is. MCP only threatens (b).

These are orthogonal. The implementation can be agentic AND the product can still be defensible, because **the product is not the agent; it is the opinionated system around the agent.**

**What MCP + a frontier agent commoditizes: the reasoning layer only.** The raw "run an LLM over the instance once." If Expliq is only that, it is dead, correctly. That is the thin-analysis-wrapper, and it does not survive.

**What Claude-Code-via-MCP does NOT give the user (the durable layers, = the actual product):**
1. **Encoded expertise / the right questions.** Claude Code analyzes the instance only if the user already knows what "black-box risk" is, the rubric, what "detectability / value-at-stake / maturity" mean, what good looks like. That codified judgment IS `risk-engine.ts` + the prompt/schema design + the domain model. The user at an empty Claude Code prompt produces the answer to their random question, not a governance assessment.
2. **Longitudinal state / delta.** Claude Code is session-bound and forgets last week. Governance is inherently monitoring-over-time ("what changed since last sync, what is newly risky"), = the whole `delta-generation.ts` / snapshot model. An agent session cannot be a continuous control plane.
3. **Determinism + auditability (the un-commoditizable core).** The irony that makes this airtight: the SAME reason Per chose deterministic retrieve-first RAG (Epic 19, D7) is why a governance verdict cannot be "just ask the agent." A risk score that changes every re-run is not an audit artifact; "Claude said it's risky" carries no compliance process. `computeGovernanceDot` as a **pure deterministic function** is exactly the part MCP cannot reproduce. **This is the same insight as Section 15's unifying principle** (deterministic structural checks vs inferential predictions), seen from the distribution angle: the deterministic core is what survives commoditization, the inferential layer is what gets commoditized. F5/F13/F14's determinism is not just a feasibility virtue, it is the *moat against the agent*.
4. **The non-agent-native user.** Claude Code is a developer terminal tool. The person who must SEE automation risk (RevOps lead, ops manager, CTO, compliance) does not have MCP configured. The product is the accessible, shareable surface for everyone who will never "pull it into Claude Code."
5. **The action loop + multi-tenant plumbing.** Accounts, sharing, RBAC, deploy/ticket/alert. An agent session is single-player and ephemeral.

**The reframe (the mature stance): MCP is distribution, not replacement, and Expliq already built the door.** Epic 20 shipped the MCP Server Door. So it is not "Expliq vs Claude-Code-via-MCP." It is: Expliq is **also** reachable from Claude Code via MCP, and it retains value because **behind the MCP tool sits the rubric + the longitudinal state + the deterministic score**, which a raw n8n-MCP session cannot reconstruct in one shot. `get_riskiest_automations` exposed to an agent is good distribution; the value lives behind the tool, not in the tool.

**The honest concession (what the MCP threat actually tells us: segment, not existence).** For a **solo technical n8n user wanting a one-time spot-check**, Claude-Code-via-MCP genuinely IS enough and Expliq adds little. So the threat does not refute Expliq's existence; it sharpens its **segment and shape**: the defensible user is the team / org / non-dev stakeholder + continuous monitoring, NOT the solo dev doing an ad-hoc check. This aligns with, and tightens, the portfolio-first lock: lead with the surfaces an agent session cannot be (shared, persistent, deterministic, non-technical-readable).

**Portfolio meta-point.** For the n8n AI Product Builder application, having *reasoned through this exact tension* and deliberately invested in the durable layers (deterministic risk engine, delta/state, accessible surface, MCP door as distribution) instead of a wrapper IS the senior product-thinking signal a reviewer wants to see. The threat, named and answered, is itself an asset.

**Net:** does not overturn the Section-14 lock; stress-tests and strengthens it. The v1 spine (F1 + F2 + F5 core, F4 canvas, F7 wow) holds, with the durability argument now explicit: F2's comprehension is the commodity-adjacent hook, F5's deterministic risk + the longitudinal state + the non-agent surface are what MCP cannot eat.

### Open
31. Should the v1 demo explicitly *show* the brain/hands division (Expliq's deterministic risk verdict consumed FROM Claude Code via the Epic-20 MCP door) as a deliberate "we are the durable layer the agent calls" narrative beat, rather than hiding it? It would turn the bear-case into a demo strength.
32. Does the "solo-dev = MCP is enough, team/non-dev = Expliq" segmentation get stated in the product framing, or stay an internal strategy note?

## 17. The "homeless agent output" angle: Expliq re-derived from the output side (2026-06-04)

A second, independent path to the same conclusion as Section 16, arrived at from the OUTPUT side instead of the reasoning side. Provoked by a concrete observation (Per): when you use the n8n MCP in Claude Code to surface your "most critical automations" (criticality JUDGED BY THE AGENT, which n8n cannot compute), the verdict is HOMELESS. It lands as a chat blob or a JSON file, with no fitting, persistent, visual home. The mcp-ui project literally names this "the text wall." Per's instinct: why is there no generic "storage/visualization MCP" that auto-generates a fitting view of arbitrary output, and is Codex Sites (launched 2026-06-02) that?

Market finding (full research: `Dev/_resources/homeless-agent-output-viz-storage-mcp-research-2026-06-04.md`): **no generic auto-fitting viz/storage MCP exists**, and it is unsolved BY DESIGN, not by lag. Every shipped approach pushes the "what view fits this?" decision onto a human: the SERVER AUTHOR (MCP Apps, the official 2026-01-26 extension), the DEVELOPER'S CATALOG (json-render / Thesys C1 / Google A2UI), or the PROMPT each run (vibe-coding builders: Codex Sites, Lovable, v0). The reason: a FITTING (not generic table/chart) view of "critical automations" requires knowing what an automation is, what "critical" means here, and how a risk verdict should look. That is domain knowledge.

**Load-bearing conclusion for Expliq: the moment the view must FIT, it needs domain knowledge, which is exactly what a purpose-built product encodes.**
- A one-shot vibe-coded app (Codex Sites / Lovable / v0) re-derives the domain from your prompt each run and freezes a snapshot. Genuinely useful for "I need to SEE this verdict now", and genuinely NOT a product (no durable opinion about what "critical" means; you re-supply it every time).
- Expliq encodes the domain opinion ONCE (the criticality/risk model `risk-engine.ts`, the estate schema, the fitting view) and keeps it alive across runs. That reusable domain opinion is the thing the generic tools structurally refuse to hold.

This is the same brain/hands + durable-layer argument as Section 16, entered from the other end. Section 16: MCP commoditizes the REASONING layer (Expliq is the durable layer behind the tool). Section 17: the AUTO-FITTING-VIEW layer is also un-genericizable without domain knowledge (Expliq is the product that holds it). Both converge on one frame: **n8n MCP = raw data; the agent = the judgment; Expliq = the persistent, fitting, shareable home for that judgment.**

Concrete buildable architecture (turns the bear-case into a demo beat): Expliq's Epic-20 MCP door exposes not just a READ tool (`get_riskiest_automations`) but a WRITE/STORE tool (`pin_to_dashboard(...)`). An agent in Claude Code computes criticality over the n8n estate and PUSHES it into Expliq's persistent visual dashboard. (Throwaway-end variant for contrast: drive a Lovable-MCP / v0-Platform-API generation instead; that is the disposable end, Expliq is the durable end.)

White space worth noting: the research found NO VC-funded pure-play whose one-liner is "the persistent home for homeless agent output" (closest pure-plays, Thesys / CopilotKit, are GenUI infrastructure; the strongest realizations are inside incumbents, Anthropic / OpenAI / Google). Treat as a blind spot, not a confirmed absence, but it is the niche this instinct points at.

### Open
33. Add `pin_to_dashboard` (agent-writes-a-fitting-view) to the Epic-20 MCP door as a deliberate demo beat ("the agent computes risk and pins it into Expliq's persistent dashboard"), or keep the door read-only?
34. Does the demo narrate the "homeless output to fitting home" story explicitly (a vivid, current framing a reviewer will recognize from the 2026 GenUI / MCP-Apps discourse)?

## 18. Dashboard vs Product: is Expliq commoditizable by vibe-coding? (2026-06-04)

The hardest identity question yet, following Section 17 to its uncomfortable end (pushed by Per).

**Concession first (a weak argument dropped):** "Expliq persists, the vibe-coded app does not" is FALSE. A Lovable-built app is persistent, hosted, live-data-capable (prod URL + Postgres). Persistence is NOT a differentiator; drop it. What survives as the ONLY real differentiator: whether Expliq has domain functionality deep enough that an agent + a vibe-coding builder (Lovable / v0) cannot easily reproduce it in a loop.

**Core diagnosis (Per's Figma / GitHub / Linear / Slack / Stripe point, sharpened):** those products share a trait Expliq currently lacks. They are systems of ACTION and RECORD that hold canonical state existing only there: you create designs, commit code, move issues, send messages, move money. Work HAPPENS there; the data is BORN there. A DASHBOARD reflects state that lives elsewhere. Expliq's data lives in n8n; Expliq reflects it and adds a judgment layer. So as a pure comprehension/risk dashboard, **Expliq is thin, and a thin dashboard is exactly what an agent can now vibe-code on demand.** This is the correct diagnosis, not a problem to wave away.

**The "raised floor":** before vibe-coding, "a decent governance dashboard" was a product. In 2026 a decent dashboard is self-service table-stakes a user can generate. Expliq must clear a HIGHER bar (functional depth) just to be worth choosing over DIY.

**Constructive path: from view to system-of-record.** For Expliq to be more than a dashboard, it must hold governance STATE born in Expliq, absent from n8n, not derivable from the n8n data:
- ownership assignments, sign-offs, reviewed/approved status
- risk acceptances (this risk is known and accepted, by whom, when)
- intent declarations (this workflow SHOULD do X) + drift detection against actual behavior
- remediation tracking, deprecation decisions

The data lives in n8n; the DECISIONS live only in Expliq. An agent can pull the data and form a judgment, but it cannot manufacture the accumulated human decisions on top, because they are nowhere in the data. The judgment + view are the hook; the held decisions (and any actions taken on the estate) are the functional identity, the un-vibe-codeable core.

**Honest tension (do not bury):** this same decision/governance layer is exactly what Per's own earlier demand research rated lukewarm: governance-as-headline = vitamin (Section 0); F9 ownership/escalation = "light; painkiller only with enforcement" (Section 11). So the move that grants functional identity points straight into the enterprise-process / vitamin zone flagged as demand-soft. The thing that makes it a product is also the thing that most sharply raises the demand question.

**"Would a user DIY a dashboard if a very good Expliq exists?"** Not independent; resolves into the diagnosis above. If Expliq is genuinely deep: no, DIY is friction and you must know what good looks like, so the ready-made wins. If Expliq is just a dashboard: "a very good one" is no moat, because the vibe-coded version is nearly as good for the one-off. You beat vibe-coding only through depth that makes DIY not worth it.

**Strategic consequence:** this hits the Section-14 portfolio-first lock directly. A thin comprehension/risk dashboard is a weaker 2026 showcase than when the lock was set, because the floor rose. The portfolio bar is now either (a) a dashboard with real functional depth (system-of-record), or (b) a different artifact entirely.

**The fork this forces (decision, NOT decided):**
- **Bet A, Expliq as a standing product.** Within it, the only version that survives the vibe-coding floor is **Bet A-prime: Expliq as a system-of-record for governance decisions/state (and/or actions on the estate), not a dashboard.** Functional identity via held decisions n8n cannot hold. Risk: the demand-soft governance-process zone.
- **Bet B, the agent-orchestration artifact.** Not Expliq-the-app, but "Claude Code orchestrating n8n MCP + a vibe-coding builder MCP (Lovable / v0 Platform API) to generate a fitting estate-view on demand from intent + raw data, with no glue code." The product shown is the AGENT'S CAPABILITY to compose tools and turn intent + data into a deployed fitting artifact. This is the multi-MCP-agent-orchestration showcase (fulfils the existing `_TODO` MCP-composition demo), arguably more 2026-state-of-the-art and more on-message for an n8n AI Product Builder application. Per's "on a lighter level that is what Codex Sites do" maps here; the impressive, agent-driven version needs Lovable/v0 (agent-drivable), not Codex Sites (no agent-to-agent API).

Bet B can consume Bet A's data; not exclusive, but as the showcase SPINE they are different bets.

### Open
35. Does Expliq pursue functional identity as a system-of-record (Bet A-prime: hold ownership / sign-offs / risk-acceptances / intent + drift / remediation), accepting the demand-soft governance-process risk?
36. Or is the honest 2026 portfolio spine Bet B (the multi-MCP agent-orchestration demo), with the dashboard demoted to a generated artifact rather than the product?
37. Synthesis option: Bet B is the wow-demo (agent generates the fitting view live) AND Bet A-prime is the backbone (Expliq holds the decisions the generated view cannot), so the demo shows BOTH the agent building the view and Expliq holding what the view can't.
