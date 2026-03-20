---
tags:
  - type/brainstorming
  - status/done
  - epic/07
---

# 07 — Automation Detail — Brainstorming

> Upstream: [Epic 07: Automation Detail](07-automation-detail.md)

## Refinement Applied

Batch-refined via `/refine_all_ind`. See `specs/ind-epic-review.md` for details.

## Implementation Refinement Applied

Batch-refined via `/refine_all_ind` (in-dev mode). See `specs/ind-epic-review.md` for details.

Results incorporated:
- 01-project-setup-results.md
- 02-auth-results.md
- 03-n8n-connector-results.md
- 04-llm-pipeline-results.md
- 05-risk-engine-results.md
- 05.5-test-infrastructure-results.md
- 06-portfolio-screen-results.md

## Layout Discussion — Risk/Impact Placement

### User feedback

> The layout should be based more on the card layout in the portfolio screen, in which the important elements such as risk, impact and so on are closer to the title. Do you understand the issue? What do you think?

### Response

Yes, completely understood. Here's the problem:

**Portfolio card** (what Emma sees before clicking):
```
[Title]  [medium risk]  [high impact]
[Slack] [Salesforce]
Short description...
[Documentation outdated] [Overdue review]
```

Risk and impact are on the **title line** — the first thing she reads.

**Current spec 07 layout** (what she sees after clicking):
```
← Back to Automations
[Title]  [n8n]  [Active]  [Doc outdated] [Overdue review]  [Edit]
Owner: ...  |  Trigger Type: ...
...
Description
Trigger
Core Logic (bullets)
Data Types
Side Effects
Business Context
─── Risk Section ───   ← buried at the bottom
Risk Level: Medium
Impact: High (LLM) / Critical (Override)
Reasoning: ...
Active signals: ...
```

There's a **visual hierarchy mismatch**. The portfolio card says "this is a medium-risk, high-impact automation" at the top. Then she clicks for details, and the risk/impact information vanishes from the scannable area — she has to scroll past 6 sections of LLM content to find it again.

**Proposed fix — two-level information architecture:**

Promote risk level and impact badges into the header row (matching the portfolio card), while keeping the detailed risk section lower for the deep-dive:

```
← Back to Automations
[Title]  [medium risk]  [high impact]  [n8n]  [Active]  [Edit]
[Doc outdated] [Overdue review]                 [Mark as reviewed]
Owner: ...  |  Trigger Type: ...
Updated: ...  |  Docs updated: ...
[Slack] [Salesforce] [Stripe]

Description: ...
Trigger: ...
Core Logic: (bullets)
Data Types: ...
Side Effects: ...
Business Context: ...

─── Risk & Governance ───
Risk Level: Medium (with color)
Impact: High (LLM proposal) → Critical (user override)
  Reasoning: "This automation processes customer payment data..."
Active signals:
  • Documentation outdated — workflow changed since last doc generation
  • Overdue review — last reviewed 45 days ago (cadence: 30 days)

─── Actions ───
[Open in n8n]  [Regenerate]
```

**What changes:**

1. **Risk + Impact badges move to title row** — same line as the name, matching the portfolio card pattern. These are the two most important indicators for quick scanning.
2. **Attention badges + "Mark as reviewed" on a second row** — governance alerts stay prominent without cluttering the title.
3. **Detailed risk section stays lower** — this is where you read the reasoning, see the LLM proposal vs override distinction, and understand which specific signals are driving the risk. Not everyone scrolls this far, but when they do, it's the full picture.
4. **Systems move up** — closer to the metadata, before the LLM content sections. Matches the portfolio card placement.

This creates continuity: the detail page header looks like an expanded version of the portfolio card. Same visual language, same scanning pattern, just with more space for details.

**One question:** Should "Mark as reviewed" stay as a standalone button in the header area (near attention badges), or should it move down to the Actions section alongside "Open in n8n" and "Regenerate"? The current spec says it's standalone for low-friction access, and placing it near the attention badges makes sense — you see "Overdue review" and immediately click to resolve it. But it could also feel odd having a button in the header area.

**Recommendation:** Keep "Mark as reviewed" in the header area near attention badges. The proximity to the governance signals it resolves is the whole point of making it standalone.

oke 

but should we really have the Risk + Impact badges in the title row. isnt that a bit too much? maybe one line below is enough? i dont really know ... what is your honest opinion or what are best practices?

### Response — Title row density

Honest take: you're right to question it. The portfolio card puts risk + impact on the title row because the card is **compact** — there's no second line to spare. But the detail page has an entire screen. Different constraints, different layout.

**Best practice:** In dashboard UIs (Datadog, PagerDuty, Jira issue view, Linear), the detail page pattern is almost always:

```
Line 1:  Title                                        [Actions]
Line 2:  [badge] [badge] [badge]    metadata
```

The title gets its own line — clean, scannable, uncluttered. Status indicators go on a dedicated second line where they have room to breathe and are still above the fold.

**Why this works better than cramming everything on the title row:**

1. **The title is longer on a detail page.** Portfolio cards truncate names. The detail page shows the full name (e.g., "Intelligent Lead Qualification and Routing System"). Adding 2-3 badges to that line creates wrapping on narrower screens.
2. **Badges need visual separation.** Risk (red/yellow/green), impact (purple/red/yellow/green), status (green/gray), platform (outline) — four different color schemes on one line is visual noise. A dedicated badge row lets them breathe.
3. **Scanning pattern.** Users read line 1 to confirm "am I on the right page?", then line 2 to get the governance summary. Two distinct cognitive steps, two distinct lines.

**Updated proposal:**

```
← Back to Automations
Line 1:  [Title]                                           [Edit]
Line 2:  [medium risk] [high impact] [n8n] [Active]
Line 3:  [Doc outdated] [Overdue review]        [Mark as reviewed]
Line 4:  Owner: Alice  |  Trigger: webhook  |  Updated: 3d ago  |  Docs: 5d ago
         [Slack] [Salesforce] [Stripe]

(LLM content sections...)
(Risk & Governance detail section...)
(Actions: Open in n8n, Regenerate)
```

- **Line 1**: Title only (+ Edit button right-aligned). Clean, dominant.
- **Line 2**: All classification badges — risk, impact, platform, status. The "what is this?" summary.
- **Line 3**: Governance attention badges + Mark as reviewed. The "what needs action?" summary.
- **Line 4**: Metadata + systems. The "who/when/what" context.

This is essentially what you suggested — risk and impact one line below the title. It follows the standard detail-page pattern, keeps the title clean, and still puts the key indicators above the fold.

**Recommendation:** Go with this. Title on its own line, badges on line 2. The portfolio card puts them together because it has to; the detail page separates them because it can.

generally good. but one improvement: i dont want two different element groups in one line such as having risk&impact in one line with platform and status. that is too much. do you understand? maybe platform and status is so immediate automation relevant that it can be in the row directly below the title for orientation sake?

### Response — One concept per line

Yes, totally understand. Mixing risk/impact (governance analysis) with platform/status (identity metadata) on the same line muddles the visual grouping. Each line should carry one clear purpose.

Your instinct about platform + status is right — they answer "what am I looking at?" and belong close to the title as orientation context. Like a subtitle.

**Revised layout:**

```
← Back to Automations
Line 1:  [Title]                                           [Edit]
Line 2:  [n8n]  [Active]                         (platform + status = identity)
Line 3:  [medium risk]  [high impact]             (governance classification)
Line 4:  [Doc outdated] [Overdue review]   [Mark as reviewed]  (action needed)
Line 5:  Owner: Alice  |  Trigger: webhook  |  Updated: 3d ago  |  Docs: 5d ago
         [Slack] [Salesforce] [Stripe]

(LLM content sections...)
(Risk & Governance detail section...)
(Actions: Open in n8n, Regenerate)
```

Each line has exactly one job:
1. **Identity** — what is this automation? (name)
2. **Context** — where does it live, what's its state? (platform, status)
3. **Governance** — how risky/impactful? (risk level, impact level)
4. **Alerts** — what needs attention? (signals + resolve action)
5. **Metadata** — who, when, what systems?

Clean grouping, no mixed concerns. Does this work?

feels right from the order but i am unsure whether we now have to much vertical cluttering. everything is below one another. the portfolio cards use a 2-column appraoch. could sth similar also apply here? have a look at my prototype detail page for inspiration on this matter: designs/{1E08A0FC-...}

### Response — Reducing vertical clutter with a 2-column approach

Looked at the prototype. Here's what it shows:

```
← Back to Automations
[CRM → Slack Escalation]                          [Edit]
[n8n] [Active]
[Documentation outdated]
Owner: Alex M.              Trigger Type: n8n CRM node trigger
Updated: Mar 2, 2026        Docs Updated: Jan 23, 2026
Systems: [Slack] [Salesforce]
Description: ...
Trigger: ...
Core Logic: (bullets)
Data Types: (bullets)
...
```

It's single-column with a 2-column metadata grid — clean but already tall. With our additions (risk badge, impact badge, mark-as-reviewed button), we'd stack even more rows into the header before reaching the actual content.

You're right to flag this. The portfolio card solves it with a 2-column internal layout (primary info left, metadata right). For a detail page, there's a well-established pattern that does the same thing at page scale: **content + sidebar**.

**Proposed: main content left + governance sidebar right**

```
┌─────────────────────────────────────────────┬──────────────────────────┐
│ ← Back to Automations                       │                          │
│                                              │                          │
│ [Title]                              [Edit]  │  Risk & Governance       │
│ [n8n]  [Active]                              │  ───────────────         │
│                                              │  Risk: [medium risk]     │
│ Description                                  │  Impact: [high impact]   │
│ Escalates high-priority Salesforce cases...  │    "Processes customer   │
│                                              │     payment data..."     │
│ Trigger                                      │                          │
│ Fires on Salesforce case creation...         │  Signals                 │
│                                              │  ───────────────         │
│ Core Logic                                   │  [Doc outdated]          │
│ • Monitors cases for high-priority status    │  [Overdue review]        │
│ • Looks up the assigned rep and manager      │                          │
│ • Sends an urgent Slack message              │  [Mark as reviewed]      │
│ • Updates the case with a note               │                          │
│                                              │  Metadata                │
│ Data Types                                   │  ───────────────         │
│ • Case Number, Priority Level, ...           │  Owner: Alice Chen       │
│                                              │  Trigger: webhook        │
│ Side Effects                                 │  Updated: 3d ago         │
│ • Writes escalation note to Salesforce case  │  Docs: 5d ago            │
│                                              │  Systems:                │
│ Business Context                             │  [Slack] [Salesforce]    │
│ Why this matters and what breaks if it fails │                          │
│                                              │  Actions                 │
│                                              │  ───────────────         │
│                                              │  [Open in n8n]           │
│                                              │  [Regenerate]            │
└─────────────────────────────────────────────┴──────────────────────────┘
```

**~65% main / ~35% sidebar.** On mobile, sidebar stacks below the title area (above the LLM content).

**Why this works:**

1. **Eliminates vertical clutter.** Instead of 5+ header rows before content starts, the page has just title + platform/status + straight into description. All governance info lives in the sidebar.
2. **Governance stays visible while scrolling.** As Emma reads through the LLM content, risk/impact/signals remain in peripheral vision. She doesn't have to scroll back up to check "wait, what was the risk level?"
3. **Natural grouping.** Left = "what does this automation do?" (LLM content). Right = "how governed is it?" (risk, signals, metadata, actions). Two distinct purposes, two distinct columns.
4. **Standard pattern.** GitHub issues, Jira tickets, Linear tasks, PagerDuty incidents — all use content-left, metadata-sidebar-right. Emma already knows this pattern.
5. **Edit mode maps cleanly.** The sidebar fields (owner, impact, review cadence, status override) become editable inputs in-place. No need for a separate edit mode layout.
6. **Matches the portfolio's 2-column DNA.** The portfolio card has primary-left / metadata-right. The detail page extends the same idea at full-page scale.

**Compared to the prototype:** The prototype's single-column layout with a 2-column metadata grid works for the fields it has. But with risk, impact, attention signals, mark-as-reviewed, and the full set of metadata, the single-column approach would push the actual LLM content (the stuff Emma came to read) below the fold. The sidebar keeps the header compact while giving governance info a permanent home.

**One consideration:** On narrower screens (< ~1024px), the sidebar should collapse to a horizontal summary above the content (similar to the mobile view of a GitHub issue). We don't need to spec the exact breakpoint, just note that the sidebar stacks responsively.

**Recommendation:** Go with the sidebar layout. It solves the vertical clutter, keeps governance visible during scrolling, and follows a pattern Emma already knows from every project management tool she uses.

oh this looks great. should such an approach not also be used for the cards on the portfolio page? what is the best practice for such cards?

### Response — Portfolio card layout: already doing it right

The portfolio cards already use a 2-column approach — and it's the right one for cards. Here's the current layout:

```
┌──────────────────────────────────────────────┬────────────────────┐
│ [Title]  [medium risk]  [high impact]        │ [Active]  [n8n]    │
│ [Slack] [Salesforce] [Stripe]                │ Alice Chen         │
│ Short description of what this does...       │ Updated: 3d ago    │
│ [Doc outdated] [Overdue review]              │ Docs: 5d ago       │
└──────────────────────────────────────────────┴────────────────────┘
```

Left = primary info (name, badges, systems, description, signals). Right = secondary metadata (status, platform, owner, timestamps). This is already the best-practice pattern for list cards.

**Why the detail page sidebar is different from the card's 2-column:**

| | Portfolio card | Detail page |
|---|---|---|
| **Purpose** | Scan & triage (which one do I click?) | Deep read (understand everything) |
| **Content volume** | 4-5 lines max | 6+ scrollable sections |
| **Scrolling** | None (card fits in view) | Lots (LLM content is long) |
| **Right column** | Compact metadata (4 lines) | Full governance panel (risk, impact, signals, metadata, actions) |
| **Interaction** | Click to navigate | Edit, mark reviewed, regenerate, open in n8n |

Cards are scannable summaries — they need to be compact. The 2-column internal layout maximizes information density in a fixed-height card. That's exactly what yours does.

The detail page sidebar solves a different problem: keeping governance info **visible while scrolling** through long content. Cards don't scroll, so they don't need this.

**Bottom line:** The portfolio cards are well-designed as-is. The 2-column card layout and the detail page sidebar are the same principle (primary left, metadata right) applied at different scales. They'll feel consistent to Emma without being identical.

No changes to the portfolio cards needed. Should we finalize the detail page layout and apply it to the spec?

## Refinement Applied

Layout restructured from single-column to content + sidebar (two-column) based on brainstorming discussion. Changes applied to spec:

1. **Layout section rewritten** — replaced single-column with main content left (~65%) + governance sidebar right (~35%). Responsive: sidebar stacks above content on narrow screens.
2. **Main content (left)**: back nav, title + Edit button, platform/status badges, then all LLM content sections (description, trigger, core logic, data types, side effects, business context).
3. **Governance sidebar (right)**: risk level, impact classification with reasoning, governance signals + Mark as reviewed button, metadata (owner, trigger type, timestamps, systems), actions (Open in n8n, Regenerate).
4. **Edit mode updated** — editable fields (owner, impact, review cadence, status override) are in the sidebar; Save/Cancel appear in the sidebar. Main content stays read-only.
5. **Standalone Actions section removed** — "Mark as reviewed" moved into the sidebar's Signals subsection (near the governance signals it resolves).
6. **ACs updated** — new AC for two-column layout with responsive stacking; existing ACs updated to reference sidebar and main content column.
7. **Domain term added** — "Governance sidebar" defined.
8. **Attention badges clarification preserved** — sidebar signals use same set as Portfolio card badges (excludes "Inactive").

---

## Related

- [Spec](07-automation-detail.md)
- [Results](07-automation-detail-results.md)
