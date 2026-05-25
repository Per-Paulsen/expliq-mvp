---
tags:
  - type/reference
  - status/done
---

# Official First-Party MCP Servers: Slack, GitHub, Linear — State of the Art (2026-05-25)

> Generated via /explore. 4 sub-questions investigated in parallel (3 service Explore subagents + 1 claude-code-guide for connection mechanics).

## Executive Summary

All three vendors ship **official, first-party** remote MCP servers. **Slack** (`https://mcp.slack.com/mcp`) and **Linear** (`https://mcp.linear.app/mcp`) authenticate via **interactive OAuth** ("Allow" in browser — no app creation, no token minting). **GitHub** (`https://api.githubcopilot.com/mcp/`) ships OAuth too, but **OAuth is not supported in Claude Code** — Claude Code connects via a **PAT in an Authorization header**, which validates the scoped-PAT approach already used for the Epic-19 GitHub credential. All three can perform the create-actions Epic 19 needs (GitHub: create issues; Linear: create issues; Slack: post messages — but **not create channels**). Key gotchas: the Slack MCP needs a **Claude paid plan + Slack workspace-admin approval** of the Claude app; Linear needs an **account** (free plan suffices) before its OAuth works.

## Sub-Topic 1: Official Slack MCP server

- **Official first-party:** Yes. `https://mcp.slack.com/mcp`, remote Streamable-HTTP (not stdio). Documented at slack.com help + Claude Code MCP docs.
- **Auth:** **OAuth 2.0 browser "Allow"** — zero token minting, no Slack app creation, no scopes config. Add via `claude mcp add --transport http slack https://mcp.slack.com/mcp`, then `/mcp` in-session to complete OAuth. Token stored in OS keychain / secure credentials file, auto-refreshed.
- **Capabilities:** Post messages to any conversation ✅; search messages/files/members/channels; read channel history; create/read Canvases; read profiles. **Create channels: NOT in the documented capability list.**
- **Prerequisites (important):**
  - **Claude paid plan** (Pro / Max / Team / Enterprise — Free excluded).
  - **Slack workspace admin must approve the Claude app** before a member can connect; the Claude app must be installed in Slack first.
  - Not Enterprise-only; standard workspaces work.
- **"Partner app" clarification:** "Partner" = validated OAuth client, NOT a proxy/intermediary. Connection is direct Claude Code → `mcp.slack.com/mcp`. The Slack help article merely links to the partner's (Claude's) own setup docs.

## Sub-Topic 2: Official GitHub MCP server

- **Official first-party:** Yes. `github/github-mcp-server`, GA since 2025-09-04. (Old `@modelcontextprotocol/server-github` deprecated April 2025.)
- **Endpoint / install:**
  - Remote: `https://api.githubcopilot.com/mcp/` (hosted). GHE Server: local-only.
  - Local: Docker `ghcr.io/github/github-mcp-server` with `GITHUB_PERSONAL_ACCESS_TOKEN`.
- **Auth (the key nuance):**
  - Remote in **Copilot IDEs** (VS Code, JetBrains, Cursor): OAuth 2.1 + PKCE.
  - Remote in **Claude Code: PAT via `Authorization: Bearer` header — OAuth NOT supported.**
  - Local Docker/binary: PAT via env var.
  - Add to Claude Code: `claude mcp add-json github '{"type":"http","url":"https://api.githubcopilot.com/mcp","headers":{"Authorization":"Bearer YOUR_GITHUB_PAT"}}'`
- **Capabilities:** 70+ tools across 19 toolsets. **Create issues: yes** (`issue_write` method create), plus PRs, repos, branches. Toolsets scopable via `GITHUB_TOOLSETS` / `--toolsets` / `X-MCP-Toolsets` header; read-only via `X-MCP-Readonly`.
- **Prerequisites:** No Copilot subscription for issues/PRs/repos/users toolsets. `copilot` toolset needs a paid Copilot seat; `code_security` needs Advanced Security. Org admins have an MCP policy to gate member access.
- **Implication for this project:** Claude Code uses a PAT regardless, so the existing **scoped fine-grained PAT** (sandbox repo + Issues) is the correct mechanism — no change needed.

## Sub-Topic 3: Official Linear MCP server

- **Official first-party:** Yes. Launched 2025-05-01, documented at linear.app/docs/mcp.
- **Endpoint / transport:** `https://mcp.linear.app/mcp` (Streamable HTTP). The old `/sse` endpoint was **deprecated 2026-02-05** — do not use.
- **Auth:** **OAuth 2.1 with dynamic client registration** — browser "Allow", no manual API key. Add via `claude mcp add --transport http linear-server https://mcp.linear.app/mcp`, then `/mcp`. (Alternative for headless/CI: pass a Linear personal API key as `Authorization: Bearer`.)
- **Capabilities:** **Create issues ✅**, update, search, sub-issues, comment; list/filter teams; projects + project updates + milestones; initiatives (Feb 2026). Lists teams/projects, updates issues, adds comments — all confirmed.
- **Prerequisites:** **All plans incl. Free** (free: unlimited members, 2 teams, 250 issues, MCP included). No workspace-admin enablement — any member connects via own OAuth. Claude Code: no plan restriction. (Claude.ai web connector path needs Team/Enterprise.)
- **Implication for this project:** No API key minting needed, but Per must **create a Linear account/workspace first** (OAuth needs an existing account).

## Sub-Topic 4: Adding a remote / OAuth MCP server to Claude Code

- **CLI syntax:** `claude mcp add --transport http <name> <url>` (all flags BEFORE the name). SSE variant: `--transport sse` (deprecated but supported). Auth header: `--header "Authorization: Bearer <tok>"`.
- **OAuth flow:** add server → run `/mcp` in session → select the flagged server → browser "Allow" → redirect to `http://localhost:PORT/callback` → tokens stored securely (Windows: secure credentials file), auto-refreshed. If redirect fails, paste the callback URL into the prompt.
- **Scope (critical for secrets):**
  - `--scope local` (default): `~/.claude.json`, private to this project.
  - `--scope user`: `~/.claude.json`, private, all projects.
  - `--scope project`: `.mcp.json` at repo root, **committed to git** — never use for OAuth/secret servers.
  - **For personal OAuth credentials → use `local` or `user`, NEVER `project`.** (The repo's `.mcp.json` is git-tracked here.)
- **Direct `.mcp.json` editing:** possible with an `oauth` object (`clientId`, `callbackPort`, optional `scopes`), client secret passed via CLI flag/env not the file; but CLI + `/mcp` is the recommended path for OAuth servers.
- **Verify:** `claude mcp list`, `claude mcp get <name>`, and `/mcp` (shows status, tool count, auth flags, reconnect/clear-auth menu).

## Consolidated Sources

- https://slack.com/help/articles/48855576908307-Guide-to-the-Slack-MCP-server — Slack help, 2025
- https://support.claude.com/en/articles/11506255-getting-started-with-claude-in-slack — Anthropic, 2025
- https://code.claude.com/docs/en/mcp — Claude Code MCP docs (Slack `mcp.slack.com/mcp` example; remote-MCP auth; scopes), 2026
- https://github.com/github/github-mcp-server — official repo
- https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-claude.md
- https://github.blog/changelog/2025-09-04-remote-github-mcp-server-is-now-generally-available/ — 2025-09-04
- https://github.blog/changelog/2025-06-12-remote-github-mcp-server-is-now-available-in-public-preview/ — 2025-06-12
- https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp/set-up-the-github-mcp-server
- https://linear.app/docs/mcp
- https://linear.app/changelog/2025-05-01-mcp — 2025-05-01
- https://linear.app/changelog/2026-02-05-linear-mcp-for-product-management — 2026-02-05 (sse deprecation)
- https://linear.app/pricing

## Open Questions / Gaps

- Exact named tool identifiers for Linear/Slack are described in prose, not fully enumerated in public docs.
- Whether the Slack MCP can create channels (absent from docs → assume no; needs Web-API/manual).
- Whether Slack-MCP admin approval is needed per-workspace even when the connecting user is the workspace owner (likely owner can self-approve).

## Revisit Triggers

- Re-check if GitHub adds OAuth support for Claude Code (would remove the PAT requirement).
- Re-check Slack MCP if channel-creation tooling is added.
- Re-run if any endpoint changes (Linear already migrated `/sse` → `/mcp`).

## Operational Notes — What Actually Worked (Epic 19 sandbox setup, 2026-05-25)

Hands-on findings from wiring these MCPs into Claude Code on Windows 11. These emerged *after* the research above, during real setup, and supersede it where they differ.

- **Slack MCP `/mcp` OAuth fails — no DCR.** Both Claude Code's built-in `/mcp` OAuth and the server's own `authenticate` tool fail with `SDK auth failed: Incompatible auth server: does not support dynamic client registration`. The error's "run /mcp and authenticate manually" advice is a dead end (same DCR path).
- **Workaround that worked: claude.ai → Settings → Connectors → Slack.** Account-managed OAuth (one "Allow"), no Slack app creation / bot token. After a session restart it injects real Slack tools `mcp__claude_ai_Slack__*` (send_message, search_channels, create_conversation incl. private channels, read_channel, search_users, …) into Claude Code. Prerequisite: the Claude app must be admin-approved in the workspace (Marketplace: `slack.com/marketplace/A08SF47R6P4`) — the workspace owner can self-approve.
- **Linear MCP supports DCR** → direct path works: `claude mcp add --transport http --scope user linear https://mcp.linear.app/mcp` → restart → `/mcp` → "Allow". No connector workaround needed. (Linear is not offered as a claude.ai connector.)
- **GitHub claude.ai connector ≠ action-tools in Claude Code** (it powers repo/branch/PR selection in remote sessions only). For n8n-runtime GitHub writes, a scoped fine-grained PAT in an n8n `githubApi` credential is the mechanism.
- **Mid-session MCP add/remove is NOT hot-reloaded** for user/project-config servers (`claude mcp add/remove`); `/reload-plugins` only reloads *plugin* MCPs. Restart with `claude --continue` (preserves the conversation) to pick up a newly-added server or a claude.ai connector. Doc-confirmed: no in-session reload for user-configured servers.
- **n8n credential schema quirk** (`n8n_manage_credentials create` for `githubApi`/`slackApi`/`linearApi`): omitting `allowedHttpRequestDomains` falsely makes `allowedDomains` required. Fix: set `allowedHttpRequestDomains:"domains"` + `allowedDomains:"<service-domain>"`.
- **Remote Control on Windows 11:** `remoteControlAtStartup:true` works (session reachable from phone) but the terminal shows no visible "RC active" indicator — looks inactive but isn't. Not bug #54527 (which would hide the session entirely). `daemonColdStart:"ask"` appears undocumented; no cold-start prompt fires.

### Epic 19 sandbox-target setup state + IDs

→ moved to the Epic 19 results file: [`specs/19-agentic-triage-actions-results.md`](../specs/19-agentic-triage-actions-results.md) § "Phase 0 — Prerequisite Setup" (sandbox-target IDs, the three n8n MCP-credential IDs, the working Slack-OAuth config). This research file keeps the reusable MCP/connector learnings above.
