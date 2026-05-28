#!/usr/bin/env bash
# Vercel "Ignored Build Step" (Settings → Build and Deployment → Ignored Build Step
# → "Run my Bash script" → Command: `bash scripts/vercel-ignore-build.sh`).
#
# Vercel semantics: exit 0 => SKIP the build, exit 1 => BUILD.
#
# Rules (in order):
#   1. main branch (production) => ALWAYS build. Production deploys are rare and
#      load-bearing; an env-var-only cutover on main may have zero or only-docs
#      file diff, but the deploy is still required to apply the new env vars at
#      runtime. Never accidentally skip prod.
#   2. Force-build marker in the latest commit message ("[force-build]" or
#      "[deploy]") => ALWAYS build. Escape hatch for the rare preview that must
#      deploy despite touching only docs/non-app paths.
#   3. Otherwise: diff the working tree against the last successful deployment
#      (VERCEL_GIT_PREVIOUS_SHA), falling back to HEAD^ when that env var is not
#      set. Skip the build when ALL changes since that baseline are in pure
#      docs/non-app paths (*.md anywhere, specs/, research/, n8n/, .claude/).
#      Using PREVIOUS_SHA over HEAD^ matters when several docs commits are
#      pushed in a row — HEAD^ alone would miss app-relevant changes in earlier
#      undeployed commits.
#   4. Fail-safe: any git error (shallow clone too shallow, unknown SHA, etc.)
#      falls through to BUILD rather than risk shipping a stale app.

set -u

if [ "${VERCEL_GIT_COMMIT_REF:-}" = "main" ]; then
  echo "Ignored Build Step: main branch — always building."
  exit 1
fi

if git log -1 --pretty=%B | grep -qE '\[(force-build|deploy)\]'; then
  echo "Ignored Build Step: force-build marker in commit — building."
  exit 1
fi

BASE="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"
if git diff --quiet "$BASE" HEAD -- . \
    ':(exclude,glob)**/*.md' ':(exclude)*.md' \
    ':(exclude)specs' ':(exclude)research' ':(exclude)n8n' ':(exclude).claude'; then
  echo "Ignored Build Step: only docs/non-app files changed since $BASE on preview — skipping build."
  exit 0
fi

echo "Ignored Build Step: app files changed since $BASE (or diff unavailable) — building."
exit 1
