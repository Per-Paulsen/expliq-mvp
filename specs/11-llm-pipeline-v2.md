---
tags:
  - type/spec
  - status/draft
  - phase/2
---

# Epic 11 — LLM Pipeline V2

> Upstream: [PRD 2.0](../prd-2.0.md) | [Decisions §10, Amendments N–S](../prd-2.0-decisions.md) | [Research Spike](research-spike.md) | [Brainstorming](brainstorming.md)
> Phase: 2 (after Epic 10)
> Dependencies: Epic 10 (schema + sync data must exist)

## Scope

Complete rewrite of the LLM pipeline to implement the v8 two-call architecture proven in the research spike.

**Per-automation enrichment (Call 1 — parallel):**
- One LLM call per workflow, all running in parallel (`Promise.all`)
- v8 prompt: simple instructions (~150 words) + output schema as instruction
- Input: full workflow JSON + aggregated execution stats
- Output: businessNarrative, trigger, triggerType, systemsTouched, dataFlow, stepName, impact (reasoning + level + failureScenario + revenueConnection), detectability (reasoning + level + evidence), timeSavingsEstimate, revenueImpactEstimate, technicalEvidence
- Stored on the Automation model

**Workspace analysis (Call 2 — single):**
- Single LLM call after all per-automation calls complete
- v8 prompt: simple instructions (~250 words) + combined output schema
- Input: all per-automation summaries + full workflow JSONs (compact) + execution overview + instance metadata (tags, credentials if available, users if available)
- Per-automation summaries include the automation's database `id` and n8n `externalId` so the LLM can reference workflows by ID
- Output populates: BusinessProcess records, Recommendation records (with impactEstimate badge), ProcessSuggestion records, CompanyProfile (systemLandscape, nextMoveText, nextMoveReasoning, processMetrics, aggregateEstimates, analyzedAt)
- Lightweight nudge in prompt: "For each automated outcome, consider whether non-recipients also deserve communication."

**Connected automations resolution:**
- Deterministic: parse `settings.errorWorkflow` and `settings.callerIds` from workflow JSON during sync → populate upstreamIds/downstreamIds
- LLM-supplementary: workspace call output includes `connectedAutomations` referencing workflows by externalId → merge into upstreamIds/downstreamIds

**Delta generation (re-sync):**
- Before re-analysis: snapshot current state into CompanyProfile.previousSnapshot (automation count, active count, per-automation error rates/active status, recommendation count/names, process count)
- Delete existing BusinessProcess, Recommendation, ProcessSuggestion records for workspace
- Run full analysis pipeline
- After re-analysis: diff current vs previousSnapshot → generate human-readable deltaSummary string

**Risk engine adaptation:**
- New governance dot derivation replacing MVP signals:
  - Critical (red): error rate >20% on active workflow, OR critical impact + silent detectability, OR error workflow itself has high error rate
  - Attention (amber): error rate 5-20%, OR inactive with recent execution history, OR no error workflow on customer-facing workflow
  - Healthy (green): low error rate, monitored/partially-monitored, operating as expected
- Pure-function architecture preserved from Epic 05 — swap inputs, same pattern

**Progressive loading:**
- CompanyProfile.analysisStatus tracks pipeline progress: pending → analyzing_workflows → analyzing_workspace → complete → failed
- Per-automation Automation.analysisStatus: pending → complete → failed

**Error handling:**
- Retry with exponential backoff: 3 attempts, 2s → 4s → 8s delay
- Individual per-automation failure isolation: if N-1 of N calls succeed, proceed with workspace call using successful results. Failed automations marked `analysisStatus: "failed"`.
- Workspace call failure: per-automation data remains available (Dashboard/Detail can render). CompanyProfile set to `analysisStatus: "failed"` with error message. Retry button exposed.
- JSON fence stripping on all LLM responses (reuse from Epic 04)
- Response schema validation before storing

## Acceptance Criteria

### Per-Automation Enrichment
1. Per-automation calls execute in parallel (`Promise.all` or equivalent)
2. Each call sends: full workflow JSON + execution stats (total runs, success rate, last execution, active status, version count)
3. LLM response parsed and stored on Automation: businessNarrative, trigger, triggerType, systemsTouched (String[]), dataFlow, stepName, impact (Json), detectability (Json), timeSavingsEstimate, revenueImpactEstimate, technicalEvidence (Json)
4. Model configurable via `OPENROUTER_MODEL` environment variable (default: Sonnet)
5. If a per-automation call fails after 3 retries, that automation is marked `analysisStatus: "failed"` and excluded from workspace call input — remaining automations proceed

### Workspace Analysis
6. Workspace call receives: per-automation summaries (with database id + externalId per workflow) + full workflow JSONs (compact, no whitespace) + execution overview + instance metadata
7. Workspace call output parsed into: BusinessProcess records (name, summary, maturityLevel, order, steps as Json), Recommendation records (all fields from §12 including impactEstimate), ProcessSuggestion records, CompanyProfile fields
8. Recommendation.processId correctly links to the BusinessProcess record (matched by process name from LLM output)
9. ProcessSuggestion child recommendations linked via processSuggestionId
10. Recommendation.priorityOrder assigned by: all Act Now first (sorted by LLM order), then Investigate, then Explore
11. CompanyProfile.aggregateEstimates populated with totalTimeSavings, totalValueAtRisk, totalOpportunityValue (from LLM output)

### Connected Automations
12. Deterministic connections: `errorWorkflow` ID resolved to Automation record → upstreamIds/downstreamIds populated bidirectionally
13. Deterministic connections: `callerIds` resolved similarly
14. LLM connections: workspace output `connectedAutomations` matched by externalId → merged into upstream/downstream arrays (no duplicates)

### Delta Generation
15. On re-sync: previousSnapshot captured from current state BEFORE deleting existing records
16. After new analysis: deltaSummary generated by diffing current vs previousSnapshot (e.g., "+2 new workflows detected, lottery-win error rate improved 31% → 12%, 1 recommendation resolved")
17. On first sync: previousSnapshot is null, deltaSummary is null

### Risk Engine
18. `computeGovernanceDot(automation)` returns "healthy" | "attention" | "critical" based on: errorRate, detectability.level, impact.level, isActive, errorWorkflowLinked
19. Old governance signals (documentationOutdated, noOwner, automationStale, overdueReview) no longer computed
20. Governance dot computation is pure function (no DB calls), tested with unit tests covering all threshold combinations

### Progressive Loading
21. CompanyProfile.analysisStatus updates at each pipeline stage (pending → analyzing_workflows → analyzing_workspace → complete)
22. On failure at any stage: analysisStatus set to "failed"

### Error Handling
23. JSON responses wrapped in markdown fences (`` ```json ... ``` ``) are stripped before parsing
24. Malformed JSON triggers one additional retry before marking as failed
25. Per-automation timeout: 120s per call
26. Workspace call timeout: 300s

### Tests
27. Unit tests for governance dot computation (all threshold combinations)
28. Unit tests for delta generation (new workflows, removed workflows, metric changes, recommendation changes)
29. Unit tests for connected automations resolution (deterministic + LLM merge)
30. Unit tests for execution aggregation → LLM input formatting
31. Integration test: full pipeline with mocked LLM responses (per-automation → workspace → DB population)
32. Unit test: partial failure scenario (1 of 8 per-automation calls fail, pipeline continues)

## Out of Scope

- Deploy JSON generation LLM call (Epic 15 — triggered on-demand from Opportunities page)
- Any page/UI changes beyond CompanyProfile.analysisStatus (Epics 12-17)
- Scaling strategy for >40 workflows (documented ceiling, addressed post-demo)
- Periodic/automatic re-analysis
- User-editable fields on LLM-generated entities

## Domain Terms

| Term | Definition |
|------|-----------|
| **Per-automation call** | Independent LLM call analyzing one workflow in isolation. All calls run in parallel. Produces Detail page data. |
| **Workspace call** | Single LLM call receiving all per-automation outputs + full workflow JSONs. Produces landscape analysis + recommendations. |
| **v8 architecture** | Two-call strategy proven in research spike: simple prompts + full data + output schema as instruction. No rubrics, no methods, no structural preprocessing. |
| **Governance dot** | Single visual indicator (healthy/attention/critical) per automation, derived from error rate, detectability, impact, and active status. Replaces MVP governance badges. |
| **Delta** | Diff between previous and current analysis state. Captured in CompanyProfile.previousSnapshot (before) and deltaSummary (human-readable result). |
| **Failure isolation** | Per-automation calls that fail after retries don't block the pipeline. The workspace call proceeds with whatever succeeded. |

## Open Questions

1. Should the workspace prompt include the lightweight nudge for complementary outcomes ("For each automated outcome, consider whether non-recipients also deserve communication"), or keep the prompt purely simple per v8 findings? (Recommendation: include it — one sentence, no structural overhead, addresses the known stochastic gap.)
2. For the CompanyProfile.processMetrics field: should this store the same data as what the Dashboard reads from BusinessProcess records (making it redundant), or should it store LLM-generated aggregate metrics that span processes? (Recommendation: store LLM-generated cross-process metrics — the per-process data comes from BusinessProcess records directly.)

---

## Related

- [Epic 10: Schema + Extended Sync](10-schema-sync.md) (prerequisite)
- [Epic 12: Design System](12-design-system.md) (parallel — no dependency)
- [Research Spike](research-spike.md) (v8 prompts and results)
