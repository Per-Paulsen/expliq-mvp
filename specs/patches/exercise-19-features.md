---
tags:
  - type/patch
  - status/pending
  - epic/05
  - exercise/19
---

# Exercise 19 — Governance Change Notifier

> Upstream: [Epic 05: Risk Engine](../05-risk-engine.md) | [Implementation Brief](../../implementation-brief.md)

**Epic:** 05 (Risk Engine)
**Type:** Feature — webhook notification on governance changes
**Exercise requirement:** Trigger -> AI reasoning step -> automated action, implemented in n8n.

## Problem

Expliq currently has no way to notify external systems when governance state changes. For Exercise 19, we need Expliq to POST change events to an n8n webhook so n8n can run an AI reasoning step and send a Slack notification.

## Solution

Add a webhook notification helper that fires after every governance edit. Both `saveAutomationEdits()` and `markAsReviewed()` in `src/lib/actions/automation.ts` call the helper after applying the edit. The helper computes the risk/signals delta and POSTs it to an n8n webhook URL configured via environment variable.

### Design decisions (from brainstorming)

- **Notify on every change**, not just risk-level changes — for reliable demo. Payload includes `riskLevelChanged: boolean` so n8n can branch.
- **Multiple changes array** — `saveAutomationEdits` can modify 4 fields at once. Send array of `{ field, oldValue, newValue }` for fields that actually changed.
- **Await the fetch** — safer than fire-and-forget in Next.js server actions. Wrapped in try/catch to swallow errors (best-effort, edit still succeeds if webhook fails).
- **Fetch user email from DB** — session only has userId, lookup email for the `changedBy` field.
- **Signals as string arrays** — convert `GovernanceSignals` object to `activeSignals: string[]` and `resolvedSignals: string[]` for clean n8n consumption.
- **Webhook URL via env var** — `N8N_GOVERNANCE_WEBHOOK_URL` in `.env`. No UI settings field for now.

### Payload shape

```json
{
  "event": "automation.governance_changed",
  "automation": {
    "id": "...",
    "name": "Daily CRM Sync",
    "riskLevel": "medium",
    "previousRiskLevel": "high",
    "riskLevelChanged": true,
    "impactLevel": "high",
    "owner": "Alice Chen",
    "systemsTouched": ["salesforce", "hubspot"],
    "activeSignals": ["documentationOutdated"],
    "resolvedSignals": ["noOwnerAssigned", "overdueReview"]
  },
  "changes": [
    { "field": "owner", "oldValue": null, "newValue": "Alice Chen" }
  ],
  "changedBy": "ops-lead@acme.com",
  "workspaceId": "...",
  "timestamp": "2026-03-25T14:30:00Z"
}
```

### Implementation

**New file: `src/lib/actions/notify-governance-change.ts`**

Helper function:
- Accepts pre-edit and post-edit `Automation` objects + userId
- Computes `getRiskLevel()` and `getGovernanceSignals()` for both (pure functions, no DB calls)
- Converts signals to string arrays, computes resolved signals (true before, false after)
- Fetches user email from DB via userId
- Builds payload and POSTs to `N8N_GOVERNANCE_WEBHOOK_URL`
- Skips silently if env var not set
- Swallows fetch errors (best-effort)

### Files to change

**`src/lib/actions/automation.ts`** — Both server actions:
- `saveAutomationEdits()`: Capture pre-edit automation (already fetched), capture Prisma update return value as post-edit automation, call helper with both + list of changed fields
- `markAsReviewed()`: Same pattern — pre-edit automation already fetched, capture update return, call helper

**`src/lib/actions/notify-governance-change.ts`** — New file with:
- `notifyGovernanceChange()` function
- Signal-to-array conversion helper
- Changes diff computation

**`.env.example`** — Add `N8N_GOVERNANCE_WEBHOOK_URL=`

### Test plan

- Unit test for signal-to-array conversion (pure logic)
- Unit test for changes diff computation (compare before/after automation fields)
- Unit test for payload construction (mock fetch, verify shape)
- Existing `automation.ts` tests should still pass (webhook is additive, doesn't change return values)

### What does NOT change

- No new API routes
- No changes to `risk-engine.ts` (called as-is)
- No changes to `llm-pipeline.ts`
- No UI changes
- No schema changes

### The n8n side (out of scope)

The n8n workflow (webhook -> AI reasoning -> Slack) is built separately in the n8n UI. This patch only covers the Expliq side.

## Invocation

```
/patch 'specs/patches/exercise-19-features.md' --epic 05
```

---

## Related

- [Epic 05 Spec](../05-risk-engine.md)
- [Epic 05 Results](../05-risk-engine-results.md)
- [Implementation Brief](../../implementation-brief.md)
