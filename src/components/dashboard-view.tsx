"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Bot, ArrowRight, Sparkles } from "lucide-react";
import { StatusDot } from "@/components/status-dot";
import { TierBadge } from "@/components/tier-badge";
import { CoverageBar } from "@/components/coverage-bar";

export interface DashboardViewProps {
  deltaSummary: string | null;
  nextMoveText: string | null;
  workflowCount: number;
  processCount: number;
  systemCount: number;
  activeCount: number;
  recommendationCount: number;
  aggregateEstimates: {
    totalTimeSavings?: string;
    totalValueAtRisk?: string;
  } | null;
  attentionItems: Array<{
    id: string;
    name: string;
    governanceDot: "healthy" | "attention" | "critical";
    businessNarrative: string;
  }>;
  topOpportunities: Array<{
    id: string;
    name: string;
    brief: string;
    tier: "act-now" | "investigate" | "explore";
    impactEstimate: string;
  }>;
  processCoverage: Array<{
    id: string;
    name: string;
    automatedSteps: number;
    totalSteps: number;
    coveragePercentage: number;
    reliability: number | null;
    recommendationCount: number;
  }>;
  systemLandscape: Array<{
    name: string;
    workflowCount: number;
  }>;
}

export function DashboardView(props: DashboardViewProps) {
  const [deltaDismissed, setDeltaDismissed] = useState(false);

  return (
    <div className="space-y-10 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-base text-text-tertiary mt-1">Automation Intelligence</p>
      </div>

      {/* 1. Delta Banner */}
      {props.deltaSummary && !deltaDismissed && (
        <div className="border-l-[3px] border-primary bg-surface rounded-r-md px-6 py-5 relative">
          <p className="text-sm uppercase tracking-wider font-semibold text-primary mb-2">
            Since last analysis
          </p>
          <p className="text-lg text-foreground leading-relaxed pr-10">
            {props.deltaSummary}
          </p>
          <button
            onClick={() => setDeltaDismissed(true)}
            className="absolute top-5 right-5 text-text-tertiary hover:text-primary transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 2. Your Next Move */}
      {props.nextMoveText && (
        <div className="border-l-[3px] border-primary bg-surface rounded-r-md px-6 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
              <Bot className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-sm uppercase tracking-wider font-semibold text-primary">
              Your Next Move
            </span>
          </div>
          <p className="text-lg text-foreground leading-relaxed mb-4">
            {props.nextMoveText}
          </p>
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 text-base text-primary hover:underline font-medium"
          >
            View recommendations <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 3. Portfolio Summary */}
      <div className="rounded-md border border-border bg-surface px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <span className="text-sm text-text-secondary uppercase tracking-wider font-medium">Workflows</span>
              <span className="block text-3xl font-mono font-bold text-foreground mt-0.5">{props.workflowCount}</span>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <span className="text-sm text-text-secondary uppercase tracking-wider font-medium">Processes</span>
              <span className="block text-3xl font-mono font-bold text-foreground mt-0.5">{props.processCount}</span>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <span className="text-sm text-text-secondary uppercase tracking-wider font-medium">Systems</span>
              <span className="block text-3xl font-mono font-bold text-foreground mt-0.5">{props.systemCount}</span>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <span className="text-sm text-text-secondary uppercase tracking-wider font-medium">Active</span>
              <span className="block text-3xl font-mono font-bold text-foreground mt-0.5">{props.activeCount}</span>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <span className="text-sm text-text-secondary uppercase tracking-wider font-medium">Recommendations</span>
              <span className="block text-3xl font-mono font-bold text-primary mt-0.5">{props.recommendationCount}</span>
            </div>
          </div>
          {props.aggregateEstimates && (
            <div className="flex items-center gap-8 pl-8 border-l border-border">
              {props.aggregateEstimates.totalTimeSavings && (
                <div className="text-right">
                  <span className="block text-2xl font-mono font-bold text-primary">
                    {props.aggregateEstimates.totalTimeSavings}
                  </span>
                  <span className="text-sm text-text-secondary">time savings across all processes</span>
                </div>
              )}
              {props.aggregateEstimates.totalValueAtRisk && (
                <div className="text-right">
                  <span className="block text-2xl font-mono font-bold text-status-attention">
                    {props.aggregateEstimates.totalValueAtRisk}
                  </span>
                  <span className="text-sm text-text-secondary">revenue at risk across all processes</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Two-column: Attention + Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Attention */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm uppercase tracking-wider font-semibold text-text-secondary">
              Needs Attention
            </h2>
            {props.attentionItems.length > 0 && (
              <span className="text-sm font-mono font-semibold text-status-attention">
                {props.attentionItems.length} items
              </span>
            )}
          </div>
          {props.attentionItems.length === 0 ? (
            <p className="text-base text-text-tertiary py-8">No issues detected</p>
          ) : (
            <div className="space-y-3">
              {props.attentionItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/automations/${item.id}`}
                  className="group block rounded-md border border-border bg-surface px-5 py-4 hover:border-border transition"
                >
                  <div className="flex items-start gap-3">
                    <StatusDot
                      status={item.governanceDot}
                      className="mt-2 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-medium text-foreground group-hover:text-primary transition">
                        {item.name}
                      </div>
                      <div className="text-base text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                        {item.businessNarrative}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {props.attentionItems.length >= 5 && (
                <Link
                  href="/processes"
                  className="inline-flex items-center gap-2 text-base text-primary hover:underline mt-2 font-medium"
                >
                  View all on Process Map <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right: Top Opportunities */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm uppercase tracking-wider font-semibold text-text-secondary">
              Top Opportunities
            </h2>
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {props.topOpportunities.length === 0 ? (
            <p className="text-base text-text-tertiary py-8">
              No recommendations yet
            </p>
          ) : (
            <div className="space-y-3">
              {props.topOpportunities.map((opp) => (
                <Link
                  key={opp.id}
                  href={`/opportunities?highlight=${opp.id}`}
                  className="group block rounded-md border border-dashed border-primary/30 bg-primary/5 px-5 py-4 hover:border-primary transition"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-base font-medium text-foreground group-hover:text-primary transition truncate">
                      {opp.name}
                    </span>
                    <span className="flex-1" />
                    <TierBadge tier={opp.tier} />
                  </div>
                  <p className="text-base text-text-secondary mb-3 leading-relaxed line-clamp-2">
                    {opp.brief}
                  </p>
                  {opp.impactEstimate && (
                    <div className="pt-3 border-t border-border">
                      <span className="font-mono text-lg font-bold text-primary">
                        {opp.impactEstimate}
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Process Coverage */}
      {props.processCoverage.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm uppercase tracking-wider font-semibold text-text-secondary">
              Process Coverage
            </h2>
            <Link
              href="/processes"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
            >
              Open Process Map <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="rounded-md border border-border bg-surface overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_280px_140px_140px] gap-4 px-6 py-3 text-sm uppercase tracking-wider font-semibold text-text-tertiary border-b border-border">
              <span>Process</span>
              <span>Coverage</span>
              <span>Reliability</span>
              <span className="text-right">Recommendations</span>
            </div>
            {/* Rows */}
            {props.processCoverage.map((p) => (
              <Link
                key={p.id}
                href="/processes"
                className="grid grid-cols-[1fr_280px_140px_140px] gap-4 px-6 py-4 border-b border-border last:border-b-0 hover:bg-surface-raised transition-colors items-center"
              >
                <span className="text-base text-foreground font-medium truncate">
                  {p.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-base font-mono text-text-secondary whitespace-nowrap">
                    {p.automatedSteps} of {p.totalSteps}
                  </span>
                  <CoverageBar
                    percentage={p.coveragePercentage}
                    className="flex-1"
                  />
                </div>
                <span className="text-base font-mono font-semibold text-text-secondary">
                  {p.reliability !== null ? `${p.reliability}%` : "—"}
                </span>
                <span className="text-base font-mono text-primary text-right font-bold">
                  {p.recommendationCount}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 6. Systems Compact */}
      {props.systemLandscape.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wider font-semibold text-text-secondary mb-5">
            Connected Systems
          </h2>
          <div className="flex flex-wrap gap-3">
            {props.systemLandscape.map((sys) => (
              <span
                key={sys.name}
                className="px-4 py-2.5 bg-surface border border-border rounded-md text-base text-text-secondary"
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
