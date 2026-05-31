# Vision: Sovereign, self-hosted, multi-agent support workflow — Brainstorming

> Status: exploration / vision-shaping. Not a patch spec yet. This is the starting point for shaping a "future of agentic automation" showcase, to be sharpened into a concrete plan (likely its own epic, not a small patch) once the open questions are answered.
> Append-only: add new sections at the bottom, annotate existing ones, do not rewrite.

## Goal

Build the expliq support stack into a **statement piece**: a workflow that demonstrates how autonomous, agentic automation should run *soon*, with the twist that it runs **on the owner's own infrastructure** (sovereign / self-hosted), not in a third-party cloud. Primary purpose is **maximum showcase value** for an n8n Product Builder application. Secondary: it must be **demonstrable live** (a reviewer may test it themselves).

The defining property is NOT "local for its own sake" and NOT "remove risk by removing autonomy". It is: **keep the agentic core, make it sovereign, and make it robust enough to survive a live test.**

## Why this is worth building (showcase thesis)

Per the research snapshot (`_resources/local-llm-hosting-model-choice-agentic-n8n-research-2026-05-30.md`):
- The n8n ecosystem markets self-hosted AI heavily, but **a robust, fully-local, multi-tool agentic workflow is the one thing nobody convincingly demonstrates** (tool-calling with local models is documented-fragile). That gap is the opportunity.
- Therefore a working sovereign multi-agent system is not "another Ollama chatbot"; it is the hard thing most builders avoid.

## Current state (what we evolve from)

The live `file_support_request` workflow (`3Mlx4jPSdle75zmW`) is a **single monolithic agent**:
- `Trigger -> Retrieve KB (pgvector + Ollama nomic-embed-text) -> Build context -> Triage Agent (Claude Sonnet 4 via OpenRouter, tools: GitHub MCP + Linear MCP) -> Format response (2nd Claude call + Structured Output Parser) -> Build audit -> Slack Audit -> Return`.
- The stack already uses the **tool-sub-workflow pattern**: `answer_expliq_question` (READ) and `file_support_request` (WRITE) are reusable sub-workflows behind two front doors (widget webhook + MCP server). This is the seed the multi-agent vision grows from.

## The vision: a sovereign support team

Evolve the single monolith agent into an **orchestrator + team of specialist agents**.

```
   Widget  /  MCP-Client (Claude Desktop)
                  |
                  v
      [ ORCHESTRATOR AGENT ]   local (e.g. Qwen 32B on vLLM):
                               "What does this request need? Whom do I delegate to?"
         | tools = the specialist sub-agents themselves
         |-- KNOWLEDGE AGENT    RAG over pgvector, answers questions        (READ)
         |-- BUG AGENT          structures repro, files GitHub issue (MCP)  (WRITE)
         |-- FEATURE AGENT      frames requirement, files Linear ticket(MCP)(WRITE)
         '-- ESCALATION AGENT   judges urgency, Slack alert (MCP)           (WRITE)
                  |
                  v
      consolidated reply  +  audit
```

Key properties:
- The orchestrator is **itself an agent** whose tools are other agents. Delegation happens **at runtime** (dynamic), not via fixed routing. It can follow up or pull in a second specialist if the first is insufficient. This is the "real agentic" magic the vision is about.
- Each specialist is its **own n8n sub-workflow** with its own agent node, focused system prompt, and own MCP tools. This is the existing `toolWorkflow` pattern, nested one level deeper.
- **Heterogeneous model-per-role** (an extra showcase hook): small fast local model for the orchestrator (routing only), larger local models for the complex specialists. "Right model per role", sovereign and self-hosted.

## Robustness strategy (keep the agent, harden around it)

The research says local + agentic + live is fragile UNLESS the foundation is strong. The levers that do NOT remove autonomy:
1. **Capable models, not toys.** 32B-class (Qwen / GLM), not 7B. Most fragility disappears at this tier.
2. **vLLM with guided / structured decoding** (not Ollama). The inference engine **enforces valid tool-call JSON at the machine level**. The agent stays fully free in its decisions but cannot emit malformed JSON. This attacks the root failure mode without beheading the agentic logic.
3. **Self-correction as part of the vision.** A validator / reflection step that re-runs an agent on failure. This is how robust future agents look (they catch their own errors), not a deterministic bypass.
4. **Cloud fallback as last-resort safety net only** (not the normal path), for live-demo insurance.

## Honest trade-offs / risks

- Multi-agent is the **most ambitious and most fragile** option. Every delegation hop is another tool call a local model can fail; errors compound (research cites 40-87% naive multi-agent failure rates).
- **Latency**: several local LLM chains in sequence can make a live request feel slow.
- Mitigation: keep the team **small** (orchestrator + 3-4 specialists, not a dozen), or the live-tauglichkeit tips over.
- This is the "highest upside, highest risk" choice, which is precisely why it has showcase value if it actually works.

## Cost / infra reality

- The current Hetzner cx23 (CPU, 8 GB) cannot host generative models. Need a GPU.
- Options: always-on GPU box (Hetzner GEX44 ~EUR 184/month) OR rent a GPU by the hour for demo windows (Vast.ai ~USD 0.30/h, RunPod scale-to-zero). For a job-application showcase, hourly/temporary is likely enough and far cheaper.
- Embeddings already run locally on the box and stay as-is.

## Open Questions (to be answered before this becomes a plan)

1. **Team size / shape.** Orchestrator + the 4 specialists above, or a leaner set (e.g. merge bug + feature + escalation into one "action agent")? Bigger team = stronger vision, more live risk.
2. **Model per role.** One model for all agents, or heterogeneous (small router + larger specialists)? Which concrete models (verify current Qwen / GLM versions + BFCL scores at decision time, the research flagged version uncertainty)?
3. **Hardening depth.** vLLM guided decoding only, or also a reflection/self-correction loop? Is a cloud fallback acceptable in the vision, or does "fallback to Claude" undercut the sovereignty story?
4. **GPU setup.** Always-on box vs hourly-for-demo. Where does it live (a new Hetzner GPU box separate from the n8n box, per the "model on a separate box" best practice)?
5. **Live vs artifact.** Confirmed "must be demonstrable live". How hard a live test do we design for (curated happy path vs reviewer hammering it with edge cases + concurrency)? This sets how much hardening is mandatory.
6. **Scope / home.** This is bigger than a patch. Does it become its own epic (e.g. Epic 21: Sovereign multi-agent support), replacing or sitting beside the current live `file_support_request`? The live demo widget must stay safe per DEPLOY-PORTFOLIO, so any build is parallel until proven.
7. **Does it replace Claude entirely, or coexist?** E.g. keep the current Claude version as the stable production path, build the sovereign multi-agent version as the "vision" variant on a separate path/workflow.

## References

- Research: `_resources/local-llm-hosting-model-choice-agentic-n8n-research-2026-05-30.md`
- Current stack: `CLAUDE.md` (Epics 18-20), `specs/20-n8n-mcp-server-door-results.md`
- Live workflow: `file_support_request` (`3Mlx4jPSdle75zmW`), `answer_expliq_question` (`QEkcrvHaatPMpj0J`)
- Deploy discipline: `DEPLOY-PORTFOLIO.md` (main = prod, parallel build + cutover)

## Discussion 2026-05-30: Is local hosting even sensible here? (OPEN, no decision made)

Question raised: is local hosting actually sensible for this multi-agent orchestration, and what is the benefit of local hosting at all? Honest assessment captured below. **No decision has been taken; this reframes the open questions above and should be resolved first.**

**Honest finding: for this workload itself, local hosting is NOT functionally sensible. The only standing driver in this case is showcase, not operations.**

Local-hosting benefits vs whether they apply to this case:
- Privacy / sovereignty (data never leaves own infra, GDPR, regulated industries): does NOT apply, demo support messages are not sensitive.
- Cost at high volume (hardware amortizes above ~millions of tokens/day): INVERTS here, demo traffic is cents/month on pay-per-token vs ~EUR 184/month for a GPU box. Local is more expensive at this volume.
- Offline / no vendor dependency (no outage, rate-limit, model deprecation): irrelevant for a cloud-deployed portfolio app.
- Latency: local on affordable hardware is slower for large agentic models, not faster.
- Control / fine-tuning: theoretically yes, not used here.
- Net: only the **sovereignty narrative** (proof of capability) applies. Legitimate, but it is a demonstration artifact, not cost-optimal operation.

**Key tension surfaced: local and multi-agent pull against each other.** Multi-agent multiplies inference (more calls, more chains, more latency, more places local tool-calling can break); local hosting is weakest exactly there. Multi-agent is the workload that stresses local hosting hardest. The vision above stacked two attractive ideas (sovereign AND multi-agent) that do not naturally complement, they compound risk.

**The real fork (STILL OPEN, no decision):**
- If **sovereignty** is the core message: keep the architecture simple and robust, a single hardened sovereign agent, not multi-agent.
- If **agentic orchestration** is the core message: use the tool that shows it reliably, i.e. cloud, or open-weight via hosted inference (Groq / DeepInfra; still open-weight, no model lock-in, just not self-hosted). This cannot tell the sovereignty story but tells the orchestration story well.

Reframe: making this trade-off *visibly* (local where it fits, cloud where reliability is critical, with stated reasoning) is itself the product-builder judgment an n8n team wants to see; it beats a dogmatic "all local" that breaks during a live test.

STATUS: open question, no decision made. The "sovereignty vs orchestration" fork should be resolved before answering open questions 1-7 (team size / models / GPU).

## Discussion 2026-05-30 (cont.): Is n8n even the right tool for multi-agent? (OPEN, no decision)

Second /explore run (multi-agent orchestration: n8n vs frameworks). Report: `_resources/multi-agent-orchestration-landscape-research-2026-05-30.md`. Findings that reshape this vision; again NO decision taken.

- **n8n does not position itself as a multi-agent framework.** It is the orchestration / integration backbone FOR agents; real multi-agent (cycles, shared state, dynamic delegation) belongs in a code-first framework (LangGraph de-facto). n8n's DAG cannot do native agent loops or shared state, caps iterations, has sub-workflow-as-tool and tool-parsing issues; orchestrator + 3-4 specialists is buildable via the gatekeeper pattern but fights the platform past ~3 levels / ~10 nodes.
- **Multi-agent is not the senior choice for support triage.** Triage is sequential single-decision work; single-agent-with-tools (what the current WF already is) is architecturally sound. Multi-agent costs ~15x tokens, compounds failure, adds latency, with no parallelism to justify it. SOTA consensus (Anthropic, Cognition, Gartner): start single-agent, add orchestration only when you can name the bottleneck.
- **Impressive vs naive for the application.** Experienced reviewers read "orchestrator + 4 specialists" for a sequential task as naive (CV-driven). Senior signals: knowing when NOT to use multi-agent, using n8n for its strengths, hybrid thinking, observability + evals.
- **Three-tension stack.** "Local multi-agent in n8n" now stacks: local (fragile + costly for this workload) + multi-agent (unneeded for triage) + n8n (overstretched for complex multi-agent). Each defensible alone, a risk cluster together.

Two senior paths that actually impress n8n (STILL OPEN):
- A) **Single-agent excellence:** keep the single-agent + tools design, add observability / traces, evals, deliberate model choice, with a written "why not multi-agent" rationale. Maturity over prestige.
- B) **Hybrid:** n8n as orchestration / integration layer + a framework (or a well-encapsulated agent) for reasoning, wired via MCP. Demonstrates n8n's own 2026 thesis.

STATUS: open, no decision. This reframes the fork further: less "sovereignty vs orchestration", more "what single deliberate statement (single-agent excellence, or n8n-as-orchestrator hybrid) best shows senior judgment", with local / multi-agent as optional justified accents rather than the headline.

## Final decisions (2026-05-30) — direction set, see ai-trust-showcase-plan.md

Decided with Per after the third /explore run (AI Trust) and an infra re-evaluation. No longer open.

- **Infra is elastic, not a blocker.** Earlier reasoning that treated the 4 GB box as a hard wall was wrong; a bigger / GPU box is trivial. Infra-driven exclusions are lifted.
- **Direction = single-agent excellence + AI Trust (path A).** Keep the single-agent + tools architecture; Claude stays the prod agent core. The headline is the AI-Trust layer (evals + observability + guardrails), which the role demands verbatim.
- **Multi-agent: out for the n8n demo**, for content reasons (sequential triage, single-agent is senior), not infra. Kept as a SEPARATE later learning project so Per gains real multi-agent-orchestration experience (also feeds the role's "harness literacy").
- **Local LLM: not a prod replacement; used as an eval comparison candidate** (local ~32B measured vs Claude on the golden dataset, GPU by the hour). This is the only place local delivers real demo value here (sovereignty + evals + data-backed "what belongs where").
- **Tracing: self-hosted Langfuse** (own/bigger box), for the sovereignty story, risk-free.
- **Golden dataset: CSV in repo as source of truth**, thin Google Sheet as the n8n-native eval adapter, optional promptfoo CI.

The concrete, phased build lives in `ai-trust-showcase-plan.md`. This vision file is now historical context for how that direction was reached.

## Implications for the existing n8n workflows (2026-05-30)

Practical landing: what both /explore runs (local-LLM + multi-agent) mean concretely for the current workflows. This narrows the work.

1. **Current architecture is already right; do not rebuild to multi-agent.** `file_support_request` is a single agent with tools, which is the senior choice for sequential triage. Multi-agent is not value-adding here and risks reading as naive. No multi-agent rebuild.
2. **Keep Claude / cloud for live prod.** Local does not pay off functionally for this workload (cost, latency, reliability). Local only as a deliberately framed showcase accent with hardening (GPU, vLLM, 32B), not for the production widget path.
3. **One clean technical fix: the formatter.** Replace the second Claude call (free text -> JSON) with a deterministic Code node, the agent emitting structured output. Confirmed by both research runs plus n8n's own "split reason+act from format" best practice. Low risk, saves a Sonnet call, makes actionsTaken / issue URL robust. Small patch scope. See `formatter-deterministic-brainstorming.md`.
4. **The real application lever: observability + evals.** What impresses an n8n team in 2026 is "enterprisiness" (traces + evals), which the workflows currently lack (no LangSmith/Langfuse, no eval suite). Low risk, high value, upgrades the existing single-agent design rather than replacing it. Larger than a patch; its own effort.
5. **Already hybrid, just unnamed.** The GitHub/Linear MCP tools, the sub-workflow-tool structure, and the two doors are already "n8n as orchestration backbone for agents", the pattern n8n promotes. Strong to narrate without building anything new.

**Resolution of the A-vs-B fork:** it effectively resolves to **A (single-agent excellence)**. B (pull in an external code-first framework as the agent brain) is a much larger rebuild, never requested, not needed for the showcase. Multi-agent and local-everywhere remain excluded. Net direction: keep the single-agent architecture, do the formatter fix (small), add observability + evals (the application trump card, its own effort).
