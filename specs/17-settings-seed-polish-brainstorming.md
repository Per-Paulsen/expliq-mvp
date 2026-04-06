---

## tags:
  - type/brainstorming
  - status/active

# Epic 17 — Settings + Seed + Polish — Brainstorming

> Upstream: [Spec](17-settings-seed-polish.md)

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
- 07-automation-detail-results.md
- 08-workspace-snapshot-results.md
- 10-schema-sync-results.md
- 11-llm-pipeline-v2-results.md
- 12-design-system-results.md
- 13-dashboard-results.md
- 14-process-map-results.md
- 15-opportunities-results.md
- 16-detail-results.md

---

## Per's Challenge: Auth + Settings Pages Look Like a Different App

The login, signup, and settings pages were built during R1 (Epics 02-03) and never updated when the R2 design system was established in Epic 12. Every other page — Dashboard, Process Map, Opportunities, Detail — follows the design guidelines. These two areas don't. They need to look like they belong to the same product.

---

## 1. Audit: Exact Gaps Between Current Pages and R2 Design System

### Auth Pages (Login / Signup) — Current State

**Layout (`(auth)/layout.tsx`):**

- `bg-background` + centered white card (`max-w-md bg-white shadow-md rounded-xl p-8 space-y-6`)
- This is close to guidelines §7 but misses several details

**Specific gaps:**


| Element                   | Current                                                         | Design Guidelines §7 / R2 Pattern                                                         | Gap                                                                     |
| ------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Logo/branding**         | None                                                            | Every SaaS login has logo at top                                                          | Missing entirely                                                        |
| **Tagline**               | None                                                            | §7: "Subtitle: gray text below heading" / Epic 17 spec calls for tagline                  | Missing entirely                                                        |
| **Heading**               | `text-2xl font-bold text-foreground`                            | §7: "24px bold, #111827"                                                                  | Close — but `text-foreground` resolves correctly                        |
| **Labels**                | `text-sm font-medium` (default color)                           | §7: "14px medium, #374151"                                                                | Missing explicit `text-gray-700` or `text-[#374151]`                    |
| **Input styling**         | Default shadcn `<Input>` (`rounded-lg`, `h-8`)                  | §7: "White bg, gray border (#d1d5db), rounded-lg, 15px text"                              | Rounding matches. Height `h-8` (32px) is under 40-44px touch target. Text size not explicit |
| **CTA button**            | `bg-primary hover:bg-primary/90 text-primary-foreground w-full` | §7: "Teal bg, white text, rounded-lg, full width"                                         | Already `rounded-lg` via shadcn. Match. |
| **Links**                 | `text-primary underline`                                        | §7: "Teal text (#0d9488)"                                                                 | OK but underline is always-on, not hover-only                           |
| **Error state**           | `bg-red-50 text-red-700 rounded-md p-3 text-sm`                 | §7: "Red bg/text (bg-red-50 text-red-700)"                                                | Match, but could be more polished                                       |
| **Password visibility**   | None                                                            | Industry standard: eye icon toggle inside input                                           | Missing                                                                 |
| **Password requirements** | `minLength={8}` on signup only (HTML attr)                      | Visual requirements indicator on signup                                                   | Missing — no visual feedback                                            |
| **Autocomplete attrs**    | None                                                            | `autocomplete="email"`, `autocomplete="current-password"` / `autocomplete="new-password"` | Missing — hurts password manager UX                                     |
| **Focus states**          | shadcn default: `focus-visible:ring-3 focus-visible:ring-ring/50` | Same shadcn focus ring used across all R2 pages                                          | Match — no change needed                                                |
| **Form card border**      | `shadow-md` only                                                | R2 cards use `border border-border shadow-sm`                                             | Different elevation/separation pattern                                  |
| **Forgot password link**  | None                                                            | Standard placement: below password field, right-aligned                                   | Missing (acceptable for MVP but notable)                                |


### Settings Page — Current State

**Layout (`settings/page.tsx` + `settings-form.tsx`):**

- Server component renders `<SettingsForm>` directly — no page-level wrapper
- Form component is a flat `<div className="space-y-8">` with bare `<section>` elements

**Specific gaps:**


| Element                    | Current                                                       | Design Guidelines §8 / R2 Pattern                                                                     | Gap                                            |
| -------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Page title**             | `text-2xl font-bold` (no color class)                         | R2 pages: `text-2xl font-bold text-foreground`                                                        | Missing `text-foreground`                      |
| **Page subtitle**          | None                                                          | R2 pages: `text-sm text-text-secondary mt-1`                                                          | Missing — no context about what this page does |
| **Section containers**     | Bare `<section className="space-y-4">`                        | §8: "White card sections" / R2: `bg-surface rounded-xl border border-border shadow-sm p-5`            | **Major gap** — no card wrappers at all        |
| **Section headers**        | `text-lg font-semibold`                                       | R2 section headers: `text-sm font-semibold text-text-secondary uppercase tracking-wider`              | Completely different style                     |
| **Section descriptions**   | None                                                          | R2 pattern: description text below header explaining the section                                      | Missing                                        |
| **Labels**                 | `text-sm font-medium` (default color)                         | R2: `text-sm font-medium text-text-secondary`                                                         | Missing color class                            |
| **Buttons**                | Default shadcn `<Button>`                                     | R2 primary: `bg-primary text-white rounded-lg` / R2 outline: `border border-primary/30 text-primary`  | Using generic shadcn, not R2-styled            |
| **Success messages**       | `bg-green-500/10 text-green-700 rounded-md p-3`               | Should use `bg-status-healthy/10 text-status-healthy` tokens                                          | Using raw colors instead of design tokens      |
| **Error messages**         | `bg-destructive/10 text-destructive rounded-md p-3`           | Should use `bg-status-critical/10 text-status-critical` tokens                                        | Using shadcn tokens instead of R2 tokens       |
| **Sync result cards**      | `rounded-md border p-3 text-center` with `text-2xl font-bold` | Should match KpiCard pattern: `bg-surface rounded-xl border border-border shadow-sm` with `font-mono` | Completely different from R2 metric cards      |
| **Tag checkboxes**         | Bare checkboxes with `text-sm font-medium` labels             | Should be in a card container, styled consistently                                                    | No visual containment                          |
| **Progressive disclosure** | Sections show/hide via conditional rendering                  | Should show disabled/locked state for incomplete prerequisites                                        | Abrupt show/hide, no visual progression        |
| **Connection status**      | No status indicator                                           | Modern pattern: colored status badge next to section header                                           | Missing                                        |
| **Saved state**            | API key shows placeholder text change                         | Modern: masked display `••••••abcd`, "Change" button                                                  | No visual saved state                          |


---

## 2. Research: Best Practices for Modern Auth Pages

### Layout & Branding

- **Centered card on single-color background** is the right choice for us (we don't have enough brand visuals for split-screen)
- Logo at **top of the card**, centered — "Expliq" in the same style as the sidebar (`text-lg font-bold`)
- Tagline below logo: one line, muted color — e.g., "Automation Intelligence Platform"
- Card: white, `shadow-sm` (not `shadow-md` — match R2 card elevation), `rounded-xl`, `border border-border`

### Form UX

- **Stacked labels above inputs** (not floating) — we already do this, correct
- Input height: **40-44px** minimum for touch targets
- **Password visibility toggle** (eye icon) inside the input, right-aligned — table stakes for 2024+
- **Autocomplete attributes**: `autocomplete="email"` on email, `autocomplete="current-password"` on login, `autocomplete="new-password"` on signup — critical for password managers
- Tab order: email -> password -> submit (no intervening elements)

### Validation & Error Handling

- **Server errors** (wrong password, account exists): banner above the form — we do this, keep it
- **Inline field errors** for client-side validation (password mismatch, too short): below the field in red
- `aria-describedby` linking inputs to error messages
- Focus moves to first error field after failed submission

### Password

- **Show/hide toggle**: eye icon, `aria-label="Show password"` / `"Hide password"`
- **Min 8 characters** (NIST SP 800-63B) — we already enforce this
- **Strength indicator on signup only**: simple 3-segment bar (weak/fair/strong) below the field
- Password requirements: static list below field on signup, checkmarks activate as criteria met

### Loading States

- Button text changes to spinner + "Signing in..." — we do this, keep it
- Disable form fields during submission (not just the button)
- Prevent double-submit

### Auth Flow

- No "Remember me" checkbox — modern SaaS just remembers (we use JWT)
- "Forgot password?" as text link below password field, right-aligned — defer for MVP (no password reset flow)
- Login <-> signup toggle below submit button — we do this, keep it

---

## 3. Research: Best Practices for Modern Settings/Integration Pages

### Page Layout

- **Card-based sections** are the universal standard (Stripe, Vercel, Linear, GitHub)
- **Max-width container**: 640-768px centered — settings pages never go full-width
- Stacked cards with 24-32px gap between them

### Section Anatomy (each card)

1. **Section title** — semibold, consistent with R2 section headers
2. **Description** — muted text, 1-2 lines explaining the section purpose
3. **Content** — form fields or status display
4. **Footer/actions** — buttons aligned, within the card

### Connection/Integration UX

- **Connection status badge**: colored dot or badge next to section title — "Connected" (green) / "Not configured" (gray)
- **Masked credentials**: show `••••••••abcd` (last 4 chars) for saved API keys, "Change" button to edit
- **Verify/Test flow**: secondary button with inline result — green checkmark or red X + message
- **Connected state transformation**: once connected, show a summary view (URL + masked key + status badge) with "Edit" button, rather than always-editable fields

### Progressive Disclosure

- Sections 2 and 3 should be **visually present but disabled** (reduced opacity, no interaction) until prerequisites are met — not hidden entirely
- Subtle visual indication of sequence (1 -> 2 -> 3)
- When a section becomes available, it transitions smoothly

### Sync Progress

- **Stage list pattern**: vertical list of named stages, each with status icon (spinner -> checkmark -> X)
- Current stage shows animated indicator
- Replace trigger button with progress display during sync (don't open a modal)
- After completion: persistent summary ("Last synced 5 min ago - 47 workflows - 12 analyzed")

### Result Display

- **Success**: green banner with counts + timestamp
- **Stats grid**: match KpiCard pattern from R2 — `bg-surface rounded-xl border border-border shadow-sm` with `font-mono` values
- **Errors**: actionable detail with specific items that failed

### Empty vs Configured States

- **Not configured**: more instructional description text, prominent CTA
- **Configured**: summary view, status badge, edit button to re-enter edit mode

---

## 4. Concrete Proposals

### Proposal A: Auth Pages Overhaul

**Auth layout (`(auth)/layout.tsx`):**

```
Background: bg-background (keep — matches #f5f5f7)
Card: bg-surface rounded-xl border border-border shadow-sm p-8 w-full max-w-md
      (change from bg-white shadow-md — align with R2 card pattern)
```

**Logo + tagline block (above form, inside card):**

```
<div className="text-center">
  <h2 className="text-xl font-bold text-foreground">Expliq</h2>
  <p className="text-sm text-text-tertiary mt-1">Automation Intelligence Platform</p>
</div>
```

**Form heading:**

```
<h1 className="text-2xl font-bold text-foreground text-center">Sign in</h1>
<p className="text-sm text-text-secondary text-center mt-1">
  Enter your credentials to access your workspace
</p>
```

**Labels:**

```
<label className="text-sm font-medium text-[#374151]">Email</label>
```

**Inputs — add to all:**

- `autocomplete="email"` / `autocomplete="current-password"` / `autocomplete="new-password"`
- Consistent focus ring: ensure shadcn Input matches R2 focus pattern
- Password inputs: add eye icon toggle for show/hide

**CTA button:**

```
<Button className="w-full bg-primary text-white rounded-lg hover:bg-primary/90">
```

**Error banner:**

```
<div className="bg-status-critical/10 text-status-critical rounded-lg p-3 text-sm">
```

(Use design tokens, `rounded-lg` to match)

**Links:**

```
<Link className="text-primary hover:underline">Sign up</Link>
```

(Remove always-on underline, add hover-only)

**Signup-specific additions:**

- Password strength indicator: 3-segment bar below password field
- Password requirements list with live checkmarks: "At least 8 characters"

**Both pages:**

- Disable all form fields during submission (not just the button)
- `aria-describedby` on inputs with error messages
- Focus management: move focus to error banner on server error

### Proposal B: Settings Page Overhaul

**Page wrapper (`settings/page.tsx`):**

```
<div className="max-w-2xl mx-auto space-y-6">
  <div>
    <h1 className="text-2xl font-bold text-foreground">Settings</h1>
    <p className="text-sm text-text-secondary mt-1">
      Configure your n8n connection and manage sync settings
    </p>
  </div>
  <SettingsForm ... />
</div>
```

**Each section wrapped in a card:**

```
<div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
  <div className="p-5 space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          n8n Connection
        </h2>
        <p className="text-sm text-text-tertiary mt-1">
          Connect your n8n instance to import workflows
        </p>
      </div>
      <!-- Connection status badge -->
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full
                       bg-status-healthy/10 text-status-healthy">Connected</span>
      <!-- or: bg-surface-raised text-text-tertiary for "Not configured" -->
    </div>
    <!-- Fields... -->
  </div>
</div>
```

**Section 1 — n8n Connection:**

- Card wrapper with status badge (Connected / Not configured)
- When saved: show summary view (URL displayed, API key masked as `••••••abcd`, status badge)
- "Edit" button to re-enter edit mode
- When editing: URL + API key inputs, Save + Verify buttons in a footer row
- Success/error messages use R2 tokens: `bg-status-healthy/10 text-status-healthy` / `bg-status-critical/10 text-status-critical`

**Section 2 — Tag Selection:**

- Card wrapper, **always visible** but with `opacity-50 pointer-events-none` when Section 1 is not verified
- Section header: "Workflow Scope" (more descriptive than "Tag Selection")
- Description: "Choose which workflow groups to include in analysis"
- Tag checkboxes in a contained list within the card
- Selected count footer: styled with `font-mono` for the number

**Section 3 — Sync & Analyze:**

- Card wrapper, **always visible** but disabled until tags selected
- Section header: "Sync & Analyze"
- Description: "Import workflows and run AI analysis"
- Last sync info: "Last synced 5 minutes ago" (relative time, like sidebar)
- **Sync progress UI** (from spec): stage list with spinner/checkmark icons
  - Stages: "Fetching workflows..." -> "Fetching execution data..." -> "Analyzing workflows..." -> "Clustering processes..." -> "Generating recommendations..." -> "Complete"
  - Replace button with progress display during sync
- **Result display**: KpiCard-style stat boxes matching R2 pattern
  ```
  bg-surface rounded-xl border border-border shadow-sm p-4 text-center
  Value: text-2xl font-bold font-mono text-foreground
  Label: text-xs text-text-tertiary
  ```
- Enrichment status: pill badges instead of plain text spans

### Proposal C: Shared Form Primitives

To ensure consistency and avoid drift, extract shared form patterns:

1. **FormCard** — wrapper: `bg-surface rounded-xl border border-border shadow-sm`
2. **FormSectionHeader** — title + description + optional status badge
3. **PasswordInput** — Input with eye icon toggle, autocomplete attrs
4. **StatusBadge** — reusable "Connected" / "Not configured" / "Analyzing" badge
5. **AlertMessage** — success/error/warning using R2 design tokens

This prevents the auth and settings pages from drifting again if new form-based pages are added.

---

## 5. Implementation Checklist (additions to Epic 17 spec)

### Auth Pages

- Add Expliq logo + tagline to auth card
- Update auth layout card to use R2 card pattern (`border border-border shadow-sm`)
- Update labels to `text-[#374151]` per guidelines §7
- Add password show/hide toggle (eye icon) to all password inputs
- Add `autocomplete` attributes to all inputs
- Add password strength indicator on signup page
- Add password requirements list with live checkmarks on signup
- Use R2 design tokens for error states (`bg-status-critical/10 text-status-critical`)
- Change links from always-underlined to hover-underline
- Disable form fields during submission
- Add aria-describedby for error messages

### Settings Page

- Add page subtitle in `settings/page.tsx`
- Add `max-w-2xl mx-auto` container
- Wrap all 3 sections in R2 card containers
- Update section headers to R2 pattern (uppercase, tracking-wider, text-text-secondary)
- Add section descriptions
- Add connection status badge to Section 1
- Implement saved/summary state for credentials (masked API key + Edit button)
- Change Section 2 + 3 from hidden to visible-but-disabled (progressive disclosure)
- Use R2 design tokens for all success/error messages
- Style sync result stats as KpiCard-style boxes with `font-mono`
- Style enrichment status as pill badges
- Implement sync progress stage list (spinner/checkmark per stage)
- Show relative "last synced" time (match sidebar pattern)

### Shared

- Create PasswordInput component (Input + eye toggle)
- Create FormCard wrapper component or establish shared classes
- Create StatusBadge component (Connected / Not configured / Analyzing)
- Create AlertMessage component using R2 tokens

---

## Decisions (all accepted)

1. **Auth card style**: `shadow-sm` + `border border-border` to match R2 cards. (Guidelines §7 said `shadow-md` but R2 consistency wins.)

2. **Logo treatment**: `text-xl font-bold text-foreground` on auth pages — slightly larger than sidebar (`text-lg`) since it's the hero element.

3. **Tagline text**: "Automation Intelligence Platform" — matches PRD positioning.

4. **Settings max-width**: `max-w-2xl mx-auto` (640px) — forms don't need full width, matches Stripe/Vercel pattern.

5. **Connected state transformation**: Yes — Section 1 collapses to summary view (URL + masked key + status badge) when saved + verified. "Edit" button to re-enter edit mode. Signals "this step is done."

6. **Shared components**: Yes — create PasswordInput, FormCard, StatusBadge, AlertMessage as reusable components. Prevents drift, used across both auth and settings pages.

7. **Password strength indicator**: Requirements list with live checkmarks (not bar). More informative, aligns with "transparent reasoning" principle from PRD §1.

8. **Forgot password link**: Don't add — no password reset flow exists. Would be a dead link.

## Audit Corrections (verified against codebase)

- shadcn `<Input>` already uses `rounded-lg` (not `rounded-md` as initially audited)
- shadcn `<Button>` already uses `rounded-lg` (not `rounded-md`)
- Focus ring pattern is consistent: `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` across all shadcn components — no change needed
- Input height is `h-8` (32px) — below the 40-44px touch target recommendation. Consider using `h-10` on auth pages for larger touch targets.
- All R2 design tokens (`text-text-secondary`, `bg-surface`, `text-status-healthy`, etc.) are confirmed available via Tailwind v4 @theme inline in `globals.css`
- `KpiCard` component exists at `src/components/kpi-card.tsx` — reuse its card pattern for sync result stats
- `StatusDot` component exists at `src/components/status-dot.tsx` — can reference for status styling patterns
- `CompanyProfile.analysisStatus` enum has 5 values: `pending`, `analyzing_workflows`, `analyzing_workspace`, `complete`, `failed`

---

## Refinement Responses (Phase 1)

### Response to Per's Challenge

Fully agreed. The audit tables above document every gap precisely. The R1 auth pages (Epic 02) and settings page (Epic 03) were never touched when the R2 design system shipped in Epic 12. The light-theme patch only changed color tokens — it didn't address structure, branding, or UX patterns. Both pages need a full overhaul to match the R2 standard.

### Response to Proposals A, B, C

All three proposals are sound and verified against the codebase. Specific confirmations and adjustments from investigation:

**Proposal A (Auth):** All gaps confirmed. No logo, no tagline, no password visibility toggle, no autocomplete attrs, error messages use raw colors instead of design tokens. The `bg-white shadow-md` card needs to become `bg-surface border border-border shadow-sm rounded-xl` per R2 pattern. Labels need explicit `text-[#374151]` per guidelines §7.

**Proposal B (Settings):** All gaps confirmed. `settings-form.tsx` is a flat `<div className="space-y-8">` with bare `<section>` elements — no card wrappers, no R2 section headers, no status badges, no progressive disclosure. Page wrapper in `settings/page.tsx` renders `<SettingsForm>` directly without page title or `max-w-2xl` container.

**Proposal C (Shared Components):** Confirmed that FormCard, PasswordInput, StatusBadge, AlertMessage do not exist. KpiCard and existing badge components (TierBadge, ConfidenceBadge, ImpactBadge, StatusDot) provide the pattern to follow. Lucide icons `Eye`/`EyeOff` are not yet imported but available. `Check` and `Loader2` are already used elsewhere.

### Response to Decisions

All 8 decisions are confirmed viable against the codebase. No conflicts found.

---

## Proactive Findings

### A. Hidden Scope Creep — Spec Must Be Expanded

The current spec's "Login page polish" section (3 bullet points) and "Settings page — sync progress UI" section significantly **understate** the work agreed in the brainstorming. The spec needs to be expanded to include:

**Auth pages (not in current spec):**
- Password show/hide toggle (PasswordInput component)
- Autocomplete attributes on all inputs
- Password strength requirements list with live checkmarks on signup
- Auth layout card restyled to R2 pattern (border, shadow-sm)
- Labels restyled to `text-[#374151]`
- Error messages restyled to R2 design tokens
- Links changed to hover-underline
- Form fields disabled during submission
- Accessibility: `aria-describedby` for errors

**Settings page (not in current spec):**
- Page wrapper with `max-w-2xl mx-auto` and subtitle
- All 3 sections wrapped in R2 card containers
- Section headers restyled to R2 pattern (uppercase, tracking-wider)
- Section descriptions added
- Connection status badge on Section 1
- Connected state transformation (summary view with masked API key + Edit button)
- Progressive disclosure: Sections 2+3 visible-but-disabled instead of hidden
- Success/error messages restyled to R2 design tokens
- Sync result stats restyled to KpiCard pattern with `font-mono`
- Enrichment status as pill badges

**Shared components (not in current spec):**
- PasswordInput component
- FormCard wrapper (or shared class pattern)
- StatusBadge component
- AlertMessage component

**New server action (not in current spec):**
- `getAnalysisStatus()` — reads `CompanyProfile.analysisStatus` for client-side polling. The pipeline updates this field progressively, but **no API route or server action currently exists** to read it from the client. This is a prerequisite for sync progress UI (ACs 1-5).

### B. Scope Item Already Done — Remove

Spec says: "Sidebar 'Synced X ago' shows actual relative time." Investigation confirms this is **already implemented** — `formatTimeAgo()` in `app-sidebar.tsx` (lines 20-29) shows "just now", "Xm ago", "Xh ago", "Xd ago". This item should be removed from the spec's "Remaining UX gaps" section.

### C. Normalization Bug — Should Be Fixed In This Epic

The `dashboard-data.ts` normalization gap (lines 552/565) is confirmed as a real bug. `TierBadge` will crash with a TypeError if DB contains `"act now"` (with space) instead of `"act-now"`. The fix is trivial — replace `r.tier as "act-now" | ...` with `normalizeTier(r.tier)` (function already exported from `opportunities-data.ts`). Same pattern needed for ConfidenceBadge where confidence values pass through without normalization in `detail-data.ts`. This should be an explicit AC, not just a "Remaining UX gaps" bullet.

### D. Oversized Slice — Settings Form Rewrite

The settings form work bundles **three distinct concerns** that could be implemented and verified separately:
1. **Visual restyling** — card wrappers, section headers, descriptions, design tokens, progressive disclosure
2. **Connected state transformation** — summary view for saved credentials, edit toggle, status badge
3. **Sync progress UI** — stage list with polling, spinner/checkmark transitions, result display

Recommendation: keep as one slice since the visual restyling is foundational (the progress UI needs to live inside the cards). But the implementation should follow this order: visual shell first, connected state second, progress UI last.

### E. Missing Acceptance Criteria

The following brainstorming items have no corresponding ACs in the spec:

| Item | Proposed AC |
|------|------------|
| Auth layout uses R2 card pattern | Auth card uses `bg-surface border border-border shadow-sm rounded-xl` |
| Expliq logo + tagline on auth pages | Logo rendered as `text-xl font-bold text-foreground`, tagline as `text-sm text-text-tertiary` |
| Password show/hide toggle | All password inputs have eye icon toggle with `aria-label` |
| Autocomplete attributes | Email inputs: `autocomplete="email"`, password: `autocomplete="current-password"` (login) / `autocomplete="new-password"` (signup) |
| Password requirements on signup | Signup shows requirements list with live checkmarks ("At least 8 characters") |
| Auth error messages use R2 tokens | Error banners use `bg-status-critical/10 text-status-critical` |
| Settings page wrapper | Settings page has `max-w-2xl mx-auto` container with page title + subtitle |
| Settings card sections | All 3 settings sections wrapped in `bg-surface rounded-xl border border-border shadow-sm` cards |
| Settings section headers | Section headers use `text-sm font-semibold text-text-secondary uppercase tracking-wider` |
| Connection status badge | Section 1 shows "Connected" (green) or "Not configured" (gray) badge |
| Connected state summary view | When saved + verified, Section 1 collapses to URL + masked key + status badge + Edit button |
| Progressive disclosure | Sections 2+3 visible but disabled (`opacity-50 pointer-events-none`) until prerequisites met |
| Analysis status polling | New `getAnalysisStatus()` server action returns current `CompanyProfile.analysisStatus` |
| Normalization fix | `dashboard-data.ts` uses `normalizeTier()` for all Recommendation.tier values |
| Shared PasswordInput component | `src/components/password-input.tsx` wraps Input with show/hide toggle |
| Shared AlertMessage component | `src/components/alert-message.tsx` renders success/error/warning with R2 tokens |

### F. Skipped Test Count Unverified

Spec says "9 files, 183 skipped tests." The 9 files are confirmed. The 183 count comes from the Epic 12 results file (`npm run test` output: "183 skipped"). This is the Vitest count of individual test cases inside `describe.skip` blocks, not the number of skip annotations. The count is accurate — it's what Vitest reports.

### G. Inconsistent Terminology

- Spec uses "Login page polish" but the brainstorming covers login, signup, AND auth layout. Recommend renaming to "Auth pages overhaul" in the spec.
- Spec has no explicit section for settings visual restyling — it's buried under "sync progress UI" and "Remaining UX gaps." Recommend adding "Settings page visual alignment" as a distinct scope section.

### H. syncAndAnalyze Return Behavior

Important implementation detail: `syncAndAnalyze()` in `connector.ts` calls `await runAnalysisPipeline(workspaceId)` which means the server action **blocks until analysis completes** (it awaits the full pipeline). This contradicts the spec's claim that "the sync action returns only when the sync portion completes and analysis begins." The actual behavior is: `syncAndAnalyze` returns only after the **entire** pipeline (sync + analysis) finishes.

This means the spec's two-phase tracking model (sync phase optimistic, analysis phase via polling) is partially wrong. In practice:
- During the `syncAndAnalyze` call: the client is blocked (button shows "Syncing..."). The pipeline updates `analysisStatus` in the DB, but the client can't poll because it's waiting for the server action to return.
- After `syncAndAnalyze` returns: analysis is already complete.

**To make progress visible**, one of these approaches is needed:
1. **Parallel polling**: Start `syncAndAnalyze` as a fire-and-forget (don't await), then poll `analysisStatus` from the client. Requires restructuring the server action.
2. **Split the action**: Separate `sync()` (returns quickly with sync summary) from `analyze()` (triggered separately, client polls status). Requires refactoring `connector.ts`.
3. **Optimistic stages during await**: Show timed stage transitions while the `syncAndAnalyze` promise is pending, then show final result when it resolves. Simpler but not real progress.

Recommendation: Option 1 (parallel polling) is the cleanest. Have `syncAndAnalyze` kick off the pipeline without awaiting it, return the sync summary immediately, then client polls `getAnalysisStatus()` until complete/failed. This requires:
- Removing `await` from `runAnalysisPipeline()` call in `syncAndAnalyze`
- Adding a `getAnalysisStatus()` server action
- Client-side `useEffect` polling loop (every 2-3s)

This is a **material change** to the existing `syncAndAnalyze` behavior and should be called out explicitly in the spec.

---

## Refinement Applied

Per confirmed satisfaction with all discussion responses. Spec updated with the following changes:

### Structural Changes
- **Renamed** "Login page polish" → "Auth pages overhaul" (covers login + signup + auth layout)
- **Added** "Settings page — visual alignment" as a distinct scope section (was previously unspecified)
- **Added** "Shared form components" scope section (PasswordInput, AlertMessage)
- **Added** "Bug fixes" scope section (tier + confidence normalization)
- **Removed** "Sidebar Synced X ago" from Remaining UX gaps (already implemented)
- **Removed** Tests section (ACs 30-32) — verification handled by `/dev` skill
- **Simplified** sync progress stages from 6 to 5 (combined "Fetching workflows" + "Fetching execution data" into single "Syncing workflows..." since they're not individually trackable)

### New Acceptance Criteria (22 added, 3 removed, net +19)
- **Auth Pages** ACs 1-12: layout card, logo, tagline, labels, password toggle, autocomplete, requirements list, error tokens, link styling, field disable, aria
- **Settings — Visual Alignment** ACs 13-22: container, cards, headers, descriptions, status badge, connected state, progressive disclosure, tokens, KpiCard stats, pill badges
- **Settings — Sync Progress** ACs 23-30: stages, transitions, fire-and-forget, getAnalysisStatus, polling, complete/failed states
- **Shared Components** ACs 35-36: PasswordInput, AlertMessage
- **Bug Fixes** ACs 37-38: normalizeTier, normalizeConfidence
- **Removed** old ACs 30-32 (test ACs — verification in `/dev`)

### Key Technical Decision
- **syncAndAnalyze restructured**: Fire-and-forget analysis pipeline (remove `await` from `runAnalysisPipeline()`). Returns sync summary immediately. Client polls `getAnalysisStatus()` for analysis progress. (Finding H, Option 1)

### Scope Simplification
- FormCard and StatusBadge moved to "Out of Scope" — use inline classes instead. Only PasswordInput and AlertMessage warrant component extraction (they have logic, not just styling).

### Open Questions Resolved
- Both original open questions marked as decided (polling for MVP, different fictional company for seed data)

