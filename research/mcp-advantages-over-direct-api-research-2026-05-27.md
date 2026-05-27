---
tags:
  - type/reference
  - status/done
  - topic/mcp
---

# MCP's Advantage over Direct API Use — State of the Art (2026-05-27)

> Generated via /explore. 4 sub-questions investigated in parallel by Explore subagents.
> Context: settles the recurring question "if a capable agent can just use an API directly, what does
> MCP actually buy?" Companion to `mcp-tool-design-best-practices-research-2026-05-27.md`.

## Executive Summary

MCP's advantage over direct API access is **not a capability advantage**: a capable model given an API
spec plus a generic execution tool can already drive any API (function calling / "give it curl"). MCP
wins on three other axes: **(1) standardization** that collapses the N×M integration problem to N+M
(Anthropic's own framing: 10 apps × 100 tools = 1,000 bespoke integrations becomes N+M); **(2) a security
trust boundary** the MCP spec *mandates* (servers hold credentials, MUST NOT pass client tokens through,
which keeps secrets out of the model's context and breaks the prompt-injection "lethal trifecta"); and
**(3) an ecosystem/distribution effect** (10,000+ servers, all major SaaS vendors ship official ones, one
server serves Claude Desktop + Cursor + IDEs at once). The honest counterweight is strong and recent:
MCP imposes real token cost (GitHub's MCP ~42k tokens before any work; Perplexity cited up to 72% context
waste and moved back to direct APIs/CLIs in March 2026), latency, and complexity that is pure overkill for
a single known integration or an internal tool. Even Anthropic has dampened the "expose all tools" model
(its "code execution with MCP" guidance has agents load only needed tools). **Resolution: MCP is
effectively a necessity at ecosystem scale (many agents × many tools, multi-client, you-are-the-provider,
or you need the credential boundary) and overkill for a single, known, self-controlled integration.** This
maps exactly onto our own build: GitHub/Linear via MCP (vendor published once, we consumed for free) vs.
Slack via a native node (one known integration, direct API was the right call).

## Sub-Topic 1: What does MCP add over plain function calling / direct API?

**Verdict: standardization and reusability, not capability. Convenience that becomes a necessity at scale.**

- **N×M → N+M, stated by Anthropic:** "Before MCP, connecting ten AI applications to 100 tools meant
  potentially 1,000 different custom integrations. MCP reduced this to ... implement the client protocol
  once, implement the server protocol once, and everything works together"
  ([Anthropic, Nov 2024](https://www.anthropic.com/news/model-context-protocol)).
- **Function calling stays vendor-specific:** OpenAI's tool format differs from Anthropic's; switching
  models means redefining tools. MCP (JSON-RPC 2.0, LSP-style) is vendor-neutral, "a USB-C port for AI
  applications" ([modelcontextprotocol.io](https://modelcontextprotocol.io)).
- **Dynamic discovery:** function calling sends a static tool list per request; MCP exposes `tools/list`
  at runtime and routes across many servers
  ([MarkTechPost, Oct 2025](https://www.marktechpost.com/2025/10/08/model-context-protocol-mcp-vs-function-calling-vs-openapi-tools-when-to-use-each/)).
- **Necessity vs convenience:** sources converge on "strategic convenience that became a necessity at
  scale" because maintaining M×N custom connectors gets cost-prohibitive; OpenAI, Google, and AWS all
  adopted MCP through 2025, and Anthropic donated it to a Linux-Foundation body (Dec 2025)
  ([DEV, Jan 2026](https://dev.to/ajeetraina/one-year-of-model-context-protocol-from-experiment-to-industry-standard-5hj8)).

## Sub-Topic 2: The security / trust-boundary advantage

**Verdict: the strongest non-hype advantage. The model should never hold prod write-credentials; MCP's
spec mandates the boundary.**

- **Credential containment (mandated):** the MCP spec requires servers to hold credentials and forbids
  "token passthrough" (a server MUST NOT forward a client-supplied token downstream), so secrets stay out
  of the model's context
  ([MCP Authorization spec, Nov 2025](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)).
  (Reality check: Astrix found only 47% of servers actually use secure credential methods
  ([Astrix, 2025](https://astrix.security/learn/blog/state-of-mcp-server-security-2025/)).)
- **Breaks the lethal trifecta:** Simon Willison's "lethal trifecta" (private data + untrusted content +
  external comms) is unconditionally exploitable via prompt injection; if the model never sees the
  credential, a successful injection still cannot extract or escalate it
  ([Willison, Jun 2025](https://simonw.substack.com/p/the-lethal-trifecta-for-ai-agents)).
- **Least privilege + audit + rate limit, enforced where the model cannot bypass it:** expose only scoped
  operations (RFC 8707 resource indicators bind tokens to a server/scope); log every call; cap rate
  server-side ([TrueFoundry](https://www.truefoundry.com/blog/llm-access-control);
  [OWASP MCP Top 10, 2025](https://owasp.org/www-project-mcp-top-10/2025/MCP01-2025-Token-Mismanagement-and-Secret-Exposure)).
- **Caveat for balance:** MCP standardizes the *right* boundary but does not guarantee a secure
  implementation. 43% of tested MCP servers had command-injection flaws; the spec defines but does not
  enforce best practice
  ([Equixly, Feb 2026](https://equixly.com/blog/2026/02/12/how-mcp-servers-challenge-traditional-api-security-models/)).

> This directly confirms the "knowing vs. doing" point: the model can construct the call, but it must not
> be the credentialed executor. Some execution layer must hold the secret; MCP standardizes that layer.

## Sub-Topic 3: The skeptical / critical case (honest)

**Verdict: for a single known integration, internal tool, or token/latency-sensitive path, direct API or
function calling is as good or better. The backlash is real and recent.**

- **Token cost:** a baseline Claude Code MCP setup burns 50k–67k tokens before first input; GitHub's MCP
  alone ~42k ([GetUnblocked, 2026](https://getunblocked.com/blog/mcp-token-budget-autopsy/)). Perplexity's
  CTO cited tool-schema overhead consuming up to **72%** of the context window as the reason for moving to
  direct APIs/CLIs (Mar 2026)
  ([awesomeagents](https://awesomeagents.ai/news/perplexity-agent-api-mcp-shift/)).
- **Overkill for small/internal/known cases:** "you probably don't need MCP" for 2–3 functions or
  software-to-software integration with no agent
  ([NoCodeAPI, 2025](https://nocodeapi.com/tutorials/you-probably-dont-need-mcp-when-direct-apis-beat-protocol-complexity/);
  [Improving, 2025](https://www.improving.com/thoughts/when-mcp-is-not-the-right-choice/)).
- **Latency:** 100–300ms gateway overhead per call compounds across multi-call workflows
  ([GetMaxim, 2026](https://www.getmaxim.ai/articles/fastest-enterprise-mcp-gateway-in-2026/)).
- **Anthropic itself dampening:** "code execution with MCP" recommends agents write code to call servers
  and load only needed tools, undermining the full-tool-exposure model
  ([Anthropic, 2025](https://www.anthropic.com/engineering/code-execution-with-mcp)); some read this as
  Anthropic demoting MCP toward a "service directory"
  ([Miessler, 2025](https://danielmiessler.com/blog/anthropic-downplays-mcps)).
- **Adoption is split, not universal:** ~78% of enterprise teams report MCP-backed agents, but "many
  production systems use both: function calling for lightweight tasks, MCP for everything else"; the
  backlash comes mostly from individual devs optimizing personal token budgets
  ([Digital Applied, 2026](https://www.digitalapplied.com/blog/mcp-ecosystem-h1-2026-retrospective-adoption-data-points/);
  [Tyk, 2026](https://tyk.io/learning-center/is-mcp-dead-in-2026-why-enterprises-still-need-mcp/)).

## Sub-Topic 4: Operational / ecosystem advantages in practice

**Verdict: the parts direct API access structurally lacks: runtime discovery, richer primitives, and a
publish-once distribution network.**

- **Dynamic discovery + change notifications:** `tools/list` at runtime; `notifications/tools/list_changed`
  pushes updates; tools can gate by user permission/tier
  ([modelcontextprotocol.io](https://modelcontextprotocol.io/docs/concepts/tools/);
  [Speakeasy, 2025](https://www.speakeasy.com/mcp/tool-design/dynamic-tool-discovery)).
- **Three primitives, not just tools:** Tools (actions), Resources (read-only data), Prompts (reusable
  templates), plus server-initiated `sampling` and `elicitation`, all over one stateful session
  ([MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture);
  [AWS, 2025](https://aws.amazon.com/blogs/machine-learning/introducing-stateful-mcp-client-capabilities-on-amazon-bedrock-agentcore-runtime/)).
- **Composition across servers:** one host aggregates many servers (local STDIO + remote HTTP) into a
  unified tool registry.
- **Distribution effect / vendor-once:** 10,000+ public servers (Q1 2026), official ones from GitHub,
  Stripe, Linear, Slack, Notion, Sentry, Figma, Salesforce, Atlassian, Vercel, Supabase, etc.; one server
  works across Claude Desktop, Cursor, Claude Code, JetBrains IDEs, VS Code
  ([Truto, 2026](https://truto.one/blog/what-is-mcp-model-context-protocol-the-2026-guide-for-saas-pms/);
  [Digital Applied, 2026](https://www.digitalapplied.com/blog/mcp-adoption-statistics-2026-model-context-protocol)).

## Consolidated Sources

Primary:
- [Anthropic — Introducing MCP](https://www.anthropic.com/news/model-context-protocol) (2024-11)
- [Anthropic — Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) (2025)
- [Anthropic — Donating MCP / Agentic AI Foundation](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation) (2025-12)
- [MCP spec — Authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) (2025-11)
- [MCP — Architecture](https://modelcontextprotocol.io/docs/learn/architecture) · [Tools](https://modelcontextprotocol.io/docs/concepts/tools/)
- [Simon Willison — The Lethal Trifecta](https://simonw.substack.com/p/the-lethal-trifecta-for-ai-agents) (2025-06) · [MCP prompt injection](https://simonwillison.net/2025/Apr/9/mcp-prompt-injection/) (2025-04)

Comparative / skeptical / operational:
- [MarkTechPost — MCP vs Function Calling vs OpenAPI](https://www.marktechpost.com/2025/10/08/model-context-protocol-mcp-vs-function-calling-vs-openapi-tools-when-to-use-each/) (2025-10)
- [Perplexity moves off MCP](https://awesomeagents.ai/news/perplexity-agent-api-mcp-shift/) (2026-03) · [Medium analysis](https://medium.com/@pankaj_pandey/perplexity-moved-off-mcp-while-google-and-aws-doubled-down-and-both-are-making-the-right-call-072550518d07) (2026-03)
- [GetUnblocked — MCP token autopsy](https://getunblocked.com/blog/mcp-token-budget-autopsy/) (2026) · [Mario Giancini — hidden cost](https://mariogiancini.com/the-hidden-cost-of-mcp-servers-and-when-theyre-worth-it) (2026)
- [NoCodeAPI — you probably don't need MCP](https://nocodeapi.com/tutorials/you-probably-dont-need-mcp-when-direct-apis-beat-protocol-complexity/) (2025) · [Improving — when MCP is not the right choice](https://www.improving.com/thoughts/when-mcp-is-not-the-right-choice/) (2025) · [KMW](https://kmwllc.com/index.php/2025/05/20/mcp-in-llm-apps-overkill-or-integral/) (2025-05)
- [Tyk — is MCP dead in 2026?](https://tyk.io/learning-center/is-mcp-dead-in-2026-why-enterprises-still-need-mcp/) (2026) · [Digital Applied — H1 2026 retrospective](https://www.digitalapplied.com/blog/mcp-ecosystem-h1-2026-retrospective-adoption-data-points/) (2026) · [adoption stats](https://www.digitalapplied.com/blog/mcp-adoption-statistics-2026-model-context-protocol) (2026)
- [Truto — 2026 guide for SaaS PMs](https://truto.one/blog/what-is-mcp-model-context-protocol-the-2026-guide-for-saas-pms/) (2026) · [DEV — one year of MCP](https://dev.to/ajeetraina/one-year-of-model-context-protocol-from-experiment-to-industry-standard-5hj8) (2026-01)
- Security: [Astrix — state of MCP server security](https://astrix.security/learn/blog/state-of-mcp-server-security-2025/) (2025) · [Equixly](https://equixly.com/blog/2026/02/12/how-mcp-servers-challenge-traditional-api-security-models/) (2026-02) · [OWASP MCP Top 10](https://owasp.org/www-project-mcp-top-10/2025/MCP01-2025-Token-Mismanagement-and-Secret-Exposure) (2025) · [TrueFoundry — LLM access control](https://www.truefoundry.com/blog/llm-access-control) · [Christian Posta — API keys are a bad idea](https://blog.christianposta.com/api-keys-are-a-bad-idea-for-enterprise-llm-agent-and-mcp-access/)

## Open Questions / Gaps

- No single benchmark cleanly isolates MCP-vs-direct-API quality holding tool count constant; the token/
  latency critiques and the standardization/security benefits are argued on different axes, so there is no
  one number that "settles" it.
- The frontier is moving toward "code execution with MCP" / progressive tool loading (Anthropic), which
  blunts the token-cost critique; how much that changes the calculus is still early.

## Revisit Triggers

- Re-run if Anthropic formalizes "code execution with MCP" / Skills as the default over tool exposure.
- Re-run if MCP authorization spec changes the credential/token model again.
- Every ~6 months while the "MCP vs direct API" debate and adoption are still actively shifting.
