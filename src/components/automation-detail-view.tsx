"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, RISK_COLORS, IMPACT_COLORS } from "@/lib/badge-colors";
import { formatRelativeTime } from "@/lib/format";
import { ATTENTION_SIGNAL_MAP, ATTENTION_LABELS } from "@/lib/portfolio-types";
import type { GovernanceSignals } from "@/lib/risk-engine";
import type { AutomationDetail, EditFormState } from "@/lib/automation-detail-types";
import { saveAutomationEdits, markAsReviewed } from "@/lib/actions/automation";
import { regenerateAutomation } from "@/lib/actions/llm";

function PendingPlaceholder() {
  return (
    <p className="text-sm italic text-muted-foreground">Pending generation</p>
  );
}

export function AutomationDetailView({
  automation,
}: {
  automation: AutomationDetail;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    owner: "",
    impactOverride: "",
    reviewCadenceDays: 30,
    statusOverride: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 2) {
      router.back();
    } else {
      router.push("/automations");
    }
  }

  function enterEditMode() {
    setEditForm({
      owner: automation.owner ?? "",
      impactOverride:
        automation.impactOverride ?? automation.impactProposal ?? "",
      reviewCadenceDays: automation.reviewCadenceDays,
      statusOverride: automation.statusOverride ?? "",
    });
    setIsEditing(true);
    setError(null);
  }

  function cancelEdit() {
    setIsEditing(false);
    setError(null);
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const result = await saveAutomationEdits(automation.id, editForm);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setIsEditing(false);
        router.refresh();
      }
    } catch {
      setError("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleMarkReviewed() {
    setIsMarkingReviewed(true);
    setError(null);
    try {
      const result = await markAsReviewed(automation.id);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch {
      setError("Failed to mark as reviewed");
    } finally {
      setIsMarkingReviewed(false);
    }
  }

  async function handleRegenerate() {
    setIsRegenerating(true);
    setError(null);
    try {
      const result = await regenerateAutomation(automation.id);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch {
      setError("Failed to regenerate automation");
    } finally {
      setIsRegenerating(false);
    }
  }

  const activeSignals = Object.entries(ATTENTION_SIGNAL_MAP).filter(
    ([, signalField]) =>
      automation.signals[signalField as keyof GovernanceSignals]
  );

  const coreLogicLines = automation.coreLogic
    ? automation.coreLogic
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => line.replace(/^[-*]\s*/, ""))
    : [];

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to Automations
      </button>

      {/* Error display */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row lg:gap-8">
        {/* Governance sidebar */}
        <aside className="mb-6 w-full lg:mb-0 lg:w-[35%] lg:order-2">
          <div className="space-y-4">
            {/* Risk & Impact card */}
            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-sm font-medium">Risk & Impact</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={cn(
                      "border-0",
                      RISK_COLORS[automation.riskLevel] ?? ""
                    )}
                  >
                    {automation.riskLevel.charAt(0).toUpperCase() +
                      automation.riskLevel.slice(1)}{" "}
                    risk
                  </Badge>
                  {automation.effectiveImpact && (
                    <Badge
                      className={cn(
                        "border-0",
                        IMPACT_COLORS[automation.effectiveImpact] ?? ""
                      )}
                    >
                      {automation.effectiveImpact.charAt(0).toUpperCase() +
                        automation.effectiveImpact.slice(1)}{" "}
                      impact
                    </Badge>
                  )}
                </div>
                {automation.impactOverride &&
                  automation.impactOverride !== automation.impactProposal && (
                    <p className="text-xs text-muted-foreground">
                      LLM: {automation.impactProposal}
                    </p>
                  )}
                {automation.impactReasoning && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {automation.impactReasoning}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Signals section */}
            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-sm font-medium">Signals</h3>
                {activeSignals.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {activeSignals.map(([key]) => (
                      <Badge
                        key={key}
                        variant="destructive"
                        className="text-xs"
                      >
                        {ATTENTION_LABELS[key] ?? key}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No active risk signals
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkReviewed}
                  disabled={isMarkingReviewed}
                >
                  {isMarkingReviewed ? "Marking..." : "Mark as reviewed"}
                </Button>
              </CardContent>
            </Card>

            {/* Metadata section */}
            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-sm font-medium">Metadata</h3>
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Owner
                      </label>
                      <Input
                        value={editForm.owner}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            owner: e.target.value,
                          }))
                        }
                        placeholder="Owner name"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Impact classification
                      </label>
                      <Select
                        value={editForm.impactOverride}
                        onValueChange={(v) =>
                          setEditForm((f) => ({
                            ...f,
                            impactOverride: v ?? "",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Review cadence (days)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={editForm.reviewCadenceDays}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            reviewCadenceDays: parseInt(e.target.value, 10) || 1,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Status override
                      </label>
                      <Select
                        value={editForm.statusOverride}
                        onValueChange={(v) =>
                          setEditForm((f) => ({
                            ...f,
                            statusOverride: v ?? "",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="deprecated">Deprecated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Owner</span>
                      <span>{automation.owner ?? "No owner"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Trigger type
                      </span>
                      <span>{automation.triggerType ?? "Unknown"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Automation updated
                      </span>
                      <span>
                        {automation.automationLastUpdated
                          ? formatRelativeTime(
                              automation.automationLastUpdated
                            )
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Docs updated
                      </span>
                      <span>
                        {automation.documentationLastUpdated
                          ? formatRelativeTime(
                              automation.documentationLastUpdated
                            )
                          : "N/A"}
                      </span>
                    </div>
                    {automation.systemsTouched.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">
                          Systems touched
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {automation.systemsTouched.map((s) => (
                            <Badge key={s} variant="secondary">
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions section */}
            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-sm font-medium">Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {automation.n8nWorkflowUrl && (
                    <a
                      href={automation.n8nWorkflowUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        Open in n8n ↗
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                  >
                    {isRegenerating ? "Regenerating..." : "Regenerate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 lg:order-1 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold">
              {automation.name ?? "Untitled automation"}
            </h1>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={enterEditMode}>
                Edit
              </Button>
            )}
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{automation.platform}</Badge>
            <Badge
              className={cn(
                "border-0",
                STATUS_COLORS[automation.effectiveStatus] ??
                  "bg-secondary text-secondary-foreground"
              )}
            >
              {automation.effectiveStatus.charAt(0).toUpperCase() +
                automation.effectiveStatus.slice(1)}
            </Badge>
          </div>

          <Separator />

          {/* Description */}
          <section>
            <h3 className="text-sm font-medium mb-2">Description</h3>
            <div className="rounded-lg border-l-2 border-muted pl-4">
              {automation.description ? (
                <p className="text-sm text-muted-foreground">
                  {automation.description}
                </p>
              ) : (
                <PendingPlaceholder />
              )}
            </div>
          </section>

          {/* Trigger */}
          <section>
            <h3 className="text-sm font-medium mb-2">Trigger</h3>
            <div className="rounded-lg border-l-2 border-muted pl-4">
              {automation.trigger ? (
                <p className="text-sm text-muted-foreground">
                  {automation.trigger}
                </p>
              ) : (
                <PendingPlaceholder />
              )}
            </div>
          </section>

          {/* Core Logic */}
          <section>
            <h3 className="text-sm font-medium mb-2">Core Logic</h3>
            <div className="rounded-lg border-l-2 border-muted pl-4">
              {coreLogicLines.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {coreLogicLines.map((line, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <PendingPlaceholder />
              )}
            </div>
          </section>

          {/* Data Types */}
          <section>
            <h3 className="text-sm font-medium mb-2">Data Types</h3>
            <div className="rounded-lg border-l-2 border-muted pl-4">
              {automation.dataTypes.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {automation.dataTypes.map((dt) => (
                    <Badge key={dt} variant="secondary">
                      {dt}
                    </Badge>
                  ))}
                </div>
              ) : (
                <PendingPlaceholder />
              )}
            </div>
          </section>

          {/* Side Effects */}
          <section>
            <h3 className="text-sm font-medium mb-2">Side Effects</h3>
            <div className="rounded-lg border-l-2 border-muted pl-4">
              {automation.sideEffects.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {automation.sideEffects.map((se, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      {se}
                    </li>
                  ))}
                </ul>
              ) : (
                <PendingPlaceholder />
              )}
            </div>
          </section>

          {/* Business Context */}
          <section>
            <h3 className="text-sm font-medium mb-2">Business Context</h3>
            <div className="rounded-lg border-l-2 border-muted pl-4">
              {automation.businessContext ? (
                <p className="text-sm text-muted-foreground">
                  {automation.businessContext}
                </p>
              ) : (
                <PendingPlaceholder />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
