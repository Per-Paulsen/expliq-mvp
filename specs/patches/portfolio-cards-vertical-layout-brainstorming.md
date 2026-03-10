# Patch: Vertical card layout on Portfolio screen (Epic 06) — Brainstorming

## Initial Analysis

### Current behavior

The portfolio grid in `src/components/portfolio-view.tsx` (line 143) uses a responsive multi-column grid:

```html
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
```

- **Mobile** (<768px): 1 column — cards already stack vertically
- **Tablet** (>=768px): 2 columns side-by-side
- **Desktop** (>=1024px): 3 columns side-by-side

When sorting is active (e.g., "Automation Last Updated, descending"), the visual reading order across multiple columns is confusing — do you read left-to-right across each row, or top-to-bottom down each column? This makes sorted lists hard to scan.

### Affected files

| File | What changes |
|------|-------------|
| `src/components/portfolio-view.tsx` (line 143) | Grid class: remove `md:grid-cols-2 lg:grid-cols-3` |

### Existing tests

- `src/__tests__/portfolio-view.test.tsx` — 7 tests (basic rendering, empty states, card count, sync status). These test card presence, not layout classes, so they should be unaffected.
- `src/__tests__/portfolio-automation-card.test.tsx` — 13 tests. Card internals only, no grid concern.

---

## Questions

### 1. Layout approach

The simplest fix is removing `md:grid-cols-2 lg:grid-cols-3` so the grid is always single-column. Cards would then take the full container width.

Should we also constrain the max width of cards so they don't stretch too wide on large screens? On a 1440px+ display, a full-width card could look oddly wide. Options:
- **(a)** No max-width — cards stretch to fill the container (simplest)
- **(b)** Add `max-w-3xl` (~48rem / 768px) to each card or the grid container
- **(c)** Add `max-w-4xl` (~56rem / 896px) to the grid container

**Recommendation:** Option (a) for now — the sidebar already constrains the content area, and the cards contain enough information to fill the width. We can revisit if it looks bad during E2E verification.

oke

### 2. Card density

With a single column, 17 cards will require significant scrolling. Is that acceptable, or should we also make the cards more compact (e.g., horizontal layout with info side-by-side instead of stacked)?

**Recommendation:** Keep the current card structure as-is. The user's request is specifically about layout direction, not card density. Sorting clarity is the priority. We can always optimize card density in a separate patch.

maybe like this: 1. group info, each group stacked and 2. within each group side by side. what do you think? 

### 3. Scope boundary

This patch only changes the grid class on line 143 of `portfolio-view.tsx`. No changes to card component, filters, sorting logic, tests, or any other file.

**Recommendation:** One-line change. No test updates needed since existing tests don't assert on grid classes.

---

*Waiting for user to confirm or adjust before implementing.*

---

## Claude Response — Card Layout Proposal

Good idea — with full-width cards, we have the horizontal space to make them more compact. Here's what I'm thinking based on "groups stacked, items within groups side-by-side":

### Proposed card structure

```
┌──────────────────────────────────────────────────────────────────┐
│ Row 1: Identity                                                  │
│ [Title]                          [Risk badge] [Status] [Platform]│
│                                                                  │
│ Row 2: Description                                               │
│ Description text (1-2 lines)                                     │
│                                                                  │
│ Row 3: Metadata (side by side)                                   │
│ Owner: John Doe  ·  Impact: High  ·  Updated: 5d ago  ·  Docs: 2d ago │
│                                                                  │
│ Row 4: Tags (side by side)                                       │
│ [Salesforce] [HubSpot] [Slack]   [Documentation outdated] [Overdue review] │
│  ^ systems                        ^ attention signals            │
└──────────────────────────────────────────────────────────────────┘
```

**Changes from current card:**
- **Row 1** — same as current (already side-by-side)
- **Row 2** — same as current (description)
- **Row 3** — collapse owner, impact, and both timestamps into one horizontal line with dot separators. Currently these are split across 2 separate rows.
- **Row 4** — merge systems and attention signals into one row. Systems on the left, attention signals on the right (or just flowing together with visual distinction via badge color).

This turns ~6 vertical sections into ~4, saving significant vertical space per card while keeping all info visible.

### Questions

**A.** Does this grouping match what you had in mind? Or did you mean something different by "group info"?

**B.** For Row 3 (metadata line) — should we keep the impact badge colored or just use plain text like the rest? Current: `{impactLevel} impact` as plain text. I'd keep it plain for consistency in that row.

**C.** For Row 4 — systems and attention signals currently have different badge styles (secondary vs destructive). Merging them into one row still works visually because the colors distinguish them. Good?

**Recommendation:** This is still a focused change — we're reorganizing content within the card component, not changing data or logic. Affected file: `portfolio-automation-card.tsx` only (plus the grid class in `portfolio-view.tsx`). Existing card tests check for content presence, not layout structure, so they should still pass.

i am not yet fully satisfied with the layout. the most important info such as title, short description, risk, impact and systems should be close to the top left corner of the card. do you understand? please look at this picture from my prototype for more inspiration designs/{3ED11295-...}

---

## Claude Response — Revised Layout (based on prototype)

I see the prototype. The key design pattern is a **two-column card**: primary info on the left, secondary metadata on the right.

### Revised card structure

```
┌────────────────────────────────────────────────────────────────────────────┐
│ LEFT (flex-grow)                              │ RIGHT (shrink-0, right-aligned) │
│                                               │                                 │
│ Title  [Risk] [Impact] [Status]               │                      [Platform] │
│ [Slack] [Salesforce] [HubSpot]                │                     Owner name  │
│ Description text (1-2 lines)                  │        Automation Updated 5d ago │
│ [Documentation outdated] [Overdue review]     │              Docs Updated 2d ago │
└────────────────────────────────────────────────────────────────────────────┘
```

### What changes vs current card

| Aspect | Current | Proposed |
|--------|---------|----------|
| **Overall layout** | Single column, info stacked | Two columns: left (primary) + right (metadata) |
| **Title row** | Title left, badges right | Title + Risk + Impact + Status badges all on the left |
| **Systems** | Below owner/impact, small text | Directly under title — prominent position |
| **Description** | Below title | Below systems |
| **Owner** | Below description, left-aligned | Right column, right-aligned |
| **Platform badge** | In header badges, right side | Right column, top-right |
| **Timestamps** | Bottom row, left-aligned | Right column, bottom, right-aligned |
| **Attention signals** | Own row near bottom | Bottom of left column (same as prototype) |

### Key design choices

1. **Risk + Impact badges stay** (prototype doesn't show them, but user explicitly wants them near top-left). They sit inline with the title as small badges.
2. **Systems move up** to directly below the title — they're key identifying info.
3. **Right column** is narrow, right-aligned, contains secondary metadata: platform, owner, timestamps.
4. **Attention signals** stay at the bottom-left as destructive badges.

### Scope update

This now touches:
- `src/components/portfolio-view.tsx` — grid class (single column)
- `src/components/portfolio-automation-card.tsx` — restructured card layout

Existing tests check content presence (text, badge text, link href), not layout structure. They should still pass.

Does this match your vision? Confirm and I'll implement.

---

## Implementation Applied (2026-03-10)

**Commit:** `98dd767` — `fix: portfolio cards vertical layout with two-column card design`

**Files modified:**
- `src/components/portfolio-view.tsx` — Removed `md:grid-cols-2 lg:grid-cols-3` from grid container (line 143), cards now single-column
- `src/components/portfolio-automation-card.tsx` — Full restructure: added `IMPACT_COLORS` map, removed `CardHeader`/`CardTitle`, replaced JSX with two-column flex layout (left: title+risk+impact, systems, description, attention signals; right: status+platform, owner, timestamps)

**Verification:**
| Check | Result |
|-------|--------|
| `npm run test` | Pass (178 tests) |
| `npm run lint` | Pass |
| `npm run build` | Pass |
| E2E verification | Playwright — cards stack vertically, two-column layout works, sort order clear, card clicks navigate correctly |