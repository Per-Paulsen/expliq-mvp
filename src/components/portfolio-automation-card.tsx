"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PortfolioAutomation } from "@/lib/portfolio-types";
import { ATTENTION_LABELS, ATTENTION_SIGNAL_MAP } from "@/lib/portfolio-types";
import type { GovernanceSignals } from "@/lib/risk-engine";
import { STATUS_COLORS, RISK_COLORS, IMPACT_COLORS } from "@/lib/badge-colors";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

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
