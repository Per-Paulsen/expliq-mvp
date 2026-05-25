#!/usr/bin/env bash
# Vercel "Ignored Build Step" (Settings → Build and Deployment → Ignored Build Step
# → "Run my Bash script" → Command: `bash scripts/vercel-ignore-build.sh`).
#
# Vercel semantics: exit 0 => SKIP the build, exit 1 => BUILD.
#
# We skip the production redeploy only when a commit changed SOLELY docs / non-app
# paths (*.md anywhere, specs/, research/, n8n/, .claude/). Any change outside those
# triggers a build. Fail-safe: if the diff can't be computed (shallow clone, no HEAD^,
# git error), we build rather than risk shipping a stale app.
if git diff --quiet HEAD^ HEAD -- . \
    ':(exclude,glob)**/*.md' ':(exclude)*.md' \
    ':(exclude)specs' ':(exclude)research' ':(exclude)n8n' ':(exclude).claude'; then
  echo "Ignored Build Step: only docs/non-app files changed — skipping build."
  exit 0
fi
echo "Ignored Build Step: app files changed (or diff unavailable) — building."
exit 1
