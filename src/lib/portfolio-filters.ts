import type {
  PortfolioAutomation,
  PortfolioFilters,
  GlobalCounts,
  GovernanceSignals,
} from "@/lib/portfolio-types";
import { ATTENTION_SIGNAL_MAP, ATTENTION_LABELS } from "@/lib/portfolio-types";

// TODO: Epic 10 — R2 portfolio will have different filter dimensions
export function computeGlobalCounts(
  automations: PortfolioAutomation[]
): GlobalCounts {
  const systems = new Map<string, number>();
  const platforms = new Map<string, number>();
  const owners = new Map<string, number>();
  const attention = new Map<string, number>();
  const impact = new Map<string, number>();
  const risk = new Map<string, number>();

  for (const a of automations) {
    platforms.set(a.platform, (platforms.get(a.platform) ?? 0) + 1);

    for (const [canonicalKey, signalField] of Object.entries(
      ATTENTION_SIGNAL_MAP
    )) {
      if (a.signals[signalField as keyof GovernanceSignals]) {
        attention.set(canonicalKey, (attention.get(canonicalKey) ?? 0) + 1);
      }
    }

    if (a.impactLevel) {
      impact.set(a.impactLevel, (impact.get(a.impactLevel) ?? 0) + 1);
    }

    risk.set(a.riskLevel, (risk.get(a.riskLevel) ?? 0) + 1);
  }

  return { systems, platforms, owners, attention, impact, risk };
}

export function filterAutomations(
  automations: PortfolioAutomation[],
  filters: PortfolioFilters
): PortfolioAutomation[] {
  let result = automations;

  // Search: case-insensitive partial match on name
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (a) => a.name && a.name.toLowerCase().includes(q)
    );
  }

  // TODO: Epic 10 — systems filter no-op until R2 adds system data back
  // Systems: automation has ANY selected system
  // if (filters.systems.length > 0) { ... }

  // Platforms
  if (filters.platforms.length > 0) {
    const set = new Set(filters.platforms);
    result = result.filter((a) => set.has(a.platform));
  }

  // TODO: Epic 10 — owners filter no-op until R2 adds owner concept back
  // Owners: _none sentinel matches null
  // if (filters.owners.length > 0) { ... }

  // Attention: automation has ANY selected governance signal active
  if (filters.attention.length > 0) {
    result = result.filter((a) =>
      filters.attention.some((key) => {
        const signalField = ATTENTION_SIGNAL_MAP[key];
        return signalField ? a.signals[signalField] : false;
      })
    );
  }

  // Impact
  if (filters.impact.length > 0) {
    const set = new Set(filters.impact);
    result = result.filter((a) => a.impactLevel !== null && set.has(a.impactLevel));
  }

  // Risk
  if (filters.risk.length > 0) {
    const set = new Set(filters.risk);
    result = result.filter((a) => set.has(a.riskLevel));
  }

  // updatedAfter: parse "{N}d" → cutoff date
  if (filters.updatedAfter) {
    const match = filters.updatedAfter.match(/^(\d+)d$/);
    if (match) {
      const days = parseInt(match[1], 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffISO = cutoff.toISOString();
      result = result.filter(
        (a) => a.automationLastUpdated !== null && a.automationLastUpdated >= cutoffISO
      );
    }
  }

  // TODO: Epic 10 — minSystems filter no-op until R2 adds system data back

  return result;
}

export function sortAutomations(
  automations: PortfolioAutomation[],
  sort: PortfolioFilters["sort"],
  order: PortfolioFilters["order"]
): PortfolioAutomation[] {
  const sorted = [...automations].sort((a, b) => {
    let aVal: string | null;
    let bVal: string | null;

    if (sort === "name") {
      aVal = a.name;
      bVal = b.name;
    } else {
      aVal = a[sort];
      bVal = b[sort];
    }

    // Nulls last regardless of order
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;

    let cmp: number;
    if (sort === "name") {
      cmp = aVal.localeCompare(bVal);
    } else {
      // ISO string comparison for dates
      cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    }

    return order === "asc" ? cmp : -cmp;
  });

  return sorted;
}

const DEFAULT_FILTERS: PortfolioFilters = {
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
};

export function parseFiltersFromParams(
  params: URLSearchParams
): PortfolioFilters {
  const sort = params.get("sort");
  const order = params.get("order");
  const updatedAfter = params.get("updatedAfter");
  const minSystems = params.get("minSystems");

  return {
    search: params.get("search") ?? DEFAULT_FILTERS.search,
    systems: params.getAll("system"),
    platforms: params.getAll("platform"),
    owners: params.getAll("owner"),
    attention: params.getAll("attention"),
    impact: params.getAll("impact"),
    risk: params.getAll("risk"),
    sort:
      sort === "automationLastUpdated" ||
      sort === "name"
        ? sort
        : DEFAULT_FILTERS.sort,
    order:
      order === "asc" || order === "desc" ? order : DEFAULT_FILTERS.order,
    updatedAfter: updatedAfter ?? DEFAULT_FILTERS.updatedAfter,
    minSystems: minSystems !== null ? parseInt(minSystems, 10) : DEFAULT_FILTERS.minSystems,
  };
}

export function filtersToSearchString(filters: PortfolioFilters): string {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  for (const s of filters.systems) params.append("system", s);
  for (const p of filters.platforms) params.append("platform", p);
  for (const o of filters.owners) params.append("owner", o);
  for (const a of filters.attention) params.append("attention", a);
  for (const i of filters.impact) params.append("impact", i);
  for (const r of filters.risk) params.append("risk", r);
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);
  if (filters.order !== DEFAULT_FILTERS.order)
    params.set("order", filters.order);
  if (filters.updatedAfter !== null)
    params.set("updatedAfter", filters.updatedAfter);
  if (filters.minSystems !== null)
    params.set("minSystems", String(filters.minSystems));

  return params.toString();
}

export function hasActiveFilters(filters: PortfolioFilters): boolean {
  return (
    filters.search !== "" ||
    filters.systems.length > 0 ||
    filters.platforms.length > 0 ||
    filters.owners.length > 0 ||
    filters.attention.length > 0 ||
    filters.impact.length > 0 ||
    filters.risk.length > 0 ||
    filters.updatedAfter !== null ||
    filters.minSystems !== null
  );
}

export function getActiveFilterChips(
  filters: PortfolioFilters
): { category: string; label: string; onRemove: PortfolioFilters }[] {
  const chips: {
    category: string;
    label: string;
    onRemove: PortfolioFilters;
  }[] = [];

  if (filters.search) {
    chips.push({
      category: "Search",
      label: filters.search,
      onRemove: { ...filters, search: "" },
    });
  }

  for (const s of filters.systems) {
    chips.push({
      category: "System",
      label: s,
      onRemove: {
        ...filters,
        systems: filters.systems.filter((v) => v !== s),
      },
    });
  }

  for (const p of filters.platforms) {
    chips.push({
      category: "Platform",
      label: p,
      onRemove: {
        ...filters,
        platforms: filters.platforms.filter((v) => v !== p),
      },
    });
  }

  for (const o of filters.owners) {
    chips.push({
      category: "Owner",
      label: o === "_none" ? "No owner" : o,
      onRemove: {
        ...filters,
        owners: filters.owners.filter((v) => v !== o),
      },
    });
  }

  for (const a of filters.attention) {
    chips.push({
      category: "Attention",
      label: ATTENTION_LABELS[a] ?? a,
      onRemove: {
        ...filters,
        attention: filters.attention.filter((v) => v !== a),
      },
    });
  }

  for (const i of filters.impact) {
    chips.push({
      category: "Impact",
      label: i,
      onRemove: {
        ...filters,
        impact: filters.impact.filter((v) => v !== i),
      },
    });
  }

  for (const r of filters.risk) {
    chips.push({
      category: "Risk",
      label: r,
      onRemove: {
        ...filters,
        risk: filters.risk.filter((v) => v !== r),
      },
    });
  }

  if (filters.updatedAfter !== null) {
    const match = filters.updatedAfter.match(/^(\d+)d$/);
    const label = match
      ? `Updated: last ${match[1]} days`
      : filters.updatedAfter;
    chips.push({
      category: "Updated",
      label,
      onRemove: { ...filters, updatedAfter: null },
    });
  }

  if (filters.minSystems !== null) {
    chips.push({
      category: "Systems",
      label: `${filters.minSystems}+ systems`,
      onRemove: { ...filters, minSystems: null },
    });
  }

  return chips;
}
