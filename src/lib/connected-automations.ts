// ── Types ───────────────────────────────────────────────

export interface AutomationConnection {
  automationId: string;
  externalId: string;
  rawWorkflowJson: unknown;
}

export interface ConnectionUpdate {
  automationId: string;
  upstreamIds: string[];
  downstreamIds: string[];
}

export interface LlmConnection {
  fromExternalId: string;
  toExternalId: string;
  connectionType: string;
  description: string;
}

// ── Helpers ─────────────────────────────────────────────

function getSettings(raw: unknown): { errorWorkflow?: string; callerIds?: string[] } {
  if (typeof raw !== "object" || raw === null) return {};
  const obj = raw as Record<string, unknown>;
  if (typeof obj.settings !== "object" || obj.settings === null) return {};
  const settings = obj.settings as Record<string, unknown>;
  const result: { errorWorkflow?: string; callerIds?: string[] } = {};
  if (typeof settings.errorWorkflow === "string") {
    result.errorWorkflow = settings.errorWorkflow;
  }
  if (Array.isArray(settings.callerIds)) {
    result.callerIds = settings.callerIds.filter(
      (id): id is string => typeof id === "string"
    );
  }
  return result;
}

function addConnection(
  map: Map<string, ConnectionUpdate>,
  automationId: string,
  direction: "upstreamIds" | "downstreamIds",
  targetId: string
): void {
  let entry = map.get(automationId);
  if (!entry) {
    entry = { automationId, upstreamIds: [], downstreamIds: [] };
    map.set(automationId, entry);
  }
  const arr = entry[direction];
  if (!arr.includes(targetId)) {
    arr.push(targetId);
  }
}

// ── Public functions ────────────────────────────────────

export function resolveDeterministicConnections(
  automations: AutomationConnection[]
): ConnectionUpdate[] {
  const byExternalId = new Map<string, AutomationConnection>();
  for (const a of automations) {
    byExternalId.set(a.externalId, a);
  }

  const map = new Map<string, ConnectionUpdate>();

  for (const automation of automations) {
    const { errorWorkflow, callerIds } = getSettings(automation.rawWorkflowJson);

    // errorWorkflow: if A has errorWorkflow pointing to B,
    // then B is upstream of A and A is downstream of B
    if (errorWorkflow) {
      const target = byExternalId.get(errorWorkflow);
      if (target && target.automationId !== automation.automationId) {
        addConnection(map, automation.automationId, "upstreamIds", target.automationId);
        addConnection(map, target.automationId, "downstreamIds", automation.automationId);
      }
    }

    // callerIds: if A has callerIds containing B,
    // then B is upstream of A and A is downstream of B
    if (callerIds) {
      for (const callerId of callerIds) {
        const caller = byExternalId.get(callerId);
        if (caller && caller.automationId !== automation.automationId) {
          addConnection(map, automation.automationId, "upstreamIds", caller.automationId);
          addConnection(map, caller.automationId, "downstreamIds", automation.automationId);
        }
      }
    }
  }

  return Array.from(map.values());
}

export function mergeLlmConnections(
  automations: AutomationConnection[],
  llmConnections: LlmConnection[]
): ConnectionUpdate[] {
  const byExternalId = new Map<string, AutomationConnection>();
  for (const a of automations) {
    byExternalId.set(a.externalId, a);
  }

  const map = new Map<string, ConnectionUpdate>();

  for (const conn of llmConnections) {
    const from = byExternalId.get(conn.fromExternalId);
    const to = byExternalId.get(conn.toExternalId);
    if (!from || !to) continue;
    if (from.automationId === to.automationId) continue;

    // from → to: "from" is upstream of "to", "to" is downstream of "from"
    addConnection(map, to.automationId, "upstreamIds", from.automationId);
    addConnection(map, from.automationId, "downstreamIds", to.automationId);
  }

  return Array.from(map.values());
}

export function getConnectionType(
  sourceId: string,
  targetId: string,
  automations: Array<{ id: string; externalId: string; rawWorkflowJson: unknown }>
): "error-handler" | "sub-workflow" | "logical" {
  const source = automations.find((a) => a.id === sourceId);
  const target = automations.find((a) => a.id === targetId);
  if (!source || !target) return "logical";

  // If source's errorWorkflow points to target → error-handler
  const sourceSettings = getSettings(source.rawWorkflowJson);
  if (sourceSettings.errorWorkflow === target.externalId) {
    return "error-handler";
  }

  // If target's callerIds contains source → sub-workflow
  const targetSettings = getSettings(target.rawWorkflowJson);
  if (targetSettings.callerIds?.includes(source.externalId)) {
    return "sub-workflow";
  }

  return "logical";
}

export function mergeConnectionUpdates(
  existing: ConnectionUpdate[],
  additional: ConnectionUpdate[]
): ConnectionUpdate[] {
  const map = new Map<string, ConnectionUpdate>();

  for (const update of existing) {
    map.set(update.automationId, {
      automationId: update.automationId,
      upstreamIds: [...update.upstreamIds],
      downstreamIds: [...update.downstreamIds],
    });
  }

  for (const update of additional) {
    let entry = map.get(update.automationId);
    if (!entry) {
      entry = { automationId: update.automationId, upstreamIds: [], downstreamIds: [] };
      map.set(update.automationId, entry);
    }
    for (const id of update.upstreamIds) {
      if (!entry.upstreamIds.includes(id)) {
        entry.upstreamIds.push(id);
      }
    }
    for (const id of update.downstreamIds) {
      if (!entry.downstreamIds.includes(id)) {
        entry.downstreamIds.push(id);
      }
    }
  }

  return Array.from(map.values());
}
