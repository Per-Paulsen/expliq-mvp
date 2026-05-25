---
tags:
  - type/reference
  - status/in-progress
  - epic/19
  - exercise/19
---

# Epic 19 — Agentic Triage Actions (M2) — Results

> Spec: [19-agentic-triage-actions.md](19-agentic-triage-actions.md) · Upstream: [Epic 18 results](18-n8n-ai-support-triage-results.md)
> Started 2026-05-25. **Status: Phase 0 (prerequisites) COMPLETE. Workflow build (`/dev`) pending.**
> MCP/connector mechanics + research: [`research/official-mcp-servers-slack-github-linear-research-2026-05-25.md`](../research/official-mcp-servers-slack-github-linear-research-2026-05-25.md).

## Phase 0 — Prerequisite Setup (DONE, 2026-05-25)

The Epic-19 sandbox targets + n8n runtime credentials, set up before the workflow build. Resolves the spec's Open Question 1 (sandbox prerequisites — "hard blockers").

### Sandbox targets
- **GitHub** (`bug` → issue): private repo `Per-Paulsen/expliq-support-sandbox`. Scoped fine-grained PAT in `.env` as `GITHUB_SANDBOX_PAT` (resource: only this repo; permission: Issues read/write). Write verified — probe issue #1 created + closed.
- **Slack** (`always` audit + `urgent` alert): workspace `expliqgovernance.slack.com`, private channel `support-triage-audit` id `C0B5YHCGH1T`. Created + test-posted via the claude.ai Slack connector (read+write verified).
- **Linear** (`feature-request` → ticket): workspace + team `Expliq Support` id `c48dd37e-f37f-48ca-a9be-6b6c6a2224d2`.

### n8n runtime credentials (for the workflow's MCP Client nodes → external MCP servers)
| Service | n8n credential | id | endpoint | auth |
|---|---|---|---|---|
| GitHub | `GitHub MCP (Bearer) — Expliq Support` | `ZBphLaYtMslOfeDE` | `api.githubcopilot.com/mcp` | Bearer (the scoped PAT) |
| Linear | `Linear MCP (Bearer) — Expliq Support` | `tyCijYT3lArGrC3W` | `mcp.linear.app/mcp` | Bearer (Linear API key, in `.env` `LINEAR_API_KEY`) |
| Slack | `Slack MCP (OAuth2) — Expliq Support` | `5ZgLobqHrckTpqhW` | `mcp.slack.com/mcp` | `mcpOAuth2Api` (connected) |

> Also present from earlier: a native `githubApi` cred `ZZDNvvAvVOpTdTwS` (`GitHub Sandbox — Expliq Support`). The Bearer cred above is the one for the MCP Client node; the native one can stay or be removed at `/dev`.

### Slack n8n→MCP OAuth — the non-trivial one (resolved, it works)
Slack's official MCP has **no DCR**, so n8n needs a pre-registered OAuth client = a **custom Slack app** (client id/secret in `.env` `SLACK_OAUTH_CLIENT_ID`/`SLACK_OAUTH_CLIENT_SECRET`). n8n `mcpOAuth2Api` config: `grantType: authorizationCode`, `authentication: body`, authUrl `https://slack.com/oauth/v2_user/authorize`, accessTokenUrl `https://slack.com/api/oauth.v2.user.access`, **user scopes** `chat:write channels:read groups:read`, redirect `https://178-105-184-130.sslip.io/rest/oauth2-credential/callback`. Endpoints discovered via `mcp.slack.com/.well-known/oauth-protected-resource` + `/oauth-authorization-server`. OAuth connect succeeded in the n8n UI.

### Session MCPs (Claude-side, for setup/testing — NOT used by the workflow at runtime)
Slack via claude.ai connector (`mcp__claude_ai_Slack__*`); Linear via `claude mcp add` + DCR OAuth; GitHub via `gh` CLI + PAT. These let Claude Code act on the services during setup; the workflow uses the n8n creds above.

## Key Decisions
- **Workflow architecture = MCP Client nodes → external MCP servers** (per spec domain terms; confirmed by Per — NOT native n8n nodes).
- **`urgent` = its own branch** (Slack alert + optional issue), per spec scope (Open Question 3 resolved).
- **Rate limit stays best-effort in-memory** (KV/Upstash deferred — spec Out-of-Scope; Open Question 2 resolved).
- **Slack auth:** custom Slack OAuth app as pre-registered client (Slack MCP lacks DCR).

## Deviations / Risks
- Slack n8n→MCP relies on a **custom Slack OAuth app** (user-token flow). OAuth connect succeeded; the **live MCP call** (agent posting via the MCP Client node) is validated when the workflow runs in `/dev`.
- The native `githubApi` cred is redundant with the GitHub Bearer cred — tidy up at `/dev`.
- Rate limit best-effort across serverless instances (spec-acknowledged upgrade = Vercel KV / Upstash).

## Next
- Run `/dev specs/19-agentic-triage-actions.md` — builds the AI Agent + MCP Client nodes on the three creds above; extends the response contract (`actionsTaken[]` + `slackSummary`) and the widget; updates `DEPLOY-PORTFOLIO.md`. `/dev` appends its build phases below this Phase 0.

---

## Phase 1 — Workflow build (`/dev`, DONE 2026-05-26)

State-of-the-art research drove an architecture refinement, approved by Per. Research file: [`research/n8n-agentic-rag-mcp-state-of-the-art-research-2026-05-25.md`](../research/n8n-agentic-rag-mcp-state-of-the-art-research-2026-05-25.md).

### What was built
New parallel workflow **"Expliq Support — Agentic Triage"** (id `B0YWkBWQa9NEfX9r`, active, webhook path `/webhook/expliq-support-agent`). The Epic-18 answer workflow (`hcTllLJwyQZcpO2O`) is left **untouched and active** serving prod; cutover happens at go-live. Exported to [`n8n/support-agent.workflow.json`](../n8n/support-agent.workflow.json) (credential references only, no secrets).

Architecture (research-backed hybrid):
```
Webhook (headerAuth) → Retrieve KB (PGVector+Ollama, deterministic, always)
  → Build context (Code) → Triage Agent (Claude/OpenRouter, + GitHub MCP issue_write + Linear MCP save_issue)
  → Format response (LLM Chain + Structured Output Parser) → Build audit (Code) → Slack Audit (native node) → Respond
```
Response contract: `{ category, reply, actionsTaken: [{ type, ref }], slackSummary }`.

### Key decisions / deviations from the literal spec (all research-justified, Per-approved)
- **D7 — RAG is deterministic retrieve-first, NOT an agent vector-store tool.** The spec's wording ("Vector Store retriever as a tool") risks grounding loss (agents skip optional retrieval → hallucinate). Retrieve-first guarantees grounding (preserves Epic-18 behavior) while the agent still genuinely *acts* via MCP tools (the new M2 capability). Per chose this over spec-literal "pure agent".
- **D8 — Structured output via a SEPARATE LLM Chain, NOT a parser on the agent.** n8n's own docs warn the Structured Output Parser is unreliable attached to a tool-calling agent (GitHub issues #20923, #21174). So the agent emits free-form working notes and a dedicated Format chain produces the strict JSON.
- **D9 — MCP Client tools use `include: selected` (one tool each: GitHub `issue_write`, Linear `save_issue`).** Research: exposing a full MCP toolset (GitHub MCP = 94 tools) collapses agent tool-selection accuracy (~43% → ~14%). Real tool names confirmed via a throwaway connectivity probe.
- **D10 — Slack is a deterministic native node (bot token), NOT an MCP Client tool.** Slack's MCP (`mcp.slack.com`) only issues MCP tokens to its approved partner OAuth clients (e.g. Claude) and does not support DCR; a custom OAuth app gets a Web-API token that `mcp.slack.com` rejects ("Could not connect to your MCP server", identical on httpStreamable + sse). Proven dead in a live probe. Native Slack node (`slackApi` cred `SXsoD9bpXEgEEQ7l`, bot token in gitignored `.env` `SLACK_BOT_TOKEN`) is both the only working path AND what the deterministic-audit design wants. This resolves the handoff's open Slack-MCP question with a clear negative finding. The MCP OAuth2 cred `5ZgLobqHrckTpqhW` is now unused.
- **D11 — Slack audit is a deterministic, structured line** (Code node), not the LLM's free-form `slackSummary`. Includes category, `Ref: exec-<n8n execution id>` (ties the Slack line to the n8n execution log, the two audit mechanisms the spec names), user+workspace, page, the question, the action ref, timestamp. `urgent` prepends a `<!here>` channel ping (the real "alert"). Posted via the native Slack node with `onError: continueRegularOutput` + retry so a Slack hiccup never blocks the webhook response.
- **D12 — Grounding rule scoped to questions.** The exact "I don't have enough information" fallback applies only to `question`; for `bug`/`feature-request`/`urgent` the reply acknowledges the escalation and may add a workaround **only if it is in the retrieved CONTEXT** (tightened after a test where the agent invented an "admin panel"). The Settings → Sync & Analyze feature is real but only surfaces if it is in the retrieved KB.

### Live verification (against real sandbox targets)
| AC | Category | Result | Artifact |
|---|---|---|---|
| AC1 | `bug` | GitHub issue created | `expliq-support-sandbox` issues #2 |
| AC2 | `feature-request` | Linear ticket created | `EXP-5` |
| AC3 | `question` | no external write (`actionsTaken: []`), grounded reply | — |
| AC4 | all | structured Slack audit line posted (`ok:true`) | channel `support-triage-audit` |
| — | `urgent` | GitHub issue + `@here`-pinged escalated audit + escalation reply | issues #4/#5 |
All four categories verified end-to-end via live POSTs with the real Server-Action payload shape (`user.email`, `context.workspaceId/pagePath`, `timestamp`). Documentation sticky-notes added to the canvas (Epic-18 parity). Throwaway connectivity-probe workflow deleted.

## Phase 2 — Track 1 / Expliq code slice (`/dev` team, DONE 2026-05-26)

Built by two parallel agents against the verified contract; lead-verified integrated.

### What was built
- **`src/lib/actions/support.ts`** — exports `type ActionTaken = { type: string; ref: string | null }`; success result extended to `{ success, category, reply, actionsTaken: ActionTaken[] }`; parses `actionsTaken` defensively from the webhook response (`Array.isArray(...) ? ... : []`); `slackSummary` is internal and NOT returned. No other behavior changed (validation, 8/min rate limit, env check, payload, prisma email, error handling all intact).
- **`src/components/support-widget.tsx`** — `Message` gains `actionsTaken?`; on success the assistant message renders one understated "what was done" line below the reply: `github-issue` → "Filed as a bug report", `linear-ticket` → "Logged as a feature request" (linked to `ref` in a new tab when present); `slack`/`none`/empty surface nothing.
- **`DEPLOY-PORTFOLIO.md`** — added an "Agentic triage (Epic 19)" note under the Epic-18 outbound touchpoint (additive): the n8n agent now does sandboxed outbound writes; the Expliq app posture is unchanged, **no new app-level env vars**; contract gained `actionsTaken[]`.

### Verification (lead, integrated)
- `npm run test`: **346/346 pass** (26 files) — was 339 at Epic 18; +2 support-action (19→21), +5 support-widget (14→19).
- `npm run build`: **succeeds**, TypeScript green across both changes (requires `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1` locally for the `next/font` fetch; environment-only, Vercel/CI unaffected).
- `npm run lint`: no new errors in the four changed files (pre-existing out-of-scope errors in `scripts/research-spike-v9-*.ts`, `demo/page.tsx`, `detail-view.tsx`, `opportunities-view.tsx` left untouched).

### AC status
- AC1–AC6 (n8n + manual/integration): met + live-verified. AC6 export committed.
- AC7–AC8 (Vitest delta): met (346/346, additive widget tests green).
- **Pending: AC9/AC10 deploy safety** — preview-verify the widget end-to-end against the agentic webhook, then go-live. The agentic workflow is not yet wired to prod: prod still calls the Epic-18 answer webhook. Go-live = point the prod/preview `N8N_SUPPORT_WEBHOOK_URL` to `/webhook/expliq-support-agent` (same secret), preview-verify, then merge.

### Risks / notes for future epics (Epic 20)
- **Two-LLM-call cost**: the agent call + the format-chain call are two OpenRouter/Claude calls per request (vs Epic 18's one). Acceptable for the demo; note for cost.
- **Agent grounding on workarounds** is tightened by prompt but remains a soft constraint; for actioned categories the reply may still occasionally lean on retrieved-but-tangential context. Verify in the preview smoke test.
- **Rate limit** is still best-effort in-memory in the Server Action (spec Out-of-Scope; KV/Upstash is the upgrade).
- **Slack widget cast**: the widget reads `actionsTaken` via a narrow optional type rather than importing the now-exported `ActionTaken`; harmless + type-safe, optional tidy.
- **Cutover mechanics** (which workflow owns the prod webhook path) to be decided with Per at go-live; the Epic-18 answer workflow stays as the rollback.
