# Expliq — Identity Exploration: what IS Expliq, substrate-independent?

> One altitude ABOVE the feature/offering work (`expliq-offering-exploration.md`) and the decision audit (`expliq-decision-audit.md`). Those ask "which features / are the 2026-05-31 calls right". THIS asks the prior question: what is Expliq *as such*, independent of n8n — given that automation is fragmenting across substrates and increasingly built by AI.
>
> Grounded on two verified research files (2026-06-01): `_resources/automation-real-world-usage-research-2026-06-01.md` (operational reality) + its targeted who/which follow-up. A scaffold we iterate (not append-only). Honest cells; mark guesses as guesses.

## 0. The trigger (Per, 2026-06-01)

"n8n is only ONE example of Expliq. But what is Expliq actually? Automations are shifting from n8n toward Claude Code / OpenClaw etc.; with the n8n MCP you can already build + analyse n8n automations in natural language from Claude Code, and simple automations don't need n8n at all — they can live directly in Claude. Where does Expliq sit then? The dependency-map question has nothing to do with what Expliq IS." (Plus: am I too deep in Claude-Code-power-user mode?)

## 1. What is now GROUNDED (build on this; do not re-litigate)

From the verified research + audit, treated as settled enough to stand on:
- **Real automation work is unglamorous data-plumbing/ETL**; "AI agent" is largely a labeling layer over single-step LLM calls. The agentic-at-scale narrative is **hype** (only first-person evidence retracts "agent"→"LLM workflow"; "95% fail" = one self-interested vendor).
- **The felt comprehension/black-box pain is real** (lose-track, silent failure, orphaned-when-owner-leaves, ~30% of platform teams can't measure success).
- **The "squeezed middle" is now PRICE-ANCHORED**: a ~90x cost cliff (citizen tools $0–150/mo, n8n self-host ~cheap → enterprise RPA/governance ~$667–1380/mo) creates a band that has outgrown solo (black-box pain bites) but can't justify enterprise governance spend. That band is Expliq's natural subject.
- **The AI-era REAL signal is buyer posture, not adoption**: enterprises demand trace/reasoning visibility, reject black-box agents; the MIT "learning gap" favours tools that understand the *specific* estate. Both point at comprehension.
- **Honest NULLS we carry**: no platform-share-by-segment data exists in desk research; **n8n appears in zero quantified market claim**; **RevOps-as-operator and agency-built automation are uncorroborated** (a soft challenge to the original "RevOps governance" buyer thesis); willingness-to-pay unproven (the standing gate). Desk research has hit its ceiling on who/which/size.

## 2. The decisive frame — two shifts, not one

Per's insight, sharpened: conflating two different "shifts" is what makes "where does Expliq sit" feel vertiginous.
- **Shift A — where automation is BUILT** (visual builder → natural language in an agent). Real, fast, but mostly a *developer* phenomenon today.
- **Shift B — what automation IS / where it RUNS** (triggered processes touching business systems). Unchanged in substance; the artifact is often still an n8n workflow (the MCP *creates* n8n workflows), or becomes a script/skill/scheduled-agent — but it still EXISTS as an operational automation someone depends on.

**The comprehension/accountability need attaches to Shift B (what runs the business), not Shift A (how it was authored).** The authoring shift doesn't dissolve the need — easier to create → more of them → more to lose track of. "Vibe-automation" = more undocumented automations nobody fully understands = MORE Expliq surface, not less. So the agentic shift is a **tailwind IF Expliq is substrate-independent**, a threat only if the *environment* (Claude Code / OpenClaw / n8n) also becomes the comprehension layer.

→ The real question is therefore **at what ALTITUDE Expliq defines itself**: abstract enough to absorb the fragmentation/AI shift as tailwind, concrete enough to be demo-able and addressable.

## 3. The altitude spectrum — three candidate identities

| | A. Concrete / narrow | B. Mid (the current locked v1) | C. Abstract / broad |
|---|---|---|---|
| **One line** | "The comprehension + governance layer for your **n8n** estate." | "**Automation estate intelligence** — understand, in business terms, what every automation across your no/low-code platforms does, how critical, who owns it." | "The **trust/comprehension layer for all the automation running your business** — wherever it lives, whoever or whatever built it." |
| **The bet** | n8n operators feel the black-box pain and want a layer on top. | Cross-platform no/low-code estates need one meta-layer of business-meaning. | As automation fragments + goes AI-built, the scarce thing is a trustworthy cross-substrate account of what runs your business and whether you can trust it. |
| **Addressable subject** | n8n squeezed-middle (but n8n buyer = a guess; n8n absent from market data). | no/low-code squeezed-middle across n8n/Make/Zapier/Power Automate. | every automation substrate incl. agents (Claude Code, OpenClaw, embedded copilots). |
| **Showcase value** | Highest — Per has a live n8n demo + the n8n application context. | High — broader story, still demo-able n8n-first. | Vision-grade but hard to demo; risks "no budget line / own-category" trap (Section 5 of offering-exploration). |
| **Agentic shift** | Threat (if n8n/agents absorb it). | Mixed. | Tailwind by construction (more substrates = more need). |
| **Main risk** | n8n could absorb it; buyer unproven; narrow. | "across platforms" is heavy to build; middle-of-the-road. | Vaporous; undemoable; the category nobody budgets for. |

These are not mutually exclusive in TIME: a common pattern is **be C in thesis, B in category-story, A in the concrete showcase** (n8n-first demo, multi-platform framing, substrate-independent vision). The question is which is the *load-bearing identity* — the thing Expliq IS — vs which are framing/sequencing.

## 4. The decisive tensions (what the identity choice must resolve)

1. **Altitude:** is Expliq's load-bearing identity A, B, or C — or explicitly "C-in-thesis, A-in-showcase"? (Section 3.)
2. **Object permanence:** does "automation estate" survive the agentic shift, or does the unit of comprehension become "the agent/automation and what it's allowed to do/touch" (closer to AI-governance, the lane we said to avoid)? Where's the line between *comprehending an estate* and *governing agents*?
3. **The environment-as-comprehension-layer threat:** if Claude Code / OpenClaw / n8n each ship "understand & audit your automations," what is left that they structurally can't do? (Likely: the CROSS-substrate, business-meaning view no single environment sees — the moat re-derived at altitude.)
4. **The buyer void:** the research could not find who operates automation (RevOps uncorroborated, n8n absent). Does the identity pick a buyer, or stay buyer-agnostic and let the portfolio hat carry it? (Under portfolio-first this is allowed; for venture it's fatal.)
5. **Comprehension vs trust:** is the core "understand what your automations do" (comprehension) or "know whether you can trust what your automations do" (trust/assurance — which the AI-era buyer posture and the deterministic-risk family point at)? These are different identities with different hero moments.
6. **Power-user bias check:** how much of the "automation moves into Claude Code" premise is Per's own vantage vs the market's? (Research: it's the developer slice; the mass is non-coders whose automation is NOT moving into agents — yet.)

## 5. My honest starting lean (a position to ATTACK, not a decision)

- **Load-bearing identity = C-in-thesis, A-in-showcase.** Expliq IS "the trust/comprehension layer for the automation running your business, substrate-independent" — but it LANDS as the n8n-first showcase, because that's the demo-able, application-relevant instance and the agentic shift makes the abstract thesis *more* right over time, not less.
- **Lean on tension 5 toward TRUST/assurance over pure comprehension.** Comprehension ("what does it do") is the entry; the durable, AI-era-aligned value is "can you trust what it does" — which is where the buyer posture, the learning-gap, and the deterministic-risk family all converge. Comprehension is the hook; trust is the identity.
- **Tension 3:** the defensible core is the **cross-substrate business-meaning + trust account no single environment sees** — n8n sees n8n, Claude Code sees its own runs; nobody sees "all the automation running this business, in business terms, and whether it's safe."
- **Carry the nulls honestly:** the n8n buyer is a guess and RevOps is uncorroborated — so under the **portfolio hat this is fine** (build the credible showcase), but we do NOT pretend we've validated a buyer.

This lean is deliberately falsifiable. The most likely ways it's wrong: (a) "trust/assurance" drifts Expliq into the crowded AI-governance lane we rejected; (b) "substrate-independent" is vapor and the only real thing is the concrete n8n tool; (c) the agentic-shift tailwind is overstated (power-user bias).

**Competitive validation (2026-06-01) — the lean HOLDS.** A 29-player adversarially-verified feature teardown (`_resources/expliq-competitor-discovery-census-2026-06-01.md` → Stage 2) maps every player on 9 pillars. Result: **business-meaning (F2), cross-substrate, trust-assurance, and ask-your-estate are all OPEN**; sync-inventory + structural-security (F13/F14) are OCCUPIED/commoditizing (don't compete); dep-map/black-box/business-impact are CONTESTED but only by occupants in the WRONG object cell (Make Grid on Make, CodeScene on code, Sifflet/Redwood on data/jobs). No player covers even TWO of the three differentiating pillars in the right object cell. This **falsifies worry (a)**: trust does NOT have to drift into the crowded lane — the *security-framed* trust lane is occupied (Zenity/Noma/AI-BOM), but the **behavioral "can you trust what this DOES in business terms" framing is OPEN** (the §6 D16 blade, now market-confirmed). The honest reframe the matrix forces: Expliq's territory is the **comprehension + trust layer ABOVE native inventory**, not inventory (Microsoft owns it) and not the security slice (commoditizing). Biggest threat = **Make Grid** (announced LLM "AI descriptions" coming "soon" — would own inventory+dependency+business-meaning inside the Make walled garden, still single-vendor → cross-substrate stays the defense). Remaining gate is no longer competitive but **demand intensity** (operator conversations).

## 6. The object-shift axis — "understand your automation" → "trust your AI" (2026-06-01)

Per's reframe (the sharpest move so far): "understand your automation" may be the **precursor** to "understand/**trust** your AI." The shift is in the OBJECT (automation → the AI *inside* the automation), not just the verb. This is a third axis, cross-cutting Altitude (§3) and Comprehension-vs-Trust (§5).

**The blade that decides whether this is brilliant or a trap = D16, one altitude up.** Per offered two phrasings; they land on opposite sides of the deterministic-vs-inferential line:
- **"trust your AI to do the *right thing right*"** → INFERENTIAL / predictive. Certifying the correctness of non-deterministic agent behaviour. This is (a) the **mirage** (you can't reliably predict/guarantee what a non-deterministic agent does — Part 12's false-confidence trap) and (b) the **most crowded lane there is** (LangSmith/Langfuse/Arize, Credo AI, Zenity, Tecto, Microsoft Agent 365), which we rejected on evidence; the buyer also flips to compliance/CISO, where a solo portfolio builder does not shine. **REJECT as primary.**
- **"trust *what* your AI does"** (what it touches, which credentials, where it's exposed) → STRUCTURAL / deterministic. Describable, verifiable, trustworthy. Lethal-trifecta, tool/credential inventory, "this AI step feeds an unreviewed outward action." **This is the F5/F13 family applied to the AI object. KEEP.**
- → It is the **same deterministic-vs-inferential line as D16**, one level up. The tool Per was wrestling with earlier is exactly what separates the good bet from the trap here.

**Object discipline (survival-critical).** "Understand your AI" becomes Tecto/Zenity the moment the object is "the AI *tools your employees use*" (shadow-AI, compliance buyer). It stays in Expliq's lane only if the object is **"the AI in the automations YOU BUILT."** This is the line F13 (D18-a) already drew; here it is load-bearing.

**Timing — not legacy→successor, but BASE→FRONTIER.** "Precursor" is only half right. Our verified evidence says agentic-at-scale is **hype today** (most "AI" = single-step LLM calls; "agent" = a label), and the deterministic plumbing is **the majority of what runs, for years.** So:
- **Base** = automation-estate comprehension (the stable majority, addressable NOW).
- **Frontier** = trust of the AI inside it (the growing, higher-stakes, more-trust-demanded layer — the *urgency/wedge*).
- "Trust your AI" is the right **north star / wedge**, but as *today's load-bearing* identity it bets the house on a substrate not yet deployed at volume. Lead with the frontier for urgency; carry the base for breadth and feasibility.

**Synthesis statement (refined):**
> Expliq understands and makes *trustworthy* the automation that runs your business — and that automation is increasingly AI. Led by the **frontier** (can you trust *what* your AI does — structurally), carried by the **base** (understand your whole estate). Trust = the structural kind, **not a compliance oracle**. Object = your *built* automations incl. their AI, **not** third-party AI tools.

**Implication for the §5 lean:** sharpens it. Frontier (structural AI-trust) leads as the urgency/wedge; base (estate comprehension) carries breadth; trust stays structural (the D16 good side), never inferential certification; object stays "your built automations incl. their AI." The crowded AI-governance lane and the false-confidence mirage are dodged by the D16 blade + object discipline, not by avoiding AI.

## 6b. VERDICT — "business translation for non-builders" DIES (2026-06-01)

The §6 business-translation idea (translate the technical workflow into business language so non-builders/business stakeholders understand it) was adversarially tested and **does not survive** (`_resources/expliq-business-comprehension-verdict-2026-06-01.md`, run `wf_51ce3a7f-db3`, ~11 refutes-to-1). Honest course-correction:
- **An automation resolves CODE-like, not data-like.** Sourcegraph/CodeScene/DeepWiki all serve engineers + agents, zero business-translation; data-catalog "business" glossaries serve data STEWARDS (a technical governance role), not arbitrary business users. An automation is an executing artifact whose logic only the maintainer needs.
- **Every consumer of "what does this do" is technical/regulatory** (developers, operators, internal audit, CISOs/CIOs, regulators) — no business/process owner demands a business-language translation. The real pattern is a business-IT **division of labor**, not business reading a translated artifact.
- **The killer:** a business-language gloss does NOT close the gap at the moment it matters (when it breaks, non-technical people still can't reason about it) — it relocates the gap; deep comprehension stays with the developer.
- **Agentic doesn't rescue it:** EU AI Act Art. 86 vests explanation in the affected END-PERSON, is outcome-level, and is Annex-III-high-risk-scoped (excludes ordinary ops/RevOps n8n); agent oversight = a technical-infra job for ops/security/audit.

**What this changes (and what it does NOT):** the comprehension VALUE survives **intact** — only the *audience* was wrong. Re-aim it at the **technical inheritor (builder onboarding, operator handover, the inheriting engineer, the auditor) + AI agents** — the "repo-walkthrough for your automation estate" framing the offering doc already leans on, now VALIDATED. So:
- §5 lean holds, with one correction: the audience is the **technical estate-owner + agents**, NOT business users. The "C-in-thesis / A-in-showcase + comprehension+trust ABOVE inventory" stays; "for those who depend but didn't build" (§6 synthesis) is **retired** — it's "for those who inherit/operate/oversee the estate."
- The §6 **object-shift to AI** survives ONLY in its structural/technical-trust form (the D16 good side), consumed by technical/agent oversight — NOT as business-facing AI-trust.
- The §6 **embeddable connector/MCP** door is validated for exposing comprehension to **AI agents** (Sourcegraph serves agents), NOT for "routing business-language to business stakeholders."
- Drop "in business terms" as the headline qualifier; keep F2 comprehension + the F4-map/F5-black-box-risk HERO, re-aimed at the technical inheritor.

Net: the last-hour business-user detour is cleanly killed; we are back on the original validated footing (technical-inheritor comprehension = repo-walkthrough), sharper for having tested it.

## 7. Open (Per writes challenges here; I respond in-file)

- [ ] (Per)
