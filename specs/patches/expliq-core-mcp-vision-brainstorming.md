# Vision: Expliq-Core MCP server (vs the Support MCP) — Brainstorming

> Status: exploration / architectural clarification. Not a build yet. Captures two related Q&A from the 2026-05-30 session: (1) what the existing Support-MCP tools actually allow + an honest use-case verdict, and (2) where the "governance-data over MCP" use case architecturally belongs.
> Append-only: add new sections at the bottom, annotate existing ones, do not rewrite.

## Part 1 — What the existing Support-MCP tools allow, and the honest use-case verdict

The live Support MCP server (`ZMnqIwsEiBgpOBOC`, Epic 20) exposes two tools:

- **`answer_expliq_question(query)` — READ.** An external AI client asks a question, gets a RAG-grounded answer from the PRODUCT KB (how Expliq works, governance concepts). No write, no action. Contract `{category, reply}`. = "query the Expliq docs, agentically instead of browsing."
- **`file_support_request(message)` — WRITE/action.** An external AI client submits a support request that triggers real actions: classify, create a GitHub or Linear issue, Slack audit, plus a reply. Contract `{category, reply, actionsTaken[], slackSummary}`. = "let an agent DO something in the Expliq support system."

So the MCP server lets an external client: **query Expliq product knowledge** + **initiate a support action**, programmatically, without the web widget.

**Honest use-case verdict:**
- **As a standalone end-user product benefit: weak today.** The only real end-user case is an Expliq user already working in Claude Code/Desktop who asks "how does Expliq's risk scoring work?" and files a bug without switching to the widget. Plausible ("support meets you where you work") but thin, since the same is one widget-click away. Convenience, not a compelling reason.
- **The real value today is the architecture statement:** "two doors, one brain" (widget + MCP) shows the support brain is built as a reusable tool consumable by any AI client. That is showcase/application value (MCP-server build, bearer auth, typed tools), not an end-user killer feature.
- **The genuinely compelling MCP use case is NOT built yet:** governance-data tools (see Part 2). That is what makes the composition demo idea ("ask Expliq which of my automations are critical -> open a GitHub issue for each") actually valuable; today it fails only because the data door doesn't exist.

Consistent with the enterprise-MCP research (`_resources/mcp-enterprise-practice-vs-hype-research-2026-05-30.md`): read-tools (product knowledge) are the safe standard; write-tools (issue creation) are deliberately gated; the real value appears when an internal server exposes the user's OWN system data, not just generic product knowledge.

## Part 2 — Where "governance-data over MCP" belongs: Expliq-Core MCP, NOT the Support MCP

The governance-data use case should run on an **Expliq-Core MCP server**, a core product feature, NOT on the support agent's MCP server. Merging them would be a category error (two different domains, data-sensitivities, and auth models in one server).

| | Support MCP (today, Epic 18-20) | Expliq-Core MCP (the vision) |
|---|---|---|
| Purpose | help WITH the product | the product ITSELF |
| Data | product KB (pgvector on the n8n box) | governance data (Supabase prod DB: Automation / BusinessProcess / Recommendation) |
| Scope | generic, same for everyone | PER WORKSPACE, user-specific, sensitive |
| Hosted | self-hosted n8n box | the Expliq Next.js app |
| Owner | support stack | core product |

**Why the split is correct:**
- **Data sensitivity + scoping.** The support door answers everyone the same (public product knowledge). Governance data is a specific workspace's real, private risk insights, must be per-user authenticated and strictly `workspaceId`-scoped. Running that on the support server mixes two completely different auth/security models in one server, and creates exactly the "lethal trifecta" exposure (private data + agent + actions) flagged in the AI-Trust research.
- **The Core MCP server belongs IN the Next.js app**, where the data, auth, session and `workspaceId` scoping already live, not on the n8n box. The app already knows how to serve per-workspace data securely; an MCP server there is just a new interface onto existing logic.
- The Support MCP **stays as-is** (two doors to the support brain). It is complete and correct. The Core MCP is a separate, standalone product feature.

**This is the Epic-20 "Framing (ii)" vision** (governance-data tools like `get_riskiest_automations`, `get_automation_detail`), explicitly marked future / out-of-scope in the Epic-20 spec.

**Strategic point:** "Expliq as an MCP server" is a STRONGER product narrative than the support door, it makes the core product a tool that lives inside every AI client the user already uses ("Expliq governance meets you where you work"). The Support MCP was the exercise (learned the build); the Core MCP is the actual product value.

**Honest scope caveat:** this is well beyond a patch, it is its own epic/feature (a new MCP layer over the app, an auth model for external agents, per-workspace scoping, read-default / write-gated). Not small, but cleanly bounded.

## Part 3 — Why the support agent has ONLY general product data (no workspace data)

Three reasons, one by design, two deeper:

1. **Deliberate scope decision (documented).** Epic 18 was built as pure PRODUCT-KB RAG (`n8n/knowledge/*.md` -> pgvector). Epic 20 spec marks "Expliq governance-data tools (`get_riskiest_automations`, etc.)" explicitly as "Framing (ii), future extension, out of scope". The support agent was intentionally built as "answers questions ABOUT the product", not "reads YOUR data". A drawn boundary, not a gap.
2. **Where the agent lives doesn't fit workspace data (architecture).** The support agent runs on the self-hosted n8n box, behind a webhook with a SHARED secret, not behind a specific user's login. Its knowledge source (pgvector of committed KB markdown) is the same for everyone. Workspace governance data lives in the Next.js app's Supabase prod DB, behind Auth.js session + `workspaceId` scoping. The agent has no authenticated, user-specific access there, by design. (Note: Epic 18 spec line 80 shows `workspaceId` IS sent in the n8n payload, but only for the Slack audit, the agent has no tool to query data with it.)
3. **Security, the "lethal trifecta".** Giving the support agent real workspace-data access would combine in ONE agent: private data (your automations) + untrusted input (the support message, possibly prompt-injected) + outward action (GitHub/Linear write). That is the exact dangerous triangle from the AI-Trust research. Keeping the support agent on public product knowledge defuses it: even if hijacked via injection, it cannot exfiltrate private workspace data because it has none.

One-liner: the support agent has only general product data because it was deliberately scoped as a product-generic helper, sits architecturally outside the authenticated app on the n8n box (no user-specific data access), and that is the safe choice. Workspace data is therefore the job of a separate Expliq-Core MCP server in the app (Parts 1-2).

## Part 4 — But CAN you build a secure agent that answers workspace-specific questions? (yes — это is Expliq's core value)

Per's follow-up, and the answer is YES, unambiguously. Answering "what are my most critical automations?" securely is not only possible, it is arguably Expliq's PRIMARY job (the dashboard already computes exactly this per workspace). Per is not misunderstanding anything; the current support agent simply wasn't built for it (Part 3).

The key reframe: the constraint was never "you can't safely give an agent private data". It is "don't combine private data + untrusted content + outward action in one ungoverned agent". You break the trifecta by ARCHITECTURE, not by avoiding data access:
- The agent runs INSIDE the authenticated app (or behind per-user auth), so every data read is `workspaceId`-scoped to the asking user, standard multi-tenant SaaS.
- Read-default: governance queries are read-only; any write/deploy action stays separately gated (human-in-the-loop).
- Input/output guardrails on the untrusted message; the agent can read the user's OWN data but cannot be tricked into reaching another tenant's.
- This is exactly the Expliq-Core MCP server from Parts 1-2 (or, equivalently, an in-app authenticated chat agent), NOT the n8n support door.

Concrete secure 2026 patterns for this (per-tenant RAG, row-level security, auth-scoped tools) are researched in `_resources/secure-per-workspace-agent-data-access-research-2026-05-30.md`.

## Part 5 — "In-app first, MCP later" + the UI-vs-MCP-only question (2026-05-30)

Two things were conflated and are separated here.

**"In-app agent first, MCP later" = sequencing for the ONE data-agent feature, not a statement about UI.** Rationale (from `_resources/secure-per-workspace-agent-data-access-research-2026-05-30.md`): an in-app agent ALREADY inherits the Auth.js session (no OAuth handshake, smallest attack surface); an external MCP server needs the full OAuth 2.1 build. So: build the scoped tool layer once, use it in-app first (safe, fast), expose it via an authenticated MCP server later. Is it consensus? Yes, the 2026 pattern is "every B2B SaaS will have a web interface, an API AND an MCP server", with the in-app agent as the safe starting point. The pattern is ADDITIVE (UI + API + MCP), not "MCP instead of UI".

**The real question: MCP-only, no UI? Verdict: wrong for Expliq.** Three reasons:
1. **Expliq's core value is visual.** The whole PRD is screens (Dashboard, Process Map, risk dots, business-case cards). Governance = seeing and verifying. An MCP server hands text/JSON to an LLM that re-renders it as prose; a "Process Map" as text is a shadow of itself. MCP-only throws away exactly what differentiates Expliq.
2. **Discovery + trust.** RevOps buyers don't all live in Claude Desktop. Without a UI: how does a buyer understand what Expliq does, or verify governance claims? "The agent said so" doesn't beat an auditable dashboard. MCP-only products have poor discoverability for non-technical buyers.
3. **Consensus is additive, not either/or.** The research is clear: MCP is an ADDITIONAL door onto an existing product, not a UI replacement. Even MCP-maximalists do "UI + API + MCP". This is Per's own "two doors, one brain" pattern applied to the core product: UI AND MCP, not UI vs MCP.

**Fair counter-view:** there is a legitimate "agentic-native / headless" thesis (product as a tool inside every AI client, no UI to maintain). It holds for a pure data-delivery tool (e.g. a weather API). It does NOT hold for a sensemaking product whose value is visual condensation. Expliq is the latter.

**The distinction that decides it: portfolio-showcase vs real product.** This whole effort is Expliq as a job-application artifact; for that, the LIVE UI (`expliq-mvp.vercel.app`) is currently the strongest asset, something a reviewer can click and see. MCP-only would remove that. For a hypothetical real product, same logic plus market discovery.

**Conclusion:** keep the UI, add MCP additively (in-app data agent first, MCP door later). "MCP-only" is seductive because it sounds radical, but it sacrifices Expliq's core. (Per's product call to make; documented here.)

## Open questions (for if/when this becomes real)

1. Auth model for external agents hitting per-workspace data (OAuth vs scoped bearer per workspace; how a user authorizes their Claude Desktop to read their Expliq data).
2. Tool surface: read-only first (`get_riskiest_automations`, `get_automation_detail`, `get_process_map`)? Which, if any, write/deploy actions, and gated how (human-in-the-loop)?
3. Hosting: MCP server route inside the Next.js app (Vercel) vs a separate service; how it reuses existing session/`workspaceId` logic.
4. Relationship to the demo: this is what makes the `_TODO.md` composition demo's "spit out my critical automations" part actually buildable.
5. Is this a portfolio/showcase artifact or a genuine product-roadmap item (or both)?

## References

- Epic 20 spec + results (Framing ii marked out-of-scope): `specs/20-n8n-mcp-server-door*.md`
- The composition-demo clarifications + stack limit: `_TODO.md` (MCP composition demo item)
- Use-case/architecture grounding: `_resources/mcp-enterprise-practice-vs-hype-research-2026-05-30.md`, `_resources/mcp-gateways-orchestration-multi-server-research-2026-05-30.md`
- Live support MCP: `ZMnqIwsEiBgpOBOC`; core app: the expliq-mvp Next.js app (Supabase prod DB)
