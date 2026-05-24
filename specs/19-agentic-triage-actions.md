---
tags:
  - type/spec
  - status/draft
  - epic/19
  - exercise/19
---

# Epic 19 — Agentic Triage Actions (M2)

> Upstream: [Epic 18 — Support Widget + RAG Answer (M1)](18-n8n-ai-support-triage.md) | [Brainstorming](18-n8n-ai-support-triage-brainstorming.md) | [DEPLOY-PORTFOLIO.md](../DEPLOY-PORTFOLIO.md)
> Goal context: completes the Exercise-19 "Trigger -> AI reasoning -> automated action" loop for the n8n Product Builder portfolio. M2 turns Epic 18's answer-only workflow into an **AI Agent that also acts**.
> Milestone 2 of 3: [Epic 18 (answer)](18-n8n-ai-support-triage.md) -> Epic 19 (this) -> [Epic 20 (MCP server door)](20-n8n-mcp-server-door.md).
> **Depends on Epic 18** (live n8n host + RAG + answer workflow + the widget + the Server Action + the webhook contract). Build only after M1 is demoable.
> Branch: continue on `feature/epic-18-n8n-support-triage` (same feature line) or `feature/epic-19-agentic-actions`.

## Scope

Extend Epic 18's RAG answer workflow into an **AI Agent** that, in addition to answering, **takes the category-appropriate action** via **MCP Client tools**, against **sandboxed targets**, and surfaces what it did back to the widget.

This is the delta on top of Epic 18; it does not rebuild the host, RAG, KB, widget, or Server Action, only extends the workflow + the response contract + the widget's rendering + the rate-limit posture.

### Workflow change (built via the n8n-MCP)

Convert/extend the webhook workflow into an **AI Agent node** (Claude via OpenRouter) with two kinds of tools:
- **Vector Store retriever** (RAG) — from Epic 18, the grounded answer.
- **MCP Client tool(s)** — agentic actions:
  - `bug` -> open a GitHub issue (sandbox repo)
  - `feature-request` -> file a Linear ticket (test board)
  - `question` -> answer from RAG only (no external write)
  - `urgent` -> Slack alert (private channel) + optional issue
  - **always** -> Slack notify (private channel) with the internal summary

Response contract becomes: `{ category, reply, actionsTaken: [{ type: "github-issue | linear-ticket | slack | none", ref: string | null }], slackSummary }`.

The agentic workflow is exported as `n8n/support-agent.workflow.json` (the agentic successor to Epic 18's answer-only `support-answer.workflow.json` on the live instance).

### Safety model (this is where external side effects appear)

- **Sandbox targets only:** a throwaway GitHub repo, a test Linear board, a private Slack channel. Nothing real is reachable; abuse is harmless + resettable (fits the daily-reset ethos).
- **Audit:** every agent action is recorded (n8n execution log + a Slack audit line).
- **Rate-limit hardening:** because actions now have external side effects, tighten the Epic-18 best-effort rate limit; document that a robust limit needs Vercel KV / Upstash (the in-memory limit is unreliable across Vercel serverless instances). For a public demo, sandbox + auth + length cap + best-effort limit together keep the abuse incentive negligible.
- The webhook URL + secret remain server-side only (unchanged from Epic 18); the workflow stays invisible to demo users.

### Expliq-side change (small)

- The Server Action's parsed response + return type gain `actionsTaken`; it returns `{ success, category, reply, actionsTaken }`.
- The widget's "answered" state renders a short "what was done" line from `actionsTaken` (e.g. "Filed as a bug report"). No new component; extends `support-widget.tsx` + `actions/support.ts` from Epic 18.

## Acceptance Criteria

### Manual / integration
1. A `bug` message creates an issue in the **sandbox GitHub repo**; the `actionsTaken` entry references it.
2. A `feature-request` files a ticket on the **test Linear board**; referenced in `actionsTaken`.
3. A `question` performs **no** external write (`actionsTaken` is empty or `none`).
4. Every run posts an audit line to the **private Slack channel**.
5. Exceeding the rate limit blocks the action (no fetch / no agent run).
6. The agentic workflow is exported to `n8n/support-agent.workflow.json` (the agentic successor to Epic 18's `support-answer.workflow.json`) and committed.

### Automated (Vitest, Track 1 delta)
7. The Server Action returns `actionsTaken` parsed from the n8n response (mocked fetch); the widget renders the "what was done" line on success.
8. Existing Epic-18 server-action + widget tests still pass (the change is additive).

### Deploy safety
9. Nothing reaches `main` until the agentic flow is verified on a preview with sandbox targets.
10. `DEPLOY-PORTFOLIO.md` notes the agentic outbound integration + sandbox targets (additive to Epic 18's env-var + deploy-note update; do not duplicate that content).

## Out of Scope

- The **MCP Server Trigger door** (Epic 20).
- **Real (non-sandbox) write targets** on the public demo.
- Robust KV-backed rate limiting (still best-effort; noted as the upgrade).
- Any Epic-18 rebuild (host, RAG, KB, widget shell).

## Domain Terms

| Term | Definition |
|------|-----------|
| **AI Agent (n8n)** | An n8n node that runs an LLM with attached tools (retriever + MCP Client action tools) and decides which to call. |
| **MCP Client Tool** | An n8n node letting the AI Agent call tools exposed by an external MCP server (GitHub / Linear / Slack). |
| **Agentic triage** | The workflow does not just classify and answer; it takes the next action based on category. |
| **Sandbox targets** | Throwaway GitHub repo / test Linear board / private Slack channel that agentic writes hit, so a public demo causes no real-world side effects. |

## Open Questions

1. **Sandbox prerequisites (hard blockers):** a throwaway GitHub repo, a test Linear board, a private Slack channel + their tokens/credentials in n8n.
2. **Rate-limit store:** keep best-effort in-memory or upgrade to Vercel KV / Upstash now that writes exist? Thresholds (e.g. N per session/IP per hour).
3. **Action breadth:** is `urgent` a distinct branch in v1, or folded into the others?

---

## Related

- [Epic 18 — Support Widget + RAG Answer (M1)](18-n8n-ai-support-triage.md) (prerequisite)
- [Epic 20 — n8n MCP Server Door (M3)](20-n8n-mcp-server-door.md)
- [Brainstorming](18-n8n-ai-support-triage-brainstorming.md) — Rounds 6 to 9 (agentic + safety decisions)
- `dl-ai-expliq/exercise_20/` — agent + safety patterns (grounding, cost, multi-tenancy, audit, confirm-before-write)
