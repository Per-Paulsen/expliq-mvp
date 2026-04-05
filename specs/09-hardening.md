---
tags:
  - type/spec
  - status/deferred
  - epic/09
---

# 09 — Production Hardening

> Upstream: [PRD](../expliq_prd.md) | Previous: [08 — Workspace Snapshot](08-workspace-snapshot.md)

## Scope

Cross-cutting reliability pass across all screens and server actions built in epics 01-08. This epic adds error boundaries, loading states, rate limiting, and graceful degradation — things that individual epics did not specify but that are required for a production-ready MVP.

### Error Boundaries
- Global error boundary (`src/app/error.tsx`) with user-friendly fallback UI and "Try again" button
- Route-level error boundaries for each app route group:
  - `src/app/(app)/error.tsx`
  - `src/app/(app)/automations/error.tsx`
  - `src/app/(app)/automations/[id]/error.tsx`
  - `src/app/(app)/settings/error.tsx`
- Error boundaries must log the error to console with structured context (route, timestamp, error message)

### Loading States
- Audit all pages and add Suspense boundaries with skeleton/spinner fallbacks where missing:
  - Workspace Snapshot (`/`) — skeleton cards for metrics, skeleton rows for rankings
  - Portfolio (`/automations`) — skeleton list rows
  - Automation Detail (`/automations/[id]`) — skeleton content blocks
  - Settings (`/settings`) — skeleton form
- Use `loading.tsx` files or inline `<Suspense>` as appropriate per route

### Server Action Hardening
- Every server action must wrap its body in try/catch and return structured `{ success, error }` responses
- No unhandled exceptions should reach the client as raw 500 errors
- Audit all existing server actions in `src/lib/actions/` for consistent error handling

### Rate Limiting (Client-Side)
- Debounce the "Regenerate" button on automation detail (disable for 10s after click)
- Debounce the "Sync Now" button on settings (disable for 30s after click or until sync completes)
- Debounce the "Test Connection" button (disable for 5s after click)

### Graceful Degradation
- If n8n API is unreachable during sync, show a clear error message (not a generic 500)
- If OpenRouter is unreachable during LLM processing, show error per-automation and preserve existing data
- If database queries fail on dashboard/portfolio, error boundary catches with retry option

### Dependencies

Depends on all prior epics (01-08). This is a hardening pass, not new functionality.

## Acceptance criteria

- [ ] Global `error.tsx` exists and renders a user-friendly fallback with "Try again" button
- [ ] Route-level `error.tsx` files exist for all four app route segments
- [ ] Error boundaries log errors to console with structured context
- [ ] All pages have loading states (Suspense boundaries or `loading.tsx`) with skeleton/spinner UI
- [ ] All server actions in `src/lib/actions/` return structured `{ success, error }` — no unhandled exceptions
- [ ] "Regenerate" button is disabled for 10s after click
- [ ] "Sync Now" button is disabled for 30s after click (or until completion)
- [ ] "Test Connection" button is disabled for 5s after click
- [ ] n8n sync failure shows specific error message (connection refused, auth failed, timeout)
- [ ] OpenRouter failure during LLM processing preserves existing automation data and shows per-automation error
- [ ] No screen shows a raw "500 Internal Server Error" or blank white page on failure

## Out of scope

- Server-side rate limiting (API route middleware, Redis, etc.)
- External error tracking services (Sentry, LogRocket, etc.)
- Performance optimization (pagination, virtual scrolling, query optimization)
- Automated health checks or uptime monitoring
- Retry logic with exponential backoff
- Offline support or service workers

## Domain terms

| Term | Definition |
|------|-----------|
| **Error boundary** | A React component that catches render-time errors in its subtree and displays a fallback UI instead of crashing the page |
| **Loading state** | Visual placeholder (skeleton, spinner) shown while async data is being fetched |
| **Graceful degradation** | Showing a useful error message and preserving existing data when an external service fails, instead of crashing |
| **Rate limiting (client-side)** | Disabling a button for a cooldown period after click to prevent rapid repeated calls to expensive operations |

## Open questions

- ~~Resolved: Error boundaries show "Try again" only for MVP. No "Report issue" link — no external error tracking or support channel exists yet.~~
- ~~Resolved: Loading skeletons use approximate layout (recognizable shapes, not pixel-perfect). Pages are still evolving through epics 05-08.~~
- ~~Resolved: Spec deferred — shelved for the R2 build sequence. R2 page epics (12-17) handle their own error boundaries and loading states. May be revisited post-R2 if a dedicated hardening pass is needed.~~

---

## Related

- [Brainstorming](09-hardening-brainstorming.md)
