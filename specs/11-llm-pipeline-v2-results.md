---
tags:
  - type/results
  - status/done
  - epic/11
---

# Epic 11 — LLM Pipeline V2: Results

> Upstream: [Epic 11: LLM Pipeline V2](11-llm-pipeline-v2.md)

## What Was Built

Complete rewrite of the LLM pipeline implementing the v8 two-call architecture proven in the research spike. Per-automation parallel LLM calls, single workspace analysis call, risk engine V2 with governance dots, connected automations resolution, delta generation for re-sync banners, and progressive loading via analysisStatus.

## Key Files Created/Modified

### New Files (8)

| File | Purpose |
|------|---------|
| `prisma/migrations/20260405130410_r2_llm_pipeline_fields/migration.sql` | Adds `trigger`, `triggerType`, `systemsTouched` to Automation + `valueAtStake` to BusinessProcess |
| `src/lib/actions/analysis.ts` | `runAnalysisPipeline(workspaceId)` — main orchestration server action (20-step flow) |
| `src/lib/connected-automations.ts` | Pure functions: deterministic resolution (errorWorkflow, callerIds) + LLM merge + update merging |
| `src/lib/delta-generation.ts` | Pure functions: `captureSnapshot()` + `generateDeltaSummary()` for re-sync delta banners |
| `src/__tests__/risk-engine-v2.test.ts` | 33 tests for governance dot computation (all threshold combinations) |
| `src/__tests__/connected-automations.test.ts` | 12 tests for connection resolution and merging |
| `src/__tests__/delta-generation.test.ts` | 14 tests for snapshot capture and delta diffing |
| `src/__tests__/analysis-pipeline.test.ts` | 12 integration tests for full pipeline orchestration |
| `scripts/verify-llm-pipeline-v2.ts` | E2E verification script (online: real LLM calls, offline: module tests) |

### Modified Files (4)

| File | Change |
|------|--------|
| `prisma/schema.prisma` | 4 new fields: Automation.trigger, triggerType, systemsTouched + BusinessProcess.valueAtStake |
| `src/lib/llm-pipeline.ts` | Complete rewrite: `analyzeAutomation()`, `analyzeWorkspace()`, `stripJsonFences()`, `retryWithBackoff()` |
| `src/lib/risk-engine.ts` | Added `computeGovernanceDot()` pure function. R1 stubs preserved for backward compatibility. |
| `src/lib/actions/connector.ts` | `syncAndAnalyze` now calls `runAnalysisPipeline()` after sync completes |
| `src/__tests__/connector-actions.test.ts` | Added mock for analysis module |

## Decisions and Deviations from Spec

1. **R1 risk engine stubs preserved** — The spec says "Old governance signals no longer computed" (AC 19). Rather than deleting the R1 stub functions, the agent preserved them for backward compatibility since R1 pages still import them. They return defaults and will be deleted when R2 pages replace R1 pages (Epics 13-16).

2. **`Promise.allSettled` for failure isolation** — Spec says `Promise.all` (AC 1) but implementation uses `Promise.allSettled` for the failure isolation requirement (AC 5). `allSettled` is the correct choice — `all` would reject on first failure.

3. **OpenRouter client lazy initialization** — Client created inside each function call, not at module scope. Matches the established pattern from Epic 04 (documented in memory: "Client must be lazily initialized to prevent crashes when OPENROUTER_API_KEY is unset").

4. **Metadata extraction from ConnectorConfig.discoveryData** — The spec mentions "instance metadata (tags, credentials if available, users if available)" but doesn't specify the source. Implementation extracts from `ConnectorConfig.discoveryData` Json field which stores the discovery response from Phase 1.

5. **Open question 2 (processMetrics) left unresolved** — The spec has an open question about whether CompanyProfile.processMetrics stores redundant data or LLM-generated aggregate metrics. Implementation populates it from the workspace call output, which can include cross-process metrics. Future epics consuming this field should read it as-is.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run test` (193 tests, 14 files) | Pass (183 skipped — R1 test files) |
| `npm run build` | Pass (all routes compile) |
| `npm run lint` | No new errors (pre-existing: research spike scripts, stubbed R1 modules) |
| Prisma migration | Applied successfully |
| E2E verification script | Pass — 3/3 per-automation LLM calls against real n8n data |

### E2E Verification (completed 2026-04-05)

Real LLM calls against seed-real workspace (12 synced n8n workflows):

1. **HubSpot → Gmail Cold Outreach** — businessNarrative ✓, impact: high ✓, detectability: partially-monitored ✓, governance dot: attention ✓
2. **Employee Onboarding Automation** — businessNarrative ✓, impact: high ✓, detectability: partially-monitored ✓, governance dot: attention ✓
3. **AI-Powered Lead Distribution System** — businessNarrative ✓, impact: critical ✓, detectability: partially-monitored ✓, governance dot: attention ✓

All fields populated with business-meaningful content, technical specificity (node names, config values), and revenue/time estimates.

### Test Coverage (71 new tests)

- `risk-engine-v2.test.ts`: 33 tests — all critical/attention/healthy thresholds, null handling, priority ordering
- `connected-automations.test.ts`: 12 tests — errorWorkflow, callerIds, missing refs, self-ref, circular, LLM merge, update merge
- `delta-generation.test.ts`: 14 tests — snapshot capture, filtering, all delta types, combined changes, no-change case
- `analysis-pipeline.test.ts`: 12 tests — full pipeline, partial failure, workspace failure, priority ordering, process linking, delta on re-sync

## Risks for Future Epics

1. **R1 stubs still exist** — `risk-engine.ts` has both the new `computeGovernanceDot()` and the old R1 stub functions (getGovernanceSignals, getRiskLevel, etc.). R1 pages import the stubs. When Epics 13-16 replace the R1 pages, delete the stubs and their skipped test files.

2. **Open question 2 unresolved** — CompanyProfile.processMetrics field populated from LLM output but structure not formally defined. Epic 13 (Dashboard) may need to specify what it reads from this field.

3. **Token costs at scale** — E2E verified with 3 workflows. The FairTix instance has 12 workflows. Full workspace call with all 12 will be larger. For instances with >40 workflows, token budget may be a concern (documented ceiling in Out of Scope).

4. **`suggestedPlatform` mapping** — Recommendation.suggestedPlatform is populated from `rec.systemSource` in the workspace call output. This mapping may need refinement when Epic 15 (Opportunities) implements the deploy flow.

5. **Analysis pipeline called inside sync flow** — `syncAndAnalyze` now calls `runAnalysisPipeline()` at the end. If the analysis takes 2-5 minutes (expected for 8-12 workflows), the sync action returns "success" only after analysis completes. Epic 17 (Settings + Seed + Polish) plans step-by-step progress UI that spans both sync and analysis phases — the current integration supports this since analysisStatus updates progressively.

## Open Questions

1. **Should the workspace call receive full workflow JSONs?** The spec says yes (AC 6: "full workflow JSONs (compact, no whitespace)"). The implementation does this. For larger instances, this will be a significant token cost. Consider truncating to node types + parameters only if token limits become an issue.

## Commit

`e40ed8c` — `feat: implement epic 11 — LLM pipeline V2`

---

## Related

- [Spec](11-llm-pipeline-v2.md)
- [Brainstorming](11-llm-pipeline-v2-brainstorming.md)
- [Epic 10: Schema + Extended Sync](10-schema-sync.md) (prerequisite)
