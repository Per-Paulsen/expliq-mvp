# Fairtix n8n Instance — API Exploration Findings

> Queried 2026-04-03 against `https://ai-software-egnineering.app.n8n.cloud`
> This is a shared bootcamp instance, not a dedicated fairtix instance.

## Instance Overview

| Endpoint | Status | Result |
|----------|--------|--------|
| `GET /workflows?limit=250` | 200 | **68 workflows**, 490KB of data |
| `GET /executions?limit=50` | 200 | **50 executions**, 40% error rate |
| `GET /users` | 200 | **25 users** (all bootcamp participants) |
| `GET /tags` | 200 | **4 tags**: Reference, Setup, support, FairTix Bootcamp |
| `GET /variables` | 200 | **Empty** — no variables configured |
| `GET /credentials` | **403** | API key lacks permission |
| `GET /projects` | **403** | API key lacks permission |

## Filtering Strategy

The instance has 68 workflows but most are bootcamp participant practice copies. The **"Reference" tag** marks the 9 real fairtix demo workflows.

**API filter:** `GET /workflows?tags=Reference` returns only the demo set.

### Tag Distribution

| Tag | Purpose | Workflow count |
|-----|---------|---------------|
| `Reference` | Real fairtix demo workflows | 9 |
| `Setup` | Infrastructure/setup workflows | 3 |
| `support` | Bootcamp exercise (ChildCompass classifier copies) | ~10 |
| `FairTix Bootcamp` | Unknown (not seen on any workflow in the list?) | 0 visible |

### The 9 Reference Workflows

| # | Name | Nodes | Active | errorWorkflow | timeSaved |
|---|------|-------|--------|---------------|-----------|
| 00 | Common node types | 28 | inactive | - | - |
| 1 | FairTix Send Welcome Email | 3 | inactive | - | - |
| 2 | FairTix - LotteryWin | 5 | inactive | Y | 1 min |
| 2b | FairTix - LotteryWin With Error Handling | 4 | inactive | - | - |
| 3 | FairTix- Support-Classifier | 11 | inactive | - | - |
| 4 | FairTix- Switch FAQ/Manual | 18 | inactive | - | - |
| 4 | FairTix- Switch FAQ/Manual (sheet based) | 14 | inactive | - | - |
| 5 | FairTix - LotteryWin - Published | 5 | inactive | Y | 1 min |
| 5 | Generic Error Workflow | 2 | **ACTIVE** | - | - |

**Observations:**
- Only 1 reference workflow is active (Generic Error Workflow)
- 2 workflows have `errorWorkflow` set → connected to the Generic Error Workflow
- 2 workflows have `timeSavedPerExecution: 1` (minute)
- Numbering suggests a teaching progression (00 → 1 → 2 → 2b → 3 → 4 → 5)
- "Common node types" (28 nodes) is a reference/cheat-sheet, not a business workflow
- Two variants of workflow 4 (regular vs sheet-based) and workflow 2/5 (LotteryWin variants)

## Execution Data

50 most recent executions:
- **Success:** 30 (60%)
- **Error:** 20 (40%)
- **Modes:** webhook (19), trigger (17), manual (8), error (6)

The 40% error rate is expected for a demo/learning instance — participants trigger workflows that fail during testing. Real execution stats per reference workflow need to be extracted separately.

## Users

25 users — all bootcamp participants. Notable:
- Instance likely owned by Matty Al Doyaili or a trainer account
- Per Paulsen (perpaulsen0@gmail.com) is among the users
- 3 pending invites (not yet accepted)
- No role data returned (field missing from response — may be a permissions issue)

## What's Available vs What's Not

| Data source | Available? | Notes |
|-------------|-----------|-------|
| Workflow definitions (nodes, connections, settings) | **Yes** | Full JSON for all 68 workflows |
| Execution history | **Yes** | Status, timing, mode. 50 returned (may have more with pagination) |
| Tags | **Yes** | 4 tags, usable for filtering |
| Users | **Yes** | 25 users, no role info |
| `errorWorkflow` links | **Yes** | 2 reference workflows link to Generic Error Workflow |
| `timeSavedPerExecution` | **Partial** | Set on 2 workflows only (1 min each) |
| `callerIds` | **Not seen** | None of the reference workflows have callerIds set |
| Credentials | **No (403)** | API key lacks permission |
| Projects | **No (403)** | API key lacks permission |
| Variables | **Empty** | No variables configured |
| Data Tables | **Not queried** | May also be 403 |

## Impact on Product Decisions

1. **Tag-based filtering works.** For the demo, sync only `tags=Reference`. For production, let users choose which tags/projects to include.

2. **Execution data is real but noisy.** Need to filter executions by workflow ID to get per-workflow stats for the reference set only.

3. **Credentials API blocked.** We'll rely on `nodes[].credentials` and `nodes[].type` for system inventory instead.

4. **Most reference workflows are inactive.** The LLM should note this — "7 of 8 business workflows are inactive, only the error handler is running. This suggests the automations are configured but not yet deployed to production."

5. **The instance IS a demo.** The LLM will likely detect this. Per's point from the brainstorming: "if our analysis says 'you are clearly a demo company' — then Expliq has won!" The LLM's self-awareness about the data quality is itself a value signal.

## Next Step

Fetch all 9 reference workflows in full detail → save in `fairtix/reference/` → LLM analysis in `fairtix/reference/ANALYSIS.md`.
