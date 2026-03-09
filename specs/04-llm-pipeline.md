# 04 — LLM Pipeline

## Scope

Build the Claude (Anthropic API) integration that transforms raw n8n workflow JSON into business-readable fields. This includes:

- **Prompt engineering**: design a structured prompt that takes a raw workflow JSON and returns all required fields in a reliable, parseable format (JSON output)
- **API integration**: call the Anthropic API (Claude Sonnet 4.6 or Haiku 4.5 — balance cost vs quality) from a Next.js API route
- **Field extraction and storage**: parse the LLM response and store generated fields on the Automation record:
  - **Name** — human-readable name (e.g., "CRM → Slack Escalation")
  - **Description** — 1-2 sentence business summary
  - **Trigger** — plain-language trigger description
  - **Core Logic** — step-by-step bullet points
  - **Systems Touched** — array of external system names (Slack, Salesforce, etc.)
  - **Data Types** — array of data types flowing through the workflow
  - **Business Context** — why this automation matters; what breaks if it fails
  - **Side Effects** — what the automation writes/modifies in other systems
  - **Trigger Type** — categorical classification (webhook, schedule, manual, event, or other)
  - **Impact Proposal** — classification (Critical / High / Medium / Low) with reasoning
- **Post-sync trigger**: after the n8n sync completes, automatically run the LLM pipeline for all newly imported or updated automations. The trigger mechanism is implemented within this epic (e.g., the sync completion handler calls the LLM pipeline internally). Automations are processed sequentially to respect API rate limits.
- **Per-automation regeneration**: a "Regenerate" API endpoint that re-runs the LLM pipeline for a single automation and overwrites its generated fields
- **documentationLastUpdated**: set to the current timestamp when LLM generation completes (this timestamp drives the "documentation outdated" governance signal)
- **Error handling**: gracefully handle API failures, rate limits, and malformed responses without corrupting existing data; surface errors to the caller

LLM-generated fields are NOT user-editable. They can only be refreshed by re-running the pipeline.

## Acceptance criteria

- [ ] A Next.js API route accepts an automation ID and sends its `rawWorkflowJson` to the Anthropic API with a structured prompt
- [ ] The LLM returns a JSON object containing: name, description, trigger, triggerType, coreLogic, systemsTouched, dataTypes, businessContext, sideEffects, impactProposal (level + reasoning)
- [ ] Generated fields are persisted to the Automation record; `documentationLastUpdated` is set to the current timestamp
- [ ] After n8n sync, the pipeline automatically runs for all new or updated automations (those whose `rawWorkflowJson` changed)
- [ ] A "Regenerate" endpoint re-runs the pipeline for a single automation and overwrites previous LLM-generated fields
- [ ] If the LLM response is missing required fields or contains unparseable data, the automation's existing LLM fields are not overwritten and the error is reported to the caller
- [ ] API errors (rate limits, network failures, malformed responses) are handled gracefully: existing data is not corrupted, and errors are returned to the caller
- [ ] The Anthropic API key is stored as an environment variable (not in the database)

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
| **LLM pipeline** | The process of sending raw workflow JSON to Claude and parsing structured business-readable fields from the response |
| **Impact proposal** | The LLM's suggested impact classification (Critical/High/Medium/Low) with reasoning; user can accept or override |
| **Regeneration** | Re-running the LLM pipeline for a single automation to refresh its generated fields |
| **documentationLastUpdated** | Timestamp set when LLM generation completes; used by the risk engine to detect stale documentation |
| **Structured output** | The LLM is instructed to return a JSON object with specific keys, making the response programmatically parseable |

## Open questions

- Claude Sonnet 4.6 vs Haiku 4.5: Sonnet is more capable but slower and more expensive per call. For MVP volume (tens of workflows, not thousands), Sonnet is likely fine. Revisit if cost becomes an issue.
- Should we store the raw LLM response alongside the parsed fields for debugging purposes?
