"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  saveConnectorConfig,
  verifyAndDiscover,
  updateSelectedTags,
  syncAndAnalyze,
  type TagPreview,
  type SyncSummary,
} from "@/lib/actions/connector";

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
  const [syncing, setSyncing] = useState(false);

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

  // Discovery data state — initialized from server props
  const [discoveryData, setDiscoveryData] = useState<{
    tags: TagPreview[];
    totalWorkflows: number;
  } | null>(initialDiscoveryData ?? null);

  // Selected tags state — initialized from server props or all tags if discovery data exists
  // When selectedTags is explicitly provided (even empty), respect it.
  // Only auto-select all tags when selectedTags is undefined (no prior selection persisted).
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>(() => {
    if (initialSelectedTags !== undefined) {
      return initialSelectedTags;
    }
    if (initialDiscoveryData?.tags) {
      return initialDiscoveryData.tags.map((t) =>
        t.id === null ? "__untagged__" : t.name
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
      // Clear discovery data since credentials changed
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
      // Update discovery data from result
      const tags = result.tags ?? [];
      const totalWorkflows = result.totalWorkflows ?? 0;
      setDiscoveryData({ tags, totalWorkflows });
      // Default: all tags selected
      const allTagKeys = tags.map((t: TagPreview) =>
        t.id === null ? "__untagged__" : t.name
      );
      setSelectedTagNames(allTagKeys);
      // Persist the default selection
      await updateSelectedTags(allTagKeys);
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
      t.id === null ? "__untagged__" : t.name
    );
    setSelectedTagNames(allKeys);
    updateSelectedTags(allKeys);
  }

  function handleDeselectAll() {
    setSelectedTagNames([]);
    updateSelectedTags([]);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);

    const result = await syncAndAnalyze();

    if ("error" in result) {
      setSyncResult({ error: result.error });
    } else {
      setSyncResult({ success: true, summary: result.summary });
    }

    setSyncing(false);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Section 1: Connection */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">n8n Connection</h2>

        <div className="space-y-2">
          <label htmlFor="instanceUrl" className="text-sm font-medium">
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
          <label htmlFor="apiKey" className="text-sm font-medium">
            API Key
          </label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              hasApiKey
                ? "API key saved \u2014 enter new to replace"
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
            {verifying ? "Verifying..." : "Verify Connection"}
          </Button>
        </div>

        {saveResult?.error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {saveResult.error}
          </div>
        )}
        {saveResult?.success && (
          <div className="bg-green-500/10 text-green-700 rounded-md p-3 text-sm">
            Connection settings saved.
          </div>
        )}
        {verifyResult?.error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {verifyResult.error}
          </div>
        )}
        {verifyResult?.success && (
          <div className="bg-green-500/10 text-green-700 rounded-md p-3 text-sm">
            Connection verified successfully!
          </div>
        )}
      </section>

      {/* Section 2: Tag Selection — visible after successful discovery */}
      {discoveryData && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Tag Selection</h2>

          <p className="text-sm">
            <strong>{discoveryData.totalWorkflows} workflows found</strong> in
            your n8n instance
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
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {tag.name} ({tag.workflowCount})
                    </label>
                    {tag.workflowNames.length > 0 && (
                      <p className="text-xs text-muted-foreground">
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

          <p className="text-sm">
            <strong>{selectedWorkflowCount} workflows selected</strong> for
            analysis
          </p>
        </section>
      )}

      {/* Section 3: Sync & Analyze — visible when tags are selected */}
      {discoveryData && selectedTagNames.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Sync & Analyze</h2>

          <p className="text-sm text-muted-foreground">
            {lastSyncAt
              ? `Last synced: ${new Date(lastSyncAt).toLocaleString()}`
              : "Never synced"}
          </p>

          <Button onClick={handleSync} disabled={syncing}>
            {syncing ? "Syncing..." : "Sync & Analyze"}
          </Button>

          {syncResult?.error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {syncResult.error}
            </div>
          )}

          {syncResult?.success && syncResult.summary && (
            <div className="space-y-3">
              <div className="bg-green-500/10 text-green-700 rounded-md p-3 text-sm">
                Sync completed successfully.
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-md border p-3 text-center">
                  <div className="text-2xl font-bold">
                    {syncResult.summary.created}
                  </div>
                  <div className="text-xs text-muted-foreground">Created</div>
                </div>
                <div className="rounded-md border p-3 text-center">
                  <div className="text-2xl font-bold">
                    {syncResult.summary.updated}
                  </div>
                  <div className="text-xs text-muted-foreground">Updated</div>
                </div>
                <div className="rounded-md border p-3 text-center">
                  <div className="text-2xl font-bold">
                    {syncResult.summary.unchanged}
                  </div>
                  <div className="text-xs text-muted-foreground">Unchanged</div>
                </div>
                <div className="rounded-md border p-3 text-center">
                  <div className="text-2xl font-bold">
                    {syncResult.summary.removed}
                  </div>
                  <div className="text-xs text-muted-foreground">Removed</div>
                </div>
              </div>
              {syncResult.summary.errors.length > 0 && (
                <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                  <p className="font-medium">Sync errors:</p>
                  <ul className="mt-1 list-inside list-disc">
                    {syncResult.summary.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="text-xs text-muted-foreground space-x-3">
                <span>
                  Credentials:{" "}
                  {syncResult.summary.enrichment.credentials
                    ? "available"
                    : "unavailable"}
                </span>
                <span>
                  Users:{" "}
                  {syncResult.summary.enrichment.users
                    ? "available"
                    : "unavailable"}
                </span>
                <span>
                  Projects:{" "}
                  {syncResult.summary.enrichment.projects
                    ? "available"
                    : "unavailable"}
                </span>
                <span>
                  Variables:{" "}
                  {syncResult.summary.enrichment.variables
                    ? "available"
                    : "unavailable"}
                </span>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
