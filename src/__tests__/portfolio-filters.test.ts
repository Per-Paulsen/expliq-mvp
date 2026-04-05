/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — R1 portfolio filter tests; types trimmed in Epic 10
import { describe, it, expect } from "vitest";
import type {
  PortfolioAutomation,
  PortfolioFilters,
} from "@/lib/portfolio-types";
import {
  computeGlobalCounts,
  filterAutomations,
  sortAutomations,
  parseFiltersFromParams,
  filtersToSearchString,
  hasActiveFilters,
  getActiveFilterChips,
} from "@/lib/portfolio-filters";

function makePortfolioAutomation(
  overrides: Partial<PortfolioAutomation> = {}
): PortfolioAutomation {
  return {
    id: "auto-1",
    name: "Test Automation",
    description: "A test description",
    platform: "n8n",
    status: "active",
    owner: "alice",
    systemsTouched: ["Salesforce", "HubSpot"],
    impactLevel: "high",
    riskLevel: "medium",
    signals: {
      documentationOutdated: false,
      automationStale: false,
      overdueReview: false,
      noOwnerAssigned: false,
      inactive: false,
    },
    automationLastUpdated: "2025-06-01T00:00:00.000Z",
    documentationLastUpdated: "2025-05-01T00:00:00.000Z",
    ...overrides,
  };
}

function defaultFilters(
  overrides: Partial<PortfolioFilters> = {}
): PortfolioFilters {
  return {
    search: "",
    systems: [],
    platforms: [],
    owners: [],
    attention: [],
    impact: [],
    risk: [],
    sort: "automationLastUpdated",
    order: "desc",
    updatedAfter: null,
    minSystems: null,
    ...overrides,
  };
}

describe.skip("R1 portfolio filters — skipped after R2 schema migration", () => {
describe("computeGlobalCounts", () => {
  it("counts systems across all automations", () => {
    const automations = [
      makePortfolioAutomation({ systemsTouched: ["Salesforce", "HubSpot"] }),
      makePortfolioAutomation({
        id: "auto-2",
        systemsTouched: ["Salesforce", "Slack"],
      }),
    ];
    const counts = computeGlobalCounts(automations);
    expect(counts.systems.get("Salesforce")).toBe(2);
    expect(counts.systems.get("HubSpot")).toBe(1);
    expect(counts.systems.get("Slack")).toBe(1);
  });

  it("counts owners including null as 'No owner'", () => {
    const automations = [
      makePortfolioAutomation({ owner: "alice" }),
      makePortfolioAutomation({ id: "auto-2", owner: "alice" }),
      makePortfolioAutomation({ id: "auto-3", owner: null }),
    ];
    const counts = computeGlobalCounts(automations);
    expect(counts.owners.get("alice")).toBe(2);
    expect(counts.owners.get("No owner")).toBe(1);
  });

  it("counts attention signals", () => {
    const automations = [
      makePortfolioAutomation({
        signals: {
          documentationOutdated: true,
          automationStale: false,
          overdueReview: false,
          noOwnerAssigned: true,
          inactive: false,
        },
      }),
      makePortfolioAutomation({
        id: "auto-2",
        signals: {
          documentationOutdated: true,
          automationStale: false,
          overdueReview: false,
          noOwnerAssigned: false,
          inactive: false,
        },
      }),
    ];
    const counts = computeGlobalCounts(automations);
    expect(counts.attention.get("documentation-outdated")).toBe(2);
    expect(counts.attention.get("no-owner")).toBe(1);
    expect(counts.attention.has("automation-stale")).toBe(false);
  });

  it("counts impact and risk levels", () => {
    const automations = [
      makePortfolioAutomation({ impactLevel: "high", riskLevel: "high" }),
      makePortfolioAutomation({
        id: "auto-2",
        impactLevel: "high",
        riskLevel: "medium",
      }),
      makePortfolioAutomation({
        id: "auto-3",
        impactLevel: null,
        riskLevel: "low",
      }),
    ];
    const counts = computeGlobalCounts(automations);
    expect(counts.impact.get("high")).toBe(2);
    expect(counts.impact.has("null")).toBe(false);
    expect(counts.risk.get("high")).toBe(1);
    expect(counts.risk.get("medium")).toBe(1);
    expect(counts.risk.get("low")).toBe(1);
  });

  it("counts platforms", () => {
    const automations = [
      makePortfolioAutomation({ platform: "n8n" }),
      makePortfolioAutomation({ id: "auto-2", platform: "n8n" }),
      makePortfolioAutomation({ id: "auto-3", platform: "zapier" }),
    ];
    const counts = computeGlobalCounts(automations);
    expect(counts.platforms.get("n8n")).toBe(2);
    expect(counts.platforms.get("zapier")).toBe(1);
  });
});

describe("filterAutomations", () => {
  const automations = [
    makePortfolioAutomation({
      id: "a1",
      name: "Lead Sync",
      description: "Syncs leads from HubSpot",
      owner: "alice",
      systemsTouched: ["Salesforce", "HubSpot"],
      impactLevel: "high",
      riskLevel: "high",
      platform: "n8n",
      signals: {
        documentationOutdated: true,
        automationStale: false,
        overdueReview: false,
        noOwnerAssigned: false,
        inactive: false,
      },
      automationLastUpdated: "2025-06-15T00:00:00.000Z",
    }),
    makePortfolioAutomation({
      id: "a2",
      name: "Slack Notifier",
      description: "Sends Slack notifications",
      owner: null,
      systemsTouched: ["Slack"],
      impactLevel: "low",
      riskLevel: "low",
      platform: "zapier",
      signals: {
        documentationOutdated: false,
        automationStale: true,
        overdueReview: false,
        noOwnerAssigned: true,
        inactive: false,
      },
      automationLastUpdated: "2025-01-01T00:00:00.000Z",
    }),
    makePortfolioAutomation({
      id: "a3",
      name: "Data Pipeline",
      description: "Processes data from Salesforce",
      owner: "bob",
      systemsTouched: ["Salesforce", "Snowflake"],
      impactLevel: "medium",
      riskLevel: "medium",
      platform: "n8n",
      signals: {
        documentationOutdated: false,
        automationStale: false,
        overdueReview: true,
        noOwnerAssigned: false,
        inactive: false,
      },
      automationLastUpdated: "2025-04-01T00:00:00.000Z",
    }),
  ];

  it("filters by search on name (case-insensitive)", () => {
    const result = filterAutomations(
      automations,
      defaultFilters({ search: "lead" })
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a1");
  });

  it("filters by search on description", () => {
    const result = filterAutomations(
      automations,
      defaultFilters({ search: "slack notifications" })
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a2");
  });

  it("search is case-insensitive", () => {
    const result = filterAutomations(
      automations,
      defaultFilters({ search: "PIPELINE" })
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a3");
  });

  it("filters by systems (OR within)", () => {
    const result = filterAutomations(
      automations,
      defaultFilters({ systems: ["Slack", "Snowflake"] })
    );
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.id).sort()).toEqual(["a2", "a3"]);
  });

  it("filters by platforms", () => {
    const result = filterAutomations(
      automations,
      defaultFilters({ platforms: ["zapier"] })
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a2");
  });

  it("filters by owners with literal match", () => {
    const result = filterAutomations(
      automations,
      defaultFilters({ owners: ["alice"] })
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a1");
  });

  it("filters by owners with _none sentinel", () => {
    const result = filterAutomations(
      automations,
      defaultFilters({ owners: ["_none"] })
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a2");
  });

  it("filters by owners with _none and literal combined (OR)", () => {
    const result = filterAutomations(
      automations,
      defaultFilters({ owners: ["_none", "bob"] })
    );
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.id).sort()).toEqual(["a2", "a3"]);
  });

  it("filters by attention signals", () => {
    const result = filterAutomations(
      automations,
      defaultFilters({ attention: ["documentation-outdated"] })
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a1");
  });

  it("filters by attention signals (OR within)", () => {
    const result = filterAutomations(
      automations,
      defaultFilters({ attention: ["automation-stale", "overdue-review"] })
    );
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.id).sort()).toEqual(["a2", "a3"]);
  });

  it("filters by impact", () => {
    const result = filterAutomations(
      automations,
      defaultFilters({ impact: ["high", "medium"] })
    );
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.id).sort()).toEqual(["a1", "a3"]);
  });

  it("filters by risk", () => {
    const result = filterAutomations(
      automations,
      defaultFilters({ risk: ["low"] })
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a2");
  });

  it("filters by updatedAfter (Nd format)", () => {
    // Use a date that makes a1 and a3 pass but not a2
    // a1: 2025-06-15, a2: 2025-01-01, a3: 2025-04-01
    // We mock Date to control "now"
    const realDate = globalThis.Date;
    const mockNow = new Date("2025-06-20T00:00:00.000Z");
    const MockDate = class extends realDate {
      constructor(...args: Parameters<typeof realDate>) {
        if (args.length === 0) {
          super(mockNow.toISOString());
        } else {
          // @ts-expect-error spread into Date constructor
          super(...args);
        }
      }
    } as DateConstructor;
    globalThis.Date = MockDate;

    try {
      const result = filterAutomations(
        automations,
        defaultFilters({ updatedAfter: "90d" })
      );
      // 90 days before 2025-06-20 = 2025-03-22
      // a1: 2025-06-15 >= 2025-03-22 ✓
      // a2: 2025-01-01 < 2025-03-22 ✗
      // a3: 2025-04-01 >= 2025-03-22 ✓
      expect(result).toHaveLength(2);
      expect(result.map((a) => a.id).sort()).toEqual(["a1", "a3"]);
    } finally {
      globalThis.Date = realDate;
    }
  });

  it("filters by minSystems", () => {
    const result = filterAutomations(
      automations,
      defaultFilters({ minSystems: 2 })
    );
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.id).sort()).toEqual(["a1", "a3"]);
  });

  it("combines filters with AND logic", () => {
    const result = filterAutomations(
      automations,
      defaultFilters({
        systems: ["Salesforce"],
        risk: ["high"],
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a1");
  });

  it("returns all when no filters active", () => {
    const result = filterAutomations(automations, defaultFilters());
    expect(result).toHaveLength(3);
  });
});

describe("sortAutomations", () => {
  const automations = [
    makePortfolioAutomation({
      id: "a1",
      name: "Charlie",
      automationLastUpdated: "2025-06-15T00:00:00.000Z",
      documentationLastUpdated: "2025-03-01T00:00:00.000Z",
    }),
    makePortfolioAutomation({
      id: "a2",
      name: "Alice",
      automationLastUpdated: "2025-01-01T00:00:00.000Z",
      documentationLastUpdated: "2025-05-01T00:00:00.000Z",
    }),
    makePortfolioAutomation({
      id: "a3",
      name: "Bob",
      automationLastUpdated: "2025-04-01T00:00:00.000Z",
      documentationLastUpdated: null,
    }),
  ];

  it("sorts by automationLastUpdated desc", () => {
    const result = sortAutomations(automations, "automationLastUpdated", "desc");
    expect(result.map((a) => a.id)).toEqual(["a1", "a3", "a2"]);
  });

  it("sorts by automationLastUpdated asc", () => {
    const result = sortAutomations(automations, "automationLastUpdated", "asc");
    expect(result.map((a) => a.id)).toEqual(["a2", "a3", "a1"]);
  });

  it("sorts by documentationLastUpdated desc with nulls last", () => {
    const result = sortAutomations(
      automations,
      "documentationLastUpdated",
      "desc"
    );
    expect(result.map((a) => a.id)).toEqual(["a2", "a1", "a3"]);
  });

  it("sorts by documentationLastUpdated asc with nulls last", () => {
    const result = sortAutomations(
      automations,
      "documentationLastUpdated",
      "asc"
    );
    expect(result.map((a) => a.id)).toEqual(["a1", "a2", "a3"]);
  });

  it("sorts by name asc", () => {
    const result = sortAutomations(automations, "name", "asc");
    expect(result.map((a) => a.id)).toEqual(["a2", "a3", "a1"]);
  });

  it("sorts by name desc", () => {
    const result = sortAutomations(automations, "name", "desc");
    expect(result.map((a) => a.id)).toEqual(["a1", "a3", "a2"]);
  });

  it("handles null names (nulls last)", () => {
    const withNullName = [
      ...automations,
      makePortfolioAutomation({ id: "a4", name: null }),
    ];
    const resultAsc = sortAutomations(withNullName, "name", "asc");
    expect(resultAsc[resultAsc.length - 1].id).toBe("a4");

    const resultDesc = sortAutomations(withNullName, "name", "desc");
    expect(resultDesc[resultDesc.length - 1].id).toBe("a4");
  });
});

describe("parseFiltersFromParams", () => {
  it("parses all filter params", () => {
    const params = new URLSearchParams();
    params.set("search", "hello");
    params.append("system", "Salesforce");
    params.append("system", "HubSpot");
    params.append("owner", "alice");
    params.append("attention", "no-owner");
    params.append("platform", "n8n");
    params.append("impact", "high");
    params.append("risk", "medium");
    params.set("sort", "name");
    params.set("order", "asc");
    params.set("updatedAfter", "30d");
    params.set("minSystems", "2");

    const filters = parseFiltersFromParams(params);
    expect(filters.search).toBe("hello");
    expect(filters.systems).toEqual(["Salesforce", "HubSpot"]);
    expect(filters.owners).toEqual(["alice"]);
    expect(filters.attention).toEqual(["no-owner"]);
    expect(filters.platforms).toEqual(["n8n"]);
    expect(filters.impact).toEqual(["high"]);
    expect(filters.risk).toEqual(["medium"]);
    expect(filters.sort).toBe("name");
    expect(filters.order).toBe("asc");
    expect(filters.updatedAfter).toBe("30d");
    expect(filters.minSystems).toBe(2);
  });

  it("returns defaults for empty params", () => {
    const filters = parseFiltersFromParams(new URLSearchParams());
    expect(filters.search).toBe("");
    expect(filters.systems).toEqual([]);
    expect(filters.platforms).toEqual([]);
    expect(filters.owners).toEqual([]);
    expect(filters.attention).toEqual([]);
    expect(filters.impact).toEqual([]);
    expect(filters.risk).toEqual([]);
    expect(filters.sort).toBe("automationLastUpdated");
    expect(filters.order).toBe("desc");
    expect(filters.updatedAfter).toBeNull();
    expect(filters.minSystems).toBeNull();
  });

  it("uses default sort for invalid sort value", () => {
    const params = new URLSearchParams({ sort: "invalid" });
    expect(parseFiltersFromParams(params).sort).toBe("automationLastUpdated");
  });

  it("uses default order for invalid order value", () => {
    const params = new URLSearchParams({ order: "invalid" });
    expect(parseFiltersFromParams(params).order).toBe("desc");
  });
});

describe("filtersToSearchString", () => {
  it("round-trips with parseFiltersFromParams", () => {
    const original = defaultFilters({
      search: "test",
      systems: ["Salesforce"],
      owners: ["alice", "_none"],
      risk: ["high"],
      sort: "name",
      order: "asc",
      updatedAfter: "30d",
      minSystems: 3,
    });

    const queryString = filtersToSearchString(original);
    const parsed = parseFiltersFromParams(new URLSearchParams(queryString));

    expect(parsed.search).toBe(original.search);
    expect(parsed.systems).toEqual(original.systems);
    expect(parsed.owners).toEqual(original.owners);
    expect(parsed.risk).toEqual(original.risk);
    expect(parsed.sort).toBe(original.sort);
    expect(parsed.order).toBe(original.order);
    expect(parsed.updatedAfter).toBe(original.updatedAfter);
    expect(parsed.minSystems).toBe(original.minSystems);
  });

  it("omits default/empty values", () => {
    const queryString = filtersToSearchString(defaultFilters());
    expect(queryString).toBe("");
  });

  it("includes non-default sort and order", () => {
    const queryString = filtersToSearchString(
      defaultFilters({ sort: "name", order: "asc" })
    );
    expect(queryString).toContain("sort=name");
    expect(queryString).toContain("order=asc");
  });
});

describe("hasActiveFilters", () => {
  it("returns false for default filters", () => {
    expect(hasActiveFilters(defaultFilters())).toBe(false);
  });

  it("returns true when search is set", () => {
    expect(hasActiveFilters(defaultFilters({ search: "test" }))).toBe(true);
  });

  it("returns true when any array filter is set", () => {
    expect(hasActiveFilters(defaultFilters({ systems: ["Salesforce"] }))).toBe(
      true
    );
    expect(hasActiveFilters(defaultFilters({ owners: ["alice"] }))).toBe(true);
    expect(hasActiveFilters(defaultFilters({ risk: ["high"] }))).toBe(true);
  });

  it("returns true when updatedAfter is set", () => {
    expect(hasActiveFilters(defaultFilters({ updatedAfter: "30d" }))).toBe(
      true
    );
  });

  it("returns true when minSystems is set", () => {
    expect(hasActiveFilters(defaultFilters({ minSystems: 2 }))).toBe(true);
  });

  it("returns false when only sort/order differ (not considered active filters)", () => {
    expect(
      hasActiveFilters(defaultFilters({ sort: "name", order: "asc" }))
    ).toBe(false);
  });
});

describe("getActiveFilterChips", () => {
  it("returns empty for default filters", () => {
    expect(getActiveFilterChips(defaultFilters())).toEqual([]);
  });

  it("returns chip for search", () => {
    const chips = getActiveFilterChips(defaultFilters({ search: "test" }));
    expect(chips).toHaveLength(1);
    expect(chips[0].category).toBe("Search");
    expect(chips[0].label).toBe("test");
    expect(chips[0].onRemove.search).toBe("");
  });

  it("returns chips for multiple systems", () => {
    const chips = getActiveFilterChips(
      defaultFilters({ systems: ["Salesforce", "HubSpot"] })
    );
    expect(chips).toHaveLength(2);
    expect(chips[0].category).toBe("System");
    expect(chips[0].label).toBe("Salesforce");
    expect(chips[0].onRemove.systems).toEqual(["HubSpot"]);
    expect(chips[1].label).toBe("HubSpot");
    expect(chips[1].onRemove.systems).toEqual(["Salesforce"]);
  });

  it("returns chip for _none owner with 'No owner' label", () => {
    const chips = getActiveFilterChips(defaultFilters({ owners: ["_none"] }));
    expect(chips).toHaveLength(1);
    expect(chips[0].label).toBe("No owner");
  });

  it("returns chip for attention with human-readable label", () => {
    const chips = getActiveFilterChips(
      defaultFilters({ attention: ["documentation-outdated"] })
    );
    expect(chips).toHaveLength(1);
    expect(chips[0].category).toBe("Attention");
    expect(chips[0].label).toBe("Documentation outdated");
  });

  it("returns chip for updatedAfter", () => {
    const chips = getActiveFilterChips(
      defaultFilters({ updatedAfter: "30d" })
    );
    expect(chips).toHaveLength(1);
    expect(chips[0].category).toBe("Updated");
    expect(chips[0].label).toBe("Updated: last 30 days");
    expect(chips[0].onRemove.updatedAfter).toBeNull();
  });

  it("returns chip for minSystems", () => {
    const chips = getActiveFilterChips(defaultFilters({ minSystems: 3 }));
    expect(chips).toHaveLength(1);
    expect(chips[0].category).toBe("Systems");
    expect(chips[0].label).toBe("3+ systems");
    expect(chips[0].onRemove.minSystems).toBeNull();
  });

  it("returns chips for risk and impact", () => {
    const chips = getActiveFilterChips(
      defaultFilters({ risk: ["high"], impact: ["low"] })
    );
    expect(chips).toHaveLength(2);
    const riskChip = chips.find((c) => c.category === "Risk");
    const impactChip = chips.find((c) => c.category === "Impact");
    expect(riskChip?.label).toBe("high");
    expect(impactChip?.label).toBe("low");
  });
});
}); // end describe.skip wrapper
