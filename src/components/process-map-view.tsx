"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProcessCard } from "@/components/process-card";
import { UnifiedCard } from "@/components/unified-card";
import { EmptyState } from "@/components/empty-state";

export interface ProcessMapWorkflow {
  id: string;
  name: string;
  governanceDot: "healthy" | "attention" | "critical";
  businessNarrative: string;
  metric: string | null;
  scope: string | null;
  processName: string;
}

export interface ProcessMapGap {
  stepName: string;
  processId: string;
  recommendationCount: number;
}

export interface ProcessMapProcess {
  id: string;
  name: string;
  automatedSteps: number;
  totalSteps: number;
  coveragePercentage: number;
  reliability: number | null;
  recommendationCount: number;
  maturityLevel: string | null;
  valueAtStake: string | null;
  workflows: ProcessMapWorkflow[];
  gaps: ProcessMapGap[];
}

export interface ProcessMapViewProps {
  processes: ProcessMapProcess[];
}

export function ProcessMapView({ processes }: ProcessMapViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showGaps, setShowGaps] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { filteredProcesses, autoExpandIds } = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return { filteredProcesses: processes, autoExpandIds: new Set<string>() };
    }

    const matched: ProcessMapProcess[] = [];
    const expand = new Set<string>();

    for (const process of processes) {
      const nameMatch = process.name.toLowerCase().includes(query);
      const workflowMatch = process.workflows.some((w) =>
        w.name.toLowerCase().includes(query),
      );

      if (nameMatch || workflowMatch) {
        matched.push(process);
        if (workflowMatch) {
          expand.add(process.id);
        }
      }
    }

    return { filteredProcesses: matched, autoExpandIds: expand };
  }, [searchQuery, processes]);

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function isExpanded(id: string) {
    return expandedIds.has(id) || autoExpandIds.has(id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Process Map</h1>
        <p className="text-sm text-text-secondary mt-1">
          Process-centric view of your automation landscape
        </p>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search processes or workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-border rounded-lg text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>

        {/* Show gaps toggle */}
        <button
          type="button"
          onClick={() => setShowGaps(!showGaps)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-foreground transition shrink-0"
        >
          <span>Show gaps</span>
          <div
            className={cn(
              "relative w-9 h-5 rounded-full transition-colors",
              showGaps ? "bg-primary" : "bg-border",
            )}
          >
            <div
              className={cn(
                "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                showGaps && "translate-x-4",
              )}
            />
          </div>
        </button>
      </div>

      {/* Process list */}
      {filteredProcesses.length === 0 ? (
        <EmptyState message="No processes to display" />
      ) : (
        <div className="space-y-4">
          {filteredProcesses.map((process) => {
            const open = isExpanded(process.id);
            return (
              <div
                key={process.id}
                className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden"
              >
                {/* Collapsible header — ProcessCard as clickable header */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(process.id)}
                  className="w-full flex items-center cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <ProcessCard
                      name={process.name}
                      maturityLevel={process.maturityLevel}
                      automatedSteps={process.automatedSteps}
                      totalSteps={process.totalSteps}
                      coverage={process.coveragePercentage}
                      reliability={process.reliability}
                      recommendations={process.recommendationCount}
                      valueAtStake={process.valueAtStake}
                      className="border-0 shadow-none rounded-none hover:border-transparent"
                    />
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-5 h-5 text-text-tertiary shrink-0 mr-4 transition-transform duration-200",
                      open && "rotate-90",
                    )}
                  />
                </button>

                {/* Expanded content */}
                {open && (
                  <div className="px-5 pb-5 pt-2 border-t border-border">
                    <div className="space-y-4">
                      {process.workflows.map((workflow) => (
                        <Link
                          key={workflow.id}
                          href={`/automations/${workflow.id}`}
                        >
                          <UnifiedCard
                            type="attention"
                            severity={
                              workflow.governanceDot === "critical"
                                ? "critical"
                                : workflow.governanceDot === "attention"
                                  ? "attention"
                                  : undefined
                            }
                            name={workflow.name}
                            description={workflow.businessNarrative}
                            metric={workflow.metric ?? "Active"}
                            scope={workflow.scope ?? undefined}
                            process={workflow.processName}
                          />
                        </Link>
                      ))}

                      {/* Gap cards — only when toggle is ON */}
                      {showGaps &&
                        process.gaps.map((gap) => (
                          <Link
                            key={`gap-${gap.processId}-${gap.stepName}`}
                            href={`/opportunities?process=${gap.processId}`}
                          >
                            <div className="border-dashed border-2 border-text-tertiary/30 rounded-xl p-4 hover:border-text-tertiary/50 transition cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-[15px] font-semibold text-foreground">
                                    {gap.stepName}
                                  </p>
                                  <p className="text-xs text-text-tertiary mt-0.5">
                                    Gap
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  {gap.recommendationCount > 0 && (
                                    <span className="text-sm font-mono font-semibold text-primary">
                                      {gap.recommendationCount}{" "}
                                      {gap.recommendationCount === 1
                                        ? "recommendation"
                                        : "recommendations"}
                                    </span>
                                  )}
                                  <span className="text-sm text-primary font-medium">
                                    View opportunities &rarr;
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}

                      {process.workflows.length === 0 && !showGaps && (
                        <p className="text-sm text-text-tertiary py-4">
                          No workflows mapped to this process
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
