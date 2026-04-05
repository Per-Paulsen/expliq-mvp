// TODO: Epic 10 — R1 detail view stubbed. R2 detail view (Epic 16) will
// replace this with process-centric layout showing businessNarrative, impact
// Json, detectability, technicalEvidence, etc.
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, RISK_COLORS } from "@/lib/badge-colors";
import { formatRelativeTime } from "@/lib/format";
import type { AutomationDetail } from "@/lib/automation-detail-types";

export function AutomationDetailView({
  automation,
}: {
  automation: AutomationDetail;
}) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 2) {
      router.back();
    } else {
      router.push("/automations");
    }
  }

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to Automations
      </button>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row lg:gap-8">
        {/* Governance sidebar */}
        <aside className="mb-6 w-full lg:mb-0 lg:w-[35%] lg:order-2">
          <div className="space-y-4">
            {/* Risk card */}
            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-sm font-medium">Risk</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={cn(
                      "border-0",
                      RISK_COLORS[automation.riskLevel] ?? ""
                    )}
                  >
                    {automation.riskLevel.charAt(0).toUpperCase() +
                      automation.riskLevel.slice(1)}{" "}
                    risk
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Metadata section */}
            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-sm font-medium">Metadata</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Automation updated
                    </span>
                    <span>
                      {automation.automationLastUpdated
                        ? formatRelativeTime(automation.automationLastUpdated)
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions section */}
            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-sm font-medium">Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {automation.n8nWorkflowUrl && (
                    <a
                      href={automation.n8nWorkflowUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        Open in n8n &#x2197;
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 lg:order-1 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold">
              {automation.name ?? "Untitled automation"}
            </h1>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{automation.platform}</Badge>
            <Badge
              className={cn(
                "border-0",
                STATUS_COLORS[automation.effectiveStatus] ??
                  "bg-secondary text-secondary-foreground"
              )}
            >
              {automation.effectiveStatus.charAt(0).toUpperCase() +
                automation.effectiveStatus.slice(1)}
            </Badge>
          </div>

          <Separator />

          <p className="text-sm text-muted-foreground italic">
            R2 analysis view coming soon. Run Sync &amp; Analyze from Settings
            to populate new fields.
          </p>
        </div>
      </div>
    </div>
  );
}
