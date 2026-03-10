"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  parseFiltersFromParams,
  computeGlobalCounts,
  filterAutomations,
  sortAutomations,
  filtersToSearchString,
} from "@/lib/portfolio-filters";
import type { PortfolioAutomation, PortfolioFilters } from "@/lib/portfolio-types";
import { PortfolioHeader } from "@/components/portfolio-header";
import { PortfolioFilterSection } from "@/components/portfolio-filter-section";
import { PortfolioSortBar } from "@/components/portfolio-sort-bar";
import { PortfolioAutomationCard } from "@/components/portfolio-automation-card";
import { Button } from "@/components/ui/button";

interface PortfolioViewProps {
  automations: PortfolioAutomation[];
  lastSyncAt: string | null;
}

export function PortfolioView({ automations, lastSyncAt }: PortfolioViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filterOpen, setFilterOpen] = useState(false);

  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams]
  );

  const globalCounts = useMemo(
    () => computeGlobalCounts(automations),
    [automations]
  );

  const filtered = useMemo(
    () => filterAutomations(automations, filters),
    [automations, filters]
  );

  const sorted = useMemo(
    () => sortAutomations(filtered, filters.sort, filters.order),
    [filtered, filters.sort, filters.order]
  );

  function updateFilters(
    updater: (f: PortfolioFilters) => PortfolioFilters
  ) {
    const next = updater(filters);
    const qs = filtersToSearchString(next);
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  function toggleFilter(category: string, value: string) {
    updateFilters((f) => {
      const key = category as keyof PortfolioFilters;
      const current = f[key] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...f, [category]: next };
    });
  }

  function clearCategory(category: string) {
    updateFilters((f) => ({ ...f, [category]: [] }));
  }

  return (
    <div className="space-y-4 p-6">
      <PortfolioHeader
        search={filters.search}
        onSearchChange={(search) => updateFilters((f) => ({ ...f, search }))}
        lastSyncAt={lastSyncAt}
      />

      <PortfolioFilterSection
        globalCounts={globalCounts}
        filters={filters}
        filterOpen={filterOpen}
        onFilterOpenChange={setFilterOpen}
        onToggleFilter={toggleFilter}
        onClearCategory={clearCategory}
        onUpdateFilters={updateFilters}
      />

      <PortfolioSortBar
        sort={filters.sort}
        order={filters.order}
        onSortChange={(sort) => updateFilters((f) => ({ ...f, sort: sort as PortfolioFilters["sort"] }))}
        onOrderToggle={() =>
          updateFilters((f) => ({
            ...f,
            order: f.order === "asc" ? "desc" : "asc",
          }))
        }
        resultCount={sorted.length}
      />

      {automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <h2 className="text-lg font-semibold">No automations yet</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Connect your automation platform in Settings and run a sync to get
            started.
          </p>
          <Link href="/settings">
            <Button>Go to Settings</Button>
          </Link>
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <h2 className="text-lg font-semibold">
            No automations match your current filters
          </h2>
          <Button
            variant="outline"
            onClick={() =>
              updateFilters(() => ({
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
              }))
            }
          >
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sorted.map((automation) => (
            <PortfolioAutomationCard
              key={automation.id}
              automation={automation}
            />
          ))}
        </div>
      )}
    </div>
  );
}
