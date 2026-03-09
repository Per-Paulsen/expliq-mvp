# 06 — Portfolio Screen

## Scope

Build the Portfolio screen (`/automations`) — the primary list view where Emma browses, searches, filters, and triages automations. This screen is the main navigation hub and the most frequently used view.

### Layout (based on prototype screenshots)

- **Header area**: search bar ("Search automations..."), sync status indicator
- **Filter section**:
  - **Systems** row: clickable chips showing each system with automation count (e.g., "Slack (10)", "Salesforce (10)"). Multiple can be selected. "Clear" button resets.
  - **Platform** row: clickable chips showing each platform with count (e.g., "n8n (5)"). Only n8n has data for MVP.
  - **Owner** row: clickable chips showing each owner with automation count (e.g., "Alice (5)", "Bob (3)", "No owner (2)"). Multiple can be selected. "Clear" button resets.
  - **Attention** row: clickable badges for governance signals with counts (e.g., "No owner assigned (3)", "Automation stale (4)", "Documentation outdated (7)", "Overdue review (5)", "Inactive (2)")
- **Sort bar**: sort by "Automation Last Updated", "Documentation Last Updated", "Name" — with ascending/descending toggle
- **Result count**: "X automations" label that updates with filters
- **Automation cards**: each card shows:
  - Name (LLM-generated)
  - Status badge (Active / Inactive / Deprecated)
  - Platform badge (n8n)
  - Systems touched (as small tag chips)
  - Owner name
  - 1-2 sentence description (LLM-generated)
  - Governance attention badges (documentation outdated, no owner, etc.)
  - Automation Last Updated timestamp
  - Documentation Last Updated timestamp
- **Card interaction**: clicking a card navigates to `/automations/[id]`

### Search

Full-text search across automation name and description using Prisma `contains` queries (case-insensitive).

### Filters

Filters are combinable (AND logic across categories, OR logic within a category). URL query parameters reflect active filters for shareability and browser back/forward support.

## Acceptance criteria

- [ ] All automations in the workspace are listed as cards with: name, effective status badge (`statusOverride ?? status`), platform badge, system tags, owner, description, governance badges, and timestamps
- [ ] Search filters automations by name and description (case-insensitive, partial match)
- [ ] System filter chips show each system with count; selecting one or more filters the list to automations touching those systems
- [ ] Owner filter chips show each owner (and "No owner") with count; selecting one or more filters the list to automations with those owners
- [ ] Attention filter badges show all five governance signal counts (including "Overdue review"); selecting one filters to automations with that signal active
- [ ] Platform filter chips show each platform with count; selecting one or more filters the list to automations on those platforms
- [ ] Sort works by automation last updated (default), documentation last updated, and name — with asc/desc toggle
- [ ] Result count updates dynamically with active filters and search
- [ ] Clicking an automation card navigates to `/automations/[id]`
- [ ] Filter state is reflected in URL query parameters
- [ ] Sync status indicator in the header shows the last sync timestamp from `ConnectorConfig.lastSyncAt` (e.g., "Last synced: 2 hours ago"), or "Never synced" if no sync has occurred
- [ ] Automations with `status = removed` are excluded from the list (regardless of `statusOverride`)

## Out of scope

- Pagination or infinite scroll (load all automations for MVP; expected volume is tens, not thousands)
- Bulk actions (multi-select, bulk assign owner, etc.)
- Manual "Add Automation" button (data comes from n8n sync only)
- Risk level column/badge on the card (governance badges serve this role on the list view)
- Export or download functionality

## Domain terms

| Term | Definition |
|------|-----------|
| **Portfolio** | The list view showing all automations in the workspace with filtering and search capabilities |
| **Automation card** | A summary card in the list showing key metadata, description, and governance badges for one automation |
| **Attention badges** | Visual indicators of governance gaps (documentation outdated, no owner assigned, automation stale, overdue review, inactive) shown on cards |
| **System chips** | Clickable filter elements showing external systems (Slack, Salesforce, etc.) with automation counts |

## Open questions

- Should the Platform filter row be shown if only n8n is supported for MVP? (Leaning yes — it communicates that multi-platform support is coming and shows the count)
