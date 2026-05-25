# Connecting and Syncing Your n8n Instance

## Connecting your n8n instance

In Settings, connect Expliq to your n8n instance by entering its instance URL and an n8n API key. The key is stored encrypted. Expliq uses it to read your workflows and execution history over the n8n API.

## Verifying the connection (discovery)

When you verify the connection, Expliq runs a lightweight discovery pass: it detects which API features your key can access, lists the tags available in your instance, and previews your workflows by name and tag. This lets you see what is in your instance before a full sync — useful for shared instances that hold mixed-purpose workflows.

## Selecting tags to sync

You choose which tags to sync. Expliq pulls and analyzes only the workflows under the tags you select, so you can scope analysis to the workflows that matter and exclude unrelated ones.

## What Expliq reads from n8n

On a full sync Expliq reads the full definitions of the selected workflows and their execution history. It can optionally enrich the analysis with credentials, users, projects, and variables if your API key has permission. These enrichment endpoints are optional: if one returns a permission error, Expliq still works with what it can read. This is graceful degradation — missing scopes reduce enrichment but do not block analysis.

## Syncing and re-syncing

A sync pulls current data, runs the LLM analysis, and updates your Dashboard, Process Map, Opportunities, and Detail screens. Re-syncing later refreshes everything and produces the change banner that summarizes what changed since the previous sync.

## Deploying a recommendation back to n8n

When a recommendation is a deployable new workflow, Expliq can push it to your connected n8n instance and activate it — the one-click Deploy on the Opportunities screen. This is the path from recommendation to a running workflow without rebuilding it by hand.
