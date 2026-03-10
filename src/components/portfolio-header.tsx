"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} months ago`;
}

interface PortfolioHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  lastSyncAt: string | null;
}

export function PortfolioHeader({
  search,
  onSearchChange,
  lastSyncAt,
}: PortfolioHeaderProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Automations</h1>
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search automations..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {lastSyncAt
            ? `Last synced: ${formatRelativeTime(lastSyncAt)}`
            : "Never synced"}
        </span>
      </div>
    </div>
  );
}
