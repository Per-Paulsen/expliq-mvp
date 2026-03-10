# 07 — Automation Detail

## Scope

Build the Automation Detail screen (`/automations/[id]`) — the full view of a single automation showing all LLM-generated content, governance metadata, risk information, and user-editable fields. This is where Emma understands what an automation does and why it matters.

### Dependencies

This epic depends on epic 05 (Risk Engine) for computed risk level and governance signals displayed in the risk section. It depends on epic 04 (LLM Pipeline) for the regenerate server action and all LLM-generated display fields. It depends on epic 03 (n8n Connector) for the ConnectorConfig record used by the "Open in n8n" link.

### Layout — content + sidebar (two-column)

Two-column layout: main content left (~65%), governance sidebar right (~35%). On narrow screens (< ~1024px), the sidebar stacks above the main content. This follows the standard detail-page pattern (GitHub issues, Jira tickets, Linear) and extends the portfolio card's 2-column DNA to page scale.

#### Main content (left column)

- **Back navigation**: "← Back to Automations" link returning to Portfolio
- **Header**: automation name (LLM-generated), Edit button (right-aligned)
- **Badges row**: platform badge (n8n), effective status badge (`statusOverride ?? status`)
- **Description**: LLM-generated business summary (1-2 sentences)
- **Trigger**: LLM-generated plain-language trigger description
- **Core Logic**: LLM-generated bullet list of what the workflow does step by step
- **Data Types**: list of data types flowing through the workflow
- **Side Effects**: what the automation writes/modifies in other systems
- **Business Context**: LLM-generated explanation of why this automation matters and what breaks if it fails

#### Governance sidebar (right column)

- **Risk & Governance**:
  - Computed risk level (High / Medium / Low) with color indicator
  - Impact classification (showing LLM proposal and user override if different), with LLM reasoning (`impactReasoning`) displayed below the classification
- **Signals**:
  - Active governance signals listed as explicit risk drivers (same set as Portfolio card badges — excludes "Inactive" since the effective status badge already conveys active/inactive/deprecated)
  - "Mark as reviewed" button (standalone, outside edit mode — sets `lastReviewDate` to now; placed near the signals it resolves for low-friction access)
- **Metadata**:
  - Owner
  - Trigger type (read-only, LLM-generated)
  - Automation Last Updated
  - Documentation Last Updated
  - Systems touched (tag chips)
- **Actions**:
  - "Open in n8n" link (constructed: `{instanceUrl}/workflow/{externalId}`, opens in new tab). The `instanceUrl` is read from the workspace's `ConnectorConfig` record. If no ConnectorConfig exists, the link is hidden.
  - "Regenerate" button to re-run LLM pipeline for this automation (shows loading state during processing; displays error if regeneration fails)

### Edit Mode

Clicking "Edit" enters inline edit mode for user-editable fields in the sidebar:

- **Owner**: text input (free-form for MVP)
- **Impact classification**: dropdown (Critical / High / Medium / Low) — pre-filled with LLM proposal or current override
- **Review cadence**: number input (days, default 30)
- **Status override**: dropdown (Active / Inactive / Deprecated) — writes to `statusOverride` field, not `status`

Save and Cancel buttons appear in the sidebar. LLM-generated fields (main content column) remain read-only and visually distinct from editable fields.

## Acceptance criteria

- [ ] Two-column layout: main content (~65%) left, governance sidebar (~35%) right; sidebar stacks above content on narrow screens
- [ ] Main content displays all LLM-generated fields: name, description, trigger, core logic (as bullets), data types, business context, side effects — with platform badge and effective status badge below the title
- [ ] Governance sidebar shows: risk level with color indicator, impact classification (LLM proposal vs user override) with impact reasoning, active governance signals as risk drivers, "Mark as reviewed" button, metadata (owner, trigger type, timestamps, systems touched as tags), and actions
- [ ] Edit mode allows modifying sidebar fields: owner, impact classification, review cadence, status override — with Save/Cancel buttons in the sidebar
- [ ] "Mark as reviewed" is a standalone action outside edit mode — one click sets `lastReviewDate` to now; placed in the sidebar near the governance signals it resolves
- [ ] LLM-generated fields (main content column) are visually distinct and not editable in edit mode
- [ ] "Open in n8n" link is constructed from `instanceUrl/workflow/externalId` and opens in a new tab
- [ ] "Open in n8n" link is hidden if no ConnectorConfig exists for the workspace
- [ ] "Regenerate" button shows a loading state during processing, displays an error if regeneration fails, and refreshes the page content on success (existing LLM fields are preserved on failure per epic 04 error handling)
- [ ] "← Back to Automations" uses `router.back()` to preserve Portfolio filter state (with fallback to `/automations` if no browser history)
- [ ] If LLM-generated fields are null (automation synced but not yet processed), the page displays placeholder text (e.g., "Pending generation") rather than blank content
- [ ] Saving edits persists changes via a server action that updates the Automation record (verifying workspace ownership) and updates the displayed content
- [ ] If the automation ID does not exist or does not belong to the user's workspace, the page shows a 404

## Out of scope

- Version history or changelog of edits
- Comments or team discussion on an automation
- Deleting automations from Expliq (they only disappear via n8n sync)
- Inline editing of LLM-generated fields
- Comparing current vs previous LLM-generated content after regeneration
- File attachments or external documentation links

## Domain terms

| Term | Definition |
|------|-----------|
| **Edit mode** | An inline state where user-editable fields become interactive inputs; toggled by the Edit button |
| **Impact override** | When the user changes the impact classification from the LLM proposal to a different level |
| **Status override** | When the user changes the effective status from the sync-derived value; stored in `statusOverride` separately from the sync-derived `status` field |
| **Mark as reviewed** | User action that sets `lastReviewDate` to the current timestamp, clearing the "overdue review" governance signal |
| **Risk drivers** | The specific governance signals contributing to an automation's risk level, shown explicitly to the user |
| **Governance sidebar** | The right column of the detail page containing risk, impact, signals, metadata, and actions — stays visible while scrolling the main content |
| **"Open in n8n"** | A deep link to the automation's workflow editor in the user's n8n instance |

## Open questions

- ~~Resolved: Override dropdowns do not include a "Reset to default" option for MVP. Overrides are permanent once set. The user can manually select the matching value if needed. The effective impact/status is always correct regardless.~~
- ~~Resolved: "Mark as reviewed" is standalone — a button visible outside edit mode. High-frequency, low-ceremony action.~~
- ~~Resolved: Back navigation uses `router.back()` with fallback to `/automations`. Preserves Portfolio filter state from browser history.~~
- ~~Resolved: `statusOverride` field added to schema (enum: active, inactive, deprecated — nullable). Edit mode writes to `statusOverride`; sync writes to `status`. Effective status = `statusOverride ?? status`.~~
