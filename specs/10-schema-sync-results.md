---

## tags:
  - type/results
  - status/done
  - epic/10

# Epic 10 — Schema + Extended Sync: Results

> Upstream: [Epic 10: Schema + Extended Sync](10-schema-sync.md)

## What Was Built

R2 Prisma schema migration, extended n8n API client with 10 new methods, execution data aggregation logic, two-phase sync pipeline (Discover + Sync & Analyze), and Settings page UI with tag selection.

## Key Files Created/Modified

### New Files (7)


| File                                                                 | Purpose                                                                                         |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `prisma/migrations/20260405113918_r2_schema_migration/migration.sql` | R2 schema migration: 4 new models, Automation field changes, ConnectorConfig extensions         |
| `src/lib/execution-stats.ts`                                         | Pure function `computeExecutionStats()` — runsPerWeek, errorRate, lastExecutedAt, avgDurationMs |
| `src/__tests__/execution-stats.test.ts`                              | 12 tests for execution aggregation                                                              |
| `src/components/ui/checkbox.tsx`                                     | shadcn/ui Checkbox component (base-ui)                                                          |
| `specs/10-schema-sync.md` through `specs/17-settings-seed-polish.md` | 8 R2 epic specs + brainstorming files                                                           |
| `specs/brainstorming.md` (appended)                                  | R2 brainstorming rounds 1-4                                                                     |


### Modified Files (Key)


| File                                      | Change                                                                                                                                                                                                    |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                    | 4 new models (BusinessProcess, Recommendation, ProcessSuggestion, CompanyProfile), AnalysisStatus enum, Automation field migration (drop 16 R1 fields, add 16 R2 fields), ConnectorConfig extensions      |
| `src/lib/n8n-client.ts`                   | 10 new methods: fetchDiscover, fetchTags, listWorkflows (tag filter), fetchExecutions, fetchCredentials/Users/Projects/Variables (graceful 403), deployWorkflow, activateWorkflow. 8 new type interfaces. |
| `src/lib/actions/connector.ts`            | Complete rewrite: verifyAndDiscover (Phase 1), updateSelectedTags, syncAndAnalyze (Phase 2) replacing old testConnection + syncWorkflows                                                                  |
| `src/components/settings-form.tsx`        | Three-section UI: Connection → Tag Selection (after verify) → Sync & Analyze. Removed LLM processing trigger.                                                                                             |
| `src/app/(app)/settings/page.tsx`         | Passes discoveryData + selectedTags from ConnectorConfig to form                                                                                                                                          |
| `src/__tests__/n8n-client.test.ts`        | 32 tests (21 new) for all client methods                                                                                                                                                                  |
| `src/__tests__/connector-actions.test.ts` | Rewritten: 26 tests for new two-phase sync                                                                                                                                                                |
| `src/__tests__/settings.test.tsx`         | Rewritten: 23 tests for new settings UI                                                                                                                                                                   |


### Stubbed R1 Files (will be replaced by R2 page epics)


| File                            | Change                                                              |
| ------------------------------- | ------------------------------------------------------------------- |
| `src/lib/risk-engine.ts`        | Stubbed — returns defaults (R2 risk engine in Epic 11)              |
| `src/lib/llm-pipeline.ts`       | Stubbed — throws "R1 pipeline disabled"                             |
| `src/lib/actions/automation.ts` | Stubbed — returns error strings                                     |
| `src/lib/actions/llm.ts`        | Stubbed — returns error strings                                     |
| 9 R1 test files                 | Wrapped in `describe.skip` — will be deleted when R1 pages replaced |
| R1 page/component files         | Simplified to remove references to dropped fields                   |


## Decisions and Deviations from Spec

1. **AutomationStatus enum kept as-is** — The spec suggested migrating `status: "removed"` to `isRemoved: true` and dropping `removed` from the enum. We kept both for backward compatibility: `isRemoved` is the new canonical field, `status: "removed"` still exists but the sync pipeline uses `isRemoved` going forward.
2. **discoveryData stores tag previews** — The `ConnectorConfig.discoveryData` Json field stores not just the raw n8n discover response, but also `{ raw, tags: TagPreview[], totalWorkflows }` so the Settings page can render the tag section on reload without re-verifying.
3. **Untagged workflows use `__untagged__` sentinel** — The `selectedTags` array uses the string `"__untagged__"` to represent the "Untagged" selection. When this value is present, the sync pipeline fetches all workflows and filters client-side (n8n API can't filter for "no tags").
4. **R1 modules stubbed, not deleted** — Existing R1 modules (risk-engine, llm-pipeline, actions/automation, actions/llm) were stubbed to return defaults/errors rather than deleted. This keeps the build passing while R1 pages still import them. They'll be properly replaced in epics 11-16.
5. **Open questions resolved** — runsPerWeek: 7-day rolling window from most recent execution. Owner extraction: deferred to Epic 16 (Detail page).
6. **Turbopack root fix** — Dev server hung on startup due to dual `package-lock.json`. Fixed with `turbopack.root: __dirname` in `next.config.ts` (separate commit). Playwright E2E then verified successfully against real n8n API.

## Verification Results


| Check                                | Result                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| `npm run test` (122 tests, 10 files) | Pass (183 skipped — R1 test files)                                                          |
| `npm run build`                      | Pass (all routes compile)                                                                   |
| `npm run lint`                       | No new errors (pre-existing: research spike scripts, stubbed R1 modules)                    |
| Prisma migration                     | Applied successfully                                                                        |
| Playwright E2E                       | Pass — full flow verified against real n8n API (see below) |


### Playwright E2E Verification (completed 2026-04-05)

Full browser-based e2e verification against real n8n instance (`perpaulsen.app.n8n.cloud`):
1. Login (seed-real@expliq.dev) — signed in, redirect to Dashboard
2. Settings page — Connection section rendered (Instance URL pre-filled, API Key, Save, Verify Connection)
3. **Verify Connection** — "Connection verified successfully!" + Tag Selection section appeared
4. **Tag Selection** — "12 workflows found", 2 tag checkboxes: "Untagged (11)" with 5-name preview, "expliq (1)" with preview. Select all/deselect all buttons. "12 workflows selected for analysis" counter.
5. **Sync & Analyze** — "Sync completed successfully." 2 Created, 0 Updated, 10 Unchanged, 0 Removed. Enrichment: Credentials available, Users available, Projects available, Variables unavailable (graceful 403).

Note: Turbopack dev server initially hung due to a dual `package-lock.json` issue (parent `C:\Users\perpa\package-lock.json` confused workspace root detection). Fixed with `turbopack.root: __dirname` in `next.config.ts` (separate commit `61b4326`).

## Risks for Future Epics

1. **R1 test files are `describe.skip`** — 9 test files with 183 tests are skipped. When epics 13-16 replace the R1 pages, these test files should be deleted entirely and replaced with R2 tests.
2. **Stubbed R1 modules** — `risk-engine.ts`, `llm-pipeline.ts`, `actions/automation.ts`, `actions/llm.ts` return defaults/errors. Epic 11 (LLM Pipeline V2) will rewrite `llm-pipeline.ts` and the risk engine. Epics 13-16 will provide new page components that don't import the old action modules.
3. **ConnectorConfig.discoveryData coupling** — The Settings page reads tag previews from `discoveryData` JSON. If the structure changes, both `connector.ts` (writes) and `settings/page.tsx` (reads) need to update in sync.
4. **Tag filter: untagged + named** — When user selects both named tags AND "Untagged", the sync pipeline fetches ALL workflows and filters client-side. For large n8n instances this could be slower than expected. For the demo (68 workflows), it's fine.
5. `**@testing-library/user-event` added** — New dev dependency for the settings tests. Standard library, no risk.

## Open Questions

1. **Should the Prisma `removed` value be dropped from AutomationStatus enum in a future migration?** The new code uses `isRemoved` boolean. The enum value exists but isn't set by new code. Cleaning it up requires a data migration (update any rows with `status: removed` to `status: inactive`, then drop the enum value).

## Commit

`0e57eef` — `feat: implement epic 10 — schema + extended sync`

---

## Related

- [Spec](10-schema-sync.md)
- [Brainstorming](10-schema-sync-brainstorming.md)

