# Risk Levels — Impact, Detectability, and Reliability

## Impact level

Expliq assigns each workflow a business impact level: **critical**, **high**, **medium**, or **low**. Impact reflects how much the business depends on the workflow. A workflow that notifies lottery winners and converts them into paying customers is high impact; an internal reference or training workflow is low impact.

## Detectability

Detectability describes how visible a failure would be if the workflow broke:

- **silent** — a failure would go unnoticed: no monitoring, no error workflow, no alert.
- **partially-monitored** — a failure would be only partly visible.
- **monitored** — a failure would be caught, for example because an error workflow or alerting is in place.

Silent failures on important workflows are the most dangerous, which is why they drive the critical signal.

## How impact and detectability combine

Impact and detectability together feed the governance dot. The worst combination is **critical impact with silent detectability**: a high-stakes workflow that could fail without anyone knowing. Expliq flags that as critical even when the error rate looks fine. Critical or high impact without any error-handling workflow is flagged as attention.

## Error rate

Error rate is the share of recent executions that failed. On the Dashboard's "Needs Attention" list it appears as, for example, "33% error rate". For an active workflow, an error rate above 20% is critical; between 5% and 20% is attention. A workflow with no execution history (or whose executions were not synced) has no error rate to show.

## Reliability (process level)

At the process level Expliq shows reliability: the average success rate across the process's workflows that report an error rate — one minus their average error rate. It indicates how dependable a whole process is, rather than a single workflow.
