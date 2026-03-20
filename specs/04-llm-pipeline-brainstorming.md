---
tags:
  - type/brainstorming
  - status/done
  - epic/04
---

# 04 — LLM Pipeline — Brainstorming

> Upstream: [Epic 04: LLM Pipeline](04-llm-pipeline.md)

## Refinement Applied

Batch-refined via `/refine_all_ind`. See `specs/ind-epic-review.md` for details.

## Implementation Refinement Applied

Batch-refined via `/refine_all_ind` (in-dev mode). See `specs/ind-epic-review.md` for details.

Results incorporated:
- 01-project-setup-results.md
- 02-auth-results.md
- 03-n8n-connector-results.md

---

## User Challenge: OpenRouter instead of direct Anthropic API

**User's concern:** Why is the spec hardcoded to the Anthropic API? OpenRouter would provide model flexibility, fallback routing, and the ability to swap models without code changes.

**Decision:** Use **OpenRouter** instead of the direct Anthropic API.

### Analysis

**Why OpenRouter makes sense for this project:**

1. **Model flexibility** — The task (structured field extraction from JSON) doesn't require cutting-edge reasoning. OpenRouter lets you start with a cost-effective model and upgrade only if quality is insufficient, without code changes.
2. **Fallback routing** — If one provider is down, OpenRouter can route to another, improving reliability.
3. **Single billing** — One API key and one vendor for all LLM usage.
4. **OpenAI-compatible API** — Widely supported, lots of tooling, easy to find examples and documentation.
5. **Cost experimentation** — Try cheaper models (Claude Haiku, GPT-4o-mini, Gemini Flash) before committing to expensive ones.

**What this changes in the spec:**

| Spec element | Before (Anthropic) | After (OpenRouter) |
|---|---|---|
| SDK | `@anthropic-ai/sdk` | `openai` (OpenAI SDK — OpenRouter is OpenAI-compatible) |
| Base URL | `https://api.anthropic.com` | `https://openrouter.ai/api/v1` |
| Env vars | `ANTHROPIC_API_KEY` | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` |
| JSON output | Anthropic tool_use / JSON mode | `response_format: { type: "json_object" }` |
| Model constant | Named constant in code | Env var (`OPENROUTER_MODEL`, e.g. `anthropic/claude-sonnet-4`) |

**What does NOT change:** prompt design, field extraction, server action architecture, post-sync trigger, error handling, sequential processing, idempotent targeting query — all remain identical.

**Cross-epic impact:** None. Epics 05–08 reference "LLM-generated fields" generically. No other spec mentions Anthropic, Claude SDK, or the API provider. The change is fully contained within epic 04.

**Recommendation:** Agreed — update the spec to use OpenRouter.

---

## Proactive Spec Review

### Issues Found

**1. Model ID storage — named constant vs env var (Inconsistent with OpenRouter):**
The spec says "store model ID as a named constant." With OpenRouter, the model ID should be an environment variable (`OPENROUTER_MODEL`) so the user can switch models without redeploying. The "named constant" approach was appropriate when locked to Claude, but doesn't fit the OpenRouter flexibility benefit.

**Recommendation:** Change to env var with a fallback default constant (e.g., `process.env.OPENROUTER_MODEL ?? 'anthropic/claude-sonnet-4'`). This preserves the "easy swapping" intent while making it runtime-configurable.

**2. Open question still unresolved — raw LLM response storage:**
The spec's only remaining open question is: "Should we store the raw LLM response alongside the parsed fields for debugging purposes?" This has been open since the spec was written.

**Recommendation:** No for MVP. It adds a schema field, storage cost, and complexity with no user-facing benefit. If LLM responses need debugging, the developer can add temporary logging. Revisit if quality issues emerge in production.

**3. No other issues found.** The spec is clean on:
- Ungrounded assumptions — all referenced fields exist in the Prisma schema (except `impactReasoning` which the spec explicitly adds)
- Hidden scope creep — settings-form modification is explicitly called out
- Oversized slices — scope is well-bounded
- Missing ACs — all ACs are testable
- Domain language — consistent with other specs

i am fine witht the recommendations

## Refinement Applied

Three changes applied to `specs/04-llm-pipeline.md`:

1. **Anthropic API → OpenRouter** — All references to Anthropic API, Anthropic SDK, and Claude-specific integration replaced with OpenRouter via OpenAI SDK. Base URL, env vars (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`), and JSON output mode updated throughout scope and ACs.
2. **Model ID: named constant → env var** — Model selection changed from a hardcoded named constant to `OPENROUTER_MODEL` env var with a fallback default (`anthropic/claude-sonnet-4`). Enables runtime model swapping without redeployment.
3. **Raw LLM response storage — closed as "No for MVP"** — Open question resolved. No schema field for raw responses; use temporary logging if debugging is needed.

---

## Related

- [Spec](04-llm-pipeline.md)
- [Results](04-llm-pipeline-results.md)
