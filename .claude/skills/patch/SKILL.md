---
name: patch
description: Apply a small, focused patch to existing epic code. Handles implementation, tests, verification, and commit. Appends results to the relevant epic's results file.
argument-hint: '<description>' --epic <N>
---

# Patch: Focused Code Change

## Inputs

- **Arguments** — parse `$ARGUMENTS` for:
  - A brief description of the change (quoted string)
  - `--epic <N>` — which epic's code is being patched (e.g., `--epic 04`)
- **Patch detail file** (optional) — if a file path is provided instead of a quoted description, read it for the full patch specification
- **Tech stack** — read `tech-stack-idea.md`
- **Prior epic results** — read all `specs/*-results.md` files. These contain decisions, established patterns, and risks.
- **Existing codebase** — explore to understand current patterns and the code being patched

## Team Lead Role

You are the team lead. You **coordinate and delegate only** — you must not write any code, tests, or configuration yourself.

Your job:
- Read and understand the patch description and the code being changed
- Break the work into tasks and delegate to team members using TeamCreate
- Monitor progress, unblock issues, and ensure quality
- Verify all checks pass before committing

## Expected Results

### Implementation
- The described change is implemented and functional
- Code follows existing codebase patterns and conventions
- No placeholder or stub code
- Change is minimal and focused — do not refactor surrounding code

### Tests
- If the patch changes logic with existing tests, ensure tests still pass
- If the patch adds new behavior, add tests for it
- Do not add tests for unchanged code

### Verification

#### Automated checks
- `npm run test` — all tests pass
- `npm run lint` — no lint errors
- `npm run build` — no type errors

### Bug Fixing
- If tests fail → fix until they pass
- If verification surfaces issues → fix them
- Iterate until all checks are green

### Commit
- When everything passes: stage all changes, commit with a descriptive message
- Message format: `fix: <description>` or `perf: <description>` (use the appropriate conventional commit prefix)
- Do NOT use `feat: implement epic` format — that's for full epic implementations

### Results

After committing, **append** a patch section to the relevant epic's results file at `specs/{epic}-results.md`.

**The results file is append-only.** Never overwrite or remove existing content. Append at the end of the file.

**Format:**

```markdown
---

## Patch: <description> (<today's date YYYY-MM-DD>)

**What changed:** <brief summary of the change>

**Files modified:**
- `path/to/file.ts` — <what changed in this file>

**Why:** <motivation — why this patch was needed>

**Verification:**
| Check | Result |
|-------|--------|
| `npm run test` | Pass/Fail (N tests) |
| `npm run lint` | Pass/Fail |
| `npm run build` | Pass/Fail |

**Commit:** `<hash>` — `<message>`
```

After writing the results section, tell the user it's ready for review.

## Done Criteria

The patch is done when **all** of the following are true:

- [ ] The described change is implemented
- [ ] All tests pass
- [ ] Build succeeds
- [ ] No outstanding code quality issues
- [ ] Changes are committed
- [ ] Results appended to the relevant epic's results file

## Constraints

- **Stay focused.** Only change what the patch describes. No bonus features, no refactoring beyond scope.
- **Do not modify specs.** Patches change code, not specifications.
- **Do not skip verification.** Every change must be self-verified before it is considered done.
