---
tags:
  - type/design
  - status/in-progress
---

> Genesis + full exploration arc: [expliq-offering-exploration.md](patches/expliq-offering-exploration.md) §16-29. This file is the focused, forward design surface for the direction that arc converged on. Refine here; the exploration log stays as history.

# Expliq , the Human-Agent Inbox (design)

## What it is (one line)
A purpose-built, persistent, bidirectional space where AI agents/automations and the humans accountable for them collaborate around the BUSINESS CASES they jointly serve. Each agent reports INTO its business case (not into Slack/email), with full formalized context; the human steps in (owner / creator / HITL) where needed. Natural language on the surface; a structured, auditable system-of-record underneath.

## The moat (core functionality)
The **business-case system-of-record**: for each business case, Expliq holds the structured + auditable decision log, context, roles, and history that are BORN in Expliq and exist nowhere else. No inbox tool, chat tool, or agent framework has this. It builds directly on Expliq's existing core: the pre-computed business meaning / impact / criticality per automation.

## Two non-negotiables
1. **NL surface, indispensable.** The agent declares, at runtime, what input it needs; the human answers in natural language (voice or text), wherever their client is. No pre-built forms (that is the legacy, gotoHuman-style paradigm). Forms assume the asks are enumerable in advance; in the agent era they are open-ended, so the agent declaring its own ask is the right abstraction.
2. **Structured, auditable record underneath, essential.** Every exchange resolves into a clean, structured, auditable fact in the business case ("APPROVED by Per, 14:32, rationale ..."), not a chat blob. This is the moat; without it we are just chat.

## Expliq as the Notary (the second LLM use case)
The LLM's job here is NOT to decide. It is to turn the NL exchange between agent and human into the binding, structured **decision-log** entry in the system-of-record. Conversation in, auditable fact out. The raw NL is kept verbatim + immutable alongside the structured fact.

## Surface = MCP-native
The inbox is a protocol, not a web-app card stack. The human answers from wherever their MCP client is (Claude Code today; a light voice/mobile surface later). Expliq is the persistent context + home BEHIND the MCP, not another UI (consistent with §16: Expliq is the durable layer behind the tool). Open question: a light non-dev surface is still needed for the business owner who does not live in an agentic client.

## Delivery vs answering (the push/pull constraint, verified 2026)
Verified against current Claude/MCP behavior: there is NO proactive push from an MCP server into an idle Claude client, and Claude Code has no notification inbox a server can populate. (Server-side elicitation/sampling exist only within an active, client-initiated tool call, and are not yet supported in Claude Code anyway.) So the surface splits into two jobs:
- **Doorbell (notification / push):** "you have a pending decision on case X." Can go anywhere: email / Slack / mobile / Expliq's own light surface. Just an alert.
- **Answering (pull):** the human fetches the case from Expliq and responds, either in an interactive Claude session via Expliq's MCP, or in Expliq's own light surface.

Expliq stays the persistent home (holds the cases); the channels are only doorbells (reinforces §16: Expliq is the home behind the MCP, not the notification channel). Implication: because neither Claude-push nor cloud routines deliver to the human, Expliq likely needs its OWN light answer surface (especially for the non-dev owner), alongside the MCP-pull path for agentic users.

## Dynamic roles
The human's role (owner / creator / HITL) is not rigidly pre-assigned; it is derived at runtime from the case context AND from the agent's declared need, grounded in Expliq's stored relationships per case. Flow: agent declares need -> Expliq resolves who + role from the case -> routes -> human answers -> persisted.

## End-to-end flow (worked example: Accounts Receivable / Dunning)
*Pre-existing in the case (Expliq's core):* Business Case "AR / Dunning". Holds the n8n dunning workflow with Expliq's pre-computed context (meaning: "sends payment-demand emails to overdue customers"; impact: "revenue + customer relationship"; criticality: high), owner = Per (RevOps), HITL rule: relationship-sensitive sends need owner sign-off.

1. **Agent declares its need (MCP, runtime).** The WF is about to send the firm dunning to ACME (45d, 80k) but flags "ACME = top-10". Calls Expliq's MCP: *"Need input. Case: AR/Dunning. Situation: ACME 45d/80k, firm template ready, top-10 account. Ask: firm / soften / skip? Type: decision + optional free text."* -> case entry created, state `awaitingInput`, with the declared ask + data snapshot. No form; the agent defines the question.
2. **Expliq resolves who/role + attaches context.** Knows owner = Per, HITL rule applies; attaches the pre-computed context (meaning/impact/criticality, ACME history); routes to Per in role owner/HITL.
3. **Per answers naturally, where he is (Claude Code / voice).** *"Soften. ACME CFO emailed me, paying next week. Friendly reminder, no legal CC."* -> raw NL stored verbatim + immutable.
4. **Expliq-LLM = the Notary.** Turns NL + ask + context into the structured fact: `{ decision: soften, template: friendly-reminder, cc_legal: false, rationale: "ACME CFO confirmed payment next week (per owner)", by: Per, role: owner, at: 14:32 }`. Both raw NL and structured fact persist.
5. **Agent receives the structured result via MCP, acts** (friendly reminder, no legal), action + outcome flow back into the case, state -> `complete`.
6. **Persistence / precedent.** The case now holds ask + context + NL + decision + action + outcome. Next time, precedent exists ("ACME -> soften, owner-approved"). The system-of-record grows with every exchange. This is what Slack, gotoHuman, and Linear do not have.

## Is Expliq itself agentic?
Core: NO, and better not. Core = system-of-record + deterministic routing/persistence + ONE LLM function (the Notary: NL -> decision log). The agency lives in the n8n agents (already there) and, at most, in a THIN ADVISORY layer on top (suggest a decision from case context, summarize open cases, "ask your estate") that NEVER owns the record or makes the decision. §16 principle: be the deterministic, durable layer; the reasoning is commoditized. Keeping the core non-agentic is what makes Expliq the trustworthy home rather than "another agent you cannot trust".

## Any agent substrate is a tenant, including Claude Code routines
A Claude Code Routine (a cloud-hosted, webhook-fireable, autonomous Claude agent) is just another agent in the estate, the same as an n8n workflow, a Make scenario, or a custom agent. Expliq gives it a business case, computes its meaning/impact/criticality, and is its system-of-record, exactly like any other. This is the vendor-neutral thesis made concrete across two real substrates (n8n + Anthropic routines), composed over MCP.

**Elegant closure (it solves the routine's own problem):** a routine is headless and cannot reach a human; its output is "homeless" (it only produces side-effects). If its side-effect is "report into its Expliq business case" (via Expliq's MCP connector, which a routine can include), then Expliq becomes its home: the routine writes its actions/decisions + its "needs input" ask into the case, and Expliq handles persistence + the human bridge (doorbell + pull). §17 (homeless output -> fitting home) applied directly to routines. The routine never has to reach the human; it reaches Expliq, and Expliq is the bridge.

**Consistency:** the routine IS agentic, but it is an EXTERNAL agent (Anthropic cloud), like an n8n workflow is an external agent (the n8n box). It does NOT make Expliq agentic; Expliq stays the non-agentic home the agent reports to.

**Bidirectional bonus:** Expliq holds where routines report INTO, and could also FIRE them (the `/fire` webhook is a deterministic call). A case can dispatch a routine -> the routine does the work -> the result returns to the same case. The bidirectional work-exchange, with routines as one "worker" type. Expliq's role stays dispatch + record (deterministic), not reasoning.

This is a generalization that reinforces the core (same loop: agent reports into its case, human steps in via pull), NOT scope-creep. "Agent" now simply may also be a routine.

## What we borrow (from the 3 closest analogues; full borrow/gap in §29)
- **Linear AgentSession:** the case as a persistent lifecycle object (state machine) + immutable activity log (thought/action/elicitation/response/error) + delegate-vs-assignee accountability (human owns, agent acts) + agent-as-app-identity.
- **gotoHuman:** the in-item executable "go", one neutral ingest contract behind many doors (n8n/Make/MCP/SDK), the item-that-evolves (`updateForReviewId`), approvals-as-reusable-dataset.
- **LangChain Agent Inbox (MIT):** the minimal verb contract (accept/edit/respond/ignore) with per-item permission flags, the pause -> decide -> resume loop, the principle that the durable record lives in case STATE not the view.

## What makes it distinct
- vs **gotoHuman:** dynamic agent-declared asks + NL/voice responses + MCP-native (not static forms/cards/web-edit), plus business-case organizing unit + pre-computed context + persistent home.
- vs **Slack/email:** built for human-to-human; agent-to-human is a different communication class; here it lands context-rich, persistent, and auditable, in the business case.
- vs **Linear/Jira/Workday/Microsoft:** organizing unit is the BUSINESS CASE (shared human-agent purpose), not an issue / agent-identity / registry; and it carries Expliq's pre-computed business context, which none of them compute.

## Open design questions
1. **The Business Case data structure (next):** fields, entry types, exactly what the decision log stores, how raw-NL and structured-fact relate, how precedent is surfaced.
2. **The non-dev owner's surface** besides MCP/Claude Code (light web/voice/mobile).
3. **NL -> structured intent for multi-turn exchanges:** where the Notary runs, single-call vs evolving extraction.
4. **Demand** is deliberately a design/portfolio bet, not a gate (per the §28 methodological correction: research orients, it does not veto a not-yet-built idea).
