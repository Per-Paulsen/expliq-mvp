---
tags:
  - type/reference
  - status/done
  - epic/20
---

# MCP Server Tool-Design Best Practices — State of the Art (2026-05-27)

> Generated via /explore. 4 sub-questions investigated in parallel by Explore subagents.
> Purpose: verify the architecture claims made while refining Epic 20 (the n8n MCP Server Door),
> specifically whether to expose one fat agent-backed tool, two tools, or granular primitives,
> and where decision intelligence should sit when the consumer is Claude Desktop/Code.

## Executive Summary

1. **Read/write separation is a confirmed best practice.** MCP defines tool annotations
   (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`) precisely so clients can
   treat queries and mutations differently. Claude Code/Desktop auto-approve read-only tools, gate
   destructive ones behind confirmation, retry only idempotent ones, and even parallelize read-only
   calls. Fusing a read and a write into one tool forfeits all of this.
2. **Fewer, well-described tools beat many.** Strong consensus that tool-selection accuracy collapses
   as tool count grows (Berkeley Function Calling Leaderboard: 43% at 4 tools → 2% at 51). Anthropic:
   "fewer, more thoughtful tools"; consolidate raw endpoints into workflow-level operations; <15 tools
   for static inclusion.
3. **"Agent behind a tool" is NOT a clean anti-pattern.** This is the key correction. The agent-as-tool
   / subagent pattern is explicitly sanctioned (OpenAI Agents SDK, LangGraph) **when the server-side
   agent enforces value the client cannot replicate**: deterministic classification consistency, safety
   gating, audit/compliance, or context isolation. It is only a smell when it merely wraps simple
   deterministic ops the client could call directly, or when opacity harms traceability the client needs.
4. **n8n practice leans granular but sanctions agent-as-tool.** Community guidance favors atomic,
   single-responsibility tool sub-workflows ("don't expose every workflow"), but n8n ships an official
   "AI Agent as a Tool (context reducer)" template, framing agent-behind-tool as a legitimate
   context-management optimization, not the default.

**Net verdict for Epic 20:** the one fused tool is the weakest option (it violates read/write
separation). Beyond that, both "a small set of deterministic primitives" and "a read tool + one smart
agent-backed write tool" are defensible. The deciding factor is whether the server-side agent earns its
opacity by enforcing things Claude can't (Epic 19's injection hardening, one-action cap, consistent
classification, deterministic audit) — it does, which materially weakens the earlier "just drop the
n8n agent and expose raw primitives" position.

## Sub-Topic 1: Does MCP recommend separating read-only from write tools?

**Verdict: Yes, recommended (not formally mandated).** The MCP spec provides four tool annotation hints:

- **`readOnlyHint`** (default `false`): the tool does not modify its environment.
- **`destructiveHint`** (default `true`, only meaningful when not read-only): performs irreversible
  changes (delete/overwrite) vs. additive ones (create/append).
- **`idempotentHint`**: repeated calls with identical args have the same effect as one → safe to retry.
- **`openWorldHint`**: interacts with external entities (APIs/internet) vs. a closed local domain;
  flags exfiltration risk when combined with write access.

How clients use them:
- **Claude Code/Desktop** implement graduated confirmation: read-only tools from trusted servers can
  auto-approve; destructive tools always require explicit confirmation; idempotent tools enable
  automatic safe retries (exponential backoff). Claude Code also dispatches `readOnlyHint: true` tools
  concurrently (~2x), while non-read-only tools serialize to avoid conflicting mutations.
- Annotations are **hints, not guarantees** ("annotations are not guaranteed to faithfully describe
  tool behavior") — untrusted unless from a trusted server. They feed policy/UX, not security
  enforcement.
- Security guidance (Descope, Google Cloud) recommends defaulting to read-only tools and gating writes
  behind explicit roles/human approval (principle of least privilege; reduces Simon Willison's "lethal
  trifecta" blast radius).

**Implication:** a tool that sometimes only answers and sometimes creates a GitHub issue cannot be
honestly annotated (neither cleanly read-only nor cleanly destructive) and cannot be safely
gated/retried by the client. That is the concrete, spec-grounded reason not to fuse read + write.

## Sub-Topic 2: Tool granularity vs. selection accuracy

**Verdict: Strong consensus that too many tools degrades accuracy; aim for a small, well-described set.**

- **Benchmark:** Berkeley Function Calling Leaderboard — **43% accuracy at 4 tools → 2% at 51 tools** on
  calendar tasks (TianPan.co, Apr 2026). (Note: the figure cited in our earlier n8n research file,
  "43%→14% for the full GitHub MCP toolset", was **not** reproduced by this pass; the robust,
  primary-sourced benchmark is 43%→2% on a different dataset. The *direction* — severe degradation with
  many tools — is solid; the exact "14%" should be treated as unverified. See Gaps.)
- **Thresholds (TianPan):** <15 tools → static inclusion; 15–40 → semantic retrieval; 40+ → layered
  routing; 200+ → tool-to-agent retrieval.
- **Token cost:** ~58 tools ≈ 55k tokens before any conversation; Anthropic's Tool Search pattern cuts
  34–64% by loading defs on demand.
- **Anthropic naming/description guidance:** consolidate related operations into higher-level tools
  (one `schedule_event`, not separate `find_availability` + `create_event`); consistent prefix
  namespacing; descriptions state *what* and *when to use*; "if a human engineer can't decide which
  tool to use, neither can the agent"; "fewer, more thoughtful tools outperform many generic wrappers."

**Implication:** this tempers naive "expose maximal primitives." The right grain is *workflow-level
operations*, a handful of them — not one fat tool and not dozens of micro-primitives.

## Sub-Topic 3: Is "an agent behind a tool" an anti-pattern?

**Verdict: No — context-dependent, and explicitly sanctioned by major frameworks.** This corrects the
earlier, too-strong claim that an LLM-agent behind an MCP tool is a "smell."

Arguments for deterministic primitives (Anthropic): tools are "a contract between deterministic systems
and non-deterministic agents"; prefer predictable, composable, clearly-defined operations; assume the
client agent is the decision-maker.

Arguments for agent-as-tool (legitimate counter-pattern):
- **OpenAI Agents SDK** codifies the "manager / agents-as-tools" orchestration pattern (production-grade).
- **LangGraph subagents** recommend a sub-agent per distinct domain, citing **context isolation** (the
  sub-agent reasons in a clean window without bloating the caller's context).
- Server-side agents are a valid **enforcement point** for mandatory safety checks, audit traces, and
  policy gates the client cannot replicate (Microsoft "Securing MCP"; TrueFoundry).

Deciding factors for where decision intelligence sits:
1. **Context isolation** — keep specialist reasoning server-side if it would pollute the client's context.
2. **Safety gating / compliance / audit** — server-side if the client can't enforce it.
3. **Determinism** — expose primitives if "what will happen?" must be answerable in advance; agent-as-tool
   is fine when the output depends on the sub-agent's probabilistic judgment (e.g. "classify urgency").
4. **Client capability** — a capable client (Claude) can orchestrate primitives well; a scripted/dumb
   client benefits more from a server-side agent doing the thinking.
5. **Auditability/transparency** — primitives when the client needs visibility the agent-tool hides.

**Anti-pattern only when:** the sub-agent merely delegates simple deterministic ops the client could call
directly, or its opacity obscures traceability the client needs.

**Implication for Epic 19/20:** the n8n agent enforces real server-side value (prompt-injection
hardening, one-action cap, consistent classification, deterministic Slack audit, grounding rules) — i.e.
the legitimate justification for agent-as-tool. So "drop the agent, expose raw primitives" is not the
clear SOTA winner; it's a genuine trade-off.

## Sub-Topic 4: n8n MCP Server Trigger — primitives or one agent-backed tool?

**Verdict: community/guides favor granular single-responsibility sub-workflows, but agent-as-tool is a
sanctioned specialized pattern.**

- The MCP Server Trigger exposes only explicitly attached workflows as tools (each with name/description/
  input schema), keeping the surface "lean and controlled." Bearer token auth recommended; workflow must
  be active/published; SSE supported (single-server in queue deployments).
- Infralovers guide (Mar 2026): "Do not expose every workflow as an MCP server"; start with one or two;
  favor atomic, composable units (`fetch_top_news`, `send_slack_message`).
- n8n ships an official template **"MCP Server with AI Agent as a Tool (Context Reducer)"** — a GitHub
  agent behind a single MCP tool to keep the primary LLM's context lean. Framed as a context-management
  optimization, not the default tool-design philosophy.
- n8n's own docs prescribe mechanics, not a tool-design opinion; the "granular" consensus is community-
  sourced.

## Consolidated Sources

Primary / official:
- [MCP Tool Annotations — spec blog (risk vocabulary)](https://blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/) (2026-03-16)
- [MCP Schema Reference 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/schema) (2025-06-18)
- [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp) (2026)
- [Anthropic — Writing Effective Tools for AI Agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
- [Claude API — Define Tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools)
- [OpenAI Agents SDK — Orchestration & Handoffs](https://developers.openai.com/api/docs/guides/agents/orchestration) (2025)
- [LangChain — Subagents](https://docs.langchain.com/oss/python/langchain/multi-agent/subagents) (2025)
- [n8n Docs — MCP Server Trigger node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.mcptrigger/)
- [n8n Template — MCP Server with AI Agent as Tool (Context Reducer)](https://n8n.io/workflows/4475-mcp-server-with-ai-agent-as-a-tool-context-reducer/)

Secondary / community:
- [TianPan — The Tool Selection Problem](https://tianpan.co/blog/2026-04-09-tool-selection-problem-agent-tool-routing-at-scale) (2026-04-09)
- [Spring AI — Dynamic Tool Discovery (34–64% token savings)](https://spring.io/blog/2025/12/11/spring-ai-tool-search-tools-tzolov/) (2025-12-11)
- [Microsoft — Securing MCP: A Control Plane for Agent Tool Execution](https://developer.microsoft.com/blog/securing-mcp-a-control-plane-for-agent-tool-execution) (2025)
- [Descope — MCP Server Security Best Practices](https://www.descope.com/blog/post/mcp-server-security-best-practices)
- [Google Cloud — Prevent read-write MCP tool use](https://docs.cloud.google.com/mcp/prevent-read-write-tool-use)
- [TrueFoundry — MCP Server Security Best Practices](https://www.truefoundry.com/blog/mcp-server-security-best-practices)
- [Infralovers — n8n as Agentic MCP Hub](https://www.infralovers.com/blog/2026-03-09-n8n-agentic-mcp-hub/) (2026-03-09)
- [n8n Community — Multi-Agent Patterns with MCP Triggers](https://community.n8n.io/t/exploring-multi-agent-patterns-in-n8n-using-mcp-triggers-clients-without-webhooks/114944)
- [Synta — n8n MCP Server Trigger with Claude setup](https://synta.io/blog/n8n-mcp-server-trigger-claude)
- arXiv: [Tool Preferences are Unreliable](https://arxiv.org/pdf/2505.18135) (2025); [Agents as Tool-Use Decision-Makers](https://arxiv.org/html/2506.00886v1) (2025); [MCP-Atlas benchmark](https://arxiv.org/html/2602.00933) (2026)

## Open Questions / Gaps

- The "43%→14% for the full GitHub MCP toolset" figure in our prior n8n research file was not confirmed;
  the robust primary benchmark is 43%→2% (4→51 tools, different dataset). Treat "14%" as unverified; the
  qualitative claim (many tools → sharp accuracy loss) stands.
- No source gives a hard rule for "agent-as-tool vs. primitives" — it remains a judgment call on the five
  deciding factors. Authoritative guidance is principles, not a decision procedure.

## Revisit Triggers

- Re-run if the MCP spec revises tool annotations or adds an enforcement (vs. hint) model.
- Re-run if Anthropic publishes updated agent/tool-design guidance superseding "Writing Effective Tools."
- Re-check n8n docs if the MCP Server Trigger node gains tool-design guidance or new auth modes.
- Every ~6 months while agentic tool-design norms are still moving.
