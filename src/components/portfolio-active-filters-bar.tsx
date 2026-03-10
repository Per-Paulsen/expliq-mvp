"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PortfolioFilters } from "@/lib/portfolio-types";
import { getActiveFilterChips, hasActiveFilters } from "@/lib/portfolio-filters";

interface PortfolioActiveFiltersBarProps {
  filters: PortfolioFilters;
  onUpdateFilters: (
    updater: (f: PortfolioFilters) => PortfolioFilters
  ) => void;
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

export function PortfolioActiveFiltersBar({
  filters,
  onUpdateFilters,
}: PortfolioActiveFiltersBarProps) {
  if (!hasActiveFilters(filters)) return null;

  const chips = getActiveFilterChips(filters);

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/50 p-2">
      {chips.map((chip, i) => (
        <Badge
          key={`${chip.category}-${chip.label}-${i}`}
          variant="secondary"
          className="gap-1 pr-1"
        >
          {chip.category}: {chip.label}
          <button
            type="button"
            onClick={() => onUpdateFilters(() => chip.onRemove)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-5 text-xs"
        onClick={() => onUpdateFilters(() => DEFAULT_FILTERS)}
      >
        Clear all
      </Button>
    </div>
  );
}
