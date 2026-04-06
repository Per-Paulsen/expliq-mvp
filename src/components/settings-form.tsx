"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertMessage } from "@/components/alert-message";
import { Check, Loader2, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  saveConnectorConfig,
  verifyAndDiscover,
  updateSelectedTags,
  syncAndAnalyze,
  getAnalysisStatus,
  type TagPreview,
  type SyncSummary,
} from "@/lib/actions/connector";

// ── Helpers ──────────────────────────────────────────────

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Types ────────────────────────────────────────────────

type SyncStage =
  | "idle"
  | "syncing"
  | "analyzing_workflows"
  | "analyzing_workspace"
  | "complete"
  | "failed";

interface SettingsFormProps {
  existingUrl?: string;
  hasApiKey: boolean;
  lastSyncAt: string | null;
  discoveryData?: {
    tags: TagPreview[];
    totalWorkflows: number;
  } | null;
  selectedTags?: string[];
}

// ── Sync stage UI config ─────────────────────────────────

const STAGE_LIST: { key: SyncStage; label: string }[] = [
  { key: "syncing", label: "Syncing workflows..." },
  { key: "analyzing_workflows", label: "Analyzing workflows..." },
  { key: "analyzing_workspace", label: "Clustering processes & generating recommendations..." },
  { key: "complete", label: "Complete" },
];

function stageIndex(stage: SyncStage): number {
  return STAGE_LIST.findIndex((s) => s.key === stage);
}

// ── Component ────────────────────────────────────────────

export function SettingsForm({
  existingUrl,
  hasApiKey,
  lastSyncAt,
  discoveryData: initialDiscoveryData,
  selectedTags: initialSelectedTags,
}: SettingsFormProps) {
  const [instanceUrl, setInstanceUrl] = useState(existingUrl ?? "");
  const [apiKey, setApiKey] = useState("");

  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [saveResult, setSaveResult] = useState<{
    success?: boolean;
    error?: string;
  } | null>(null);
  const [verifyResult, setVerifyResult] = useState<{
    success?: boolean;
    error?: string;
  } | null>(null);
  const [syncResult, setSyncResult] = useState<{
    success?: boolean;
    error?: string;
    summary?: SyncSummary;
  } | null>(null);

  const [configSaved, setConfigSaved] = useState(hasApiKey);
  const [editingConnection, setEditingConnection] = useState(false);

  // Sync progress state
  const [syncStage, setSyncStage] = useState<SyncStage>("idle");
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Discovery data state
  const [discoveryData, setDiscoveryData] = useState<{
    tags: TagPreview[];
    totalWorkflows: number;
  } | null>(initialDiscoveryData ?? null);

  // Selected tags state
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>(() => {
    if (initialSelectedTags !== undefined) {
      return initialSelectedTags;
    }
    if (initialDiscoveryData?.tags) {
      return initialDiscoveryData.tags.map((t) =>
        t.id === null ? "__untagged__" : t.name,
      );
    }
    return [];
  });

  // Computed selected workflow count
  const selectedWorkflowCount = useMemo(() => {
    if (!discoveryData) return 0;
    return discoveryData.tags
      .filter((t) => {
        const key = t.id === null ? "__untagged__" : t.name;
        return selectedTagNames.includes(key);
      })
      .reduce((sum, t) => sum + t.workflowCount, 0);
  }, [discoveryData, selectedTagNames]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // ── Handlers ─────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    setSaveResult(null);

    const formData = new FormData();
    formData.append("instanceUrl", instanceUrl);
    formData.append("apiKey", apiKey);

    const result = await saveConnectorConfig(formData);

    if ("error" in result) {
      setSaveResult({ error: result.error });
    } else {
      setSaveResult({ success: true });
      setConfigSaved(true);
      setDiscoveryData(null);
      setSelectedTagNames([]);
    }

    setSaving(false);
  }

  async function handleVerify() {
    setVerifying(true);
    setVerifyResult(null);

    const result = await verifyAndDiscover();

    if ("error" in result) {
      setVerifyResult({ error: result.error });
    } else {
      setVerifyResult({ success: true });
      const tags = result.tags ?? [];
      const totalWorkflows = result.totalWorkflows ?? 0;
      setDiscoveryData({ tags, totalWorkflows });
      const allTagKeys = tags.map((t: TagPreview) =>
        t.id === null ? "__untagged__" : t.name,
      );
      setSelectedTagNames(allTagKeys);
      await updateSelectedTags(allTagKeys);
      setEditingConnection(false);
    }

    setVerifying(false);
  }

  function handleTagToggle(tagKey: string, checked: boolean) {
    const next = checked
      ? [...selectedTagNames, tagKey]
      : selectedTagNames.filter((k) => k !== tagKey);
    setSelectedTagNames(next);
    updateSelectedTags(next);
  }

  function handleSelectAll() {
    if (!discoveryData) return;
    const allKeys = discoveryData.tags.map((t) =>
      t.id === null ? "__untagged__" : t.name,
    );
    setSelectedTagNames(allKeys);
    updateSelectedTags(allKeys);
  }

  function handleDeselectAll() {
    setSelectedTagNames([]);
    updateSelectedTags([]);
  }

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      const { status } = await getAnalysisStatus();

      if (status === "analyzing_workflows") {
        setSyncStage("analyzing_workflows");
      } else if (status === "analyzing_workspace") {
        setSyncStage("analyzing_workspace");
      } else if (status === "complete") {
        setSyncStage("complete");
        if (pollingRef.current) clearInterval(pollingRef.current);
      } else if (status === "failed") {
        setSyncStage("failed");
        setAnalysisError("Analysis pipeline failed. Check server logs for details.");
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    }, 2500);
  }, []);

  async function handleSync() {
    setSyncStage("syncing");
    setSyncResult(null);
    setAnalysisError(null);

    const result = await syncAndAnalyze();

    if ("error" in result) {
      setSyncResult({ error: result.error });
      setSyncStage("failed");
      setAnalysisError(result.error ?? "Sync failed");
    } else {
      setSyncResult({ success: true, summary: result.summary });
      // Sync done, analysis running in background — start polling
      setSyncStage("analyzing_workflows");
      startPolling();
    }
  }

  // ── Derived state ────────────────────────────────────

  const showSummaryView = configSaved && !!discoveryData && !editingConnection;
  const isSyncing = syncStage !== "idle" && syncStage !== "complete" && syncStage !== "failed";
  const currentStageIdx = stageIndex(syncStage);

  return (
    <div className="space-y-5">
      {/* Section 1: N8N Connection */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              N8N Connection
            </h2>
            <p className="text-sm text-text-tertiary mt-1">
              Connect your n8n instance to import workflows
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full",
              discoveryData
                ? "bg-status-healthy/10 text-status-healthy"
                : "bg-surface-raised text-text-tertiary",
            )}
          >
            {discoveryData ? "Connected" : "Not configured"}
          </span>
        </div>

        {showSummaryView ? (
          /* Summary view */
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm text-text-secondary">
                <span className="text-text-tertiary">URL:</span> {instanceUrl}
              </p>
              <p className="text-sm text-text-secondary">
                <span className="text-text-tertiary">API Key:</span>{" "}
                <span className="font-mono">{"••••••••"}</span>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingConnection(true)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          </div>
        ) : (
          /* Edit mode */
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="instanceUrl" className="text-sm font-medium text-foreground">
                Instance URL
              </label>
              <Input
                id="instanceUrl"
                value={instanceUrl}
                onChange={(e) => setInstanceUrl(e.target.value)}
                placeholder="https://your-n8n-instance.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="apiKey" className="text-sm font-medium text-foreground">
                API Key
              </label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  hasApiKey
                    ? "API key saved — enter new to replace"
                    : "Enter your n8n API key"
                }
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={handleVerify}
                disabled={verifying || !configSaved}
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Verifying...
                  </>
                ) : (
                  "Verify Connection"
                )}
              </Button>
              {configSaved && discoveryData && (
                <Button
                  variant="ghost"
                  onClick={() => setEditingConnection(false)}
                >
                  Cancel
                </Button>
              )}
            </div>

            {saveResult?.error && (
              <AlertMessage variant="error">{saveResult.error}</AlertMessage>
            )}
            {saveResult?.success && (
              <AlertMessage variant="success">Connection settings saved.</AlertMessage>
            )}
            {verifyResult?.error && (
              <AlertMessage variant="error">{verifyResult.error}</AlertMessage>
            )}
            {verifyResult?.success && (
              <AlertMessage variant="success">Connection verified successfully!</AlertMessage>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Workflow Scope */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
            Workflow Scope
          </h2>
          <p className="text-sm text-text-tertiary mt-1">
            Choose which workflow groups to include in analysis
          </p>
        </div>

        <div className={cn(!discoveryData && "opacity-50 pointer-events-none")}>
          {discoveryData ? (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                <strong className="font-mono">{discoveryData.totalWorkflows}</strong> workflows
                found in your n8n instance
              </p>

              <div className="flex gap-3 text-sm">
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
                  onClick={handleSelectAll}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
                  onClick={handleDeselectAll}
                >
                  Deselect all
                </button>
              </div>

              <div className="space-y-3">
                {discoveryData.tags.map((tag) => {
                  const key = tag.id === null ? "__untagged__" : tag.name;
                  const isChecked = selectedTagNames.includes(key);
                  return (
                    <div key={key} className="flex items-start gap-3">
                      <Checkbox
                        id={`tag-${key}`}
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handleTagToggle(key, checked as boolean)
                        }
                        className="mt-0.5"
                      />
                      <div className="space-y-0.5">
                        <label
                          htmlFor={`tag-${key}`}
                          className="text-sm font-medium leading-none cursor-pointer text-foreground"
                        >
                          {tag.name} ({tag.workflowCount})
                        </label>
                        {tag.workflowNames.length > 0 && (
                          <p className="text-xs text-text-tertiary">
                            {tag.workflowNames.join(", ")}
                            {tag.workflowCount > tag.workflowNames.length &&
                              ", ..."}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-sm text-text-secondary">
                <strong className="font-mono">{selectedWorkflowCount}</strong> workflows
                selected
              </p>
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">
              Verify your connection to see available workflows
            </p>
          )}
        </div>
      </div>

      {/* Section 3: Sync & Analyze */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              Sync & Analyze
            </h2>
            <p className="text-sm text-text-tertiary mt-1">
              Import workflows and run AI analysis
            </p>
          </div>
          <p className="text-xs text-text-tertiary">
            Last synced: {lastSyncAt ? formatTimeAgo(new Date(lastSyncAt)) : "Never"}
          </p>
        </div>

        <div
          className={cn(
            (!discoveryData || selectedTagNames.length === 0) &&
              "opacity-50 pointer-events-none",
          )}
        >
          <Button onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                Processing...
              </>
            ) : (
              "Sync & Analyze"
            )}
          </Button>
        </div>

        {/* Stage progress list */}
        {syncStage !== "idle" && (
          <div className="space-y-2 pt-2">
            {STAGE_LIST.map((stage, idx) => {
              const isCompleted = syncStage === "failed"
                ? idx < currentStageIdx
                : currentStageIdx > idx || syncStage === "complete";
              const isCurrent =
                syncStage !== "complete" &&
                syncStage !== "failed" &&
                currentStageIdx === idx;
              const isFailed = syncStage === "failed" && currentStageIdx === idx;
              const isPending = !isCompleted && !isCurrent && !isFailed;

              return (
                <div key={stage.key} className="flex items-center gap-2.5">
                  {isCompleted && (
                    <Check className="h-4 w-4 text-status-healthy flex-shrink-0" />
                  )}
                  {isCurrent && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                  )}
                  {isFailed && (
                    <X className="h-4 w-4 text-status-critical flex-shrink-0" />
                  )}
                  {isPending && (
                    <div className="h-4 w-4 flex items-center justify-center flex-shrink-0">
                      <div className="h-1.5 w-1.5 rounded-full bg-text-tertiary" />
                    </div>
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      isCompleted && "text-status-healthy",
                      isCurrent && "text-foreground",
                      isFailed && "text-status-critical",
                      isPending && "text-text-tertiary",
                    )}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}

            {syncStage === "failed" && analysisError && (
              <AlertMessage variant="error" className="mt-2">
                {analysisError}
              </AlertMessage>
            )}
          </div>
        )}

        {/* Sync result display */}
        {syncResult?.error && syncStage === "idle" && (
          <AlertMessage variant="error">{syncResult.error}</AlertMessage>
        )}

        {syncResult?.success && syncResult.summary && syncStage === "complete" && (
          <div className="space-y-4 pt-2">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([
                { label: "Created", value: syncResult.summary.created },
                { label: "Updated", value: syncResult.summary.updated },
                { label: "Unchanged", value: syncResult.summary.unchanged },
                { label: "Removed", value: syncResult.summary.removed },
              ] as const).map((stat) => (
                <div
                  key={stat.label}
                  className="bg-surface rounded-xl border border-border shadow-sm p-4 text-center"
                >
                  <div className="text-2xl font-bold font-mono text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-xs text-text-tertiary">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Sync errors */}
            {syncResult.summary.errors.length > 0 && (
              <AlertMessage variant="error">
                <p className="font-medium">Sync errors:</p>
                <ul className="mt-1 list-inside list-disc">
                  {syncResult.summary.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </AlertMessage>
            )}

            {/* Enrichment badges */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { name: "Credentials", available: syncResult.summary.enrichment.credentials },
                  { name: "Users", available: syncResult.summary.enrichment.users },
                  { name: "Projects", available: syncResult.summary.enrichment.projects },
                  { name: "Variables", available: syncResult.summary.enrichment.variables },
                ] as const
              ).map((item) => (
                <span
                  key={item.name}
                  className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-full",
                    item.available
                      ? "bg-status-healthy/10 text-status-healthy"
                      : "bg-surface-raised text-text-tertiary",
                  )}
                >
                  {item.name}: {item.available ? "available" : "unavailable"}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
