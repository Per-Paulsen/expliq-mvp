---
tags:
  - type/results
  - status/done
  - epic/07
---

# Epic 07 — Automation Detail: Results

> Upstream: [Epic 07: Automation Detail](07-automation-detail.md)

## What Was Built

The Automation Detail screen (`/automations/[id]`) — the full view of a single automation showing all LLM-generated content, governance metadata, risk information, and user-editable fields.

### Architecture
- **Server component** (`page.tsx`) fetches automation + ConnectorConfig, enriches with risk-engine computed fields, constructs n8n URL, serializes to client
- **Client component** (`automation-detail-view.tsx`) handles two-column layout, edit mode state, all action dispatching (save, mark reviewed, regenerate)
- **Server actions** (`actions/automation.ts`) for save edits and mark as reviewed, with workspace ownership checks
- **Shared utilities** extracted from portfolio card: badge color maps and `formatRelativeTime`

## Key Files Created/Modified

| File | Purpose |
|------|---------|
| `src/lib/badge-colors.ts` | Shared color maps (STATUS_COLORS with `deprecated`, RISK_COLORS, IMPACT_COLORS) — extracted from portfolio card |
| `src/lib/format.ts` | Shared `formatRelativeTime` utility — extracted from portfolio card |
| `src/lib/automation-detail-types.ts` | `AutomationDetail` and `EditFormState` interfaces |
| `src/lib/actions/automation.ts` | `saveAutomationEdits()` + `markAsReviewed()` server actions with workspace scoping |
| `src/app/(app)/automations/[id]/page.tsx` | Server component: parallel fetch, risk engine enrichment, n8n URL construction, notFound() |
| `src/app/(app)/automations/[id]/not-found.tsx` | 404 page with "Back to Automations" link |
| `src/app/(app)/automations/[id]/error.tsx` | Error boundary with reset button |
| `src/components/automation-detail-view.tsx` | Main client component: two-column layout, edit mode, all interactive behavior |
| `src/components/portfolio-automation-card.tsx` | Updated imports to use shared badge-colors and format utilities |
| `src/__tests__/automation-detail-actions.test.ts` | 8 unit tests for server actions |
| `src/__tests__/automation-detail-view.test.tsx` | 21 component tests for detail view |

## Decisions and Deviations from Spec

1. **Separate `AutomationDetail` type** — Did not extend `PortfolioAutomation`. The detail page needs many more fields (trigger, coreLogic, dataTypes, businessContext, sideEffects, impactProposal, impactOverride, impactReasoning, etc.). Keeping types independent avoids coupling.

2. **Extracted shared utilities** — `badge-colors.ts` and `format.ts` extracted from `portfolio-automation-card.tsx`. This was flagged as a risk in Epic 06 results. Both the portfolio card and detail page now import from the same source.

3. **`coreLogic` rendered by splitting on newlines** — The LLM stores `coreLogic` as a single string. The component splits on `\n`, strips leading `•`/`-`/`*` prefixes, and renders as `<ul>` bullet items.

4. **Sidebar first in DOM for mobile stacking** — Spec says sidebar stacks above content on narrow screens. Achieved via CSS flex ordering: sidebar is first in DOM order (appears first on mobile), with `lg:order-2` pushing it right on desktop.

5. **Edit mode pre-fills from effective values** — Impact dropdown pre-fills with `impactOverride ?? impactProposal`, status dropdown pre-fills with `statusOverride ?? ""`. No "Reset to default" option per spec.

6. **`statusOverride` dropdown shows empty when no override** — When no override is set, the status select shows a placeholder. This matches the spec: "writes to `statusOverride` field, not `status`".

## Verification Results

| Check | Result |
|-------|--------|
| `npm run test` (207 tests, 16 files) | Pass |
| `npm run lint` | Pass (0 errors, 1 pre-existing warning) |
| `npm run build` | Pass |

### Test Coverage (29 new tests)
- `automation-detail-actions.test.ts`: 8 tests — saveAutomationEdits (not found, wrong workspace, saves all fields, clears owner, validates cadence), markAsReviewed (not found, sets date, returns success)
- `automation-detail-view.test.tsx`: 21 tests — name rendering (including null fallback), badges, description/trigger/core logic/data types/side effects/business context, pending generation placeholders, risk/impact badges, governance signals, mark as reviewed button, metadata display, open in n8n shown/hidden, regenerate button, edit mode enter/cancel

### Playwright E2E — Pass

Verified via Playwright MCP on 2026-03-10. Logged in as `seed-mock@expliq.dev`.

**Processed automation (Stripe CRM Subscription Sync):**
- [x] Two-column layout: main content left (~65%), governance sidebar right (~35%)
- [x] Header: automation name + Edit button
- [x] Badges: platform (n8n) + effective status (Active)
- [x] All LLM fields: description, trigger, core logic (5 bullets), data types (5 badges), side effects (3 items), business context
- [x] Risk & Impact: "Low risk" + "Critical impact" badges with impact reasoning text
- [x] Signals: "No active risk signals" + "Mark as reviewed" button
- [x] Metadata: Owner (Carol Davis), Trigger type (webhook), timestamps (1d ago), systems (Stripe, Salesforce, Slack, Intercom)
- [x] Actions: "Open in n8n" link (https://n8n-mock.example.com/workflow/mock-14), "Regenerate" button
- [x] Edit mode: toggles owner input, impact select, cadence input, status select; Save/Cancel buttons appear
- [x] Cancel exits edit mode, restores view
- [x] Mark as reviewed: page refreshes successfully (no error)
- [x] Back navigation: returns to `/automations` portfolio

**Unprocessed automation:**
- [x] "Untitled automation" title
- [x] "Pending generation" placeholder for all 6 LLM content sections
- [x] Sidebar still shows risk level, signals, metadata, actions

**404 handling:**
- [x] `/automations/nonexistent-id` shows "Automation not found" page with "Back to Automations" link

**Responsive layout:**
- [x] At 768px width: sidebar stacks above main content
- [x] At 1280px width: two-column side-by-side layout

## Risks for Future Epics

1. **Impact override display** — When `impactOverride` differs from `impactProposal`, both are shown. If Epic 08 (Workspace Snapshot) needs to display impact differently, the badge-colors utility is already shared and can be extended.

2. **`formatRelativeTime` now shared** — Extracted to `src/lib/format.ts`. Future epics should import from there rather than creating new copies.

3. **`badge-colors.ts` includes `deprecated` status** — Added for the status override dropdown. The portfolio card also benefits from this for deprecated automations.

4. **No optimistic updates** — Save, mark as reviewed, and regenerate all use `router.refresh()` after the server action completes. This causes a full server component re-render. Fine for MVP but could feel slow on slower connections.

5. **`coreLogic` bullet splitting** — Assumes the LLM stores one step per line with optional bullet prefixes. If the LLM changes its formatting, the rendering may need adjustment.

## Open Questions

None.

## Commit

`0d27489` — `feat: implement epic 7 — automation detail`

---

## Related

- [Spec](07-automation-detail.md)
- [Brainstorming](07-automation-detail-brainstorming.md)
