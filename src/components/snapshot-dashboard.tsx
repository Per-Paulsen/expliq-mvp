// TODO: Epic 10 — R1 snapshot dashboard trimmed. R2 dashboard (Epic 13) will
// replace this with process-centric view from CompanyProfile data.
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import type { SnapshotData } from "@/lib/snapshot-types";

interface SnapshotDashboardProps {
  data: SnapshotData;
}

const metricCards = [
  { key: "totalAutomations" as const, label: "Total Automations", href: "/automations" },
  { key: "highImpactCount" as const, label: "High Impact", href: "/automations?impact=critical&impact=high" },
  { key: "highRiskCount" as const, label: "High Risk", href: "/automations?risk=high" },
] as const;

export function SnapshotDashboard({ data }: SnapshotDashboardProps) {
  const { metrics, recentlyChanged, hasMoreRecentlyChanged } = data;

  if (metrics.totalAutomations === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Workspace Snapshot</h1>
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <p className="text-muted-foreground mb-4">
            No automations found. Connect a platform to get started.
          </p>
          <Link href="/settings">
            <Button>Go to Settings</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Workspace Snapshot</h1>

      {/* Metrics row */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {metricCards.map(({ key, label, href }) => (
          <Link key={key} href={href}>
            <Card className="hover:ring-foreground/20 transition-shadow cursor-pointer">
              <CardContent>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{metrics[key]}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recently changed */}
      <div className="mt-6 grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recently Changed</span>
              {hasMoreRecentlyChanged && (
                <Link
                  href="/automations?updatedAfter=7d&sort=automationLastUpdated&order=desc"
                  className="text-sm font-normal text-primary hover:underline"
                >
                  View all
                </Link>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentlyChanged.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent changes</p>
            ) : (
              <div className="space-y-2">
                {recentlyChanged.map((a) => (
                  <Link
                    key={a.id}
                    href={`/automations/${a.id}`}
                    className="flex items-center justify-between text-sm hover:bg-muted rounded px-2 py-1 -mx-2"
                  >
                    <span>{a.name ?? "Untitled automation"}</span>
                    <span className="text-muted-foreground">
                      {a.automationLastUpdated
                        ? formatRelativeTime(a.automationLastUpdated.toISOString())
                        : ""}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
