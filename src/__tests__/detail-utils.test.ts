import { describe, it, expect } from "vitest";
import { normalizeTier, normalizeConfidence } from "@/lib/opportunities-data";
import { getConnectionType } from "@/lib/connected-automations";

describe("normalizeTier", () => {
  it("maps 'act-now' to 'act-now'", () => {
    expect(normalizeTier("act-now")).toBe("act-now");
  });

  it("maps 'Act Now' to 'act-now'", () => {
    expect(normalizeTier("Act Now")).toBe("act-now");
  });

  it("maps 'immediate' to 'act-now'", () => {
    expect(normalizeTier("immediate")).toBe("act-now");
  });

  it("maps 'critical' to 'act-now'", () => {
    expect(normalizeTier("critical")).toBe("act-now");
  });

  it("maps 'high' to 'act-now'", () => {
    expect(normalizeTier("high")).toBe("act-now");
  });

  it("maps 'investigate' to 'investigate'", () => {
    expect(normalizeTier("investigate")).toBe("investigate");
  });

  it("maps 'Investigate' to 'investigate'", () => {
    expect(normalizeTier("Investigate")).toBe("investigate");
  });

  it("maps 'medium' to 'investigate'", () => {
    expect(normalizeTier("medium")).toBe("investigate");
  });

  it("maps 'explore' to 'explore'", () => {
    expect(normalizeTier("explore")).toBe("explore");
  });

  it("maps 'low' to 'explore'", () => {
    expect(normalizeTier("low")).toBe("explore");
  });

  it("maps unknown values to 'explore'", () => {
    expect(normalizeTier("unknown")).toBe("explore");
    expect(normalizeTier("something else")).toBe("explore");
  });
});

describe("normalizeConfidence", () => {
  it("returns undefined for null", () => {
    expect(normalizeConfidence(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(normalizeConfidence(undefined)).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(normalizeConfidence("")).toBeUndefined();
  });

  it("normalizes 'Data Driven' to 'data-driven'", () => {
    expect(normalizeConfidence("Data Driven")).toBe("data-driven");
  });

  it("passes 'data-driven' through as-is", () => {
    expect(normalizeConfidence("data-driven")).toBe("data-driven");
  });

  it("normalizes 'Benchmark Based' to 'benchmark-based'", () => {
    expect(normalizeConfidence("Benchmark Based")).toBe("benchmark-based");
  });

  it("normalizes 'AI Suggested' to 'ai-suggested'", () => {
    expect(normalizeConfidence("AI Suggested")).toBe("ai-suggested");
  });

  it("normalizes 'ai-suggested' as-is", () => {
    expect(normalizeConfidence("ai-suggested")).toBe("ai-suggested");
  });
});

describe("getConnectionType", () => {
  const makeAutomation = (
    id: string,
    externalId: string,
    settings: Record<string, unknown> = {},
  ) => ({
    id,
    externalId,
    rawWorkflowJson: { settings },
  });

  it("returns 'error-handler' when source's errorWorkflow points to target", () => {
    const source = makeAutomation("a1", "ext-1", {
      errorWorkflow: "ext-2",
    });
    const target = makeAutomation("a2", "ext-2");
    expect(getConnectionType("a1", "a2", [source, target])).toBe(
      "error-handler",
    );
  });

  it("returns 'sub-workflow' when target's callerIds contains source", () => {
    const source = makeAutomation("a1", "ext-1");
    const target = makeAutomation("a2", "ext-2", {
      callerIds: ["ext-1"],
    });
    expect(getConnectionType("a1", "a2", [source, target])).toBe(
      "sub-workflow",
    );
  });

  it("returns 'logical' when no errorWorkflow or callerIds match", () => {
    const source = makeAutomation("a1", "ext-1");
    const target = makeAutomation("a2", "ext-2");
    expect(getConnectionType("a1", "a2", [source, target])).toBe("logical");
  });

  it("returns 'logical' when source is not found", () => {
    const target = makeAutomation("a2", "ext-2");
    expect(getConnectionType("unknown", "a2", [target])).toBe("logical");
  });

  it("returns 'logical' when target is not found", () => {
    const source = makeAutomation("a1", "ext-1");
    expect(getConnectionType("a1", "unknown", [source])).toBe("logical");
  });

  it("prefers error-handler over sub-workflow when both match", () => {
    const source = makeAutomation("a1", "ext-1", {
      errorWorkflow: "ext-2",
    });
    const target = makeAutomation("a2", "ext-2", {
      callerIds: ["ext-1"],
    });
    expect(getConnectionType("a1", "a2", [source, target])).toBe(
      "error-handler",
    );
  });
});
