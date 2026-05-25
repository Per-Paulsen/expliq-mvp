---
tags:
  - type/reference
  - status/done
  - epic/19
---

# n8n Agentic RAG + MCP Client Tools — State of the Art (2026-05-25)

> Generated via /explore. 4 sub-questions investigated in parallel by Explore subagents.
> Context: Epic 19 (M2) — turning the Epic-18 RAG answer workflow into an AI Agent that also acts
> via MCP Client Tools (GitHub/Linear/Slack) against sandbox targets. Claude via OpenRouter as the
> agent LLM. Public always-on portfolio demo for an n8n Product-Builder application.

## Executive Summary

Three findings overturn the naive "one AI Agent holds the RAG retriever tool **and** the action tools
**and** emits structured JSON" reading of the Epic-19 spec:

1. **n8n's own docs say the Structured Output Parser is unreliable on agents** that also call tools, and
   explicitly recommend a **separate LLM Chain after the agent** to format the output. (GitHub issues
   #20923, #21174 confirm.)
2. **An optional RAG retrieval tool is a real grounding risk** — agents skip the KB and answer from
   parametric memory. The robust, current best practice for a public demo is **retrieve-first**
   (deterministic retrieval, then the agent reasons over guaranteed context) or forced tool calls.
3. **The n8n MCP Client Tool has a serious open transport bug** (#18938 / #24967): it can ignore the
   "HTTP Streamable" selection and silently use deprecated SSE, causing reconnection storms / "Session
   not found". And exposing a full MCP toolset (GitHub MCP = 94 tools, ~17.6k tokens) collapses agent
   tool-selection accuracy from ~43% to ~14% — so expose only the 1 needed tool per server ("Selected").

Net: the **most robust AND most n8n-product-mature architecture** is a hybrid — deterministic
retrieve-first for guaranteed grounding, a genuine AI Agent holding only the (Selected) MCP action
tools, and a separate formatting LLM Chain for the `{category, reply, actionsTaken[], slackSummary}`
contract. This deviates from the spec's literal "vector retriever as an agent tool + structured output
on the agent", but it is what n8n's own reliability guidance prescribes.

## Sub-Topic 1: n8n's canonical AI-Agent + Vector-Store + action-tools architecture

- n8n **v1.74.0 (Jan 2025)** made vector stores connectable **directly as AI Agent tools** ("Retrieve
  Documents (As Tool for AI Agent)" mode on PGVector/Supabase/Pinecone/Qdrant/etc.). This is the modern
  "vector store as a tool" pattern n8n actively promotes.
- n8n's **Agentic RAG** blog positions a "Retriever Router" agent that picks among tools (vector / SQL /
  API) per query; vector store is one tool among many, not a privileged mandatory layer.
- n8n **also** documents the lightweight deterministic pattern: `Vector Store QA Tool (retrieval) → LLM
  (generation)`, explicitly for "saving tokens" by pre-retrieving once before the agent.
- Tool **description quality drives selection**: the toolVectorStore description literally reads "…you
  should ALWAYS use this." Poor descriptions cause agents to skip tools.
- **Gap:** n8n has **no** featured official template combining a vector retrieval tool **and** external
  action tools (Slack/GitHub) in a single agent. The architecture is supported but not showcased — so
  there is no canonical "do it exactly like this" reference for our exact shape.

## Sub-Topic 2: Agentic RAG vs deterministic retrieve-then-generate (grounding)

- **Deterministic RAG** (embed → retrieve N → prepend → generate): fast, cheap, strong grounding,
  brittle on multi-hop. **Agentic RAG** (agent decides when/whether to retrieve, can re-retrieve):
  handles complex queries, but 3–10x cost/latency and **retrieval becomes optional**.
- **Optional retrieval = hallucination risk.** With `tool_choice: auto`, LLMs exhibit "choice overload"
  and often answer from parametric knowledge instead of calling the KB tool. Out-of-domain questions get
  "plausible-looking false answers" unless explicitly forced to say "I don't know".
- **Forcing techniques (in order of strength):**
  1. **Architectural retrieve-first** — retrieval always runs *before* the agent; the agent decides how
     to *use* context, not *whether* to retrieve. Strongest guarantee.
  2. **Forced tool calls** — Anthropic `tool_choice: "any"` (must call some tool) or
     `{"type":"tool","name":"search"}` (must call a specific tool). (Not exposed cleanly by the n8n
     Agent node; n8n abstracts tool_choice away.)
  3. **System-prompt discipline** — "answer ONLY from CONTEXT", "you must search before answering". A
     *soft* constraint; strong models can override.
- **Consensus:** no single best practice; teams go **hybrid** — agentic for genuinely complex queries,
  deterministic + forced retrieval for factual QA. For a **public demo answering KB questions**,
  retrieve-first is the safe default (matches Epic-18's verified behavior).

## Sub-Topic 3: n8n MCP Client Tool — best practices + gotchas

- **Expose "Selected" tools, not "All".** GitHub's MCP server exposes ~94 tools (~17.6k tokens);
  bloated toolsets dropped tool-selection accuracy from ~43% to **under 14%**. Start with the 1–5
  tools you actually need per server.
- **Transport bug (open, serious):** GitHub #18938 / #24967 — the node can display "HTTP Streamable"
  but actually use deprecated **SSE** under the hood (GET instead of POST), and the transport dropdown
  selection can be ignored entirely, causing retry storms and "Session not found". **Implication:** test
  the live MCP connection carefully; be ready to try the other transport if one fails.
- **SSE is deprecated** in the MCP spec (2025-11-25); HTTP Streamable is the recommended transport — but
  see the n8n bug above.
- **Auth:** Bearer / header / OAuth2 supported, but the node accepts **static credentials only** — no
  OAuth 2.1 refresh flow. A user-token Slack OAuth (our Phase-0 setup) works as long as the token does
  not need mid-run refresh; long-lived/non-expiring tokens are safest.
- **Hardcoded 60s timeout** on the MCP Client tool.
- **Failure modes reported (2025/26):** tools defined-but-never-called; unwanted `toolCallId` parameter
  injection breaking schemas; "single tool call then stop" (model-dependent); tool-name conflicts when
  multiple MCP nodes of the same server type expose duplicate names — give each MCP node a clear,
  distinct name + tool description.
- **Precedent:** n8n ships Slack→Linear ticket-triage and GitHub-agent MCP templates, so our exact
  use-case (triage → create issue/ticket + Slack) is a proven pattern, just not as one official file.

## Sub-Topic 4: Structured output parser + tool-calling agent reliability

- **n8n's official docs explicitly warn:** structured output parsing is "often not reliable when working
  with agents" and recommend **"a separate LLM-chain to receive the data from the agent and parse it."**
  The parser "is not intended to structure intermediary output."
- **Confirmed bugs:** #21174 (agent structured-output failures), #20923 (connected parser not recognized
  by the agent node, v1.115.x). Known markdown-in-JSON bug: triple-backtick code blocks inside JSON
  string values → "Invalid JSON in model output".
- **Recommended pattern:** Agent (+ tools, with **"intermediate steps"** enabled so tool results like a
  created issue URL are available) → **separate Basic LLM Chain + Structured Output Parser** that emits
  the final JSON. A community template ("Reliable AI agent output without structured output parser")
  confirms the split-stage approach in production.
- **Vendor best practice:** structured outputs guarantee *structural* correctness, not *value*
  correctness — keep the schema simple and validate semantics downstream. (Anthropic constrained
  decoding / OpenAI `strict:true`, the latter incompatible with parallel tool calls.)

## Consolidated Sources

**n8n official (docs / blog / templates)**
- https://docs.n8n.io/advanced-ai/rag-in-n8n/
- https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/tools-agent/
- https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolvectorstore/
- https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.outputparserstructured/common-issues/
- https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolmcp/
- https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstorepgvector/
- https://blog.n8n.io/agentic-rag/ · https://blog.n8n.io/rag-chatbot/
- https://community.n8n.io/t/building-rag-in-2025-vector-stores-as-tools-is-here/75166
- https://n8n.io/integrations/mcp-client-tool/ · https://n8n.io/workflows/6538-company-knowledge-base-agent-rag/

**n8n bugs / community (MCP Client Tool + structured output)**
- https://github.com/n8n-io/n8n/issues/18938 (HTTP Streamable → SSE transport bug)
- https://github.com/n8n-io/n8n/issues/24967 (transport selection ignored / retry storm)
- https://github.com/n8n-io/n8n/pull/15886 (60s timeout)
- https://github.com/n8n-io/n8n/issues/21174 · https://github.com/n8n-io/n8n/issues/20923 (agent + parser)
- https://community.n8n.io/t/oauth-2-1-support-for-mcp-client-node/201221
- https://community.n8n.io/t/tool-in-mcp-client-are-not-being-called/133502
- https://n8n.io/workflows/4316-reliable-ai-agent-output-without-structured-output-parser-w-openai-and-switch/

**Grounding / agentic RAG / tool-forcing**
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
- https://platform.claude.com/cookbook/tool-use-tool-choice
- https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- https://towardsdatascience.com/agentic-rag-vs-classic-rag-from-a-pipeline-to-a-control-loop/
- https://arxiv.org/html/2601.07711v1 (Is Agentic RAG worth it? 2026)
- https://dev.to/aws/stop-ai-agent-hallucinations-4-essential-techniques-2i94
- https://www.atlassian.com/blog/developer/mcp-compression-preventing-tool-bloat-in-ai-agents
- https://dev.to/nebulagg/mcp-tool-overload-why-more-tools-make-your-agent-worse-5a49

## Open Questions / Gaps

- **No official n8n template** combines a vector retrieval tool + external action tools + structured
  output in one workflow — our shape is supported but not canonically referenced.
- **Transport bug unresolved:** which transport (HTTP Streamable vs SSE) actually works against
  api.githubcopilot.com/mcp, mcp.linear.app, mcp.slack.com on n8n 2.56.0 must be confirmed by live test.
- **No quantified field data** on how often n8n agents skip an optional retrieval tool — risk is
  qualitative.
- **Slack user-token OAuth longevity** under the MCP Client node (static-credential limitation) is
  unverified for long-running/expiring tokens.

## Revisit Triggers

- Re-run if n8n ships a fix for #18938 / #24967 (transport) or changes the Agent↔Structured-Output-Parser
  behavior (would simplify the architecture back toward "all on one agent").
- Re-run when Anthropic exposes `tool_choice` forcing through the n8n Agent node (would let us force the
  retrieval tool and collapse the retrieve-first step into the agent).
- General 6-month refresh for this fast-moving area.
