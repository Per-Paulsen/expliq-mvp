"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { StatusDot } from "@/components/status-dot";
import { FactCard } from "@/components/fact-card";
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* 1. Delta Banner */}
      {props.deltaSummary && !deltaDismissed && (
        <div className="border-l-2 border-primary bg-surface px-4 py-3 rounded-r relative">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary mb-1">
            Since last analysis
          </p>
          <p className="text-sm text-text-secondary pr-8">
            {props.deltaSummary}
          </p>
          <button
            onClick={() => setDeltaDismissed(true)}
            className="absolute top-3 right-3 text-text-tertiary hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Your Next Move */}
      {props.nextMoveText && (
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary mb-2">
            Your Next Move
          </p>
          <div className="border-l-2 border-primary bg-surface px-4 py-3 rounded-r">
            <p className="text-sm text-text-secondary mb-2">
              {props.nextMoveText}
            </p>
            <Link
              href="/opportunities"
              className="text-sm text-primary hover:underline"
            >
              View recommendations →
            </Link>
          </div>
        </div>
      )}

      {/* 3. Facts Bar */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <FactCard label="Workflows" value={props.workflowCount} />
          <FactCard label="Processes" value={props.processCount} />
          <FactCard label="Systems" value={props.systemCount} />
          <FactCard label="Active" value={props.activeCount} />
          <FactCard label="Recommendations" value={props.recommendationCount} />
        </div>
        {props.aggregateEstimates && (
          <p className="text-[11px] text-text-tertiary mt-2">
            {props.aggregateEstimates.totalTimeSavings && (
              <span>
                est. {props.aggregateEstimates.totalTimeSavings} saved
              </span>
            )}
            {props.aggregateEstimates.totalTimeSavings &&
              props.aggregateEstimates.totalValueAtRisk && <span> · </span>}
            {props.aggregateEstimates.totalValueAtRisk && (
              <span>{props.aggregateEstimates.totalValueAtRisk} at risk</span>
            )}
          </p>
        )}
      </div>

      {/* 4. Two-column: Attention + Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Attention */}
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary mb-3">
            Needs Attention
          </p>
          {props.attentionItems.length === 0 ? (
            <p className="text-sm text-text-tertiary py-4">
              No issues detected
            </p>
          ) : (
            <div>
              {props.attentionItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/automations/${item.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 border-b border-border hover:bg-surface transition-colors"
                >
                  <StatusDot status={item.governanceDot} />
                  <span className="text-sm text-white truncate flex-shrink-0 max-w-[180px]">
                    {item.name}
                  </span>
                  <span className="text-xs text-text-tertiary truncate">
                    {item.businessNarrative}
                  </span>
                </Link>
              ))}
              {props.attentionItems.length >= 5 && (
                <Link
                  href="/processes"
                  className="block text-xs text-primary hover:underline mt-2 px-3"
                >
                  View all on Process Map →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right: Top Opportunities */}
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary mb-3">
            Top Opportunities
          </p>
          {props.topOpportunities.length === 0 ? (
            <p className="text-sm text-text-tertiary py-4">
              No recommendations yet
            </p>
          ) : (
            <div>
              {props.topOpportunities.map((opp) => (
                <Link
                  key={opp.id}
                  href={`/opportunities?highlight=${opp.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 border-b border-border hover:bg-surface transition-colors"
                >
                  <TierBadge tier={opp.tier} />
                  <span className="text-sm text-white truncate flex-shrink-0 max-w-[160px]">
                    {opp.name}
                  </span>
                  <span className="text-xs text-text-tertiary truncate flex-1">
                    {opp.brief}
                  </span>
                  {opp.impactEstimate && (
                    <span className="text-[10px] font-mono text-text-secondary flex-shrink-0">
                      {opp.impactEstimate}
                    </span>
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
          <p className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary mb-3">
            Process Coverage
          </p>
          <div className="border border-border rounded">
            {/* Header */}
            <div className="grid grid-cols-[1fr_120px_100px_60px] gap-4 px-4 py-2 text-[10px] uppercase tracking-wider font-semibold text-text-tertiary border-b border-border">
              <span>Process</span>
              <span>Coverage</span>
              <span>Reliability</span>
              <span className="text-right">Recs</span>
            </div>
            {/* Rows */}
            {props.processCoverage.map((p) => (
              <Link
                key={p.id}
                href="/processes"
                className="grid grid-cols-[1fr_120px_100px_60px] gap-4 px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-surface transition-colors items-center"
              >
                <span className="text-sm text-white truncate">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-text-secondary whitespace-nowrap">
                    {p.automatedSteps} of {p.totalSteps}
                  </span>
                  <CoverageBar
                    percentage={p.coveragePercentage}
                    className="flex-1"
                  />
                </div>
                <span className="text-sm font-mono text-text-secondary">
                  {p.reliability !== null ? `${p.reliability}%` : "—"}
                </span>
                <span className="text-sm font-mono text-text-secondary text-right">
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
          <p className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary mb-3">
            Systems
          </p>
          <div className="flex flex-wrap gap-2">
            {props.systemLandscape.map((sys) => (
              <span
                key={sys.name}
                className="px-3 py-1.5 bg-surface rounded text-xs font-mono text-text-secondary"
              >
                {sys.name} ({sys.workflowCount})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
