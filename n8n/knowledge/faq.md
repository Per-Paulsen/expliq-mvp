# Frequently Asked Questions

## Why is an automation flagged critical?

A workflow turns critical when it is active and failing on more than 20% of its runs, or when it has critical business impact and silent detectability (it could fail without anyone noticing). Either condition means it needs attention now.

## What does "detectability: silent" mean?

It means a failure in that workflow would go unnoticed — there is no error workflow, monitoring, or alert to catch it. Combined with high business impact, that is the riskiest case, so Expliq marks it critical.

## What is "Your Next Move"?

"Your Next Move" on the Dashboard is the one or two recommendations Expliq judges most worth acting on first, taken from the top of your ranked recommendations. It answers "if I do one thing, what should it be?"

## What is the difference between Act Now, Investigate, and Explore?

These are the three recommendation tiers, sorted by business impact:

- **Act Now** — high impact and high confidence; no-regret moves backed by your data.
- **Investigate** — high impact, but Expliq cannot fully verify it from your n8n data; it may be handled in another system. Framed honestly.
- **Explore** — valuable but lower urgency, or it needs you to connect more platforms first.

## What do the confidence labels mean?

- **Data-driven** — derived from your own synced data.
- **Benchmark-based** — based on industry benchmarks, not your specific data.
- **AI-suggested** — an inference that may be wrong; treat it as a hypothesis to check.

## What do process coverage, maturity, and value at stake mean?

Coverage is the share of a process's steps that are automated versus left as gaps. Maturity is Expliq's read of how developed the process is. Value at stake is the business value tied to the process — often shown as a range — that improving it would protect or unlock.

## Why does a workflow show no error rate?

Error rate needs execution history. If a workflow has not run, or its execution data was not synced (or your API key lacks permission to read executions), Expliq has no error rate to show for it.

## What does the change banner after a sync mean?

After each sync Expliq compares against the previous snapshot and reports what changed: new or removed workflows, error rates that improved or worsened, workflows that went active or inactive, and recommendations that are new or now resolved.

## Can Expliq build or fix a workflow for me?

For recommendations that are deployable new workflows, yes — you can deploy them to your n8n instance directly from the Opportunities screen in one click. Other recommendations are technical fixes or platform-connection suggestions that you apply in n8n yourself.

## How detailed is Expliq's implementation guidance?

Expliq tells you what to change and why, at the level its recommendations state — for example, "replace the manual trigger with a webhook trigger so new registrations fire the workflow in real time." It is not a general n8n tutorial: for the exact node-by-node setup, follow n8n's own documentation. Where a recommendation is deployable, Expliq builds it for you on deploy, so no manual setup is needed.
