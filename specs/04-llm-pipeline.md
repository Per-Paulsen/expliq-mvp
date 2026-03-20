---
tags:
  - type/spec
  - status/done
  - epic/04
---

# 04 — LLM Pipeline

> Upstream: [PRD](../expliq_prd.md) | Previous: [03 — n8n Connector](03-n8n-connector.md)

## Scope

Build the LLM integration (via OpenRouter) that transforms raw n8n workflow JSON into business-readable fields. Uses the OpenAI SDK with OpenRouter's OpenAI-compatible API, allowing model selection via environment variable. This includes:

- **Schema migration**: add `impactReasoning String?` to the Automation model (this field was deferred from earlier epics)
- **Prompt engineering**: design a structured prompt that takes a raw workflow JSON and returns all required fields in a reliable, parseable format (JSON output)
- **API integration**: call the OpenRouter API using the OpenAI SDK (`openai` package) with base URL `https://openrouter.ai/api/v1`. Model is configured via `OPENROUTER_MODEL` env var with a fallback default (e.g., `anthropic/claude-sonnet-4`). JSON output via `response_format: { type: "json_object" }`.
- **`rawWorkflowJson` handling**: when reading `rawWorkflowJson` from the database, the value is Prisma's `JsonValue` type and must be serialized (e.g., `JSON.stringify()`) before sending to the LLM
- **Field extraction and storage**: parse the LLM response and store generated fields on the Automation record:
  - **Name** — human-readable name (e.g., "CRM → Slack Escalation")
  - **Description** — 1-2 sentence business summary
  - **Trigger** — plain-language trigger description
  - **Core Logic** — step-by-step bullet points
  - **Systems Touched** — array of external system names (Slack, Salesforce, etc.); normalized to lowercase during parsing to prevent casing inconsistencies in exposure scores
  - **Data Types** — array of data types flowing through the workflow
  - **Business Context** — why this automation matters; what breaks if it fails
  - **Side Effects** — array of what the automation writes/modifies in other systems (matches schema `sideEffects String[]`)
  - **Trigger Type** — categorical classification (webhook, schedule, manual, event, or other)
  - **Impact Proposal** — classification (Critical / High / Medium / Low) with reasoning (stored in `impactReasoning`)
- **Architecture**: the core LLM logic lives in an internal service module (`src/lib/llm-pipeline.ts`), exposed to the UI via server actions. This avoids the server-action-calling-server-action pattern and follows the existing `n8n-client.ts` → `actions/connector.ts` pattern.
- **Post-sync trigger**: after the n8n sync completes, the UI triggers a separate "process unprocessed automations" server action (sync returns immediately with its summary). This requires modifying the existing settings page component (built in epic 03: `src/components/settings-form.tsx`) to call the new server action after sync completes and display a processing indicator while it runs. The pipeline queries for automations where `documentationLastUpdated IS NULL OR automationLastUpdated > documentationLastUpdated` — this is idempotent and handles interrupted previous runs. Automations are processed sequentially to respect API rate limits.
- **Per-automation regeneration**: a server action that re-runs the LLM pipeline for a single automation and overwrites its generated fields
- **documentationLastUpdated**: set to the current timestamp when LLM generation completes (this timestamp drives the "documentation outdated" governance signal)
- **Error handling**: gracefully handle API failures, rate limits, and malformed responses without corrupting existing data; surface errors to the caller

LLM-generated fields are NOT user-editable. They can only be refreshed by re-running the pipeline.

## Acceptance criteria

- [ ] A Prisma schema migration adds `impactReasoning String?` to the Automation model
- [ ] An endpoint (server action or API route) accepts an automation ID, verifies the automation belongs to the requesting user's workspace, and sends its `rawWorkflowJson` to the OpenRouter API (via OpenAI SDK) with a structured prompt
- [ ] The LLM returns a JSON object containing: name, description, trigger, triggerType, coreLogic, systemsTouched, dataTypes, businessContext, sideEffects, impactProposal (level + reasoning)
- [ ] Generated fields are persisted to the Automation record, including `impactReasoning` (the LLM's explanation for its impact classification); `documentationLastUpdated` is set to the current timestamp
- [ ] After n8n sync, a separate server action triggers LLM processing for all automations where `documentationLastUpdated IS NULL OR automationLastUpdated > documentationLastUpdated` (sync returns immediately; LLM processing is a follow-up call)
- [ ] A "Regenerate" server action re-runs the pipeline for a single automation and overwrites previous LLM-generated fields
- [ ] The core LLM logic is in an internal service module (`src/lib/llm-pipeline.ts`), called by server actions for both post-sync processing and single-automation regeneration
- [ ] If the LLM response is missing required fields or contains unparseable data, the automation's existing LLM fields are not overwritten and the error is reported to the caller
- [ ] API errors (rate limits, network failures, malformed responses) are handled gracefully: existing data is not corrupted, and errors are returned to the caller
- [ ] The OpenRouter API key (`OPENROUTER_API_KEY`) and model (`OPENROUTER_MODEL`) are stored as environment variables (not in the database)

## Out of scope

- Batch regeneration UI for all automations at once
- LLM model selection or configuration UI
- Streaming LLM responses to the client
- Any UI for displaying the generated fields (that's epics 06 and 07)
- Fine-tuning or custom model training
- Caching or memoization of LLM responses

## Domain terms

| Term | Definition |
|------|-----------|
| **LLM pipeline** | The process of sending raw workflow JSON to an LLM (via OpenRouter) and parsing structured business-readable fields from the response |
| **Impact proposal** | The LLM's suggested impact classification (Critical/High/Medium/Low) with reasoning; user can accept or override |
| **impactReasoning** | The LLM's explanation for its impact classification, stored as free-form text alongside the `impactProposal` enum |
| **Regeneration** | Re-running the LLM pipeline for a single automation to refresh its generated fields |
| **documentationLastUpdated** | Timestamp set when LLM generation completes; used by the risk engine to detect stale documentation |
| **Structured output** | The LLM is instructed to return a JSON object with specific keys, making the response programmatically parseable |

## Open questions

- ~~Resolved: Raw LLM response storage — No for MVP. Use temporary logging if debugging is needed.~~
- ~~Resolved: Post-sync LLM trigger — (b) separate call. Sync returns immediately; UI triggers LLM processing via a follow-up server action.~~
- ~~Resolved: Architecture — internal service module (`src/lib/llm-pipeline.ts`) with core logic, exposed via server actions. Follows existing `n8n-client.ts` → `actions/connector.ts` pattern.~~
- ~~Resolved: LLM target selection — (b) query by timestamp (`documentationLastUpdated IS NULL OR automationLastUpdated > documentationLastUpdated`). Idempotent, handles interrupted runs.~~
- ~~Resolved: Impact reasoning is stored in `impactReasoning String?` on the Automation model. Requires a schema migration in this epic.~~
- ~~Resolved: LLM provider — OpenRouter (via OpenAI SDK) instead of direct Anthropic API. Model configured via `OPENROUTER_MODEL` env var with fallback default.~~

---

## Related

- [Brainstorming](04-llm-pipeline-brainstorming.md)
- [Results](04-llm-pipeline-results.md)
- [Next: 05 — Risk Engine](05-risk-engine.md)
- [Patch: Parallelize LLM](patches/parallelize-llm.md)
