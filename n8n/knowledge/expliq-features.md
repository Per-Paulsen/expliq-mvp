# Expliq — What It Is and What Each Screen Does

## What Expliq is

Expliq is an Automation Intelligence platform. It connects to your n8n instance, uses an LLM to read every workflow and your whole automation landscape, and turns raw workflow JSON into business-level insight: what each automation does, what is working, what is broken, and what to build next. Every insight traces back to your own synced data.

Expliq analyzes the automations you already have. It is not a tutorial for building n8n workflows from scratch; questions about how to use n8n itself are outside what Expliq answers.

## The Dashboard

The Dashboard answers "What needs my attention?" It is the executive summary of your automation landscape and shows:

- **Your Next Move** — the one or two highest-priority recommendations to act on first.
- **KPIs** — total workflows, business processes, active workflows (of total), connected systems, and open recommendations, with deltas since your last sync.
- **Needs Attention** — up to five automations flagged critical or attention by the governance signal, most urgent first, each with a short reason such as "33% error rate" or "Inactive".
- **Top Opportunities** — the three highest-impact recommendations.
- **Process Coverage** — your business processes with how many of their steps are automated.
- **Connected Systems** — the external systems your workflows touch, with how many workflows use each.

After a re-sync, a change banner summarizes what changed.

## The Process Map

The Process Map answers "What do I have?" It groups your workflows into the business processes they serve. For each process it shows coverage (how many steps are automated versus gaps), maturity, and the value at stake, and it reveals where a process has gaps that no workflow covers yet.

## Opportunities

Opportunities answers "What should I do?" It lists all of Expliq's recommendations ranked by business impact. Each recommendation has a tier (Act Now, Investigate, or Explore), a confidence label, the affected scope, and a business brief. Where a recommendation is a deployable new workflow, you can deploy it to your n8n instance from here.

## Automation Detail

The Detail screen answers "Tell me everything about this one." It explains a single workflow in business terms: its business narrative, its data flow, the systems it touches, its impact and detectability, estimated time savings and revenue impact, execution stats (runs per week, error rate, average duration, last run), and how it connects to upstream and downstream workflows. Technical evidence backs the analysis.

## Settings

Settings is where you connect and sync your n8n instance: enter the instance URL and API key, choose which tags to sync, and trigger a sync. See "Connecting and Syncing Your n8n Instance" for the full flow.

## Re-sync and the change banner

Each sync captures a snapshot. On the next sync, Expliq compares against the previous snapshot and shows a change banner on the Dashboard: new workflows detected, workflows removed, error rates that improved or worsened, workflows that went active or inactive, and recommendations that are new or now resolved.
