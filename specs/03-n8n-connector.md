# 03 — n8n Connector

## Scope

Build the n8n API connector and sync pipeline. This includes:

- **Settings page** (`/settings`): form where the user enters their n8n instance URL and API key; credentials are stored encrypted in the ConnectorConfig table scoped to the workspace. This requires creating the `/settings` route and adding a settings icon to the sidebar navigation (not created in epic 01).
- **Manual sync**: a "Sync" button on the settings page that triggers the import pipeline
- **Import pipeline**:
  1. Call the n8n REST API (`GET /workflows`) to list all workflows
  2. For each workflow, fetch the full workflow JSON (`GET /workflows/{id}`)
  3. Upsert Automation records by `workspaceId` + `externalId` (matching the composite unique constraint) — new workflows create records, existing workflows update their `rawWorkflowJson` and `automationLastUpdated`. The n8n workflow's `active` property is read and mapped to `status = active` or `status = inactive` accordingly.
  4. Workflows in Expliq that no longer exist in n8n are soft-removed (status set to `removed`)

  Sync always writes to the `status` field and never touches `statusOverride`. This ensures user overrides are preserved across syncs.
- **Sync feedback**: show the user sync progress/completion (count of imported, updated, removed workflows; errors for unreachable instance or invalid API key)
- **Connection test**: a "Test Connection" button that verifies the n8n instance is reachable and the API key is valid before saving

At this stage, LLM-generated fields remain null — only raw workflow JSON and basic metadata (externalId, status, automationLastUpdated) are populated.

## Acceptance criteria

- [ ] Settings page allows saving an n8n instance URL and API key, stored encrypted in ConnectorConfig scoped to the workspace
- [ ] "Test Connection" verifies the n8n instance is reachable and the API key is valid
- [ ] Clicking "Sync" calls the n8n REST API, fetches all workflows, and upserts Automation records by `workspaceId` + `externalId`
- [ ] New workflows create Automation records with `rawWorkflowJson`, `externalId`, `platform = n8n`, `automationLastUpdated`, and `status` set from the n8n workflow's `active` property (`active` or `inactive`)
- [ ] Existing workflows update their `rawWorkflowJson` and `automationLastUpdated` if the workflow JSON has changed
- [ ] Workflows removed from n8n are soft-removed in Expliq (status set to `removed`, not deleted)
- [ ] While sync is in progress, the Sync button is disabled and a progress indicator is shown
- [ ] Sync completion shows a summary: count of new, updated, unchanged, and removed workflows; errors are displayed clearly
- [ ] `ConnectorConfig.lastSyncAt` is updated to the current timestamp when sync completes successfully

## Out of scope

- LLM generation of any fields (raw JSON only; LLM fields remain null)
- Periodic/scheduled sync (manual only for MVP)
- Make or Zapier connectors
- Editing or pushing changes back to n8n
- Sidebar nav item for "Integrations" (settings page is accessed via a settings icon/route)

## Domain terms

| Term | Definition |
|------|-----------|
| **n8n REST API** | The HTTP API exposed by an n8n instance for managing workflows programmatically |
| **externalId** | The n8n workflow ID used as the unique key for upsert matching |
| **rawWorkflowJson** | The complete JSON representation of an n8n workflow including all nodes, connections, and settings |
| **Soft removal** | Setting an automation's status to `removed` rather than deleting the database record |
| **ConnectorConfig** | Database record storing the n8n instance URL and encrypted API key for a workspace |

## Open questions

- What encryption approach for the API key? (AES-256-GCM with a server-side secret from environment variables is the standard approach)
- Should we store the n8n workflow `updatedAt` field from the API response to avoid re-processing unchanged workflows? (Optimization — probably yes)
- ~~Resolved: Sync button lives on the settings page only. No header button.~~
