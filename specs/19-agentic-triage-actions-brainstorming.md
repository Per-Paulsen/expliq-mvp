---
tags:
  - type/spec
  - status/brainstorming
  - epic/19
  - exercise/19
---

# 19 — Agentic Triage Actions — Brainstorming

> Upstream: [Epic 19 spec](19-agentic-triage-actions.md)
> **Decision history lives in [18-n8n-ai-support-triage-brainstorming.md](18-n8n-ai-support-triage-brainstorming.md)** (Rounds 1 to 9). This epic was carved out of Epic 18 as milestone M2 during the Round-9 split. The agentic + safety + sandbox decisions are recorded there (Rounds 6 to 9).

## Carved decisions (from Epic 18 brainstorming)

- Agentic triage chosen (Round 6/7, option b4): the AI Agent takes the category-appropriate action via MCP Client tools.
- Actions: `bug` -> GitHub issue; `feature-request` -> Linear ticket; `question` -> answer-only; always Slack notify. Ticketing settled on **Linear** (not Jira) in Round 9.
- Public-demo safety (Round 7/8/9): **sandbox targets** + audit + **best-effort rate limit** (in-memory unreliable on Vercel serverless; KV/Upstash is the robust upgrade, deferred). Webhook server-side only; workflow invisible to demo users.

## Open (epic-specific)

Use this file for any further `/refine` rounds scoped to Epic 19. Current open items are in the spec's Open Questions (sandbox prerequisites, rate-limit store, action breadth).

## Refinement Applied

Batch-refined via `/refine_all_ind`. See `specs/ind-epic-review.md` for details.
