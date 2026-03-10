"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  saveConnectorConfig,
  testConnection,
  syncWorkflows,
} from "@/lib/actions/connector";
import { processUnprocessedAutomations } from "@/lib/actions/llm";

interface SyncSummary {
  created: number;
  updated: number;
  unchanged: number;
  removed: number;
  errors: string[];
}

interface SettingsFormProps {
  existingUrl?: string;
  hasApiKey: boolean;
  lastSyncAt: string | null;
}

export function SettingsForm({
  existingUrl,
  hasApiKey,
  lastSyncAt,
}: SettingsFormProps) {
  const [instanceUrl, setInstanceUrl] = useState(existingUrl ?? "");
  const [apiKey, setApiKey] = useState("");

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [saveResult, setSaveResult] = useState<{
    success?: boolean;
    error?: string;
  } | null>(null);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    error?: string;
  } | null>(null);
  const [syncResult, setSyncResult] = useState<{
    success?: boolean;
    error?: string;
    summary?: SyncSummary;
  } | null>(null);
  const [processResult, setProcessResult] = useState<{
    success?: boolean;
    error?: string;
    summary?: { total: number; processed: number; errors: string[] };
  } | null>(null);

  const [configSaved, setConfigSaved] = useState(hasApiKey);

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
    }

    setSaving(false);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);

    const formData = new FormData();
    formData.append("instanceUrl", instanceUrl);
    formData.append("apiKey", apiKey);

    const result = await testConnection(formData);

    if ("error" in result) {
      setTestResult({ error: result.error });
    } else {
      setTestResult({ success: true });
    }

    setTesting(false);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    setProcessResult(null);

    const result = await syncWorkflows();

    if ("error" in result) {
      setSyncResult({ error: result.error });
      setSyncing(false);
      return;
    }

    setSyncResult({ success: true, summary: result.summary });
    setSyncing(false);

    setProcessing(true);
    try {
      const llmResult = await processUnprocessedAutomations();
      setProcessResult({ success: true, summary: llmResult.summary });
    } catch {
      setProcessResult({ error: "LLM processing failed unexpectedly" });
    }
    setProcessing(false);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

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
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? "Testing..." : "Test Connection"}
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
        {testResult?.error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {testResult.error}
          </div>
        )}
        {testResult?.success && (
          <div className="bg-green-500/10 text-green-700 rounded-md p-3 text-sm">
            Connection successful!
          </div>
        )}
      </section>

      {configSaved && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Sync</h2>

          <p className="text-sm text-muted-foreground">
            {lastSyncAt
              ? `Last synced: ${new Date(lastSyncAt).toLocaleString()}`
              : "Never synced"}
          </p>

          <Button onClick={handleSync} disabled={syncing || processing}>
            {syncing ? "Syncing..." : "Sync Now"}
          </Button>

          {syncResult?.error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {syncResult.error}
            </div>
          )}

          {syncResult?.success && syncResult.summary && (
            <div className="space-y-2">
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
            </div>
          )}

          {processing && (
            <div className="text-sm text-muted-foreground">
              Processing automations with AI...
            </div>
          )}

          {processResult?.error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {processResult.error}
            </div>
          )}

          {processResult?.success && processResult.summary && (
            <div className="space-y-2">
              <div className="bg-green-500/10 text-green-700 rounded-md p-3 text-sm">
                Processed {processResult.summary.processed} of{" "}
                {processResult.summary.total} automations.
              </div>
              {processResult.summary.errors.length > 0 && (
                <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                  <p className="font-medium">Processing errors:</p>
                  <ul className="mt-1 list-inside list-disc">
                    {processResult.summary.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
