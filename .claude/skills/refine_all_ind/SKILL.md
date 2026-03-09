---
name: refine_all_ind
description: Batch within-epic refinement. Runs the same deep checks as /refine on every unrefined spec, applies fixes directly, and produces a single review file. Run this before /refine_all.
---

# Refine All Individual: Batch Within-Epic Spec Refinement

## Inputs

- **All specs** — discover by globbing `specs/[0-9][0-9]-*.md` (exclude `*-brainstorming.md`)
- **PRD** — read `expliq_prd.md`
- **Tech stack** — read `tech-stack-idea.md`

Do NOT read `specs/brainstorming.md` — its decisions are already incorporated into each spec.

### Skip logic

For each spec, derive the brainstorming file path (e.g., `specs/02-auth.md` → `specs/02-auth-brainstorming.md`). If the brainstorming file contains a `## Refinement Applied` section, **skip that spec** — it has already been individually refined.

## Phase 1 — Review & Apply

For each unrefined spec **in numeric order**, perform a thorough within-epic review. These are the same checks that `/refine` performs:

### Within-epic checks

| Check | Description |
|-------|-------------|
| **Ungrounded assumptions** | ACs or scope items that assume something not established in the spec or its dependencies |
| **Hidden scope creep** | Work implied by the spec that isn't explicitly called out (e.g., an AC that requires building an unmentioned component) |
| **Oversized slices** | Scope sections or ACs that bundle too much to implement and verify in a single pass |
| **Missing or untestable acceptance criteria** | ACs that are vague, subjective, or impossible to verify without manual inspection |
| **Inconsistent domain language** | Terms used differently across the spec's own sections, or differently from the PRD or tech stack |

### Applying changes

For each spec:

1. **Structural fixes** — apply directly to the spec file. These include: specifying ambiguous types, adding missing ACs, clarifying vague scope, fixing inconsistent terminology, removing untestable criteria.
2. **Design decisions** — do NOT apply. Instead, add as an open question on the spec tagged `NEEDS CONFIRMATION`. Also collect these in the review file for Phase 2.
3. **Retain structure** — keep the original section order: Scope, Acceptance criteria, Out of scope, Domain terms, Open questions.
4. **Resolve open questions** — if the review provides a clear answer to an existing open question (structural, not a design choice), resolve it.

### After processing each spec

Append a `## Refinement Applied` marker to the epic's brainstorming file:

```markdown
## Refinement Applied

Batch-refined via `/refine_all_ind`. See `specs/ind-epic-review.md` for details.
```

### Output

Write `specs/ind-epic-review.md` with all findings and changes:

```markdown
# Individual Epic Review — {date}

## Summary
- Specs reviewed: list
- Specs skipped (already refined): list
- Specs modified: list
- Specs clean: list

## {epic number} — {epic name}

### Findings
- **{issue description}** ({check type})
  - **Change**: what was modified in the spec
  - Or: `NEEDS CONFIRMATION` — added as open question

(repeat for each finding)

### Changes applied
- Bullet list of actual edits made to the spec

(repeat per epic)
```

### Post Phase 1

In chat, give a concise summary: how many specs reviewed, how many modified, most significant findings.

- If there are **no** `NEEDS CONFIRMATION` items → skip Phase 2, recommend `/refine_all` next
- If there **are** `NEEDS CONFIRMATION` items → tell the user that questions are ready in `specs/ind-epic-review.md` and proceed to Phase 2

## Phase 2 — Brainstorming

Only runs if Phase 1 produced `NEEDS CONFIRMATION` items.

Conduct all brainstorming exclusively in `specs/ind-epic-review.md`.

### Expected results

- A `## Brainstorming` section is appended to `specs/ind-epic-review.md` with grouped, focused questions covering all `NEEDS CONFIRMATION` items
- Questions are grouped by epic, with enough context for the user to decide
- The user's answers are captured in the same file
- Follow-up questions are appended based on answers until all items are resolved

### Rules

- The file is **append-only** — never overwrite or remove existing content
- All questions go into the file, never in chat
- Chat is only for telling the user that questions are ready or that a phase is complete
- Finish brainstorming completely before moving to Phase 3

## Phase 3 — Apply Confirmations

For each resolved `NEEDS CONFIRMATION` item:

1. Apply the confirmed decision to the spec file (update scope, ACs, or remove the open question as appropriate)
2. Remove the `NEEDS CONFIRMATION` tag from the spec's open questions
3. Append a `## Confirmations Applied` section to `specs/ind-epic-review.md` listing what was resolved and how

In chat, give a concise summary and recommend running `/refine_all` next for cross-epic consistency.

## Constraints

- **Do not implement anything.** No code, no configuration, no project setup. Output is only markdown files.
- **Do not invent requirements.** Everything must trace back to a spec, the PRD, the tech stack, or explicit user confirmation.
- **Do not re-review already-refined content.** If a brainstorming file has a `## Refinement Applied` section, skip that spec entirely.
- **Judgment calls require confirmation.** If a fix involves a design decision (not just a structural correction), flag it as `NEEDS CONFIRMATION` and add it as an open question on the spec — do not apply it.
- **No cross-epic analysis.** This skill reviews each spec in isolation. Cross-epic consistency is the job of `/refine_all`.
