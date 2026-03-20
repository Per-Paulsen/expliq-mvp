---
tags:
  - type/results
  - status/done
  - epic/03
---

# Epic 03 — n8n Connector: Results

> Upstream: [Epic 03: n8n Connector](03-n8n-connector.md)

## What Was Built

n8n API connector and sync pipeline: settings page for configuring n8n credentials, connection testing, manual workflow sync with full upsert logic, and sync feedback UI.

## Key Files Created/Modified

### New Files (9)
| File | Purpose |
|------|---------|
| `src/lib/encryption.ts` | AES-256-GCM encrypt/decrypt for API key storage |
| `src/lib/n8n-client.ts` | n8n REST API client (testConnection, listWorkflows, getWorkflow) |
| `src/lib/actions/connector.ts` | Server actions: saveConnectorConfig, testConnection, syncWorkflows |
| `src/app/(app)/settings/page.tsx` | Settings page server component (loads config, passes to form) |
| `src/components/settings-form.tsx` | Settings form client component (form, sync UI, feedback) |
| `src/__tests__/encryption.test.ts` | 6 encryption tests |
| `src/__tests__/n8n-client.test.ts` | 8 n8n client tests |
| `src/__tests__/connector-actions.test.ts` | 14 server action tests |
| `src/__tests__/settings.test.tsx` | 10 settings UI render tests |

### Modified Files (2)
| File | Change |
|------|--------|
| `src/components/app-sidebar.tsx` | Added Settings nav item with Settings icon |
| `.env.example` | Added ENCRYPTION_KEY |

## Decisions and Deviations from Spec

1. **No schema migration** — ConnectorConfig lacks `@@unique([workspaceId, platform])`. Used `findFirst` + conditional create/update instead of upsert. Works fine for MVP single-user-per-workspace.

2. **AES-256-GCM encryption** — API key encrypted with random 12-byte IV, stored as base64(iv + authTag + ciphertext) in the existing `apiKeyEncrypted` column. Key from `ENCRYPTION_KEY` env var (32-byte hex).

3. **n8n API auth** — Uses `X-N8N-API-KEY` header (n8n's documented REST API auth method).

4. **Change detection** — Compares n8n `updatedAt` timestamp against stored `automationLastUpdated` to avoid unnecessary updates. No JSON deep-comparison.

5. **Sync progress** — Simple loading state (boolean) rather than SSE/polling. Sync completes in seconds for typical n8n instances.

6. **API key not sent to client** — Server component passes `hasApiKey: boolean` to the client form, never the decrypted key. Prevents exposure in serialized HTML.

7. **Prisma Json type cast** — `N8nWorkflow` type (with index signature `[key: string]: unknown`) required `as unknown as Prisma.InputJsonValue` cast when writing to `rawWorkflowJson`.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run test` (53 tests) | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass |
| Settings page via sidebar | Pass |
| Save n8n credentials (encrypted) | Pass |
| Test Connection (real n8n cloud) | Pass |
| First sync (10 workflows created) | Pass |
| Re-sync (10 unchanged, idempotent) | Pass |

## Risks for Future Epics

1. **ConnectorConfig without unique constraint** — No `@@unique([workspaceId, platform])` means theoretical possibility of duplicate configs via race condition. Negligible for MVP but worth adding if multi-user workspaces are introduced.

2. **n8n API pagination** — Current implementation paginates with cursor and max 100 pages. If an n8n instance has thousands of workflows, sync duration could be noticeable. No progress feedback beyond the loading spinner.

3. **ENCRYPTION_KEY rotation** — No key rotation mechanism. Changing the key requires re-encrypting all stored API keys. Straightforward but not automated.

4. **Sync is blocking** — The sync server action blocks until all workflows are fetched and upserted. For very large n8n instances, this could hit server action timeouts.

5. **Epic 04 (LLM Pipeline)** — The `N8nWorkflow` type uses `[key: string]: unknown` index signature. When epic 04 reads `rawWorkflowJson` from the database, it gets Prisma's `JsonValue` type and will need to parse/cast it to access workflow node structure.

## Open Questions

- Should sync be triggered automatically after saving credentials for the first time?
- Should the settings page show a list of synced automations or just the count?
- The `impactReasoning` field mentioned in epic 04's spec is not in the current Prisma schema — needs to be added in epic 04.

### Recommendations

**Auto-sync after first save?** — No. Keep it manual. The user may want to verify the connection (Test Connection) before syncing, and the explicit "Sync Now" click gives them control over when data flows in. Auto-sync could be surprising if there are hundreds of workflows.

**Show synced automations on settings page?** — No, just the count (via the sync summary). The Portfolio screen (epic 06) is purpose-built for browsing automations with search, filters, and sorting. Duplicating a list on the settings page adds clutter without value. The sync summary (created/updated/unchanged/removed) is sufficient feedback.

**`impactReasoning` field** — Add it in epic 04 as a schema migration. It's an LLM-generated field that doesn't exist until the LLM pipeline runs, so it belongs in that epic's scope. Simple addition: `impactReasoning String?` on the Automation model.

## Commit

`26bb7da` — `feat: implement epic 3 — n8n connector`

---

## Related

- [Spec](03-n8n-connector.md)
- [Brainstorming](03-n8n-connector-brainstorming.md)
