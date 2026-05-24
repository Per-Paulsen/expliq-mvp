---
tags:
  - type/runbook
  - epic/18
  - exercise/19
---

# Epic 18 — Runbook (Phase 0 + 1a: self-hosted n8n + RAG)

> Operational guide for the interactive, MCP-driven setup that `/dev` does NOT automate.
> Spec: [18-n8n-ai-support-triage.md](18-n8n-ai-support-triage.md). Covers **M1** (Phase 0 + 1a). M2/M3 (Epics 19/20) add their own steps at the end.
> Most steps run on the Hetzner box (console) or in Claude Code via the n8n-MCP. Per leads at the console; Claude Code drives the workflow build.

## Prerequisites checklist (gather before starting)

- [ ] Hetzner Cloud account + ability to create a CX22 VPS (2 vCPU, 4GB RAM, Ubuntu 24.04). ~EUR 4-5/mo.
- [ ] A (sub)domain you control, e.g. `n8n.<your-domain>` (for HTTPS + `WEBHOOK_URL`).
- [ ] OpenRouter API key (answer LLM = Claude; reuses the project's `OPENROUTER_API_KEY` pattern).
- [ ] Supabase project access + the connection strings (already in the project's `.env`: `DATABASE_URL`, `DIRECT_URL`).
- [ ] A shared secret string for the webhook (`N8N_SUPPORT_WEBHOOK_SECRET`), generated locally.
- [ ] (M2 later) GitHub sandbox repo, Linear test board, Slack workspace + private channel + tokens.

## Secrets map (where each secret lives)

| Secret | Lives in | Notes |
|---|---|---|
| n8n API key | local `.env` (gitignored) + shell env for Claude Code | referenced as `${N8N_API_KEY}` in committed `.mcp.json` (stdio `env` block) |
| `N8N_API_URL` | local `.env` + shell env | e.g. `https://n8n.<domain>/api/v1` |
| Webhook URL + secret | Vercel prod env (`N8N_SUPPORT_WEBHOOK_URL`, `N8N_SUPPORT_WEBHOOK_SECRET`) | NEVER in the client bundle; only the Server Action reads them |
| OpenRouter key | n8n credentials (in the n8n instance) | for the answer LLM node |
| Supabase connection | n8n credentials (Postgres node) | use the **direct** connection (port 5432) for the vector node (it needs DDL) |
| n8n owner password, encryption key | the Hetzner box (compose env) | never committed |

---

## Phase 0 — Provision public n8n + Ollama + wire the MCP

### 0.1 Create the box + DNS
1. Create a Hetzner CX22 (Ubuntu 24.04). Note its public IP.
2. Point an A record `n8n.<your-domain>` -> that IP. Wait for DNS to resolve.
3. SSH in. Install Docker + Compose plugin:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```

### 0.2 docker-compose (n8n + Caddy + Ollama)
Create `/opt/n8n/docker-compose.yml` (illustrative; fill in your domain + secrets):
```yaml
services:
  caddy:
    image: caddy:2
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on: [n8n]

  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_HOST=n8n.${DOMAIN}
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.${DOMAIN}/
      - N8N_EDITOR_BASE_URL=https://n8n.${DOMAIN}/
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - N8N_PUBLIC_API_DISABLED=false   # the REST API the n8n-MCP needs
      - OLLAMA_HOST=http://ollama:11434
    volumes: [n8n_data:/home/node/.n8n]
    depends_on: [ollama]

  ollama:
    image: ollama/ollama:latest
    volumes: [ollama_models:/root/.ollama]

volumes: { caddy_data: {}, n8n_data: {}, ollama_models: {} }
```
`Caddyfile`:
```
n8n.{$DOMAIN} {
    reverse_proxy n8n:5678
}
```
Bring it up: `DOMAIN=<your-domain> N8N_ENCRYPTION_KEY=<random> docker compose up -d`. Caddy auto-provisions the Let's Encrypt cert. Open `https://n8n.<domain>`, complete the n8n owner setup.

### 0.3 Pull the embedding model
```bash
docker compose exec ollama ollama pull nomic-embed-text
```
(`nomic-embed-text` = 768-dim, CPU-only, ~274MB. Confirms Epic 18 OQ1.)

### 0.4 Create the n8n API key
In n8n: Settings -> API -> create an API key. This is what the n8n-MCP uses.

### 0.5 Wire the n8n-MCP into the repo (stdio)
On the dev machine, add to the committed `.mcp.json` (alongside `figma`):
```jsonc
{
  "mcpServers": {
    "figma": { "type": "http", "url": "https://mcp.figma.com/mcp" },
    "n8n": {
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": { "N8N_API_URL": "${N8N_API_URL}", "N8N_API_KEY": "${N8N_API_KEY}" }
    }
  }
}
```
Put the real values in the gitignored `.env` AND export them in the shell Claude Code runs in (env-var expansion in `.mcp.json` reads the process env). Restart Claude Code, confirm the `n8n` MCP tools appear and can list workflows. **No literal secret is committed.**

---

## Phase 1a — RAG (knowledge base + indexer + answer workflow)

### 1a.1 Enable pgvector on Supabase
Run once (Supabase SQL editor or `psql` via `DIRECT_URL`):
```sql
create extension if not exists vector;
```
The n8n vector node creates/manages its own table; Prisma ignores it. Keep it in its own table/namespace; never point n8n at Prisma-managed tables.

### 1a.2 Author the knowledge base
Create `n8n/knowledge/*.md` (committed), reusing the Exercise 22 structure:
- `expliq-features.md`, `faq.md`, `governance-signals.md`, `risk-levels.md`, plus n8n-support topics.
- Split by heading; keep sections focused (1 topic each).

### 1a.3 Build the indexer workflow (via the n8n-MCP)
Have Claude Code build, in n8n: read the KB markdown -> chunk by heading -> **Ollama embeddings** (`nomic-embed-text`) -> upsert into the **Supabase PGVector** store (vector column dimension = 768). Set the Supabase Postgres credential to the **direct** connection (port 5432). Run it once to populate. Verify a similarity query returns relevant chunks.

### 1a.4 Build the answer workflow (via the n8n-MCP)
```
Webhook (POST /expliq-support, header auth x-webhook-secret, respond: when last node finishes)
  -> retriever over the PGVector store (Ollama-embedded query)
  -> Claude via OpenRouter (default anthropic/claude-sonnet-4): classify + grounded answer
       guardrails: answer ONLY from retrieved context; "I don't have enough information" fallback; never invent
  -> Respond to Webhook -> { category, reply }
```
Set credentials in n8n: OpenRouter key, Ollama base URL, Supabase Postgres (direct).

### 1a.5 Verify + export
- Ask a question whose answer is in a KB file -> reply contains that fact.
- Ask an out-of-scope question -> the exact "I don't have enough information" fallback (no hallucination).
- A request without the `x-webhook-secret` header is rejected.
- Export both workflows to the repo (committed): `n8n/support-answer.workflow.json`, `n8n/support-indexer.workflow.json`.
- Record the live webhook URL (`https://n8n.<domain>/webhook/expliq-support`) for the Server Action / Vercel env.

---

## Fallback: swap Ollama -> OpenAI embeddings
If Ollama is flaky before the deadline: change the embeddings node to OpenAI `text-embedding-3-small`, then **re-run the indexer** (1a.3). Vectors are not cross-model compatible, so a full re-index is required (and the vector column dimension changes: 768 -> 1536). Keep an OpenAI key handy as the safety net.

---

## After Phase 0/1a -> hand to `/dev` (Phase 2)
With the live webhook URL + secret in hand, `/dev specs/18-n8n-ai-support-triage.md` builds the Track-1 code slice (widget + Server Action + tests). Then preview deploy (Phase 3) -> set Vercel prod env + merge to `main` (Phase 4).

## Later (M2/M3 — separate epics)
- **M2 ([Epic 19](19-agentic-triage-actions.md)):** turn the answer workflow into an AI Agent + MCP Client action tools (GitHub/Linear/Slack) against sandbox targets; rate-limit hardening. Needs the sandbox prerequisites above.
- **M3 ([Epic 20](20-n8n-mcp-server-door.md)):** factor RAG/triage into tool sub-workflows + add a native MCP Server Trigger workflow; point Claude Desktop/Code at it.
