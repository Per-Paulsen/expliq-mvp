## 11. MINI‑PRD: First‑Time Control Snapshot

PERSONA CONTEXT
- Who is Emma in this moment: Emma is a RevOps manager responsible for many business automations built and maintained by her team using no/low-code automation tools (such as n8n, Make, Zapier, Salesforce Flows, or HubSpot Workflows) rather than custom high-code backend systems.
- What just happened before this screen: Emma connected or synced her automation platforms (e.g., n8n, Make, Zapier) and other tools containing automations (e.g., Salesforce, HubSpot) with Expliq and completed the first sync of workflows.
- What she's trying to accomplish: She wants to quickly understand which automations are important (high business impact if they fail), which ones are risky (based on ownership, review state, or recent changes), and which ones are missing ownership so she knows where to focus attention. She also wants to understand what each automation actually does in simple business terms without reading the technical workflow logic.
- What she's worried about: Hidden operational risk, broken revenue workflows, or critical automations that nobody owns or reviews.

ASSUMPTION WE'RE TESTING
- We believe: Business operations teams building no/low-code automations want a fast way to understand automation impact (how severe the business consequences would be if an automation fails), ownership (who is responsible), and risk exposure (prioritization based on governance signals such as missing owner, overdue review, or recent workflow changes) without manually inspecting every workflow in their automation builders.
- We'll know we're wrong if: Users still open individual automation builders (e.g., n8n or Salesforce) to understand risk and responsibility instead of relying on Expliq’s snapshot.

USER FLOW
- Step 1: Emma sees the Workspace Control Snapshot → She scans the top metrics and exposure rankings → She expects to immediately understand which automations or systems require attention based on impact (business consequence severity) and risk (governance or structural warning signals).
- Step 2: Emma sees that Slack or Stripe appears as a top exposure system → She opens the Portfolio view filtered by risk or system → She expects to see the specific automations contributing to that exposure.
- Step 3: Emma opens a specific automation in the Automation Detail view → She reads the business explanation and checks ownership and governance signals → She expects to quickly understand in simple business terms what the automation does and why the automation is risky (e.g., missing owner, overdue review, recent change, or multi‑system dependency) and what action might be needed.

SCREENS TO BUILD
- Screen 1 Workspace Control Snapshot: Key elements to include:
  - Top metrics (total automations, high impact, high risk, missing owners, overdue reviews)
  - System exposure ranking
  - Owner exposure ranking
  - Optional structural indicators (recently changed, multi‑system automations)

- Screen 2 Portfolio: Key elements to include:
  - Searchable automation list with filters (e.g., by system, risk level, owner, or governance gaps)
  - Business summary per automation
  - Criticality and Risk Level indicators
  - Owner information
  - Governance badges (missing owner, overdue review, documentation outdated, multi‑system — each representing a governance signal indicating potential operational risk)

- Screen 3 Automation Detail: Key elements to include:
  - Business explanation (LLM‑generated)
  - Logic overview (trigger, systems touched, side effects)
  - Governance fields (owner, review cadence, documentation status)
  - Risk section (score, level, explicit drivers showing which governance or structural signals contributed to the risk)

VISUAL APPEARANCE
- Clean operational dashboard aesthetic
- Data‑dense but readable layout
- Emphasis on risk and prioritization signals
- Clear badges, rankings, and metrics for quick scanning

TECHNICAL ASPECTS
- responsive web app

OUT OF SCOPE
- We are NOT building:
  - Automation editing or workflow creation
  - Real-time automation monitoring
  - Enterprise compliance enforcement
  - Complex policy configuration
  - Multi-platform deep integrations beyond initial connectors