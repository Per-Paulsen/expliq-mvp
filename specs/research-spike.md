# Research Spike — LLM Prompt Validation Against FairTix Data

> Phase 0 of PRD 2.0. Proves that the prompt architecture produces ANALYSIS-FINAL.md quality on the first shot.
> Results from this spike are the foundation for Epic 10 spec derivation.

---

## Goal

Test the three-call prompt chain (per-automation → Call 1 "Understand" → Call 2 "Advise") against real FairTix workflow JSONs. Iterate until one-shot output matches `n8n-api-examples/fairtix/reference/ANALYSIS-FINAL.md` quality.

## Inputs

| File | What it contains |
|------|-----------------|
| `n8n-api-examples/fairtix/reference/01-send-welcome-email.json` | Welcome email workflow JSON |
| `n8n-api-examples/fairtix/reference/02-lotterywins.json` | Lottery winner notification (base) |
| `n8n-api-examples/fairtix/reference/02b-lotterywins-error-handling.json` | Lottery winner notification (error handling variant) |
| `n8n-api-examples/fairtix/reference/03-support-classifier.json` | AI support classifier |
| `n8n-api-examples/fairtix/reference/04-switch-faq-manual.json` | FAQ auto-response (Gmail-based) |
| `n8n-api-examples/fairtix/reference/04-switch-faq-manual-sheet.json` | FAQ auto-response (Sheet-based) |
| `n8n-api-examples/fairtix/reference/05-lotterywins-published.json` | Lottery winner notification ("Published") |
| `n8n-api-examples/fairtix/reference/05-generic-error-workflow.json` | Centralized error handler |
| `n8n-api-examples/fairtix/reference/executions-*.json` | Per-workflow execution data |
| `n8n-api-examples/fairtix/reference/ANALYSIS-FINAL.md` | Target output quality |
| `prd-2.0-decisions.md` section 10 | Prompt architecture requirements |

## Quality Target

ANALYSIS-FINAL.md demonstrates:
- **Per-workflow:** Business narrative (not mechanical), revenue connection, failure impact, deductive reasoning about connected systems
- **Process clustering:** 4 existing + 4 suggested processes, with coverage/reliability/maturity
- **System narratives:** Per-system deductive reasoning (Gmail backbone, Sheets as data store, Claude AI brain)
- **Recommendations:** 13 ranked (4 Act Now, 4 Investigate, 5 Explore), each with evidence chain and honest framing
- **"Your Next Move":** Specific narrative chaining multiple recommendations, citing workflow names and numbers

## Workflow

### Step 1: Per-Automation Prompt (test with 3 diverse workflows)

**Test workflows:**
- `02-lotterywins.json` — revenue-critical, has errors, has execution data
- `03-support-classifier.json` — AI architecture, multi-system, complex nodes
- `05-generic-error-workflow.json` — infrastructure/cross-cutting, active

**Process:**
1. Draft the per-automation prompt following section 10 (persona, schema-first output, deductive reasoning mandate, anti-patterns)
2. Define the output JSON schema (all fields from section 10 + existing fields)
3. Feed one workflow JSON + its execution data to the LLM via OpenRouter
4. Compare output to the corresponding section in ANALYSIS-FINAL.md
5. Evaluate: Is `businessBrief` deep or mechanical? Does `failureImpact` show deductive reasoning? Are estimates transparent?
6. Iterate on prompt until quality matches
7. Run the proven prompt on all 8 workflows (excluding the reference node-types sheet)
8. Record all per-automation summaries — these become input to Step 2

**Pass criteria:** Per-automation output matches ANALYSIS-FINAL.md's per-workflow business cases in depth, tone, and deductive reasoning. No mechanical descriptions.

### Step 2: Call 1 "Understand" (process clustering + system landscape)

**Input:** All 8 per-automation summaries from Step 1 + execution stats + tag data

**Process:**
1. Draft Call 1 prompt following section 10 (business analyst persona, cross-workflow pattern detection mandate, XML-tagged sections, chain-of-thought)
2. Define output JSON schema (processes, system landscape, connected automations, process metrics)
3. Feed all summaries to the LLM
4. Compare output to ANALYSIS-FINAL.md's "Business Processes" and "System Narratives" sections
5. Evaluate: Are processes clustered correctly? Are cross-workflow patterns detected (3 duplicate LotteryWins, Gmail single point of failure, support categories proving gaps)? Are system narratives deductive, not descriptive?
6. Iterate on prompt until quality matches

**Pass criteria:** Process clustering matches ANALYSIS-FINAL's 4 existing + 4 suggested processes. Cross-workflow patterns detected. System narratives show deductive reasoning.

### Step 3: Call 2 "Advise" (recommendations + synthesis)

**Input:** Call 1 output + per-automation summaries

**Process:**
1. Draft Call 2 prompt following section 10 (business opportunity consultant persona, few-shot example, anti-patterns, honest framing rules, schema-first)
2. Define output JSON schema (recommendations with tier/confidence/evidence, process suggestions, "Your Next Move", visibility expansions)
3. Feed Call 1 output + summaries to the LLM
4. Compare output to ANALYSIS-FINAL.md's "Recommendations" and "Your Next Move" sections
5. Evaluate: Are recommendations business-first (not governance-first)? Is honest framing applied to uncertain ones? Does "Your Next Move" chain specific recommendations with workflow names? Are evidence chains specific (not generic)?
6. Iterate on prompt until quality matches

**Pass criteria:** Recommendations match ANALYSIS-FINAL's tiers and evidence quality. "Your Next Move" is specific and actionable. Honest framing applied correctly.

### Step 4: Model Selection

After prompts are proven with the best model (Opus):
1. Run the full chain with Sonnet
2. Compare quality — does Sonnet match Opus?
3. Measure response times for both
4. Decision: which model for per-automation, which for workspace-level?

## Output

Record everything in this file as results are produced:

### Proven Prompts
- Per-automation prompt template (exact text)
- Call 1 "Understand" prompt template (exact text)
- Call 2 "Advise" prompt template (exact text)

### Output Schemas
- Per-automation JSON schema (what the LLM returns)
- Call 1 JSON schema
- Call 2 JSON schema

### FairTix Worked Example
- All 8 per-automation outputs
- Call 1 output (processes, systems, patterns)
- Call 2 output (recommendations, next move)

### Model Comparison
- Opus quality + latency
- Sonnet quality + latency
- Recommendation

### Discoveries
- Anything that affects PRD or epic specs
- Prompt patterns that worked unexpectedly well
- Anti-patterns that needed to be added

---

## Status

- [ ] Step 1: Per-automation prompt proven
- [ ] Step 2: Call 1 "Understand" proven
- [ ] Step 3: Call 2 "Advise" proven
- [ ] Step 4: Model comparison done
- [ ] Full chain validated end-to-end
