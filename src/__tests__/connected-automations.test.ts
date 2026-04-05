import { describe, it, expect } from "vitest";
import {
  resolveDeterministicConnections,
  mergeLlmConnections,
  mergeConnectionUpdates,
} from "@/lib/connected-automations";
import type {
  AutomationConnection,
  ConnectionUpdate,
  LlmConnection,
} from "@/lib/connected-automations";

function makeAutomation(
  overrides: Partial<AutomationConnection> & { automationId: string; externalId: string }
): AutomationConnection {
  return {
    rawWorkflowJson: {},
    ...overrides,
  };
}

// ── resolveDeterministicConnections ─────────────────────

describe("resolveDeterministicConnections", () => {
  it("returns empty when no connections exist", () => {
    const automations: AutomationConnection[] = [
      makeAutomation({ automationId: "a1", externalId: "ext-1", rawWorkflowJson: {} }),
      makeAutomation({ automationId: "a2", externalId: "ext-2", rawWorkflowJson: { settings: {} } }),
    ];
    expect(resolveDeterministicConnections(automations)).toEqual([]);
  });

  it("resolves a single errorWorkflow connection bidirectionally", () => {
    const automations: AutomationConnection[] = [
      makeAutomation({
        automationId: "a1",
        externalId: "ext-1",
        rawWorkflowJson: { settings: { errorWorkflow: "ext-2" } },
      }),
      makeAutomation({ automationId: "a2", externalId: "ext-2" }),
    ];
    const result = resolveDeterministicConnections(automations);

    // A1 has errorWorkflow → ext-2, so A2 is upstream of A1
    const a1 = result.find((r) => r.automationId === "a1");
    const a2 = result.find((r) => r.automationId === "a2");
    expect(a1).toBeDefined();
    expect(a2).toBeDefined();
    expect(a1!.upstreamIds).toContain("a2");
    expect(a2!.downstreamIds).toContain("a1");
  });

  it("resolves a single callerIds connection bidirectionally", () => {
    const automations: AutomationConnection[] = [
      makeAutomation({
        automationId: "a1",
        externalId: "ext-1",
        rawWorkflowJson: { settings: { callerIds: ["ext-2"] } },
      }),
      makeAutomation({ automationId: "a2", externalId: "ext-2" }),
    ];
    const result = resolveDeterministicConnections(automations);

    const a1 = result.find((r) => r.automationId === "a1");
    const a2 = result.find((r) => r.automationId === "a2");
    expect(a1).toBeDefined();
    expect(a2).toBeDefined();
    expect(a1!.upstreamIds).toContain("a2");
    expect(a2!.downstreamIds).toContain("a1");
  });

  it("resolves multiple callerIds", () => {
    const automations: AutomationConnection[] = [
      makeAutomation({
        automationId: "a1",
        externalId: "ext-1",
        rawWorkflowJson: { settings: { callerIds: ["ext-2", "ext-3"] } },
      }),
      makeAutomation({ automationId: "a2", externalId: "ext-2" }),
      makeAutomation({ automationId: "a3", externalId: "ext-3" }),
    ];
    const result = resolveDeterministicConnections(automations);

    const a1 = result.find((r) => r.automationId === "a1");
    expect(a1!.upstreamIds).toContain("a2");
    expect(a1!.upstreamIds).toContain("a3");
    expect(a1!.upstreamIds).toHaveLength(2);
  });

  it("skips errorWorkflow pointing to non-existent workflow", () => {
    const automations: AutomationConnection[] = [
      makeAutomation({
        automationId: "a1",
        externalId: "ext-1",
        rawWorkflowJson: { settings: { errorWorkflow: "ext-missing" } },
      }),
    ];
    expect(resolveDeterministicConnections(automations)).toEqual([]);
  });

  it("skips self-referential connections", () => {
    const automations: AutomationConnection[] = [
      makeAutomation({
        automationId: "a1",
        externalId: "ext-1",
        rawWorkflowJson: { settings: { errorWorkflow: "ext-1", callerIds: ["ext-1"] } },
      }),
    ];
    expect(resolveDeterministicConnections(automations)).toEqual([]);
  });

  it("handles circular references (A→B, B→A)", () => {
    const automations: AutomationConnection[] = [
      makeAutomation({
        automationId: "a1",
        externalId: "ext-1",
        rawWorkflowJson: { settings: { errorWorkflow: "ext-2" } },
      }),
      makeAutomation({
        automationId: "a2",
        externalId: "ext-2",
        rawWorkflowJson: { settings: { errorWorkflow: "ext-1" } },
      }),
    ];
    const result = resolveDeterministicConnections(automations);

    const a1 = result.find((r) => r.automationId === "a1");
    const a2 = result.find((r) => r.automationId === "a2");
    expect(a1!.upstreamIds).toContain("a2");
    expect(a1!.downstreamIds).toContain("a2");
    expect(a2!.upstreamIds).toContain("a1");
    expect(a2!.downstreamIds).toContain("a1");
  });
});

// ── mergeLlmConnections ─────────────────────────────────

describe("mergeLlmConnections", () => {
  const automations: AutomationConnection[] = [
    makeAutomation({ automationId: "a1", externalId: "ext-1" }),
    makeAutomation({ automationId: "a2", externalId: "ext-2" }),
    makeAutomation({ automationId: "a3", externalId: "ext-3" }),
  ];

  it("returns empty for empty LLM connections", () => {
    expect(mergeLlmConnections(automations, [])).toEqual([]);
  });

  it("adds a new LLM connection", () => {
    const llmConns: LlmConnection[] = [
      {
        fromExternalId: "ext-1",
        toExternalId: "ext-2",
        connectionType: "data-flow",
        description: "Passes lead data",
      },
    ];
    const result = mergeLlmConnections(automations, llmConns);

    const a1 = result.find((r) => r.automationId === "a1");
    const a2 = result.find((r) => r.automationId === "a2");
    expect(a1!.downstreamIds).toContain("a2");
    expect(a2!.upstreamIds).toContain("a1");
  });

  it("skips LLM connections referencing non-existent automations", () => {
    const llmConns: LlmConnection[] = [
      {
        fromExternalId: "ext-1",
        toExternalId: "ext-missing",
        connectionType: "data-flow",
        description: "Missing target",
      },
    ];
    expect(mergeLlmConnections(automations, llmConns)).toEqual([]);
  });
});

// ── mergeConnectionUpdates ──────────────────────────────

describe("mergeConnectionUpdates", () => {
  it("combines non-overlapping updates", () => {
    const existing: ConnectionUpdate[] = [
      { automationId: "a1", upstreamIds: ["a2"], downstreamIds: [] },
    ];
    const additional: ConnectionUpdate[] = [
      { automationId: "a3", upstreamIds: [], downstreamIds: ["a4"] },
    ];
    const result = mergeConnectionUpdates(existing, additional);
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.automationId === "a1")).toBeDefined();
    expect(result.find((r) => r.automationId === "a3")).toBeDefined();
  });

  it("unions upstream/downstream for same automationId", () => {
    const existing: ConnectionUpdate[] = [
      { automationId: "a1", upstreamIds: ["a2"], downstreamIds: ["a3"] },
    ];
    const additional: ConnectionUpdate[] = [
      { automationId: "a1", upstreamIds: ["a4", "a2"], downstreamIds: ["a5"] },
    ];
    const result = mergeConnectionUpdates(existing, additional);
    const a1 = result.find((r) => r.automationId === "a1")!;
    expect(a1.upstreamIds).toEqual(expect.arrayContaining(["a2", "a4"]));
    expect(a1.upstreamIds).toHaveLength(2); // no duplicate a2
    expect(a1.downstreamIds).toEqual(expect.arrayContaining(["a3", "a5"]));
    expect(a1.downstreamIds).toHaveLength(2);
  });
});
