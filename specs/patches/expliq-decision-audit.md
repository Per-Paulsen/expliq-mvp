# Expliq — Decision Audit: evidence re-check of the 2026-05-31 conclusions

> Purpose: re-examine the decisions reached on 2026-05-31 (brainstorming Parts 6-14 + offering-exploration Sections 0-15) **neutrally and evidence-based**, before treating any of them as settled. Triggered by Per's observation that the conclusions were reached argumentatively in one long session (some late), not checked against the evidence, so they feel unstable and each new discussion can overturn the last.

## Method (the rules we agreed)

1. **Existence of a research file ≠ solidity of the conclusion drawn from it.** Every decision starts UNGRADED. Verdicts stay empty until the evidence is actually re-weighed.
2. **Grade the evidence, not the decision.** Neutral question is "what does the evidence say, open-ended?" not "is decision X defensible?" (the latter makes X the anchor).
3. **Two levels of neutrality.** (a) *internal* — is the decision a faithful derivation from the existing files, or an over-interpretation? (b) *external* — is it actually true in the world? The files themselves may be biased (the confirmation-bias risk Per flagged), so internal fidelity is necessary but not sufficient; decisions that matter get a fresh external check.
4. **Independent isolated reviewers.** One reviewer per item (or per coherent bundle), each neutrally briefed ("gather evidence FOR and AGAINST; name the unspoken premise"). Independence is the anti-bias method.
5. **No v1 framing.** v1-as-a-frame is itself one of the assumptions on the table. Feature gradings are recorded as "was classified as core/canvas/out", and what gets audited is the evidence behind that classification.
6. **Atomic decomposition (Per, 2026-06-01: "split everything that can be split").** Each top-level decision Dn is broken into independently-checkable atoms Dn-a, Dn-b, ... An atom is its own row when it could be judged true/false on its own evidence, even if it currently travels with its siblings. This surfaces hidden bundled assumptions (e.g. "comprehension is LLM-strong" is separable from "therefore comprehension is the core").

## Neutral note on the arc (sequence, not judgment)

The conclusions were not reached linearly. The brainstorming arc corrected itself several times: Part 8 (adversarial) asserted "comprehension = commodity" and "reposition off governance onto reliability/security"; Part 10 rebundled onto "change-confidence + reliability"; Part 11 (adversarial) demoted change-confidence to weakest; Part 12 declared impact-prediction a mirage; Part 13 retracted the "commodity" claim; Part 14 returned to the "simple comprehension core". The offering-exploration (Sections 0-15) then consolidated and locked a v1, and Section 15 (F13/F14 + the deterministic-vs-inferential line) was added late, after the lock, and is still uncommitted. Decisions flipped more than once, or set late after the lock, are flagged in the Source column. This is fact-recording, not grading.

## The decision register (atomic)

Evidence-Status and Verdict are intentionally empty. Filled by the isolated reviewers (next step), then reviewed with Per. `[fact]` = a world-fact claim (verify externally); `[judgment]` = a strategic/positioning judgment (internal fidelity + external check); `[late]` = set late / post-lock; `[flipped]` = reversed at least once during the arc.

### Cluster A — Direction / identity / hat

| # | Decision atom (neutral) | Source | Type | Ev-Status | Verdict |
|---|---|---|---|---|---|
| D1-a | The primary hat is portfolio-first (showcase for the n8n application), not venture/real-product | Section 9 | judgment | | |
| D1-b | Under the portfolio hat, demand / willingness-to-pay does NOT gate the work | Section 9 | judgment | | |
| D1-c | It must still solve a real, documented pain (no fantasy product), so a reviewer sees it as credible | Section 9 | judgment | | |
| D2-a | Expliq is its OWN nascent category, not a feature of an existing product | Section 5 | judgment | | |
| D2-b | The category label = "automation estate intelligence" / the automation comprehension layer | Section 5 | judgment | | |
| D2-c | The sharpest analogue framing = "the repo-walkthrough for your automation estate" | Section 4 | judgment | | |
| D3-a | Comprehension (what an automation does/is) is verifiable against the user's real data and LLM-strong | Part 6/14 | judgment | | |
| D3-b | Prescription (what-to-build, ROI, Deploy) is unfalsifiable by the user and trust-eroding | Part 6 | judgment | | |
| D3-c | Therefore comprehension = the core; prescription = overshoot (not the headline) | Part 6 | judgment | | |
| D4-a | n8n will itself build anything single-platform + technical (exec status, lineage, basic owner field, "explain this") | Section 2 | judgment | | |
| D4-b | n8n will NOT build cross-platform or business-meaning (not their lens; they sell the builder) | Section 2 | judgment | | |
| D4-c | Monitoring (runtime signals) = n8n's turf; analysis/interpretation = Expliq's; even within one signal, detection=n8n, interpretation=Expliq | Section 2 | judgment | | |
| D5-a | The runtime-node form factor is wrong for the core value (a node sees one execution; value is meta/estate-level) | Section 8 | judgment | | |
| D5-b | Right form = ecosystem-native, built as an API integration (not a node), n8n-first, cross-platform later | Section 8 | judgment | | |
| D5-c | Expliq = cross-platform ANALYSIS BRAIN, platforms = HANDS (Expliq analyses, n8n acts) | Section 9 | judgment | | |
| D5-d | UI-first, MCP-additive (MCP is an extra door, not a UI replacement; "MCP-only" is wrong for Expliq) | Section 5 | judgment | | |

### Cluster B — What was classified as core / component

| # | Decision atom (neutral) | Source | Type | Ev-Status | Verdict |
|---|---|---|---|---|---|
| D6-a | There is real, voiced demand for per-workflow business-meaning ("I lost track"; user-built "Document My Workflow") | Section 11 | fact | | |
| D6-b | F2 is feasible + demo-strong ("explain 50 workflows instantly") | Section 11 | judgment | | |
| D6-c | F2 is NOT a commodity (value is in ingestion-at-scale / join / persistence / structure / surfacing around the call) | Part 13 `[flipped]` | judgment | | |
| D6-d | F2 is classified as the core differentiator | Section 14 | judgment | | |
| D6-e | F2's moat depth is medium (single-WF explain is copyable by n8n in one release; strongest moat = cross-platform) | Part 13 | judgment | | |
| D7-a | There is acute, real demand for black-box / knowledge-loss risk (owner-left outage threads) | Section 11 | fact | | |
| D7-b | CodeScene (paid, for code) is a valid market-proxy for F5 (validation by analogy) | Section 11 | judgment | | |
| D7-c | F5 is cheap to build (heuristic over already-synced metadata: single owner? gone? no docs? stale? → R/Y/G), no ML/prediction | Section 11 | judgment | | |
| D7-d | F5 is classified as core + HERO | Section 14 | judgment | | |
| D8-a | n8n shipped a basic dependency graph in Feb 2026 (PR #22371, force-directed D3) | Section 13 | fact | | |
| D8-b | Therefore F4-as-raw-map is table-stakes / partly redundant | Section 13 | judgment | | |
| D8-c | Differentiation = the F2+F5+criticality+ask overlay; F4 = canvas, not differentiator | Section 13 | judgment | | |
| D9-a | F1 auto-discovery/sync = necessary scaffold (structural, unvoiced) | Section 11 | judgment | | |
| D9-b | F7 ask-your-estate (conversational) = optional wow | Section 11 | judgment | | |
| D9-c | F9 ownership = light (painkiller only with enforcement) | Section 11 | judgment | | |

### Cluster C — What was classified as out / deferred

| # | Decision atom (neutral) | Source | Type | Ev-Status | Verdict |
|---|---|---|---|---|---|
| D10-a | Opportunity-engine / recommendation-generation as the headline = OUT (overshoot, the prescriptive half) | Part 6 | judgment | | |
| D10-b | The Deploy button = parked (a different product = workflow generation; trust/maintenance liability) | Part 6 | judgment | | |
| D10-c | Revenue/dollar estimates = dropped hard (sharpest trust-killers); keep qualitative impact tiers | Part 6 | judgment | | |
| D11-a | LLM cross-workflow impact-PREDICTION is not reliably feasible on dynamic n8n (expressions, IF/Switch on live data, variable sub-workflows, external state) | Part 12 | judgment | | |
| D11-b | "False confidence is worse than nothing" for a "safe-to-change?" tool (false negatives kill trust) | Part 12 | judgment | | |
| D11-c | Only a static structural dependency VIEW is honest/feasible; impact-prediction = OUT | Part 12 | judgment | | |
| D12-a | Zenity owns ~70% of low-code/no-code security posture (Gartner "company to beat"), not n8n/self-hosted yet | Part 10 | fact | | |
| D12-b | Therefore security-posture = OUT as a headline / at most a feature | Section 14 | judgment | | |
| D13-a | Silent-failure DETECTION = n8n's turf (Insights, error workflows); the floor is crowded (Cronitor/Datadog) | Part 10 | fact | | |
| D13-b | Reliability-as-a-headline = demoted / platform-threatened | Part 11 | judgment | | |
| D13-c | Only the business-impact INTERPRETATION (cross-workflow RCA) stays open as a substrate feature | Part 10 | judgment | | |
| D14-a | F8 dedup demand is weak (n8n talk = duplicate EXECUTIONS, not redundant workflows) | Section 11 | fact | | |
| D14-b | F8 has high feasibility risk (semantic equivalence, false positives) | Section 11 | judgment | | |
| D14-c | Therefore F8 = defer (the defensible-but-unwanted trap) | Section 11 | judgment | | |
| D15-a | F6 onboarding tour has unverified demand (no n8n voice, generic only) | Section 11 | fact | | |
| D15-b | F6 is high-effort + low demo value → defer | Section 11 | judgment | | |

### Cluster D — Conceptual framings + the linter / Spectral-style family

| # | Decision atom (neutral) | Source | Type | Ev-Status | Verdict |
|---|---|---|---|---|---|
| D16-a | F5 + F13 + F14 form ONE family (deterministic, structural risk/quality checks over the estate) | Section 15 `[late]` | judgment | | |
| D16-b | The dividing line between Expliq's good bets and its traps = deterministic structural checks (trustworthy) vs inferential predictions/judgments (false-confidence trap) | Section 15 `[late]` | judgment | **Per is contesting this** (see note) | |
| D17-a | "does" (describe current behaviour from JSON) = feasible / now (mostly built in v8) | Part 14 | judgment | | |
| D17-b | "should" (intent + drift / correctness) = frontier / deferred (needs stated-or-inferred intent + comparison) | Part 14 | judgment | | |
| **D18-a** | **F13 (AI-inventory + risk lens)**: identify the AI INSIDE your workflows (which use AI, which model, what it does, the risk); object = the AI in YOUR workflows, NOT Tecto's "AI tools employees use", so it stays in Expliq's lane | Section 15 `[late]` | judgment | | |
| **D18-b** | F13's feasible/trustworthy scope = detection + classification + business-meaning + STRUCTURAL security-risk (lethal-trifecta); data-privacy/legal = "flag for human review" only, never claim "GDPR / EU-AI-Act compliant" | Section 15 `[late]` | judgment | | |
| **D18-c** | F13 = post-v1; a feature/lens, NOT a headline (else drift into the crowded AI-governance lane) | Section 15 `[late]` | judgment | | |
| **D19-a** | **F14 (best-practices / structural linter)**: check each workflow + estate against best practices (error handling? hardcoded secrets? lethal-trifecta? missing retries? deprecated nodes?) → violations + an estate "health score" | Section 15 `[late]` | judgment | | |
| **D19-b** | F14 addresses a real gap: n8n PUBLISHES best-practice guidance but does NOT enforce/check it (its native "validation" = config/parse validity, not quality) — the ESLint/Spectral analogy | Section 15 `[late]` | fact | | |
| **D19-c** | F14's core check is DETERMINISTIC structural rule-checking on the static JSON (trustworthy, low false-positive); the LLM only adds explanation + prioritization | Section 15 `[late]` | judgment | | |
| **D19-d** | F14 escapes the vitamin trap ONLY by tying violations to CONSEQUENCES ("no error handling → silent failures"), not abstract hygiene | Section 15 `[late]` | judgment | | |
| **D19-e** | F14 caveat: n8n could add a native linter (platform-encroachment, as it did the dep-graph), so keep it a lens, not a standalone "linter product" identity | Section 15 `[late]` | judgment | | |
| **D19-f** | F14 = post-v1 | Section 15 `[late]` | judgment | | |

> Note on D16-b: Per's live challenge (2026-06-01): (a) "Expliq says 'error handling is missing'" is exactly the structural-lint output n8n could absorb and is not state-of-the-art impressive (the Spectral-on-OpenAPI feel), losing the cleverness Expliq rests on (modern LLMs reading the business case + risk out of the JSON); (b) the deterministic-vs-inferential line may be the WRONG cut, since it risks dragging F2/F5 (comprehension — inferential but verifiable) into the linter drawer. A candidate re-cut for the audit to test, not adopt: **comprehension/description (verifiable, LLM-strong) vs prediction/counterfactual (speculative)** — both inferential, only one a trap. Also unresolved (Per): is the deterministic "support layer" (D19) even needed/wanted at all, or does it dilute the comprehension identity?

## Web-evidence pass — deep-research `wf_661b6e42`, 2026-06-01

External adversarial verification (5 angles, 25 sources, 107 claims extracted, 25 verified by 3-vote, 22 confirmed / 3 killed). This is Stage B (external "is it true in the world"). It covers the `[fact]` atoms + the empirical premises under several `[judgment]` atoms; it does NOT settle the internal/positioning atoms (flagged out-of-scope below). Full result + sources: `tasks/w3lnubd3d.output` (run `wf_661b6e42-567`).

### ⚠ Headline correction — D8 premise is FALSE (high confidence, primary source)

**D8-a is wrong.** n8n did NOT ship a dependency graph in Feb 2026. PR #22371 is a **community fork PR (Davaakhatan/n8n, author_association=NONE), opened 2025-11-26, still OPEN / unmerged** as of 2026-05-11 (GitHub API: `state=open, merged=false, merged_at=null`). The encroachment *direction* is real (the PR exists), but "already shipped / table-stakes" is false.
- **Consequence:** D8-b ("F4-as-raw-map = table-stakes / partly redundant") and D8-c ("F4 = canvas, not differentiator") lose their evidential basis. A clean estate dependency-map is **NOT currently redundant** with n8n-native. The "demote F4 to canvas" call — a late Section-13 decision — must be **re-opened**, not assumed. F4 may be a live differentiator again (until/unless that PR merges → tracked as an open question + time-risk).

### Atom mapping

**SUPPORTED by external evidence (high confidence unless noted):**
- **D4-a / D4-b / D4-c** — n8n native = execution-metrics + access-control ONLY. Insights = exactly 5 ops metrics; security-audit = deterministic 5-category checklist, explicitly "not machine learning or language models"; Custom Project Roles = pure RBAC. No business-meaning, criticality, dependency-map, ownership, or staleness natively. Sources: docs.n8n.io/insights, /security-audit, security-audit/constants.ts, the Jan-2026 Enterprise-governance blog. → The comprehension/governance gap Expliq targets is real and primary-sourced.
- **D3 (substrate side)** — corroborated by the same gap evidence + the SAP precedent: SAP embeds n8n as the *runtime* but supplies business-context/governance from ACQUIRED EA tools (Signavio Process Consultant, LeanIX), i.e. the comprehension layer sits ABOVE the runtime (news.sap.com, May 2026). Supports D4-b and D5-c (brain/hands).
- **D7-b** — CodeScene "Bus Factor" / offboarding-simulation is a real PAID product category ("behavioral code analysis", from ~€18/mo). The knowledge-loss/black-box analogy proxy is valid. Sources: codescene.com product/docs/pricing.
- **D6-a / D7-a (demand EXISTS)** — operators voice felt demand for cross-workflow dependency visibility + fear-of-changing-production / blast-radius blindness (community.n8n.io thread 42802; template #2939 "teams lose track of sub-workflows… whether they can be safely updated"). **CAVEAT (important): demand-EXISTENCE is grounded but demand-SIZE is thinly sampled (one ~4-reply thread).** Enough under the portfolio hat; weak for venture.
- **D11-a / D11-b (empirical premise)** — LLM inference over code is a false-confidence risk: ~44.4% avg on Runtime-Behavior-Reasoning (REval, arXiv 2403.16437; execution-path 35.6%, output 19.4%), and code reasoning ties to surface features irrelevant to semantics (arXiv 2504.04372, 750k tasks/10 LLMs; replicated 2505.10443). Adversarial counter-search found ZERO credible dispute. → The "impact-PREDICTION is a mirage" premise holds.

**CONTRADICTED / CORRECTED:**
- **D8-a / D8-b / D8-c** — see headline above. FALSE premise → re-open.
- **D11 framing nit** — the specific **"78% fault-recognition failure under benign mutation"** figure (carried from brainstorming Parts 11/12 into the prediction argument) was **REFUTED in voting (1-2) as an overreach.** The underlying surface-feature finding holds; cite the surface-feature conclusion + the 44.4% REval number instead of "78%."

**PARTIALLY CONTESTED — new competitor evidence (was not in our 9 files):**
- **D18 / D19** — **Trusera "AI-BOM"** (open-source, v3.1.0 Feb 2026, 244★) ALREADY scans the n8n estate: detects AI-Agent nodes, MCP connections, **dangerous tool combinations (lethal-trifecta), and hardcoded credentials** in workflow JSON. So the AI-inventory + structural-security-lint space (D18 + D19's lethal-trifecta) is **NOT empty — a competitor occupies it**, on the security-inventory axis. It explicitly does NOT do business-comprehension / ownership / lineage / dependency-map (term-checked absent), so **D6/D7 stay uncontested**. → Independently corroborates Per's instinct that the linter (D19) is the *weaker, less-special* bet, and that comprehension is the defensible axis.

**UNVERIFIED — claimed in our files, NOT confirmed here (remain open):**
- **D12-a** (Zenity ~70% low-code/no-code posture, Gartner "company to beat") — was NOT among the 22 verified claims. A Gartner/Zenity press item was fetched but the ~70% + n8n/self-hosted-coverage specifics are unverified. Open.
- **D5-d moat analogue** (Atlan / Select Star / dbt ship governance MCP servers) — sources fetched, claim not in the verified set. Weakly open.
- **D6-e** (cross-platform = the most DEFENSIBLE moat) + the "governance = historically shelfware / data-catalog graveyard" durability question — touched (CoE EOL precedent confirmed) but moat-durability not directly verified. Open.

**OUT-OF-SCOPE-FOR-WEB (flagged by the run; web supplies premises, not the call):**
- **D1** (the portfolio-vs-venture hat), **D2** (own-category claim), the positioning atoms **D6-d / D7-d / D8-c / D9** (which feature is core/hero/canvas/scaffold), and **D16** (the deterministic-vs-inferential dividing line + the candidate "comprehension/description vs prediction/counterfactual" re-cut). These are Stage-A / Per-judgment items; the web pass deliberately did not force evidence onto them.

### Net for the audit
- One late "fact"-based decision **falsified** (D8 — the F4 demotion). Re-open.
- The substrate + comprehension + black-box-risk core (D3, D4, D6-a, D7) **externally corroborated**, with a real demand-SIZE caveat.
- The prediction-mirage premise (D11) **corroborated**, minus the 78% overreach.
- The linter family (D18/D19) **has a live competitor** (Trusera) — supports treating it as non-core.
- D12-a, D5-d, D6-e **still unproven** — do not bank on them.

## Next step

Stage A (internal fidelity) for the `[judgment]` atoms + the Per-judgment items (D1, D16, positioning). Then fill the Verdict column jointly. The decisive open item to resolve first: **D8 re-opened** — is F4 (dependency map) a differentiator again, given n8n has NOT shipped one?
