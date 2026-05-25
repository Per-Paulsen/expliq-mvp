# Epic 18 — Implementation Results (Phase 0 + 1a)

> Companion to [`18-n8n-ai-support-triage.md`](18-n8n-ai-support-triage.md) and the [runbook](18-n8n-ai-support-triage-runbook.md). Records what was actually built, the decisions, the deviations from the runbook, and reproducibility notes. Read this before continuing Phase 1a or starting the `/dev` slice (Phase 2).

## Status (2026-05-25)

- **Phase 0** (self-hosted n8n + Ollama + n8n-MCP): DONE, verified end-to-end.
- **Phase 1a / 1a.2** (KB authoring): DONE — `n8n/knowledge/*.md` committed (5 files), scope locked in brainstorming Round 10.
- **Phase 1a / 1a.3** (indexer workflow): DONE, verified — 34 per-heading chunks (768-dim) in the dedicated Supabase pgvector store.
- **Remaining:** indexer idempotency (self-clear), export indexer workflow JSON (1a.5), then 1a.4 (answer workflow), then Phases 2–4 (`/dev` widget slice → preview → prod).

## Key decisions & deviations from the runbook

### D1 — RAG vector store on a dedicated Supabase project, NOT the prod DB
The runbook (1a.1/1a.3) says enable pgvector on the existing Supabase and let n8n create its table there. But that Supabase is the **single shared prod DB** (see `DEPLOY-PORTFOLIO.md`: "Same DB for dev + prod"; only `DATABASE_URL` exists, no separate dev DB). **Decision:** stand up a dedicated 2nd Supabase project (`expliq-rag`, region eu-central-1 near the nbg1 box, pgvector enabled) purely for the RAG vectors, so the product's prod DB stays untouched. The connection lives in the gitignored `.env` as `RAG_DATABASE_URL` (session pooler, port 5432, IPv4). Honors the runbook's isolation intent maximally.

### D2 — KB delivery via the GitHub Contents API, NOT the native GitHub Document Loader node
The n8n GitHub Document Loader node has no path filter (only `ignorePaths`) and requires a GitHub PAT, so it would crawl the whole Next.js app repo. **Decision:** the indexer reads only `n8n/knowledge/` via GitHub's **public Contents API** (the repo is public → no token, no whole-repo crawl). The git repo stays the single source of truth for the KB.

### D3 — Per-heading chunking via a Code node, NOT the merge-based text splitter
The spec requires "chunk by heading; 1 topic each." The Character Text Splitter merged short sections (first attempt produced 8 coarse chunks — whole small files as a single chunk). **Decision:** a Code node ("Split into sections") splits each markdown on `\n## ` and emits one chunk per H2 section, prefixed with the document's H1 title so each chunk is self-contained. The Default Data Loader runs in "simple" mode (sections are < 1000 chars → no further splitting). Result: **34 focused per-heading chunks.**

### D4 — Supabase pooler SSL via `allowUnauthorizedCerts`
The Supabase pooler presents a certificate not in Node's CA bundle ("self-signed certificate in certificate chain"), and n8n's Postgres credential has no field for a custom CA cert. **Decision:** the Postgres credential uses `allowUnauthorizedCerts: true` (SSL stays on / encrypted; the cert chain is not CA-verified). This is the standard way to connect to the Supabase pooler from tools that can't load Supabase's CA.

### D5 — Indexer built in n8n, not as a standalone script
A standalone script would be simpler for indexing alone. The indexer is built in n8n deliberately because (a) the runbook prescribes it, (b) this epic is a portfolio piece demonstrating n8n RAG-building, and (c) using the **same n8n PGVector node** on the write side (indexer) and the read side (answer workflow) guarantees table-schema and embedding-format compatibility for free.

## The indexer workflow

Name: **"Expliq Support — KB Indexer"** (manual trigger, inactive by design — an indexer runs on demand, not via an open webhook).

```
Manual Trigger
  → HTTP (GitHub Contents API: list n8n/knowledge/ on the feature branch)
  → HTTP (fetch each raw .md, retryOnFail)
  → Code "Split into sections" (one chunk per H2, title-prefixed)
  → Postgres PGVector (insert, table `expliq_kb_vectors`)
       ├─ ai_document:  Default Data Loader ("simple")
       └─ ai_embedding: Embeddings Ollama (nomic-embed-text, 768-dim)
```

Credentials are configured **on the box** (a Postgres credential pointing at `RAG_DATABASE_URL`, and an Ollama credential at `http://ollama:11434`). No secrets in the repo.

### How to run / re-index
Manual triggers cannot be fired via the n8n public API — run the indexer with **"Execute workflow"** in the n8n editor. Verify by querying the dedicated Supabase (`RAG_DATABASE_URL`) for row count and `vector_dims(embedding)` = 768.

### Known gaps / risks
- **Not yet idempotent:** re-running appends duplicate chunks (currently cleared manually via `TRUNCATE expliq_kb_vectors` before a re-index). Clean fix: a Postgres "clear" node before the insert.
- pgvector `metadata.source` is the loader's default ("blob"); chunk attribution lives in the in-text title prefix instead — sufficient for grounding.
- 1a.5 export (`n8n/support-indexer.workflow.json`) still pending.

## Reproducibility (clone / fresh box)
The n8n-MCP global install + `.mcp.json` config are documented in the runbook. Once exported (1a.5), the workflow JSON under `n8n/` allows re-import. The dedicated Supabase + `RAG_DATABASE_URL` must be provisioned per D1.
