"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FilterChipsProps {
  label: string;
  items: { value: string; label: string; count: number }[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
}

export function PortfolioFilterChips({
  label,
  items,
  selected,
  onToggle,
  onClear,
}: FilterChipsProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {items.map((item) => {
        const isActive = selected.includes(item.value);
        return (
          <button key={item.value} type="button" onClick={() => onToggle(item.value)}>
            <Badge variant={isActive ? "secondary" : "outline"}>
              {item.label} ({item.count})
            </Badge>
          </button>
        );
      })}
      {selected.length > 0 && (
        <Button variant="ghost" size="sm" className="h-5 text-xs" onClick={onClear}>
          Clear
        </Button>
      )}
    </div>
  );
}
