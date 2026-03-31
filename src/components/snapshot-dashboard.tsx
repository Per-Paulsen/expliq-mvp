import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/metric-card";
import { ExpliqCard } from "@/components/expliq-card";
import { ExpliqBadge } from "@/components/expliq-badge";
import { ProgressBar } from "@/components/progress-bar";
import { formatRelativeTime } from "@/lib/format";
import type { SnapshotData } from "@/lib/snapshot-types";
import {
  Zap,
  AlertTriangle,
  UserX,
  Clock,
  Activity,
} from "lucide-react";

interface SnapshotDashboardProps {
  data: SnapshotData;
}

interface MetricCardConfig {
  key: keyof import("@/lib/snapshot-types").SnapshotMetrics;
  label: string;
  subtitle?: string;
  href: string;
  icon: React.ReactNode;
  accentColor?: string;
}

const metricCards: MetricCardConfig[] = [
  {
    key: "totalAutomations",
    label: "Total Automations",
    href: "/automations",
    icon: <Zap className="w-5 h-5" />,
  },
  {
    key: "highImpactCount",
    label: "High Impact",
    subtitle: "Business critical",
    href: "/automations?impact=critical&impact=high",
    icon: <Activity className="w-5 h-5" />,
  },
  {
    key: "highRiskCount",
    label: "High Risk",
    subtitle: "Need attention",
    href: "/automations?risk=high",
    icon: <AlertTriangle className="w-5 h-5" />,
    accentColor: "#f59e0b",
  },
  {
    key: "missingOwnersCount",
    label: "Missing Owners",
    subtitle: "Unassigned",
    href: "/automations?attention=no-owner",
    icon: <UserX className="w-5 h-5" />,
  },
  {
    key: "overdueReviewsCount",
    label: "Overdue Reviews",
    subtitle: "Past due date",
    href: "/automations?attention=overdue-review",
    icon: <Clock className="w-5 h-5" />,
  },
];

export function SnapshotDashboard({ data }: SnapshotDashboardProps) {
  const {
    metrics,
    systemExposure,
    ownerExposure,
    recentlyChanged,
    multiSystem,
    hasMoreRecentlyChanged,
    hasMoreMultiSystem,
  } = data;

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

  const maxSystemScore =
    systemExposure.length > 0 ? systemExposure[0].exposureScore : 0;
  const maxOwnerScore =
    ownerExposure.length > 0 ? ownerExposure[0].exposureScore : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Workspace Snapshot
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Overview of your automation portfolio
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {metricCards.map(({ key, label, subtitle, href, icon, accentColor }) => (
          <Link key={key} href={href}>
            <MetricCard
              title={label}
              value={metrics[key]}
              subtitle={subtitle}
              icon={icon}
              accentColor={accentColor}
              className="cursor-pointer h-full"
            />
          </Link>
        ))}
      </div>

      {/* Exposure Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Exposure */}
        <ExpliqCard className="p-6">
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold">System Exposure</h2>
              <p className="text-sm text-neutral-500 mt-0.5">
                Ranked by automation dependency
              </p>
            </div>
            {systemExposure.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No systems detected
              </p>
            ) : (
              <div className="space-y-4">
                {systemExposure.map((s) => {
                  const pct =
                    maxSystemScore > 0
                      ? (s.exposureScore / maxSystemScore) * 100
                      : 0;
                  return (
                    <Link
                      key={s.system}
                      href={`/automations?system=${encodeURIComponent(s.system)}`}
                      className="block group"
                    >
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-medium group-hover:text-teal-600 transition">
                          {s.system}
                        </span>
                        <span className="text-neutral-400 text-xs">
                          {s.exposureScore} &middot;{" "}
                          {s.automationCount} automation
                          {s.automationCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <ProgressBar value={pct} height="sm" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </ExpliqCard>

        {/* Owner Exposure */}
        <ExpliqCard className="p-6">
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Owner Exposure</h2>
              <p className="text-sm text-neutral-500 mt-0.5">
                Automation ownership distribution
              </p>
            </div>
            {ownerExposure.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No owners detected
              </p>
            ) : (
              <div className="space-y-4">
                {ownerExposure.map((o) => {
                  const pct =
                    maxOwnerScore > 0
                      ? (o.exposureScore / maxOwnerScore) * 100
                      : 0;
                  return (
                    <Link
                      key={o.owner}
                      href={`/automations?owner=${o.owner === "Unassigned" ? "_none" : encodeURIComponent(o.owner)}`}
                      className="block group"
                    >
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium group-hover:text-teal-600 transition ${
                              o.owner === "Unassigned"
                                ? "text-amber-700"
                                : ""
                            }`}
                          >
                            {o.owner}
                          </span>
                          <span className="text-xs text-neutral-400">
                            {o.automationCount} automation
                            {o.automationCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <span className="text-neutral-400 text-xs">
                          {o.exposureScore}
                        </span>
                      </div>
                      <ProgressBar value={pct} height="sm" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </ExpliqCard>
      </div>

      {/* Recently Changed & Multi-System */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Changed */}
        <ExpliqCard className="p-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Recently Changed</h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Latest automation updates
                </p>
              </div>
              {hasMoreRecentlyChanged && (
                <Link
                  href="/automations?updatedAfter=7d&sort=automationLastUpdated&order=desc"
                  className="text-sm font-medium text-teal-600 hover:text-teal-700 transition"
                >
                  View all
                </Link>
              )}
            </div>
            {recentlyChanged.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent changes
              </p>
            ) : (
              <div className="space-y-1">
                {recentlyChanged.map((a) => (
                  <Link
                    key={a.id}
                    href={`/automations/${a.id}`}
                    className="flex items-center justify-between text-sm hover:bg-neutral-50 rounded-lg px-3 py-2.5 -mx-3 transition group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium group-hover:text-teal-600 transition truncate">
                        {a.name ?? "Untitled automation"}
                      </div>
                      <div className="flex gap-1.5 mt-1">
                        {a.systemsTouched.slice(0, 3).map((s) => (
                          <ExpliqBadge key={s} variant="system" size="sm">
                            {s}
                          </ExpliqBadge>
                        ))}
                        {a.systemsTouched.length > 3 && (
                          <ExpliqBadge variant="system" size="sm">
                            +{a.systemsTouched.length - 3}
                          </ExpliqBadge>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400 ml-3 whitespace-nowrap">
                      {a.automationLastUpdated
                        ? formatRelativeTime(
                            a.automationLastUpdated.toISOString(),
                          )
                        : ""}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </ExpliqCard>

        {/* Multi-System Automations */}
        <ExpliqCard className="p-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Multi-System Automations
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Complex cross-platform workflows
                </p>
              </div>
              {hasMoreMultiSystem && (
                <Link
                  href="/automations?minSystems=3"
                  className="text-sm font-medium text-teal-600 hover:text-teal-700 transition"
                >
                  View all
                </Link>
              )}
            </div>
            {multiSystem.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No multi-system automations
              </p>
            ) : (
              <div className="space-y-1">
                {multiSystem.map((a) => (
                  <Link
                    key={a.id}
                    href={`/automations/${a.id}`}
                    className="block hover:bg-neutral-50 rounded-lg px-3 py-2.5 -mx-3 transition group"
                  >
                    <div className="flex items-center gap-2">
                      <ExpliqBadge variant="status" size="sm">
                        {a.systemsTouched.length} systems
                      </ExpliqBadge>
                      <span className="font-medium text-sm group-hover:text-teal-600 transition">
                        {a.name ?? "Untitled automation"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {a.systemsTouched.slice(0, 4).map((s) => (
                        <ExpliqBadge key={s} variant="system" size="sm">
                          {s}
                        </ExpliqBadge>
                      ))}
                      {a.systemsTouched.length > 4 && (
                        <ExpliqBadge variant="system" size="sm">
                          +{a.systemsTouched.length - 4}
                        </ExpliqBadge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </ExpliqCard>
      </div>
    </div>
  );
}
