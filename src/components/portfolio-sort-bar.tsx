"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PortfolioSortBarProps {
  sort: string;
  order: string;
  onSortChange: (sort: string) => void;
  onOrderToggle: () => void;
  resultCount: number;
}

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "automationLastUpdated", label: "Automation Last Updated" },
  { value: "documentationLastUpdated", label: "Documentation Last Updated" },
  { value: "name", label: "Name" },
];

export function PortfolioSortBar({
  sort,
  order,
  onSortChange,
  onOrderToggle,
  resultCount,
}: PortfolioSortBarProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">
        {resultCount} {resultCount === 1 ? "automation" : "automations"}
      </span>
      <div className="flex items-center gap-2">
        <Select value={sort} onValueChange={(v) => { if (v) onSortChange(v); }}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={onOrderToggle} className="size-7 p-0">
          {order === "asc" ? (
            <ArrowUp className="size-4" />
          ) : (
            <ArrowDown className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
