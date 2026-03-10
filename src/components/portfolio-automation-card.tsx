"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PortfolioAutomation } from "@/lib/portfolio-types";
import { ATTENTION_LABELS, ATTENTION_SIGNAL_MAP } from "@/lib/portfolio-types";
import type { GovernanceSignals } from "@/lib/risk-engine";
import { cn } from "@/lib/utils";

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const RISK_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const IMPACT_COLORS: Record<string, string> = {
  critical: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export function PortfolioAutomationCard({
  automation,
}: {
  automation: PortfolioAutomation;
}) {
  const activeSignals = Object.entries(ATTENTION_SIGNAL_MAP).filter(
    ([, signalField]) =>
      automation.signals[signalField as keyof GovernanceSignals]
  );

  return (
    <Link href={`/automations/${automation.id}`} className="block">
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="flex gap-6">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-medium">
                {automation.name ?? "Untitled automation"}
              </h3>
              <Badge
                className={cn(
                  "border-0",
                  RISK_COLORS[automation.riskLevel] ?? ""
                )}
              >
                {automation.riskLevel} risk
              </Badge>
              {automation.impactLevel && (
                <Badge
                  className={cn(
                    "border-0",
                    IMPACT_COLORS[automation.impactLevel] ?? ""
                  )}
                >
                  {automation.impactLevel} impact
                </Badge>
              )}
            </div>

            {automation.systemsTouched.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {automation.systemsTouched.map((s) => (
                  <Badge key={s} variant="secondary" className="text-[10px]">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Badge>
                ))}
              </div>
            )}

            <p className="line-clamp-2 text-sm text-muted-foreground">
              {automation.description ?? "No description available"}
            </p>

            {activeSignals.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {activeSignals.map(([key]) => (
                  <Badge
                    key={key}
                    variant="destructive"
                    className="text-[10px]"
                  >
                    {ATTENTION_LABELS[key] ?? key}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
            <div className="flex items-center gap-1.5">
              <Badge
                className={cn(
                  "border-0",
                  STATUS_COLORS[automation.status] ?? "bg-secondary text-secondary-foreground"
                )}
              >
                {automation.status.charAt(0).toUpperCase() +
                  automation.status.slice(1)}
              </Badge>
              <Badge variant="outline">{automation.platform}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {automation.owner ?? "No owner"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Automation updated:{" "}
              {automation.automationLastUpdated
                ? formatRelativeTime(automation.automationLastUpdated)
                : "N/A"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Docs updated:{" "}
              {automation.documentationLastUpdated
                ? formatRelativeTime(automation.documentationLastUpdated)
                : "N/A"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
