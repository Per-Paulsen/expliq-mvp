# Governance Signals — The Health Dot

## What the governance dot is

Every automation Expliq tracks gets a governance dot: a single health signal with three states — healthy (green), attention (amber), or critical (red). The dot summarizes whether a workflow is running safely or needs a look. You see it on the Dashboard's "Needs Attention" list and on automation views. The signal is derived live from your synced data; it is not a manual label.

## Healthy (green)

The workflow shows no governance concern: it is not failing at a high rate, and it does not combine high business impact with poor monitoring. Healthy is the default when none of the attention or critical conditions apply.

## Attention (amber)

Something is worth a look, but it is not an active failure. An automation is flagged attention when any of these hold:

- It is active and its error rate is between 5% and 20%.
- It is inactive but ran within the last 30 days (recently switched off).
- Its business impact is critical or high and it has no error-handling workflow configured.

## Critical (red)

The workflow needs attention now. An automation is flagged critical when either:

- It is active and its error rate is above 20%, or
- Its business impact is critical and its detectability is silent — a high-stakes workflow that would fail without anyone noticing.

## How the dot is computed

The dot is computed from the workflow's current data, checked in priority order (critical first, then attention, otherwise healthy):

1. **Critical** — active with error rate above 20%; or impact = critical and detectability = silent.
2. **Attention** — active with error rate 5–20%; or inactive but executed within the last 30 days; or impact critical or high with no error workflow set.
3. **Healthy** — none of the above.

## Where you see the dot

The Dashboard's "Needs Attention" list shows up to five automations with a critical or attention dot, most urgent first, each with a short reason (for example "33% error rate" or "Inactive"). Healthy workflows are not listed there because they need no action.
