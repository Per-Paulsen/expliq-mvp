# Patch: Make the file_support_request formatter deterministic (drop the 2nd LLM) — Brainstorming

> Status: draft / brainstorming. Not yet implemented. Target is an n8n workflow on the box (not repo app code).
> Append-only: add new sections at the bottom, annotate existing ones, do not rewrite.

## Goal

Replace the second LLM call in `file_support_request` (the "Format response" chainLlm that re-parses the agent's free text into the `{category, reply, actionsTaken[], slackSummary}` contract) with a **deterministic Code node**. The Triage Agent emits structured output directly; a Code node parses it robustly. This removes a full Claude-Sonnet-4 call per request and makes the contract (especially the issue URL in `actionsTaken`) robust instead of LLM-re-extracted.

## Why (research-backed)

- The 2nd LLM only reformats; the URL it re-extracts from prose was already deterministically available from the tool response. An LLM copying an exact URL can corrupt it.
- n8n's own docs recommend splitting "reason+act" from "format" and using a deterministic step for the format, not chaining a Structured Output Parser onto an agent (fragile).
- Both 2026-05-30 research reports confirm: deterministic format step over a second LLM; for local models this is mandatory, for Claude it is still a clean win (cost + robustness).
- Matches the expliq app convention already in `CLAUDE.md` ("JSON fence stripping on all responses").

## Affected object

- **n8n workflow** `file_support_request` (`3Mlx4jPSdle75zmW`) on the box. **This is the LIVE prod workflow** (the widget delegates to it via `IuXf6YCFk85qxyu0`).
- Repo export (if kept in sync): `n8n/support-file-support-request.workflow.json` (credential refs only, no secrets).
- No expliq app-code change. The widget contract `{category, reply, actionsTaken[], slackSummary}` stays byte-identical.

## Current behavior (verified live)

```
Triage Agent (Claude)  -> free-text output ($json.output)
   -> Format response (chainLlm, OpenRouter Claude #2, + Structured Output Parser)  -> {category, reply, actionsTaken[], slackSummary}
   -> Build audit (Code)  -> Slack Audit  -> Return result
```
- Triage Agent: classifies, calls at most one MCP tool (GitHub `issue_write` / Linear `save_issue`), writes a reply, states the created issue URL in its free text.
- Format response + OpenRouter (Format) + Structured Output Parser: three nodes whose only job is free-text -> JSON.
- Build audit reads `$json.output` (the parsed object); Return result returns `$('Format response').first().json.output`.

## Proposed change

```
Triage Agent (Claude)  -> structured output (a JSON object as its final message)
   -> Parse result (Code node, deterministic)  -> {category, reply, actionsTaken[], slackSummary}
   -> Build audit (Code)  -> Slack Audit  -> Return result
```

1. **Agent prompt:** extend the system message so the agent's FINAL output is a strict JSON object with exactly `{category, reply, actionsTaken[], slackSummary}`. Do NOT attach the Structured Output Parser to the agent (that is the fragile path); just instruct it to end with the JSON. Keep all existing classification + one-action + injection-hardening rules.
2. **Parse result (Code node):** replace "Format response", "OpenRouter (Format)", and "Structured Output Parser" with one Code node that:
   - takes the agent's output string,
   - strips markdown fences / leading prose (first `{` to last `}`),
   - `JSON.parse` inside try/catch,
   - validates the four fields and the `actionsTaken[]` item shape (`{type, ref}`),
   - on parse failure, returns a safe fallback object (see open question 2).
3. **Build audit / Return result:** repoint to read the Code node's output instead of `$('Format response')...`.

## Key detail: the issue URL in actionsTaken

The weakest part today is `actionsTaken[].ref` (the GitHub/Linear URL). Two options:
- **(a) Pragmatic:** the agent includes the URL in its structured JSON (it receives it from the tool and already states it); the Code node reads it deterministically from the agent JSON. Deterministic parse, but the URL still originates in the agent's own output.
- **(b) Stronger:** capture the real MCP tool response and build `actionsTaken` from it in code, independent of what the agent wrote. In n8n the langchain agent's internal tool result is not trivially exposed as a separate node output, so this needs verification (can we read the tool call result? or restructure so the tool call is a deterministic node outside the agent?).
- Open question 1 below. Start with (a); evaluate (b) only if (a) proves unreliable.

## Risk & rollback

- **This is the live prod path.** Build and verify on a COPY (or a temp path) first, byte-equivalence-check the contract against the current agent, then cut over. Do not edit the live workflow in place. Mirror the Epic-20 parallel-build + cutover discipline (DEPLOY-PORTFOLIO.md). Keep the current version as rollback.
- Failure mode to guard: agent returns non-JSON -> Code node must not throw (fallback object), so the widget never 500s.

## Verification

- All four categories (bug / feature-request / question / urgent) produce the correct contract, byte-identical shape to today.
- A bug probe creates exactly one `expliq-support-sandbox` issue and `actionsTaken[0].ref` equals the real issue URL (compare against the n8n execution's tool result).
- Slack audit line unchanged.
- Confirm only ONE Claude call now occurs per request (the agent), none for formatting.

## Open questions

1. Issue-URL source: option (a) agent-JSON vs (b) real tool response. Can n8n expose the MCP tool result as a node output for (b)?
2. Fallback object on parse failure: echo a generic `{category: "question", reply: "<safe message>", actionsTaken: [], slackSummary: "parse-failed"}`, or surface an explicit error to the widget? The current 2-LLM path rarely fails, so define the desired degraded behavior.
3. Should `answer_expliq_question` (the READ tool) get the same treatment? It also has an Answer (Claude) + Structured Output Parser. Lower priority (read-only, no actions), but same pattern; decide whether to include or keep this patch tightly scoped to the WRITE workflow.
4. Keep the repo JSON export in sync, or treat the box as source of truth? (Epic-20 committed exports with credential refs only.)
