"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { X, Check, Loader2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { UnifiedCard } from "@/components/unified-card";
import { SlideOverPanel } from "@/components/slide-over-panel";
import { CollapsibleRow } from "@/components/collapsible-row";
import { SystemFlow } from "@/components/system-flow";
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

  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const selectedRec = useMemo(
    () => allRecs.find((r) => r.id === selectedId) ?? null,
    [allRecs, selectedId],
  );

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

  function renderCard(rec: OpportunityRecommendation) {
    return (
      <div
        key={rec.id}
        data-rec-id={rec.id}
        onClick={() => setSelectedId(rec.id)}
        className={cn(
          "transition-all",
          highlightedId === rec.id &&
            "ring-2 ring-primary/50 rounded-xl",
        )}
      >
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
        />
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

      {/* Slide-over panel */}
      <SlideOverPanel
        open={!!selectedRec}
        onClose={() => setSelectedId(null)}
        title={selectedRec?.name}
      >
        {selectedRec && (
          <div className="space-y-6">
            {/* Business Case */}
            {selectedRec.businessCase && (
              <div>
                <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                  Business Case
                </h3>
                <p className="text-[15px] text-foreground leading-relaxed">
                  {selectedRec.businessCase}
                </p>
              </div>
            )}

            {/* Evidence */}
            {selectedRec.evidenceChain && (
              <div>
                <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                  Evidence
                </h3>
                <p className="text-[15px] text-text-secondary leading-relaxed">
                  {selectedRec.evidenceChain}
                </p>
              </div>
            )}

            {/* Honest Framing */}
            {selectedRec.honestFraming && (
              <div className="bg-status-attention/10 border-l-[3px] border-status-attention p-4 rounded-r-lg">
                <h3 className="text-xs font-semibold text-status-attention uppercase tracking-wider mb-2">
                  Honest Framing
                </h3>
                <p className="text-[15px] text-foreground leading-relaxed">
                  {selectedRec.honestFraming}
                </p>
              </div>
            )}

            {/* Implementation Notes */}
            {selectedRec.implementationNotes && (
              <div>
                <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                  Implementation Notes
                </h3>
                <p className="text-[15px] text-text-secondary leading-relaxed">
                  {selectedRec.implementationNotes}
                </p>
              </div>
            )}

            {/* Systems */}
            {(selectedRec.systemSource || selectedRec.systemDestination) && (
              <div>
                <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                  Systems
                </h3>
                <SystemFlow
                  systems={[
                    selectedRec.systemSource,
                    selectedRec.systemDestination,
                  ].filter(Boolean) as string[]}
                  className="text-sm"
                />
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-border space-y-3">
              {/* Deploy button — available for all recommendation types */}
              <button
                type="button"
                onClick={() => {
                  setDeployRecId(selectedRec.id);
                  setSelectedId(null);
                }}
                className="w-full px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {selectedRec.automationId
                  ? "Deploy improved version"
                  : "Deploy"}
              </button>

              {/* View workflow link — for fix/optimize/enhance types with a target automation */}
              {selectedRec.automationId && (
                <Link
                  href={`/automations/${selectedRec.automationId}`}
                  className="block w-full px-4 py-2.5 text-center text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  View current workflow &rarr;
                </Link>
              )}
            </div>
          </div>
        )}
      </SlideOverPanel>

      {/* Deploy modal */}
      {deployRecId && (() => {
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
