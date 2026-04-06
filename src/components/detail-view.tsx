"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusDot } from "@/components/status-dot";
import { SystemFlow } from "@/components/system-flow";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { TierBadge } from "@/components/tier-badge";
import { CollapsibleRow } from "@/components/collapsible-row";
import type { DetailData } from "@/lib/detail-data";

// ── Maturity badge styles (same as ProcessCard) ────────
const maturityStyles: Record<string, string> = {
  Production: "bg-status-healthy/10 text-status-healthy",
  Developing: "bg-blue-50 text-blue-700",
  Emerging: "bg-status-attention/10 text-status-attention",
  Prototype: "bg-surface-raised text-text-tertiary",
  Optimized: "bg-primary/10 text-primary",
};

// ── Status label colors ────────────────────────────────
const statusLabelColor: Record<string, string> = {
  critical: "text-status-critical",
  attention: "text-status-attention",
  healthy: "text-status-healthy",
};

// ── Section header component ───────────────────────────
function SectionHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "text-xs font-semibold uppercase tracking-wider text-text-tertiary",
        className,
      )}
    >
      {children}
    </h3>
  );
}

// ── Card wrapper ───────────────────────────────────────
function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-surface rounded-xl border border-border shadow-sm overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── Error rate color helper ────────────────────────────
function errorRateColor(rate: number): string {
  if (rate > 0.15) return "text-status-critical";
  if (rate >= 0.05) return "text-status-attention";
  return "text-status-healthy";
}

// ── Format duration ────────────────────────────────────
function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// ── Format relative time ───────────────────────────────
function formatRelativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "< 1 hour ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

// ── Text helpers ───────────────────────────────────────

/** Split text into first N sentences and remainder */
function splitSentences(text: string, count: number): { visible: string; hidden: string } {
  const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
  if (sentences.length <= count) return { visible: text, hidden: "" };
  return {
    visible: sentences.slice(0, count).join("").trim(),
    hidden: sentences.slice(count).join("").trim(),
  };
}

/** Split estimate text at "Reasoning:" into amount and reasoning */
function splitEstimateReasoning(text: string): { estimate: string; reasoning: string } {
  const idx = text.search(/reasoning:/i);
  if (idx > 0) {
    return {
      estimate: text.slice(0, idx).trim().replace(/[.\s]+$/, ""),
      reasoning: text.slice(idx).replace(/^reasoning:\s*/i, "").trim(),
    };
  }
  // Fallback: split at first sentence-ending period (not decimal)
  const sentenceEnd = text.search(/\.(?!\d)\s/);
  if (sentenceEnd > 0) {
    return { estimate: text.slice(0, sentenceEnd + 1).trim(), reasoning: text.slice(sentenceEnd + 1).trim() };
  }
  return { estimate: text, reasoning: "" };
}

// ── Main component ─────────────────────────────────────

export interface DetailViewProps {
  data: DetailData;
}

export function DetailView({ data }: DetailViewProps) {
  const [showAllFindings, setShowAllFindings] = useState(false);
  const [narrativeExpanded, setNarrativeExpanded] = useState(false);
  const [failureExpanded, setFailureExpanded] = useState(false);
  const [timeSavingsExpanded, setTimeSavingsExpanded] = useState(false);
  const [revenueEstExpanded, setRevenueEstExpanded] = useState(false);
  const [revenueConnExpanded, setRevenueConnExpanded] = useState(false);
  const findings = data.technicalEvidence.keyFindings;
  const visibleFindings = showAllFindings ? findings : findings.slice(0, 5);
  const hiddenCount = findings.length - 5;

  const hasConnections = data.upstream.length > 0 || data.downstream.length > 0;
  const confidenceTimeSavings = data.timeSavingsConfidence;
  const confidenceRevenue = data.revenueConfidence;

  const narrativeParts = data.businessNarrative ? splitSentences(data.businessNarrative, 2) : null;
  const failureParts = data.impact.failureScenario ? splitSentences(data.impact.failureScenario, 2) : null;
  const timeSavingsParts = data.timeSavingsEstimate ? splitEstimateReasoning(data.timeSavingsEstimate) : null;
  const revenuEstParts = data.revenueImpactEstimate ? splitEstimateReasoning(data.revenueImpactEstimate) : null;
  const revenueConnParts = data.impact.revenueConnection ? splitSentences(data.impact.revenueConnection, 2) : null;

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* ── 1. Header — Status Card ────────────────────── */}
      <Card className="p-6">
        {/* Row 1 — Identity */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">
              {data.name}
            </h1>
            <StatusDot status={data.governanceDot} />
            <span
              className={cn(
                "text-sm font-medium whitespace-nowrap",
                statusLabelColor[data.governanceDot],
              )}
            >
              {data.statusLabel}
            </span>
          </div>
          <span className="bg-foreground/5 text-text-tertiary rounded-full text-[10px] font-mono uppercase px-2.5 py-1 shrink-0">
            n8n
          </span>
        </div>

        {/* Row 2 — Context metadata */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          {data.systemsTouched.length > 0 && (
            <SystemFlow systems={data.systemsTouched} />
          )}
          {data.stepName && data.process && (
            <Link
              href="/processes"
              className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium px-3 py-1 hover:bg-primary/20 transition"
            >
              {data.process.name}
            </Link>
          )}
        </div>
      </Card>

      {/* ── 2. Business Narrative — Teal Callout ───────── */}
      {data.businessNarrative && (
        <Card className="border-l-[3px] border-primary bg-primary/[0.03] p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <SectionHeader>Business Narrative</SectionHeader>
          </div>
          <p className="text-[15px] text-foreground leading-relaxed break-words">
            {narrativeExpanded ? data.businessNarrative : narrativeParts!.visible}
          </p>
          {narrativeParts!.hidden && (
            <button onClick={() => setNarrativeExpanded(!narrativeExpanded)} className="text-xs text-primary font-medium hover:underline mt-1">
              {narrativeExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </Card>
      )}

      {/* ── 3. Business Case — Three-Column Grid ───────── */}
      <Card className="p-6">
        <SectionHeader className="mb-4">Business Case</SectionHeader>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
          {/* Failure Impact */}
          <div
            className={cn(
              "border-l-[3px] rounded-r-lg pl-4 py-3 min-w-0",
              data.impact.failureScenario
                ? "border-status-critical bg-status-critical/5"
                : "border-text-tertiary/30",
            )}
          >
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-wider mb-2",
                data.impact.failureScenario
                  ? "text-status-critical"
                  : "text-text-tertiary",
              )}
            >
              Failure Impact
            </p>
            <p
              className={cn(
                "text-sm leading-relaxed",
                data.impact.failureScenario
                  ? "text-foreground"
                  : "text-text-tertiary",
              )}
            >
              {data.impact.failureScenario
                ? (failureExpanded ? data.impact.failureScenario : failureParts!.visible)
                : "Not applicable"}
            </p>
            {failureParts?.hidden && (
              <button onClick={() => setFailureExpanded(!failureExpanded)} className="text-xs text-primary font-medium hover:underline mt-1">
                {failureExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>

          {/* Time Savings */}
          <div
            className={cn(
              "border-l-[3px] rounded-r-lg pl-4 py-3 min-w-0",
              data.timeSavingsEstimate
                ? "border-primary bg-primary/5"
                : "border-text-tertiary/30",
            )}
          >
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-wider mb-2",
                data.timeSavingsEstimate ? "text-primary" : "text-text-tertiary",
              )}
            >
              Time Savings
            </p>
            {data.timeSavingsEstimate ? (
              <>
                <p className="text-lg font-bold font-mono text-primary break-words">
                  {timeSavingsParts!.estimate}
                </p>
                {confidenceTimeSavings && (
                  <ConfidenceBadge level={confidenceTimeSavings} className="mt-1" />
                )}
                {timeSavingsParts!.reasoning && (
                  <>
                    {timeSavingsExpanded && (
                      <p className="text-sm text-text-secondary leading-relaxed mt-1">
                        {timeSavingsParts!.reasoning}
                      </p>
                    )}
                    <button onClick={() => setTimeSavingsExpanded(!timeSavingsExpanded)} className="text-xs text-primary font-medium hover:underline mt-1">
                      {timeSavingsExpanded ? "Show less" : "Read more"}
                    </button>
                  </>
                )}
              </>
            ) : (
              <p className="text-sm text-text-tertiary">Not applicable</p>
            )}
          </div>

          {/* Revenue Connection */}
          <div
            className={cn(
              "border-l-[3px] rounded-r-lg pl-4 py-3 min-w-0",
              data.revenueImpactEstimate || data.impact.revenueConnection
                ? "border-status-attention bg-status-attention/5"
                : "border-text-tertiary/30",
            )}
          >
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-wider mb-2",
                data.revenueImpactEstimate || data.impact.revenueConnection
                  ? "text-status-attention"
                  : "text-text-tertiary",
              )}
            >
              Revenue Connection
            </p>
            {data.revenueImpactEstimate ? (
              <>
                <p className="text-lg font-bold font-mono text-status-attention break-words">
                  {revenuEstParts!.estimate}
                </p>
                {confidenceRevenue && (
                  <ConfidenceBadge level={confidenceRevenue} className="mt-1" />
                )}
                {revenuEstParts!.reasoning && (
                  <>
                    {revenueEstExpanded && (
                      <p className="text-sm text-text-secondary leading-relaxed mt-1">
                        {revenuEstParts!.reasoning}
                      </p>
                    )}
                    <button onClick={() => setRevenueEstExpanded(!revenueEstExpanded)} className="text-xs text-primary font-medium hover:underline mt-1">
                      {revenueEstExpanded ? "Show less" : "Read more"}
                    </button>
                  </>
                )}
              </>
            ) : (
              <p className="text-sm text-text-tertiary">Not applicable</p>
            )}
          </div>
        </div>
      </Card>

      {/* ── 4. Recommendations — List Card ─────────────── */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <SectionHeader>Recommendations for This Workflow</SectionHeader>
          {data.recommendations.length > 0 && (
            <span className="text-xs font-mono font-semibold text-primary bg-primary/10 rounded-full px-2">
              {data.recommendations.length}
            </span>
          )}
        </div>
        {data.recommendations.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-text-secondary mb-2">
              No recommendations linked to this workflow
            </p>
            <Link
              href="/opportunities"
              className="text-sm text-primary font-medium hover:underline"
            >
              View all opportunities &rarr;
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.recommendations.map((rec) => (
              <Link
                key={rec.id}
                href={`/opportunities?highlight=${rec.id}`}
                className="flex items-center justify-between gap-4 py-3 hover:bg-surface-hover -mx-6 px-6 transition group overflow-hidden"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <TierBadge tier={rec.tier} />
                    <span className="text-[15px] font-semibold text-foreground group-hover:text-primary transition truncate">
                      {rec.name}
                    </span>
                  </div>
                  {rec.brief && (
                    <p className="text-sm text-text-secondary mt-0.5 truncate">
                      {rec.brief}
                    </p>
                  )}
                </div>
                {rec.impactEstimate && (
                  <span className="font-mono font-bold text-primary shrink-0">
                    {rec.impactEstimate}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* ── 5. Process Position — Visual Step Card ──────── */}
      {data.process && (
        <Card className="p-6">
          <SectionHeader className="mb-4">Process Position</SectionHeader>
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/processes"
              className="text-[15px] font-semibold text-primary hover:underline"
            >
              {data.process.name}
            </Link>
            {data.process.maturityLevel && (
              <span
                className={cn(
                  "text-xs font-semibold px-2.5 py-1 rounded-full",
                  maturityStyles[data.process.maturityLevel] ??
                    "bg-surface-raised text-text-tertiary",
                )}
              >
                {data.process.maturityLevel}
              </span>
            )}
          </div>
          {data.process.steps.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {data.process.steps.map((step, i) => (
                <span key={i} className="contents">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs",
                      step.name === data.stepName
                        ? "bg-primary text-white font-semibold"
                        : "bg-surface-hover text-text-secondary font-medium",
                    )}
                  >
                    {step.name}
                  </span>
                  {i < data.process!.steps.length - 1 && (
                    <span className="text-text-tertiary text-xs">&rarr;</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── 6. Connected Automations ───────────────────── */}
      {hasConnections && (
        <Card className="p-6">
          <SectionHeader className="mb-4">Connected Automations</SectionHeader>
          <div className="divide-y divide-border">
            {/* Upstream */}
            {data.upstream.length > 0 && (
              <div className="pb-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-text-tertiary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Upstream
                  </span>
                </div>
                <div className="space-y-2">
                  {data.upstream.map((conn) => (
                    <Link
                      key={conn.id}
                      href={`/automations/${conn.id}`}
                      className="flex items-center gap-3 py-2 hover:bg-surface-hover -mx-6 px-6 transition group overflow-hidden"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-foreground group-hover:text-primary transition truncate">
                            {conn.name}
                          </span>
                          <span className="bg-foreground/5 text-text-tertiary rounded-full text-[10px] font-mono uppercase px-2 py-0.5 shrink-0">
                            {conn.connectionType.replace(/-/g, " ")}
                          </span>
                        </div>
                        {conn.businessNarrative && (
                          <p className="text-sm text-text-secondary mt-0.5 truncate">
                            {conn.businessNarrative}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {/* Downstream */}
            {data.downstream.length > 0 && (
              <div className="pt-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <ArrowUpRight className="w-3.5 h-3.5 text-text-tertiary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Downstream
                  </span>
                </div>
                <div className="space-y-2">
                  {data.downstream.map((conn) => (
                    <Link
                      key={conn.id}
                      href={`/automations/${conn.id}`}
                      className="flex items-center gap-3 py-2 hover:bg-surface-hover -mx-6 px-6 transition group overflow-hidden"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-foreground group-hover:text-primary transition truncate">
                            {conn.name}
                          </span>
                          <span className="bg-foreground/5 text-text-tertiary rounded-full text-[10px] font-mono uppercase px-2 py-0.5 shrink-0">
                            {conn.connectionType.replace(/-/g, " ")}
                          </span>
                        </div>
                        {conn.businessNarrative && (
                          <p className="text-sm text-text-secondary mt-0.5 truncate">
                            {conn.businessNarrative}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── 7. "How We Know This" — Collapsible Evidence ── */}
      <Card>
        <CollapsibleRow
          className="border-b-0"
          header={
            <div className="flex items-center gap-2">
              <SectionHeader>How We Know This</SectionHeader>
              <span className="text-sm text-text-secondary">
                Execution data, error handling, credentials, and technical findings
              </span>
            </div>
          }
        >
          <div className="space-y-6 pt-2">
            {/* 7a. Execution Stats */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
                Execution Stats
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                    Runs / Week
                  </p>
                  <p className="text-lg font-bold font-mono">
                    {data.runsPerWeek != null
                      ? data.runsPerWeek.toFixed(1)
                      : "\u2014"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                    Error Rate
                  </p>
                  <p
                    className={cn(
                      "text-lg font-bold font-mono",
                      data.errorRate != null
                        ? errorRateColor(data.errorRate)
                        : "",
                    )}
                  >
                    {data.errorRate != null
                      ? `${Math.round(data.errorRate * 100)}%`
                      : "\u2014"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                    Last Executed
                  </p>
                  <p className="text-lg font-bold font-mono">
                    {data.lastExecutedAt
                      ? formatRelativeTime(data.lastExecutedAt)
                      : "\u2014"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                    Avg Duration
                  </p>
                  <p className="text-lg font-bold font-mono">
                    {data.avgDurationMs != null
                      ? formatDuration(data.avgDurationMs)
                      : "\u2014"}
                  </p>
                </div>
              </div>
            </div>

            {/* 7b. Error Handling */}
            {data.technicalEvidence.errorHandling && (
              <div className="border-l-[3px] border-status-attention bg-status-attention/5 rounded-r-lg p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-status-attention mb-2">
                  Error Handling
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {data.technicalEvidence.errorHandling}
                </p>
              </div>
            )}

            {/* 7c. Credentials */}
            {data.technicalEvidence.credentials.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
                  Credentials &amp; System Dependencies
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.technicalEvidence.credentials.map((cred, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                    >
                      {cred}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 7d. Detectability */}
            {(data.detectability.level ||
              data.detectability.reasoning ||
              data.detectability.evidence) && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
                  Detectability
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {data.detectability.level && (
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Level</p>
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-surface-hover text-text-secondary">
                        {data.detectability.level}
                      </span>
                    </div>
                  )}
                  {data.detectability.reasoning && (
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">
                        Reasoning
                      </p>
                      <p className="text-sm text-foreground">
                        {data.detectability.reasoning}
                      </p>
                    </div>
                  )}
                  {data.detectability.evidence && (
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">
                        Evidence
                      </p>
                      <p className="text-sm text-text-secondary">
                        {data.detectability.evidence}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7e. Key Findings */}
            {findings.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
                  Key Findings
                </p>
                <div className="space-y-2">
                  {visibleFindings.map((finding, i) => (
                    <div
                      key={i}
                      className="border-l-[2px] border-primary/30 pl-3 py-1.5"
                    >
                      <p className="text-sm text-foreground">{finding}</p>
                    </div>
                  ))}
                </div>
                {hiddenCount > 0 && !showAllFindings && (
                  <button
                    type="button"
                    onClick={() => setShowAllFindings(true)}
                    className="text-sm text-primary font-medium hover:underline mt-2"
                  >
                    Show {hiddenCount} more
                  </button>
                )}
              </div>
            )}

            {/* 7f. Complexity */}
            {(data.technicalEvidence.complexity.nodeCount != null ||
              data.technicalEvidence.complexity.branching) && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
                  Complexity
                </p>
                <div className="flex flex-wrap gap-6">
                  {data.technicalEvidence.complexity.nodeCount != null && (
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">
                        Node Count
                      </p>
                      <p className="text-sm font-bold font-mono">
                        {data.technicalEvidence.complexity.nodeCount}
                      </p>
                    </div>
                  )}
                  {data.technicalEvidence.complexity.branching && (
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">
                        Branching
                      </p>
                      <p className="text-sm text-foreground">
                        {data.technicalEvidence.complexity.branching}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CollapsibleRow>
      </Card>
    </div>
  );
}
