---
tags:
  - type/spec
  - status/draft
  - phase/1a
---

# Epic 10 — Schema + Extended Sync

> Upstream: [PRD 2.0](../prd-2.0.md) | [Decisions §11, §12](../prd-2.0-decisions.md) | [Brainstorming](brainstorming.md)
> Phase: 1a (parallel with Epic 12)
> Dependencies: None (first R2 epic)

## Scope

Prisma schema migration for R2 and full two-phase n8n sync pipeline.

**Schema changes:**
- 4 new Prisma models: BusinessProcess, Recommendation, ProcessSuggestion, CompanyProfile (per decisions §12)
- Automation model field migration: drop old LLM fields (`description`, `coreLogic`, `businessContext`, `trigger`, `triggerType`, `systemsTouched`, `dataTypes`, `sideEffects`, `impactLevel`, `impactReasoning`), add new fields (`businessNarrative`, `dataFlow`, `impact` as Json, `detectability` as Json, `timeSavingsEstimate`, `revenueImpactEstimate`, `technicalEvidence` as Json, `stepName`, `processId` FK, `runsPerWeek`, `errorRate`, `lastExecutedAt`, `avgDurationMs`, `upstreamIds` String[], `downstreamIds` String[], `analysisStatus`)
- ConnectorConfig extended with `selectedTags` (String[]) and `discoveryData` (Json — cached discover response)
- Recommendation model includes `impactEstimate` field (short string for row-level value badge, e.g., "~€2K/cycle")

**Extended n8n client:**
- `GET /discover` — feature detection (call first on verify)
- `GET /tags` — available tags
- `GET /workflows` (existing, extend with tag filter support)
- `GET /executions?workflowId=X` — per-workflow execution history (cap 250, newest-first)
- `GET /credentials` — system inventory (graceful 403)
- `GET /users` — ownership data (graceful 403)
- `GET /projects` — team structure (graceful 403)
- `GET /variables` — environment context (graceful 403)
- `POST /workflows` + `POST /workflows/{id}/activate` — deploy endpoint

**Two-phase sync pipeline:**
- Phase 1 "Discover" (on "Verify Connection"): call discover + tags + workflows list. Store results on ConnectorConfig. Display instance overview with tag selection checkboxes showing workflow count and name preview per tag.
- Phase 2 "Sync + Analyze" (on "Sync & Analyze"): fetch full workflow definitions filtered by selected tags, fetch executions per workflow (cap 250), attempt enrichment endpoints (credentials, users, projects, variables — graceful 403). Upsert Automation records by externalId. Aggregate execution data to `runsPerWeek`, `errorRate`, `lastExecutedAt`, `avgDurationMs` on Automation. Flag removed workflows with `isRemoved`.

**Settings page updates:**
- After Phase 1: show connection status, instance overview ("68 workflows found"), tag checkboxes (each with count + name preview), untagged workflows shown separately.
- Tag selection persisted on ConnectorConfig.selectedTags.
- "Sync & Analyze" button triggers Phase 2.

## Acceptance Criteria

### Schema
1. Prisma migration creates BusinessProcess, Recommendation, ProcessSuggestion, CompanyProfile tables with all fields from decisions §12
2. Automation model has all new fields; old LLM-specific fields removed
3. ConnectorConfig has `selectedTags` (String[]) and `discoveryData` (Json)
4. Recommendation model has `impactEstimate` (String, nullable) for row-level value badge
5. CompanyProfile has `analysisStatus` enum field (pending | analyzing_workflows | analyzing_workspace | complete | failed)
6. CompanyProfile has `previousSnapshot` (Json, nullable) and `deltaSummary` (String, nullable)
7. `npx prisma migrate dev` succeeds; `npx prisma generate` produces updated client

### n8n Client
8. `fetchDiscover()` calls `GET /discover` and returns instance capabilities
9. `fetchTags()` calls `GET /tags` and returns tag list
10. `fetchWorkflows(tags?)` supports optional tag filter parameter
11. `fetchExecutions(workflowId, limit=250)` calls `GET /executions?workflowId=X&limit=250` and returns execution list
12. `fetchCredentials()`, `fetchUsers()`, `fetchProjects()`, `fetchVariables()` each return data or null on 403 (no error thrown)
13. `deployWorkflow(json)` calls `POST /workflows` and returns the created workflow
14. `activateWorkflow(id)` calls `POST /workflows/{id}/activate`
15. All new client methods have unit tests with mocked responses

### Sync Pipeline
16. Phase 1 ("Verify Connection") calls discover → tags → workflows list, stores results on ConnectorConfig
17. Phase 2 ("Sync & Analyze") fetches full workflows filtered by selectedTags, fetches executions per workflow (capped at 250), attempts enrichment endpoints
18. Execution data aggregated per workflow: `runsPerWeek` (computed from execution timestamps), `errorRate` (failed/total), `lastExecutedAt` (most recent execution date), `avgDurationMs` (average of stoppedAt - startedAt)
19. Workflows upserted by workspaceId + externalId; workflows no longer in n8n flagged as `isRemoved: true`
20. Enrichment endpoint 403s logged but do not fail the sync

### Settings Page
21. After successful verify: shows "X workflows found", tag checkboxes with per-tag workflow count and name preview (first 3-5 workflow names)
22. Untagged workflows shown as "Untagged (X)" checkbox
23. Tag selection changes update ConnectorConfig.selectedTags
24. "Sync & Analyze" button triggers Phase 2 and shows progress indication
25. Re-verify resets discovery data and refreshes tag list

### Tests
26. Unit tests for all new n8n-client methods (mocked HTTP)
27. Unit tests for execution aggregation logic (runsPerWeek, errorRate calculations)
28. Unit tests for tag filtering logic
29. Integration test: Phase 1 verify → Phase 2 sync flow with mocked n8n responses

## Out of Scope

- LLM processing of any kind (Epic 11)
- Dark theme, design system, shared UI components (Epic 12)
- Dashboard, Process Map, Opportunities, Detail page content (Epics 13-16)
- Sync progress step-by-step UI with named stages (Epic 17 — Settings page gets a basic progress indicator here, polished version in 17)
- Periodic/automatic sync (manual only for MVP)

## Domain Terms

| Term | Definition |
|------|-----------|
| **Phase 1 / Discover** | Lightweight n8n API calls (discover + tags + workflow list) triggered by "Verify Connection." Shows what's in the instance. |
| **Phase 2 / Sync + Analyze** | Full sync of selected workflows + execution data + enrichment endpoints. Triggered by "Sync & Analyze." |
| **Tag selection** | User chooses which n8n tags to include in the sync. Persisted on ConnectorConfig. |
| **Graceful degradation** | Enrichment endpoints (credentials, users, projects, variables) may return 403 depending on API key permissions. The sync must succeed without them. |
| **Execution aggregation** | Raw execution records (up to 250 per workflow) are reduced to 4 summary fields on the Automation model. Raw records are not stored. |

## Open Questions

1. Should `runsPerWeek` computation use a fixed 7-day window from the most recent execution, or the full date range of available executions? (Recommendation: 7-day rolling window from most recent, or null if no executions in the last 7 days.)
2. The n8n `GET /workflows` response includes a `shared[]` array with user references. Should we extract and store the primary owner (highest-role user in shared[]) on the Automation model during sync, or defer owner display to Epic 16 (Detail page)?

---

## Related

- [Epic 11: LLM Pipeline V2](11-llm-pipeline-v2.md) (depends on this epic's schema + sync data)
- [Epic 12: Design System](12-design-system.md) (parallel)
