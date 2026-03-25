import { prisma } from "@/lib/prisma";
import {
  getRiskLevel,
  getGovernanceSignals,
  getEffectiveImpact,
} from "@/lib/risk-engine";
import type { Automation } from "@/generated/prisma/client";
import type { GovernanceSignals } from "@/lib/risk-engine";

// ── Helpers ────────────────────────────────────────────

/** Convert GovernanceSignals object to array of active signal name strings. */
export function toSignalArray(signals: GovernanceSignals): string[] {
  return (Object.entries(signals) as [string, boolean][])
    .filter(([, active]) => active)
    .map(([name]) => name);
}

/** Compare governance-relevant fields between before/after automation objects. */
export function computeChanges(
  before: Automation,
  after: Automation,
): { field: string; oldValue: unknown; newValue: unknown }[] {
  const fields: (keyof Automation)[] = [
    "owner",
    "impactOverride",
    "reviewCadenceDays",
    "statusOverride",
    "lastReviewDate",
  ];

  const changes: { field: string; oldValue: unknown; newValue: unknown }[] = [];

  for (const field of fields) {
    const oldVal = before[field];
    const newVal = after[field];

    // Handle Date comparison
    if (oldVal instanceof Date && newVal instanceof Date) {
      if (oldVal.getTime() !== newVal.getTime()) {
        changes.push({ field, oldValue: oldVal.toISOString(), newValue: newVal.toISOString() });
      }
    } else if (oldVal !== newVal) {
      changes.push({ field, oldValue: oldVal, newValue: newVal });
    }
  }

  return changes;
}

// ── Main Notifier ──────────────────────────────────────

export async function notifyGovernanceChange(
  before: Automation,
  after: Automation,
  userId: string,
): Promise<void> {
  try {
    const webhookUrl = process.env.N8N_GOVERNANCE_WEBHOOK_URL;
    if (!webhookUrl) return;

    const workspaceId = before.workspaceId;

    // Compute risk levels and signals for both states
    const previousRiskLevel = getRiskLevel(before);
    const riskLevel = getRiskLevel(after);
    const signalsBefore = getGovernanceSignals(before);
    const signalsAfter = getGovernanceSignals(after);

    // Resolved = true before, false after
    const resolvedSignals = (
      Object.keys(signalsBefore) as (keyof GovernanceSignals)[]
    ).filter((key) => signalsBefore[key] && !signalsAfter[key]);

    // Active = true after
    const activeSignals = toSignalArray(signalsAfter);

    // Compute field changes
    const changes = computeChanges(before, after);

    // Fetch user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const payload = {
      event: "automation.governance_changed",
      automation: {
        id: after.id,
        name: after.name,
        riskLevel,
        previousRiskLevel,
        riskLevelChanged: riskLevel !== previousRiskLevel,
        impactLevel: getEffectiveImpact(after),
        owner: after.owner,
        systemsTouched: after.systemsTouched,
        activeSignals,
        resolvedSignals,
      },
      changes,
      changedBy: user?.email ?? "unknown",
      workspaceId,
      timestamp: new Date().toISOString(),
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const secretName = process.env.N8N_GOVERNANCE_WEBHOOK_SECRET_NAME;
    const secretValue = process.env.N8N_GOVERNANCE_WEBHOOK_SECRET;
    if (secretName && secretValue) {
      headers[secretName] = secretValue;
    }

    await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch {
    // Best-effort: swallow all errors
  }
}
