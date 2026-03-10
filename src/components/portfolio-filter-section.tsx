"use client";

import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PortfolioFilterChips } from "@/components/portfolio-filter-chips";
import { PortfolioActiveFiltersBar } from "@/components/portfolio-active-filters-bar";
import type { GlobalCounts, PortfolioFilters } from "@/lib/portfolio-types";
import { ATTENTION_LABELS } from "@/lib/portfolio-types";
import { hasActiveFilters } from "@/lib/portfolio-filters";

function mapToItems(
  map: Map<string, number>,
  labelFn?: (key: string) => string
) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      value: key,
      label: labelFn ? labelFn(key) : key,
      count,
    }));
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface PortfolioFilterSectionProps {
  globalCounts: GlobalCounts;
  filters: PortfolioFilters;
  filterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  onToggleFilter: (category: string, value: string) => void;
  onClearCategory: (category: string) => void;
  onUpdateFilters: (
    updater: (f: PortfolioFilters) => PortfolioFilters
  ) => void;
}

export function PortfolioFilterSection({
  globalCounts,
  filters,
  filterOpen,
  onFilterOpenChange,
  onToggleFilter,
  onClearCategory,
  onUpdateFilters,
}: PortfolioFilterSectionProps) {
  const activeCategories = [
    filters.systems.length > 0,
    filters.platforms.length > 0,
    filters.owners.length > 0,
    filters.attention.length > 0,
    filters.impact.length > 0,
    filters.risk.length > 0,
  ].filter(Boolean).length;

  return (
    <Collapsible open={filterOpen} onOpenChange={onFilterOpenChange}>
      <CollapsibleTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Filter className="size-4" />
            Filters
            {activeCategories > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeCategories}
              </Badge>
            )}
            {filterOpen ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        }
      />

      {!filterOpen && hasActiveFilters(filters) && (
        <div className="mt-2">
          <PortfolioActiveFiltersBar
            filters={filters}
            onUpdateFilters={onUpdateFilters}
          />
        </div>
      )}

      <CollapsibleContent>
        <div className="mt-3 space-y-2.5 rounded-lg border p-3">
          <PortfolioFilterChips
            label="Systems"
            items={mapToItems(globalCounts.systems)}
            selected={filters.systems}
            onToggle={(v) => onToggleFilter("systems", v)}
            onClear={() => onClearCategory("systems")}
          />
          <PortfolioFilterChips
            label="Platform"
            items={mapToItems(globalCounts.platforms)}
            selected={filters.platforms}
            onToggle={(v) => onToggleFilter("platforms", v)}
            onClear={() => onClearCategory("platforms")}
          />
          <PortfolioFilterChips
            label="Owner"
            items={mapToItems(globalCounts.owners, (k) =>
              k === "No owner" ? "No owner" : k
            ).map((item) =>
              item.value === "No owner"
                ? { ...item, value: "_none" }
                : item
            )}
            selected={filters.owners}
            onToggle={(v) => onToggleFilter("owners", v)}
            onClear={() => onClearCategory("owners")}
          />
          <PortfolioFilterChips
            label="Attention"
            items={mapToItems(globalCounts.attention, (k) =>
              ATTENTION_LABELS[k] ?? k
            )}
            selected={filters.attention}
            onToggle={(v) => onToggleFilter("attention", v)}
            onClear={() => onClearCategory("attention")}
          />
          <PortfolioFilterChips
            label="Impact"
            items={mapToItems(globalCounts.impact, capitalize)}
            selected={filters.impact}
            onToggle={(v) => onToggleFilter("impact", v)}
            onClear={() => onClearCategory("impact")}
          />
          <PortfolioFilterChips
            label="Risk"
            items={mapToItems(globalCounts.risk, capitalize)}
            selected={filters.risk}
            onToggle={(v) => onToggleFilter("risk", v)}
            onClear={() => onClearCategory("risk")}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
