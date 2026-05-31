---
tags:
  - type/index
  - type/task
---

# expliq-mvp — TODO

> Projekt-lokale Task-Liste. Taucht automatisch im Dev-Vault-Dashboard auf (Pfad-Regex `/todo/i`).

## ▶ Start Here (new session)

1. Read [`_HANDOFF.md`](_HANDOFF.md) — last session state + next step
2. Read this TODO list for full backlog
3. `_HANDOFF.md` is version-tracked and persists; the next `/handoff` overwrites it

---

## Open

- [ ] MCP composition demo (nach Epic 20): in Claude Code drei MCP-Server gleichzeitig anbinden (Expliq-Support-MCP + GitHub-MCP + Linear-MCP via `.mcp.json`) und einen geprobten Prompt zeigen, der über alle drei spannt (Expliq fragen → GitHub-Issue → Linear-Ticket). Optional als `/expliq-triage-demo` Skill für Wiederholbarkeit verpacken. Voraussetzung: Epic-20-MCP-Server live. Kontext: `research/mcp-vs-api-explained.md` Punkt 3c.

  **Klärungen 2026-05-30 (Session-Recherche):**
  - **Es ist KEIN MCP-Gateway-Thema.** Ein Gateway (MetaMCP, Docker MCP Gateway, ContextForge) ist eine reine Infra-Schicht, die N Server hinter 1 Endpunkt bündelt — brauche ich bei 3 Servern + 1 Client NICHT (Over-Engineering, wäre Cargo-Cult in der Bewerbung). Volle Einordnung: `_resources/mcp-gateways-orchestration-multi-server-research-2026-05-30.md` (5-Schichten-Karte).
  - **Es ist emergente Agent-Orchestrierung, kein gebauter Orchestrator.** Claude IST der Orchestrator; null Glue-Code. Auch kein Agent-Framework (LangGraph etc.) nötig für einen read-then-write-Loop über 3 Server.
  - **Zwei verschiedene Demos mit verschiedenen Botschaften** (nicht eine besser als die andere):
    (a) **Claude Code als Orchestrator** = die MCP-Door-Story ("ein externer smarter Client konsumiert meinen self-hosted MCP-Server mit null Glue"). Für diese Story ist Claude-Code-Orchestrierung RICHTIG; n8n-als-Hub würde sie verstecken (siehe `mcp-vs-api-explained.md` Z.761-765, Option 3 "verfehlt den Zweck").
    (b) **n8n als Hub** (MCP Client Tool Nodes rufen GitHub/Linear, re-exponiert via MCP Server Trigger) = n8n's eigene Produkt-These. Stärkere n8n-Story, aber andere Demo. Details: `_resources/mcp-gateways-orchestration-multi-server-research-2026-05-30.md` Sub-Topic 5.
  - **Grenze des heutigen Stacks:** Der "lasse Expliq meine KRITISCHEN Automationen ausspucken"-Teil ist mit Epic 20 NICHT baubar — der Support-Door antwortet nur aus der Produkt-KB, nicht über Daten der konkreten n8n-Instanz. Das bräuchte die Governance-Daten-Tools (`get_riskiest_automations` etc.), die in der Spec explizit out of scope / zukünftige Erweiterung (Framing ii) sind. Heute baubar: "bug/feature/question/urgent + Issue anlegen", komponiert mit GitHub/Linear.
