---
tags:
  - type/reference
  - exercise/19
---

# Exercise 19 — Implementation Brief for expliq-mvp

## What the exercise requires

Build one AI-powered workflow in n8n with this structure: **Trigger -> AI reasoning step -> automated action.**

## What we're building

**Governance Change Notifier:** When a user edits an automation in Expliq and the risk level changes, Expliq notifies an n8n webhook. n8n uses Claude to generate a human-readable explanation of what changed, then sends a Slack message with appropriate urgency.

## Why this approach

Expliq already computes risk levels via `getRiskLevel()` in `src/lib/risk-engine.ts`. The two server actions that modify governance data (`saveAutomationEdits` and `markAsReviewed` in `src/lib/actions/automation.ts`) already know what changed. We just need to compute the risk before and after the edit, then POST the delta to n8n. No new API endpoints, no new sync mechanism.

## What needs to change in expliq-mvp

### 1. Compute risk delta in server actions

In `src/lib/actions/automation.ts`, both `saveAutomationEdits()` and `markAsReviewed()` need to:

1. **Before** applying the edit: fetch the automation, compute `getRiskLevel()` and `getGovernanceSignals()`
2. Apply the edit (existing code, no changes)
3. **After** the edit: re-fetch the automation, compute `getRiskLevel()` and `getGovernanceSignals()` again
4. Compare before vs. after

### 2. POST to n8n webhook (fire-and-forget)

If the risk level changed, POST a change event to n8n. This should be:

- **Fire-and-forget:** Use `fetch()` without `await` so the UI response is not delayed
- **Best-effort:** If the webhook fails, the edit still succeeds (the notification is a nice-to-have, not transactional)
- **Conditional:** Only POST when risk level actually changed (most edits won't change it)

### 3. Environment variable

Add `N8N_GOVERNANCE_WEBHOOK_URL` to `.env` and `.env.example`. This is the n8n webhook URL that receives the change events.

### 4. Webhook payload shape

```json
{
  "event": "automation.edited",
  "automation": {
    "id": "cm5auto789",
    "name": "Daily CRM Sync",
    "riskLevel": "medium",
    "previousRiskLevel": "high",
    "impactLevel": "high",
    "owner": "Alice Chen",
    "systemsTouched": ["salesforce", "hubspot"],
    "activeSignals": ["documentationOutdated"],
    "resolvedSignals": ["noOwnerAssigned", "overdueReview"]
  },
  "change": {
    "field": "owner",
    "oldValue": null,
    "newValue": "Alice Chen",
    "changedBy": "ops-lead@acme.com"
  },
  "workspace": {
    "id": "cm5wks456",
    "name": "Acme Operations"
  },
  "timestamp": "2026-03-25T14:30:00Z"
}
```

Key fields:
- `riskLevel` + `previousRiskLevel`: the before/after
- `activeSignals`: what's still flagged after the edit
- `resolvedSignals`: what the edit fixed (difference between old and new signals)
- `change`: exactly what field was modified, by whom

### 5. Helper function (suggested)

Extract the webhook notification into a reusable helper so both server actions can call it:

```typescript
// src/lib/actions/notify-governance-change.ts

async function notifyGovernanceChange(opts: {
  automation: Automation,
  previousRiskLevel: string,
  currentRiskLevel: string,
  previousSignals: GovernanceSignals,
  currentSignals: GovernanceSignals,
  changeField: string,
  oldValue: unknown,
  newValue: unknown,
  changedByEmail: string,
  workspaceId: string,
}) {
  if (opts.previousRiskLevel === opts.currentRiskLevel) return; // no change, skip

  const webhookUrl = process.env.N8N_GOVERNANCE_WEBHOOK_URL;
  if (!webhookUrl) return; // not configured, skip silently

  // fire-and-forget: don't await, don't block the UI
  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ /* payload shape above */ }),
  }).catch(() => {}); // swallow errors, this is best-effort
}
```

## What does NOT need to change

- No new API routes
- No changes to `risk-engine.ts` (pure functions, called as-is)
- No changes to `llm-pipeline.ts`
- No changes to the UI
- No new database tables or Prisma schema changes

## The n8n side (separate from expliq-mvp)

The n8n workflow is built separately in the n8n UI:

1. **Webhook node** receives the POST from Expliq
2. **IF node** checks if risk actually changed (safety check, should always be true since Expliq already filters)
3. **HTTP Request node** calls OpenRouter (Claude) with the change data, asking it to generate a human-readable explanation
4. **Set node** parses the AI JSON response
5. **Switch node** routes based on whether risk increased or decreased
6. **Slack nodes** send the notification with appropriate urgency formatting (red for increases, green for decreases)

## How to test

1. Start the n8n instance with the workflow active
2. Set `N8N_GOVERNANCE_WEBHOOK_URL` in Expliq's `.env`
3. Open Expliq, navigate to an automation detail page
4. Make an edit that changes risk level (e.g., remove the owner from a medium-risk automation with 1 other active signal, pushing it to high)
5. Check Slack for the notification
6. Verify the AI explanation references the specific change and automation name
