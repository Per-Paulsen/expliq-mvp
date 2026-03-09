---
name: dev
description: Implement an epic spec using a self-organizing team. Handles code, tests, verification, and commit.
argument-hint: <spec-file-path>
---

# Dev: Spec to Implementation

## Inputs

- **Spec** — read the file at `$ARGUMENTS`
- **Tech stack** — read `tech-stack-idea.md`
- **PRD** — read `expliq_prd.md`
- **All epic specs** — read all `specs/[0-9]*.md` files (excluding brainstorming files). Understand the full epic sequence so implementation decisions account for what future epics will need.
- **Prior epic results** — read all `specs/*-results.md` files. These contain decisions, deviations from spec, established patterns, and risks flagged by completed epics. Understand these before breaking down work — they document conventions and gotchas that the current spec may not account for.
- **Existing codebase** — explore to understand current patterns and conventions

## Team Lead Role

You are the team lead. You **coordinate and delegate only** — you must not write any code, tests, or configuration yourself.

Your job:
- Read and understand the spec, tech stack, and existing codebase
- Break the work into tasks and delegate to team members using TeamCreate
- Monitor progress, unblock issues, and ensure quality
- Verify all done criteria are met before committing

## Expected Results

### Implementation
- All scope items from the spec are implemented and functional
- Code follows existing codebase patterns and conventions
- No placeholder or stub code

### Tests
- Unit tests written for all significant logic (Vitest)
- All tests pass
- Edge cases from the spec's acceptance criteria are covered

### Verification
- `npm run build` succeeds with no errors
- `npm run dev` starts without errors
- Browser verification confirms UI matches spec requirements (use Playwright)
- Every acceptance criterion from the spec is verified and passing

### Clean Code
- Server-side auth checks where required
- Input validation at system boundaries
- Consistent error handling
- Separation of concerns (data fetching, business logic, presentation)
- No hardcoded secrets, unused imports, dead code, or leftover console.logs

### Bug Fixing
- If tests fail → fix until they pass
- If browser verification fails → fix until it succeeds
- If code review surfaces issues → fix them
- Iterate until all checks are green

### Commit
- When everything passes: stage all changes, commit with a descriptive message
- Message format: `feat: implement epic {number} — {name}`

### Retrospective & Results

After committing, conduct a structured retrospective before writing the results file.

**Step 1 — Self-review.** Evaluate the implementation against these categories:
- **Version/dependency surprises** — what was expected vs what was actually installed or used
- **Deviations from spec** — anything implemented differently than specified, and why
- **Risks for future epics** — compatibility concerns, spec freshness issues, or assumptions in upcoming specs that may no longer hold given what was built
- **Patterns established** — conventions or approaches introduced that future epics should follow
- **Open questions** — unresolved items, known limitations, or things that need revisiting

**Step 2 — Write draft results file** at `specs/{epic-number}-{epic-name}-results.md` containing:
- What was built
- Key files created/modified
- Decisions and deviations from spec
- Verification results
- Risks for future epics
- Open questions

**Step 3 — User review.** Tell the user the results file is ready for review. The user may add observations, corrections, or additional risks. Wait for the user to confirm before marking the epic as done. The results file is **append-only** during this phase — do not remove user additions.

## Done Criteria

The epic is done when **all** of the following are true:

- [ ] Every acceptance criterion from the spec is implemented and verified
- [ ] All unit tests pass
- [ ] Build succeeds
- [ ] Browser verification passes
- [ ] No outstanding code quality issues
- [ ] Changes are committed
- [ ] Results file written and reviewed by user

## Constraints

- **Do not modify specs.** If the spec is unclear, ask — do not interpret ambiguously.
- **Do not go beyond the spec.** Only build what the spec defines. No bonus features.
- **Do not skip verification.** Every change must be self-verified before it is considered done.
