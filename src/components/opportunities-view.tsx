"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { X, Check, Loader2, Copy, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { UnifiedCard } from "@/components/unified-card";
import { CollapsibleRow } from "@/components/collapsible-row";
import { EmptyState } from "@/components/empty-state";
import type {
  OpportunityRecommendation,
  OpportunitiesData,
} from "@/lib/opportunities-data";
import {
  generateDeployJson,
  deployToN8n,
} from "@/lib/actions/deploy";

export type OpportunitiesViewProps = OpportunitiesData;

// ── Deploy Modal ────────────────────────────────────────

type DeployState =
  | { step: "generate" }
  | { step: "preview"; json: string }
  | { step: "deploying"; json: string }
  | { step: "success"; instanceUrl: string; workflowId: string; activated: boolean }
  | { step: "error"; message: string };

function DeployModal({
  recommendation,
  onClose,
}: {
  recommendation: OpportunityRecommendation;
  onClose: () => void;
}) {
  const [state, setState] = useState<DeployState>(() => {
    if (recommendation.deployableJson) {
      return {
        step: "preview",
        json: JSON.stringify(recommendation.deployableJson, null, 2),
      };
    }
    return { step: "generate" };
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (state.step !== "generate") return;
    let cancelled = false;

    async function generate() {
      const result = await generateDeployJson(recommendation.id);
      if (cancelled) return;
      if ("success" in result) {
        setState({
          step: "preview",
          json: JSON.stringify(result.json, null, 2),
        });
      } else {
        setState({ step: "error", message: result.error });
      }
    }

    generate();
    return () => {
      cancelled = true;
    };
  }, [state.step, recommendation.id]);

  async function handleDeploy(json: string) {
    setState({ step: "deploying", json });
    const result = await deployToN8n(recommendation.id);
    if ("success" in result) {
      setState({
        step: "success",
        instanceUrl: result.instanceUrl ?? "",
        workflowId: result.workflowId ?? "",
        activated: result.activated ?? false,
      });
    } else {
      setState({ step: "error", message: result.error });
    }
  }

  async function handleCopy(json: string) {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-xl border border-border shadow-lg w-full max-w-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">
              Deploy Workflow
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-text-tertiary hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {state.step === "generate" && (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin mb-3" />
                <p className="text-sm text-text-secondary">
                  Generating workflow scaffold...
                </p>
              </div>
            )}

            {state.step === "preview" && (
              <div className="space-y-4">
                <pre className="bg-foreground/95 text-white text-xs font-mono p-4 rounded-lg overflow-auto max-h-96">
                  {state.json}
                </pre>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleCopy(state.json)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg text-text-secondary hover:text-foreground transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeploy(state.json)}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Deploy to n8n
                  </button>
                </div>
              </div>
            )}

            {state.step === "deploying" && (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin mb-3" />
                <p className="text-sm text-text-secondary">
                  Deploying to n8n...
                </p>
              </div>
            )}

            {state.step === "success" && (
              <div className="flex flex-col items-center py-8">
                <div className="w-10 h-10 rounded-full bg-status-healthy/10 flex items-center justify-center mb-3">
                  <Check className="w-5 h-5 text-status-healthy" />
                </div>
                <p className="text-[15px] font-semibold text-foreground mb-1">
                  Workflow deployed!
                </p>
                {!state.activated && (
                  <p className="text-xs text-status-attention mb-2">
                    Activation skipped — configure credentials in n8n first.
                  </p>
                )}
                <a
                  href={`${state.instanceUrl}/workflow/${state.workflowId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Open in n8n
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:text-foreground transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {state.step === "error" && (
              <div className="flex flex-col items-center py-8">
                <p className="text-sm text-status-critical mb-2">
                  {state.message}
                </p>
                <button
                  type="button"
                  onClick={() => setState({ step: "generate" })}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Inline Detail Section ───────────────────────────────

function RecommendationDetail({
  rec,
  onDeploy,
}: {
  rec: OpportunityRecommendation;
  onDeploy: (id: string) => void;
}) {
  return (
    <div className="px-5 pb-5 pt-3 border-t border-border">
      {/* Structured detail grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Business Case — full width */}
        {rec.businessCase && (
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
              Business Case
            </p>
            <p className="text-[15px] text-foreground leading-relaxed">
              {rec.businessCase}
            </p>
          </div>
        )}

        {/* Evidence — full width */}
        {rec.evidenceChain && (
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
              Evidence
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              {rec.evidenceChain}
            </p>
          </div>
        )}

        {/* Honest Framing — amber callout, full width */}
        {rec.honestFraming && (
          <div className="lg:col-span-2 bg-status-attention/10 border-l-[3px] border-status-attention p-4 rounded-r-lg">
            <p className="text-xs font-semibold text-status-attention uppercase tracking-wider mb-1.5">
              Honest Framing
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {rec.honestFraming}
            </p>
          </div>
        )}

        {/* Implementation Notes — left column */}
        {rec.implementationNotes && (
          <div>
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
              Implementation
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              {rec.implementationNotes}
            </p>
          </div>
        )}

        {/* Systems + Impact — right column as metadata pairs */}
        <div className="space-y-3">
          {(rec.systemSource || rec.systemDestination) && (
            <div>
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
                Systems
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {rec.systemSource && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {rec.systemSource}
                  </span>
                )}
                {rec.systemSource && rec.systemDestination && (
                  <span className="text-text-tertiary text-xs">&rarr;</span>
                )}
                {rec.systemDestination && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {rec.systemDestination}
                  </span>
                )}
              </div>
            </div>
          )}

          {rec.impactEstimate && (
            <div>
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
                Impact
              </p>
              <p className="text-lg font-bold font-mono text-primary">
                {rec.impactEstimate}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions — bottom row */}
      <div className="flex items-center gap-3 pt-3 border-t border-border">
        <button
          type="button"
          onClick={() => onDeploy(rec.id)}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {rec.automationId ? "Deploy improved version" : "Deploy"}
        </button>

        {rec.automationId && (
          <Link
            href={`/automations/${rec.automationId}`}
            className="px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
          >
            View current workflow &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Tier Config ─────────────────────────────────────────

const tierConfig = {
  "act-now": {
    label: "ACT NOW",
    color: "text-status-healthy",
  },
  investigate: {
    label: "INVESTIGATE",
    color: "text-status-attention",
  },
  explore: {
    label: "EXPLORE",
    color: "text-text-tertiary",
  },
} as const;

// ── Main Component ──────────────────────────────────────

export function OpportunitiesView({
  actNow,
  investigate,
  explore,
  processSuggestions,
}: OpportunitiesViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const processFilter = searchParams.get("process");
  const highlight = searchParams.get("highlight");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deployRecId, setDeployRecId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // All recommendations flat list for lookups
  const allRecs = useMemo(() => {
    const all = [...actNow, ...investigate, ...explore];
    for (const ps of processSuggestions) {
      all.push(...ps.recommendations);
    }
    return all;
  }, [actNow, investigate, explore, processSuggestions]);

  // Filter by process if URL param present
  const filterByProcess = useCallback(
    (recs: OpportunityRecommendation[]) => {
      if (!processFilter) return recs;
      return recs.filter((r) => r.processId === processFilter);
    },
    [processFilter],
  );

  const filteredActNow = useMemo(
    () => filterByProcess(actNow),
    [filterByProcess, actNow],
  );
  const filteredInvestigate = useMemo(
    () => filterByProcess(investigate),
    [filterByProcess, investigate],
  );
  const filteredExplore = useMemo(
    () => filterByProcess(explore),
    [filterByProcess, explore],
  );

  // Deep-linking: scroll to and highlight referenced recommendation
  useEffect(() => {
    if (!highlight) return;
    setHighlightedId(highlight);
    setExpandedId(highlight);

    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-rec-id="${highlight}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);

    const clearTimer = setTimeout(() => {
      setHighlightedId(null);
    }, 2100);

    return () => {
      clearTimeout(timer);
      clearTimeout(clearTimer);
    };
  }, [highlight]);

  // Find process name for filter display
  const filterProcessName = useMemo(() => {
    if (!processFilter) return null;
    const rec = allRecs.find((r) => r.processId === processFilter);
    return rec?.processName ?? processFilter;
  }, [processFilter, allRecs]);

  const isEmpty =
    filteredActNow.length === 0 &&
    filteredInvestigate.length === 0 &&
    filteredExplore.length === 0 &&
    (!processFilter ? processSuggestions.length === 0 : true);

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function renderCard(rec: OpportunityRecommendation) {
    const isExpanded = expandedId === rec.id;
    return (
      <div
        key={rec.id}
        data-rec-id={rec.id}
        className={cn(
          "bg-surface rounded-xl border border-border shadow-sm overflow-hidden transition-all",
          highlightedId === rec.id && "ring-2 ring-primary/50",
          isExpanded && "shadow-md",
        )}
      >
        {/* Card header — clickable to expand */}
        <button
          type="button"
          onClick={() => toggleExpanded(rec.id)}
          className="w-full text-left flex items-center cursor-pointer"
        >
          <div className="flex-1 min-w-0">
            <UnifiedCard
              type="recommendation"
              tier={rec.tier}
              name={rec.name}
              description={rec.brief}
              metric={rec.impactEstimate || "\u2014"}
              confidence={
                (rec.confidence?.toLowerCase().replace(/\s+/g, "-") as
                  | "data-driven"
                  | "benchmark-based"
                  | "ai-suggested") ?? undefined
              }
              scope={rec.affectedScope ?? undefined}
              process={rec.processName ?? ""}
              className="border-0 shadow-none rounded-none"
            />
          </div>
          <ChevronRight
            className={cn(
              "w-5 h-5 text-text-tertiary shrink-0 mr-4 transition-transform duration-200",
              isExpanded && "rotate-90",
            )}
          />
        </button>

        {/* Expanded detail */}
        {isExpanded && (
          <RecommendationDetail
            rec={rec}
            onDeploy={(id) => setDeployRecId(id)}
          />
        )}
      </div>
    );
  }

  function renderTierSection(
    tier: "act-now" | "investigate" | "explore",
    recs: OpportunityRecommendation[],
  ) {
    if (recs.length === 0) return null;
    const config = tierConfig[tier];
    return (
      <div key={tier}>
        <h2
          className={cn(
            "text-[13px] font-semibold uppercase tracking-wider mb-4",
            config.color,
          )}
        >
          {config.label}
        </h2>
        <div className="space-y-4">{recs.map(renderCard)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Opportunities</h1>
        <p className="text-sm text-text-secondary mt-1">
          Recommendations ranked by business impact
        </p>
      </div>

      {/* Process filter bar */}
      {processFilter && filterProcessName && (
        <div className="flex items-center gap-3 bg-surface rounded-lg border border-border px-4 py-3">
          <p className="text-sm text-text-secondary">
            Filtered by process:{" "}
            <span className="font-semibold text-foreground">
              {filterProcessName}
            </span>
          </p>
          <button
            type="button"
            onClick={() => router.push("/opportunities")}
            className="text-sm text-primary font-medium hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Empty state */}
      {isEmpty ? (
        <EmptyState message="No recommendations to display" />
      ) : (
        <div className="space-y-8">
          {/* Tier sections */}
          {renderTierSection("act-now", filteredActNow)}
          {renderTierSection("investigate", filteredInvestigate)}
          {renderTierSection("explore", filteredExplore)}

          {/* Process suggestions */}
          {!processFilter &&
            processSuggestions.map((ps) => (
              <CollapsibleRow
                key={ps.id}
                header={
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-foreground">
                        {ps.name}
                      </p>
                      {ps.description && (
                        <p className="text-sm text-text-secondary mt-0.5">
                          {ps.description}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-mono font-semibold text-primary shrink-0">
                      {ps.recommendations.length}{" "}
                      {ps.recommendations.length === 1
                        ? "recommendation"
                        : "recommendations"}
                    </span>
                  </div>
                }
              >
                <div className="space-y-4 pt-2">
                  {ps.recommendations.map(renderCard)}
                </div>
              </CollapsibleRow>
            ))}
        </div>
      )}

      {/* Deploy modal */}
      {deployRecId &&
        (() => {
          const rec = allRecs.find((r) => r.id === deployRecId);
          if (!rec) return null;
          return (
            <DeployModal
              recommendation={rec}
              onClose={() => setDeployRecId(null)}
            />
          );
        })()}
    </div>
  );
}
