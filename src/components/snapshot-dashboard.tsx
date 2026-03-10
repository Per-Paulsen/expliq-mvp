import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  { key: "missingOwnersCount" as const, label: "Missing Owners", href: "/automations?attention=no-owner" },
  { key: "overdueReviewsCount" as const, label: "Overdue Reviews", href: "/automations?attention=overdue-review" },
] as const;

export function SnapshotDashboard({ data }: SnapshotDashboardProps) {
  const { metrics, systemExposure, ownerExposure, recentlyChanged, multiSystem, hasMoreRecentlyChanged, hasMoreMultiSystem } = data;

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

  const maxSystemScore = systemExposure.length > 0 ? systemExposure[0].exposureScore : 0;
  const maxOwnerScore = ownerExposure.length > 0 ? ownerExposure[0].exposureScore : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold">Workspace Snapshot</h1>

      {/* Metrics row */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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

      {/* Exposure rankings */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System exposure */}
        <Card>
          <CardHeader>
            <CardTitle>System Exposure</CardTitle>
          </CardHeader>
          <CardContent>
            {systemExposure.length === 0 ? (
              <p className="text-sm text-muted-foreground">No systems detected</p>
            ) : (
              <div className="space-y-3">
                {systemExposure.map((s) => (
                  <Link
                    key={s.system}
                    href={`/automations?system=${encodeURIComponent(s.system)}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span>{s.system}</span>
                      <span className="text-muted-foreground">
                        {s.exposureScore} · {s.automationCount} automation{s.automationCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${(s.exposureScore / maxSystemScore) * 100}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Owner exposure */}
        <Card>
          <CardHeader>
            <CardTitle>Owner Exposure</CardTitle>
          </CardHeader>
          <CardContent>
            {ownerExposure.length === 0 ? (
              <p className="text-sm text-muted-foreground">No owners detected</p>
            ) : (
              <div className="space-y-3">
                {ownerExposure.map((o) => (
                  <Link
                    key={o.owner}
                    href={`/automations?owner=${o.owner === "Unassigned" ? "_none" : encodeURIComponent(o.owner)}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span>{o.owner}</span>
                      <span className="text-muted-foreground">
                        {o.exposureScore} · {o.automationCount} automation{o.automationCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${(o.exposureScore / maxOwnerScore) * 100}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Structural indicators */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently changed */}
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

        {/* Multi-system */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Multi-System Automations</span>
              {hasMoreMultiSystem && (
                <Link
                  href="/automations?minSystems=3"
                  className="text-sm font-normal text-primary hover:underline"
                >
                  View all
                </Link>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {multiSystem.length === 0 ? (
              <p className="text-sm text-muted-foreground">No multi-system automations</p>
            ) : (
              <div className="space-y-2">
                {multiSystem.map((a) => (
                  <Link
                    key={a.id}
                    href={`/automations/${a.id}`}
                    className="flex items-center justify-between text-sm hover:bg-muted rounded px-2 py-1 -mx-2"
                  >
                    <div className="flex items-center gap-2">
                      <span>{a.name ?? "Untitled automation"}</span>
                      <span className="text-muted-foreground">
                        {a.systemsTouched.length} systems
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {a.systemsTouched.slice(0, 4).map((s) => (
                        <Badge key={s} variant="secondary">
                          {s}
                        </Badge>
                      ))}
                      {a.systemsTouched.length > 4 && (
                        <Badge variant="outline">
                          +{a.systemsTouched.length - 4}
                        </Badge>
                      )}
                    </div>
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
