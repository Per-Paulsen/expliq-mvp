# 07 — Automation Detail

## Scope

Build the Automation Detail screen (`/automations/[id]`) — the full view of a single automation showing all LLM-generated content, governance metadata, risk information, and user-editable fields. This is where Emma understands what an automation does and why it matters.

### Layout (based on prototype screenshots)

- **Back navigation**: "← Back to Automations" link returning to Portfolio
- **Header**: automation name (LLM-generated), platform badge (n8n), effective status badge (`statusOverride ?? status`), governance attention badges, Edit button
- **Metadata grid**:
  - Owner | Trigger Type
  - Automation Last Updated | Documentation Last Updated
- **Systems**: tag chips for each system touched
- **Description**: LLM-generated business summary (1-2 sentences)
- **Trigger**: LLM-generated plain-language trigger description
- **Core Logic**: LLM-generated bullet list of what the workflow does step by step
- **Data Types**: list of data types flowing through the workflow
- **Side Effects**: what the automation writes/modifies in other systems
- **Business Context**: LLM-generated explanation of why this automation matters and what breaks if it fails
- **Risk section**:
  - Computed risk level (High / Medium / Low) with color indicator
  - Impact classification (showing LLM proposal and user override if different)
  - Active governance signals listed as explicit risk drivers
- **Actions**:
  - "Open in n8n" link (constructed: `{instanceUrl}/workflow/{externalId}`, opens in new tab). The `instanceUrl` is read from the workspace's `ConnectorConfig` record.
  - "Regenerate" button to re-run LLM pipeline for this automation

### Edit Mode

Clicking "Edit" enters inline edit mode for user-editable fields only:

- **Owner**: text input (free-form for MVP)
- **Impact classification**: dropdown (Critical / High / Medium / Low) — pre-filled with LLM proposal or current override
- **Review cadence**: number input (days, default 30)
- **Status override**: dropdown (Active / Inactive / Deprecated) — writes to `statusOverride` field, not `status`
- **Mark as reviewed**: button that sets `lastReviewDate` to now

Save and Cancel buttons. LLM-generated fields remain read-only and visually distinct from editable fields.

## Acceptance criteria

- [ ] Detail page displays all LLM-generated fields: name, description, trigger, core logic (as bullets), systems touched (as tags), data types, business context, side effects
- [ ] Governance metadata is shown: owner, trigger type, automation last updated, documentation last updated, platform badge, status badge, governance attention badges
- [ ] Risk section shows computed risk level, impact classification (LLM proposal vs user override), and specific governance signals driving the risk
- [ ] Edit mode allows modifying: owner, impact classification, review cadence, status override; and includes a "Mark as reviewed" action
- [ ] LLM-generated fields are visually distinct and not editable in edit mode
- [ ] "Open in n8n" link is constructed from `instanceUrl/workflow/externalId` and opens in a new tab
- [ ] "Regenerate" button triggers LLM re-generation and refreshes the page content
- [ ] "← Back to Automations" navigates to the Portfolio screen
- [ ] If LLM-generated fields are null (automation synced but not yet processed), the page displays placeholder text (e.g., "Pending generation") rather than blank content
- [ ] Saving edits persists changes to the database and updates the displayed content

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
| **"Open in n8n"** | A deep link to the automation's workflow editor in the user's n8n instance |

## Open questions

- Should "Mark as reviewed" be part of the edit mode or a standalone action accessible without entering edit mode? (Standalone feels more ergonomic — it's a frequent action)
- ~~Resolved: `statusOverride` field added to schema (enum: active, inactive, deprecated — nullable). Edit mode writes to `statusOverride`; sync writes to `status`. Effective status = `statusOverride ?? status`.~~
