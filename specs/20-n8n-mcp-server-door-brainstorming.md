---
tags:
  - type/spec
  - status/brainstorming
  - epic/20
  - exercise/19
---

# 20 — n8n MCP Server Door — Brainstorming

> Upstream: [Epic 20 spec](20-n8n-mcp-server-door.md)
> **Decision history lives in [18-n8n-ai-support-triage-brainstorming.md](18-n8n-ai-support-triage-brainstorming.md)** (Rounds 1 to 9). This epic was carved out of Epic 18 as milestone M3 during the Round-9 split. The MCP-node use-case analysis (Round 5) and the MCP Server Trigger decision (Round 8) are recorded there.

## Carved decisions (from Epic 18 brainstorming)

- Add the native **MCP Server Trigger** to expose the support brain as MCP tools (Round 8), framing (i) only (mirror the support brain). Framing (ii) (governance-data tools) = future extension.
- Consumer = **Claude Desktop / Claude Code** (Round 8). The Expliq web app keeps using the webhook.
- Architecture: factor RAG + triage into reusable **tool sub-workflows** shared by both front doors; the MCP server is a separate workflow/trigger, not bolted onto the webhook flow.

## Open (epic-specific)

Use this file for any further `/refine` rounds scoped to Epic 20. Current open items are in the spec's Open Questions (MCP auth scheme + client config; whether the write tool is exposed via MCP in v1).

## Refinement Applied

Batch-refined via `/refine_all_ind`. See `specs/ind-epic-review.md` for details.

---

## `/refine` round — 2026-05-27 (reconcile with Epic 19's built architecture)

This file had **no open user challenges**, so this round is the reconciliation mandated
by the session handoff: align the spec's assumptions with what Epics 18/19 *actually*
shipped, plus the proactive review the skill prescribes. Findings were verified against
the committed workflow JSONs and the live n8n instance (node capabilities), not just read
off the spec. Each item ends with a concrete recommendation. Nothing here is applied to
the spec yet — that happens in Phase 2 after Per confirms.

> The prior `/refine_all_ind` pass (pass 11, `ind-epic-review.md`) only touched **AC 1**
> ("export the sub-workflows as committed JSON"). It did **not** examine the factoring
> entanglement, verify the MCP Server Trigger node, or pin the auth scheme. Those are the
> non-duplicative areas below.

### A. Reconciliation: spec assumptions vs. what's actually built

**A1 — The dedup premise holds (spec is correct here).** The RAG retrieval block really is
duplicated: `support-answer.workflow.json` and `support-agent.workflow.json` both carry an
*identical* `Retrieve KB chunks` (PGVector `load`, table `expliq_kb_vectors`, topK 4, same
Postgres cred), an *identical* `Embeddings Ollama` (`nomic-embed-text:latest`), and a
**byte-identical** `Build context` Code node. So "no duplicated KB/retrieval" (AC 1) is
real, justified deduplication — not a strawman. ✅ No change needed to the premise.

**A2 — Factoring the agent is a redesign, not a mechanical extraction.** The spec frames
factoring as "refactor … to *delegate* to these sub-workflows instead of inlining."
Reality: the live agent (`Triage Agent`, `@n8n/n8n-nodes-langchain.agent`) does
**answer + classify + act in one LLM call**. There is no internal "answer" vs. "act" seam
to extract. Splitting it into `answer_expliq_question` + `file_support_request` would
*change the agent's single-call design* (two sub-workflow calls + a merge), i.e. a rebuild
of the production flow, not a lift-and-shift.
*Recommendation:* the spec should state explicitly that factoring the **agent** workflow is
a behavior-affecting redesign, and gate it behind a regression check (see A4 + the missing
AC in §C). For v1 I recommend **not** rebuilding the live agent at all — see the decision in
"Open questions for Per" below.

**A3 — `Build context` and `Build audit` reference nodes by name.** `Build context` reads
`$('Webhook').first().json.body`; `Build audit` reads `$('Webhook')` **and** `$execution.id`.
Inside a *called* sub-workflow there is no `Webhook` node and the execution id differs, so
these break unless reworked to take explicit inputs (`query` / `message` / `history`). This
is the actual refactor cost and the spec doesn't mention it.
*Recommendation:* add a scope note that the factored sub-workflows take explicit typed
inputs and that `Build context` / `Build audit` are reworked to read those inputs (not
`$('Webhook')`).

**A4 — "The webhook flow" (singular) is stale — there are now two front doors + a live one.**
The spec was written when Epic 18's answer workflow was *the* webhook. After Epic 19 go-live:
the **agent** workflow (`B0YWkBWQa9NEfX9r`) owns the **production** webhook path
(`/webhook/expliq-support-agent`); the **answer** workflow (`hcTllLJwyQZcpO2O`) is kept active
purely as the **rollback**. The spec's "backward touch … refactors Epic 18's answer workflow
(and … Epic 19's agent workflow)" therefore proposes editing the **live prod path** and the
**rollback**, which threatens the demo discipline in `DEPLOY-PORTFOLIO.md` ("main IS
production", the live demo must not change except by a checklist-cleared merge).
*Recommendation:* see the prod-safety decision below; at minimum the spec must name *which*
workflow is refactored and keep the rollback's independence intact.

**A5 — Slack-audit placement is undecided once the write tool is MCP-exposed.** The Slack
audit is a deterministic **native** node (`n8n-nodes-base.slack`, bot token — confirming
Epic 19's D10 finding that Slack-MCP rejects non-partner clients) sitting on the agent's
*main path*, downstream of the agent. If `file_support_request` is exposed as an MCP tool,
we must decide whether the audit lives **inside** the tool sub-workflow (so MCP-initiated
actions are also audited — consistent with Epic 19's "every run → an audit line") or only on
the webhook front door (MCP calls then go un-audited). The spec's Open Question 2 doesn't
cover this consequence.
*Recommendation:* if the write tool is exposed at all, the audit must live inside the tool
sub-workflow so both doors are audited. (Another reason to keep v1 read-only — see below.)

**A6 — Cost note compounds via MCP.** Epic 19's results explicitly flag the agent path as
**two** Claude calls (agent + Format chain) vs. Epic 18's one. An external MCP client (Claude
Desktop/Code) calling `file_support_request` adds *its own* LLM turn on top → 3 LLM calls per
action. Read-only `answer_expliq_question` is one call.
*Recommendation:* note this in the spec; it reinforces the read-only-v1 recommendation.

### B. MCP Server Trigger node — instance-verified facts to fold into the spec

Verified against the live box (n8n **2.56.0**) via n8n-MCP, not doc-only:

- **B1 — Node type / version.** `@n8n/n8n-nodes-langchain.mcpTrigger`, displayName "MCP Server
  Trigger", `isWebhook: true`. **Use `typeVersion: 2`** (the node warns to use v2). Required
  prop: `path`. → The spec/runbook should name the exact type + v2.
- **B2 — Auth (grounds AC 2 + AC 4).** `authentication` is an enum: **`none` | `bearerAuth` |
  `headerAuth`**, **default `none`**. So "auth required / unauthenticated refused" is
  achievable — but auth is **opt-in**, so the spec must *require* selecting `bearerAuth`
  (Bearer is what n8n's own Claude Desktop guide uses: `MCP_URL` + `MCP_BEARER_TOKEN`) or
  `headerAuth` (matches the existing webhooks' `x-webhook-secret`). → Resolves Open Question 1's
  "auth scheme": **recommend `bearerAuth`** for Claude Desktop/Code compatibility.
- **B3 — Tool exposure + transport.** A sub-workflow is exposed as a named MCP tool by attaching
  the **"Custom n8n Workflow Tool"** node to the trigger (carries the tool name + description
  shown to clients). The trigger serves **both SSE and streamable HTTP**. → The spec's pattern
  is correct; name the attach node precisely ("Custom n8n Workflow Tool", not loosely "Call n8n
  Workflow Tool").

### C. Proactive review flags (skill checklist)

- **Hidden scope creep / prod risk:** the "backward touch" silently includes editing the
  **live production** agent workflow. That's the riskiest line in the spec and is buried in a
  scope sub-bullet. → Pull it out as an explicit, gated decision (see A2/A4).
- **Oversized slice:** AC 1 bundles (a) factor RAG, (b) factor triage, (c) refactor the answer
  workflow, (d) refactor the agent workflow, (e) re-export all — too much to build and verify
  in one pass. → Slice: ship `answer_expliq_question` + the MCP door first; treat triage
  factoring as a separate, optional slice.
- **Missing / untestable AC (important):** no AC asserts that the refactored front door(s)
  **still emit the same contract / behavior** as before the refactor. With prod live, this
  regression guard is essential. → Add an AC: "after factoring, each touched webhook front door
  returns a byte-equivalent contract for a fixed probe set (answer `{category,reply}`; agent
  `{category,reply,actionsTaken[],slackSummary}`)."
- **Inconsistent domain language:** the framing "**one** n8n workflow, two front doors"
  contradicts reality (indexer + answer + agent today, + MCP server + 1–2 sub-workflows after
  this epic = 4–5 workflows). It's a nice tagline but the spec body should say "one shared
  *brain* (sub-workflows), two front doors." Also "the webhook flow" (singular, AC 1) → there
  are two. → Tighten wording.
- **Ungrounded lean in Open Question 2:** it presents write-tool exposure as roughly neutral
  ("widens reach; sandbox + auth still apply"). Epic 19 had to add **prompt-injection
  hardening** precisely because the actioning endpoint is public (results D-tweak 4). An
  MCP-exposed write tool is *more* exposed (any agent pointed at the URL). → Recommend the spec
  default Open Question 2 to **read-only `answer_expliq_question` in v1**, write tool deferred.

### D. What I'd change in the spec (Phase 2, pending Per's confirmation)

1. Add the prod-safety / factoring-scope decision (A2 + A4) as the governing constraint.
2. Add the regression-guard AC (§C).
3. Pin MCP node facts: `@n8n/n8n-nodes-langchain.mcpTrigger` v2, `authentication: bearerAuth`,
   "Custom n8n Workflow Tool" attach node, SSE + streamable HTTP (B1–B3) — resolving Open
   Question 1's auth scheme.
4. Default Open Question 2 to read-only v1; note the Slack-audit-inside-the-tool rule if/when
   the write tool is ever exposed (A5).
5. Add the sub-workflow input/refactor note (A3) and the two-LLM-cost note (A6).
6. Tighten domain language: "one shared brain, two front doors"; "the webhook flow" → name the
   specific door(s) (§C).

### Open questions for Per (decide before Phase 2)

These two changes are scope decisions, so I'm surfacing them rather than deciding silently:

1. **Write-tool exposure (Open Question 2).** v1 = expose only read-only `answer_expliq_question`
   via MCP (my recommendation: lower blast radius, one LLM call, simpler auth story), or also
   expose `file_support_request` (write/action)?

2. **Factoring scope vs. the live prod path (the big one).** Two ways to honor AC 1 without
   risking the live demo:
   - **Option A (spec-literal):** refactor *both* live workflows — including the **prod agent** —
     to delegate to shared sub-workflows. Maximum dedup, but edits the live prod path and
     requires redesigning the agent's single-call flow → regression risk; needs the new AC + a
     careful preview→prod cutover.
   - **Option B (prod-safe, recommended):** v1 builds the `answer_expliq_question` sub-workflow;
     the **MCP server** exposes it; the **Epic-18 answer workflow (the non-prod rollback)** is
     refactored to delegate to it (proving the shared pattern on a safe path); the **live agent
     is left untouched** this epic (its retrieval stays duplicated until a later hardening pass).
     This delivers the MCP door + a genuinely shared sub-workflow while never touching prod. The
     trade-off: AC 1's "no duplicated retrieval" becomes "the MCP door and the answer front door
     share the sub-workflow" (the agent's copy is retired in a follow-up), so AC 1 would be
     relaxed accordingly.

Please answer 1 + 2 (or push back) below, then confirm and I'll apply the §D changes to the
spec.

---

## `/refine` round 2 — 2026-05-27 (Per's pushback; recommendations corrected)

### Q1 RESOLVED — expose the write tool (read-only-v1 lean withdrawn)

Per: "natürlich write tool exposen." Correct, and my read-only-v1 recommendation was an
unjustified scope cut that would have weakened the portfolio demo. The agentic action IS the
point of this milestone series, so the MCP door must expose both tools:
`answer_expliq_question` (read-only RAG) **and** `file_support_request` (classify + act).

The prompt-injection concern is a **hardening requirement, not a reason to drop the feature**.
It is handled by: required auth on the MCP server (`bearerAuth`), Epic 19's existing
prompt-injection guard + one-action cap (carried into the tool sub-workflow), and the
throwaway sandbox targets (GitHub `expliq-support-sandbox`, Linear "Expliq Support", Slack
`support-triage-audit`). Because the audit lives **inside** `file_support_request`, every
MCP-initiated action is audited too (this also resolves flag A5 cleanly).

### Q2 CLARIFIED — the factoring "dilemma" was overstated; Option B dropped

What Q2 is actually about: AC 1 wants "no duplicated KB/retrieval", i.e. one shared brain that
both front doors call. Today the retrieval block is copy-pasted identically into both the
answer workflow and the **live production** agent workflow. To share it, that logic moves into
sub-workflows the front doors call, which means editing the workflow that currently serves the
live demo. I turned that into a risky either/or and leaned toward "leave the live agent
untouched" (Option B). That was the corner-cut: it leaves duplication in place and is not the
cleanest solution.

The prod-safety part is already solved by the pattern Epic 19 itself used: build the refactored
workflow **in parallel**, verify all four categories against the sandboxes, then **cut over the
webhook path** (exactly the Epic-19 go-live). So there is no "don't touch prod" trade-off to
make. Full factoring (the former Option A) is the right call:

- Extract the shared **retrieval** block once (PGVector + Ollama + context build).
- `file_support_request(message)` = the full Epic-19 agent pipeline (retrieve, agent + GitHub
  `issue_write` + Linear `save_issue`, Format chain, Slack audit) packaged as a sub-workflow.
- `answer_expliq_question(query)` = the read-only RAG answer sub-workflow.
- The **webhook front door** (the widget) delegates to `file_support_request`, so its behavior
  is **preserved exactly** (same nodes, just wrapped). No agent redesign after all.
- The **MCP front door** exposes both sub-workflows as named tools.

This means flag **A2 dissolves** (it is wrap-as-sub-workflow, not a split of the agent's
single call) and **AC 1 stays literal** (no relaxation). The only genuine refactor cost is flag
**A3**: `Build context` / `Build audit` reference `$('Webhook')` and `$execution.id` by name,
which do not exist inside a called sub-workflow, so they are reworked to take explicit inputs.
Normal work, covered by the regression-guard AC.

### Revised §D (supersedes the read-only / Option-B items in round 1)

1. **Open Question 1 → resolved:** MCP Server Trigger auth = `bearerAuth` (Claude Desktop/Code
   compatible; node default is `none`, so set explicitly). Node `@n8n/n8n-nodes-langchain.mcpTrigger`
   typeVersion 2; tools attached via "Custom n8n Workflow Tool"; SSE + streamable HTTP.
2. **Open Question 2 → resolved:** expose **both** tools (`answer_expliq_question` +
   `file_support_request`). Carry Epic 19's prompt-injection hardening + one-action cap into the
   tool sub-workflow; audit lives inside `file_support_request`.
3. **Full factoring (Option A):** shared retrieval extracted; webhook delegates to
   `file_support_request` (behavior preserved); MCP exposes both. AC 1 stays literal.
4. **Add the regression-guard AC** (§C): each touched front door returns a byte-equivalent
   contract for a fixed probe set after factoring.
5. **Add notes:** sub-workflow explicit inputs / `Build context`+`Build audit` rework (A3);
   prod-safe parallel-build + cutover (the Epic-19 pattern); two-LLM-call cost via MCP (A6).
6. **Tighten domain language:** "one shared *brain* (sub-workflows), two front doors"; name the
   specific door(s) instead of "the webhook flow" (singular).

Awaiting Per's confirmation on the revised §D, then I apply it to the spec.

---

## `/refine` round 3 — 2026-05-27 (Per: the answer workflow is only the rollback)

Per is right, and this corrects a muddle I carried through rounds 1 and 2.

**Fact:** post Epic-19 go-live, the **agent** workflow (`B0YWkBWQa9NEfX9r`) is production and owns
the live webhook; the **answer** workflow (`hcTllLJwyQZcpO2O`) is **only the rollback**, frozen.

**The stale spec line:** the spec's scope says factoring "refactors Epic 18's answer workflow
(and … Epic 19's agent workflow) to delegate." That sentence was written **before** Epic-19
go-live, when the answer workflow was still the main webhook. It is now both:
1. **Stale** — the answer workflow is no longer a front door, so there is nothing to "share" with
   it; and
2. **Actively wrong** — a rollback must stay a **frozen, self-contained** snapshot. If it
   delegated to shared sub-workflows that keep changing, it would no longer be a reliable fallback.

So my rounds 1–2 treatment of the answer workflow as a refactor/share target (Option B, and the
"refactor the non-prod rollback to prove the pattern" line) is **withdrawn**.

**Corrected, simpler picture — Epic 20 touches only the agent workflow:**
- `file_support_request(message)` = the agent pipeline factored out as a sub-workflow.
- `answer_expliq_question(query)` = a read-only RAG sub-workflow, **built fresh** (not by
  refactoring the frozen backup), sharing the extracted retrieval block.
- The **agent webhook** front door delegates to `file_support_request` → behavior preserved.
- The **MCP** front door exposes both tools.
- The **answer workflow is left untouched** as the rollback.

**What AC 1 actually means now:** "no duplicated KB/retrieval" is about the **two live front doors**
(webhook + MCP) — both call the shared sub-workflows, so no duplication between them. The frozen
backup keeping its own old retrieval copy is fine and intended, not a violation.

**Re-revised §D (supersedes round 2 items 3 + 6 where they involved the answer workflow):**
- (1) auth = `bearerAuth`; node facts as in round 2. Unchanged.
- (2) expose both tools; hardening + audit inside `file_support_request`. Unchanged.
- (3) **Factoring touches only the agent workflow.** Extract shared retrieval; agent webhook
  delegates to `file_support_request`; MCP exposes both; **the answer/rollback workflow is
  explicitly out of scope and untouched**. AC 1 stays literal, scoped to the two live front doors.
- (4) regression-guard AC: applies to the **agent** front door only (its `{category, reply,
  actionsTaken[], slackSummary}` contract stays byte-equivalent after factoring). The answer
  workflow needs no regression check because it is not touched.
- (5) sub-workflow explicit-inputs rework (A3); prod-safe parallel-build + cutover; two-LLM cost
  note. Unchanged.
- (6) domain language: "one shared brain (sub-workflows), two **live** front doors"; the rollback
  is a frozen snapshot, not a front door.

Awaiting Per's confirmation on this re-revised §D, then I apply it to the spec.

---

## `/refine` round 4 — 2026-05-27 (FINAL agreed architecture, research-grounded)

The open design question (one tool vs. two; agent-backed vs. primitives) was verified via `/explore`.
Full report: `research/mcp-tool-design-best-practices-research-2026-05-27.md`. The findings settled it and
corrected one overstatement I had made in round 3.

**Research verdicts (grounded, with sources in the report):**
- **Read/write separation = confirmed best practice.** MCP defines tool annotations (`readOnlyHint`,
  `destructiveHint`, `idempotentHint`, `openWorldHint`); Claude Code/Desktop use them to auto-approve
  reads, gate writes, retry only idempotent calls, and parallelize reads. A fused read+write tool cannot
  be honestly annotated or safely gated. So: at least two tools, read separated from write.
- **Fewer, well-described tools beat many.** Berkeley Function Calling Leaderboard: 43% accuracy at 4
  tools, 2% at 51. Anthropic: "fewer, more thoughtful tools"; consolidate to workflow-level operations.
  So: a small, consolidated toolset.
- **"Agent behind a tool" is NOT a clean anti-pattern (correction to round 3).** It is explicitly
  sanctioned (OpenAI Agents SDK, LangGraph) when the server-side agent enforces value the client cannot
  replicate: consistent classification, safety gating, audit, context isolation. Epic 19's agent does
  exactly that (prompt-injection hardening, one-action cap, consistent triage, deterministic audit), so
  it earns being exposed as a tool. My round-3 lean toward "drop the agent, expose raw primitives" is
  withdrawn.
- **n8n practice** leans granular (single-responsibility sub-workflows) but ships an official
  "AI Agent as a Tool (context reducer)" template, so agent-as-tool is a sanctioned pattern there too.

**FINAL architecture (locked, confirmed by Per 2026-05-27):**
```
Gehirn (Epic-19 agent)  → extracted as sub-workflow  = "file_support_request"  (WRITE tool, agent-backed, carries the guards)
Read-only RAG           → new sub-workflow            = "answer_expliq_question" (READ tool, shares the retrieval block)

Widget door:  Webhook → delegates to file_support_request   (contract byte-equivalent, behavior preserved)
MCP door:     MCP Server Trigger (bearerAuth) → exposes BOTH tools
Backup:       Epic-18 answer workflow untouched (frozen rollback)
```

**Decisions locked:**
1. Two tools, read/write separated.
2. Write tool (`file_support_request`) stays **agent-backed** (Form 1); deterministic primitives (Form 2)
   considered and deferred.
3. Factoring touches **only the agent workflow**; the answer/rollback workflow is untouched.
4. `answer_expliq_question` is a read-only RAG sub-workflow sharing the retrieval block.
5. MCP Server Trigger `@n8n/n8n-nodes-langchain.mcpTrigger` v2, `authentication: bearerAuth`, tools
   attached via "Custom n8n Workflow Tool" nodes; SSE / streamable HTTP.
6. Prod safety via the Epic-19 parallel-build + verify + cutover pattern; a regression check guards the
   widget contract.

## Refinement Applied — 2026-05-27

Applied the locked architecture above to `specs/20-n8n-mcp-server-door.md`:
- **Scope** rewritten: factoring scoped to the agent workflow only; the two named tool sub-workflows
  (`file_support_request` write/agent-backed, `answer_expliq_question` read-only) sharing one retrieval
  block; widget webhook delegates to `file_support_request`; answer/rollback workflow explicitly
  untouched; MCP Server Trigger node facts pinned (type v2, bearerAuth, Custom Workflow Tool attach).
- **Acceptance Criteria**: AC1 scoped to the two live front doors + agent-only refactor; AC2/AC3 expose
  both tools with bearer auth; AC4 unauth refused; AC5 runbook; new AC6 = regression-guard on the widget
  contract + parallel-build cutover.
- **Out of Scope**: added "answer/rollback workflow untouched" and "write-as-primitives deferred".
- **Domain Terms**: updated for the two specific tools + read/write separation; pinned the node type.
- **Open Questions**: both resolved (auth = bearerAuth; write tool exposed, agent-backed) and removed.
- Added a pointer to `research/mcp-tool-design-best-practices-research-2026-05-27.md`.
