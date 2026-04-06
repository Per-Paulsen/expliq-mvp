"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Bot, Activity, ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EstimateCard } from "@/components/estimate-card";
import { UnifiedCard } from "@/components/unified-card";
import { ProcessCard } from "@/components/process-card";
import type {
  DeltaSegment,
  NextMoveRecommendation,
  AttentionItem,
  OpportunityItem,
  ProcessCoverageItem,
  KpiDeltas,
} from "@/lib/dashboard-data";

export interface DashboardViewProps {
  deltaSummary: string | null;
  deltaSegments: DeltaSegment[];
  nextMoveRecommendations: NextMoveRecommendation[];
  totalOpportunityValue: string | null;
  workflowCount: number;
  processCount: number;
  systemCount: number;
  activeCount: number;
  recommendationCount: number;
  aggregateEstimates: {
    totalTimeSavings?: string;
    totalValueAtRisk?: string;
  } | null;
  kpiDeltas: KpiDeltas;
  attentionItems: AttentionItem[];
  topOpportunities: OpportunityItem[];
  processCoverage: ProcessCoverageItem[];
  systemLandscape: Array<{
    name: string;
    workflowCount: number;
  }>;
}


const segmentColor: Record<DeltaSegment["type"], string> = {
  neutral: "text-foreground",
  positive: "text-status-healthy",
  negative: "text-status-attention",
  info: "text-primary",
};

export function DashboardView(props: DashboardViewProps) {
  const [deltaDismissed, setDeltaDismissed] = useState(false);

  const showDelta =
    !deltaDismissed &&
    (props.deltaSegments.length > 0 || props.deltaSummary);

  const firstRec = props.nextMoveRecommendations[0] ?? null;
  const secondRec = props.nextMoveRecommendations[1] ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Dashboard
        </h1>
        <p className="text-base text-text-tertiary mt-1">
          Automation Intelligence
        </p>
      </div>

      {/* 1. Delta Banner */}
      {showDelta && (
        <div className="bg-surface rounded-xl border border-primary/20 shadow-sm p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">
              Since last analysis
            </p>
            {props.deltaSegments.length > 0 ? (
              <p className="text-base text-foreground">
                {props.deltaSegments.map((seg, i) => {
                  const isNumeric = /^[+\-]?\d/.test(seg.text);
                  return (
                    <span
                      key={i}
                      className={`${segmentColor[seg.type]}${isNumeric ? " font-bold font-mono" : " font-medium"}`}
                    >
                      {i > 0 ? " " : ""}
                      {seg.text}
                    </span>
                  );
                })}
              </p>
            ) : (
              <p className="text-base text-foreground">{props.deltaSummary}</p>
            )}
          </div>
          <button
            onClick={() => setDeltaDismissed(true)}
            className="text-text-tertiary hover:text-foreground transition"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Your Next Move */}
      {firstRec && (
        <div className="border-l-[3px] border-primary bg-primary/[0.04] rounded-r-xl px-6 py-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Your Next Move
            </span>
          </div>

          <Link href={`/opportunities?highlight=${firstRec.id}`}>
            <UnifiedCard
              type="recommendation"
              tier={firstRec.tier}
              name={firstRec.name}
              description={firstRec.brief}
              metric={firstRec.impactEstimate}
              confidence={
                (firstRec.confidence?.toLowerCase().replace(/\s+/g, "-") as
                  | "data-driven"
                  | "benchmark-based"
                  | "ai-suggested") ?? undefined
              }
              scope={firstRec.scope ?? undefined}
              process={firstRec.processName ?? ""}
            />
          </Link>

          {secondRec && (
            <Link
              href={`/opportunities?highlight=${secondRec.id}`}
              className="rounded-lg border border-border bg-surface-raised p-4 flex items-center gap-4 mt-3 hover:border-text-tertiary/50 transition"
            >
              <span className="text-sm font-medium text-text-tertiary shrink-0">
                Then
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-foreground">
                  {secondRec.name}
                </p>
                <p className="text-sm text-text-secondary">{secondRec.brief}</p>
              </div>
              <span className="text-base font-bold font-mono text-primary shrink-0">
                {secondRec.impactEstimate}
              </span>
              <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />
            </Link>
          )}

          {props.totalOpportunityValue && (() => {
            return (
              <p className="text-sm text-text-tertiary mt-3">
                <span className="font-bold font-mono text-primary">
                  {props.nextMoveRecommendations.length}
                </span>{" "}
                moves, total impact:{" "}
                <span className="font-bold font-mono text-primary">
                  {props.totalOpportunityValue}
                </span>
              </p>
            );
          })()}
        </div>
      )}

      {/* 3. Facts Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Overview</p>
          <div className="space-y-4">
            {/* Processes */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Processes</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-mono text-foreground">{props.processCount}</span>
                {props.kpiDeltas.processes?.delta && (
                  <span className={cn("text-sm", props.kpiDeltas.processes.deltaType === "positive" ? "text-status-healthy" : props.kpiDeltas.processes.deltaType === "negative" ? "text-status-attention" : "text-text-tertiary")}>
                    {props.kpiDeltas.processes.deltaType === "positive" && "↑ "}{props.kpiDeltas.processes.deltaType === "negative" && "↓ "}{props.kpiDeltas.processes.delta}
                  </span>
                )}
              </div>
            </div>
            <div className="border-t border-border" />
            {/* Workflows */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Workflows</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-mono text-foreground">{props.workflowCount}</span>
                {props.kpiDeltas.workflows?.delta && (
                  <span className={cn("text-sm", props.kpiDeltas.workflows.deltaType === "positive" ? "text-status-healthy" : props.kpiDeltas.workflows.deltaType === "negative" ? "text-status-attention" : "text-text-tertiary")}>
                    {props.kpiDeltas.workflows.deltaType === "positive" && "↑ "}{props.kpiDeltas.workflows.deltaType === "negative" && "↓ "}{props.kpiDeltas.workflows.delta}
                  </span>
                )}
              </div>
            </div>
            <div className="border-t border-border" />
            {/* Active */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Active</span>
              <span className="text-2xl font-bold font-mono text-foreground">{props.activeCount}</span>
            </div>
          </div>
        </div>
        <EstimateCard
          label="Time Saved"
          value={props.aggregateEstimates?.totalTimeSavings ?? "\u2014"}
          confidence="benchmark-based"
          deltaType="positive"
        />
        <EstimateCard
          label="At Risk"
          value={props.aggregateEstimates?.totalValueAtRisk ?? "\u2014"}
          confidence="benchmark-based"
          deltaType="negative"
        />
      </div>

      {/* 4. Attention + Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Attention */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              Needs Attention
            </h3>
            <Link href="/processes" className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">
              View all in Process Map <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {props.attentionItems.length === 0 ? (
            <p className="text-base text-text-tertiary py-8">
              No issues detected
            </p>
          ) : (
            <div className="space-y-4">
              {props.attentionItems.map((item) => (
                <Link key={item.id} href={`/automations/${item.id}`}>
                  <UnifiedCard
                    type="attention"
                    severity={
                      item.governanceDot === "critical"
                        ? "critical"
                        : "attention"
                    }
                    name={item.name}
                    description={item.businessNarrative}
                    metric={item.metric ?? "Needs review"}
                    scope={item.scope ?? undefined}
                    process={item.processName ?? ""}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Top Opportunities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              Top Opportunities
            </h3>
            <Link
              href="/opportunities"
              className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              View all in Opportunities <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {props.topOpportunities.length === 0 ? (
            <p className="text-base text-text-tertiary py-8">
              No recommendations yet
            </p>
          ) : (
            <div className="space-y-4">
              {props.topOpportunities.map((opp) => (
                <Link
                  key={opp.id}
                  href={`/opportunities?highlight=${opp.id}`}
                >
                  <UnifiedCard
                    type="recommendation"
                    tier={opp.tier}
                    name={opp.name}
                    description={opp.brief}
                    metric={opp.impactEstimate}
                    confidence={
                      (opp.confidence?.toLowerCase().replace(/\s+/g, "-") as
                        | "data-driven"
                        | "benchmark-based"
                        | "ai-suggested") ?? undefined
                    }
                    scope={
                      opp.scope && opp.scope !== opp.processName
                        ? opp.scope
                        : undefined
                    }
                    process={opp.processName ?? ""}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Process Coverage */}
      {props.processCoverage.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              Process Coverage
            </h3>
            <Link
              href="/processes"
              className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              Open Process Map <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {props.processCoverage.map((p) => (
              <Link key={p.id} href="/processes">
                <ProcessCard
                  name={p.name}
                  maturityLevel={p.maturityLevel}
                  automatedSteps={p.automatedSteps}
                  totalSteps={p.totalSteps}
                  coverage={p.coveragePercentage}
                  reliability={p.reliability}
                  recommendations={p.recommendationCount}
                  valueAtStake={p.valueAtStake}
                />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 6. Connected Systems */}
      {props.systemLandscape.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Connected Systems
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {props.systemLandscape.map((sys) => (
              <span
                key={sys.name}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface border border-border rounded-lg text-sm text-text-secondary shadow-sm"
              >
                {sys.name}{" "}
                <span className="font-mono font-bold text-foreground">
                  {sys.workflowCount}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
