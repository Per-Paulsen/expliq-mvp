// Risk Engine V2 — Governance Dot computation (Epic 11)
// Pure functions only — no DB calls, no Prisma imports.

// ── R2 Governance Dot ──────────────────────────────────

export type GovernanceDot = "healthy" | "attention" | "critical";

export interface GovernanceDotInput {
  errorRate: number | null;
  isActive: boolean;
  impact: { level: string } | null;
  detectability: { level: string } | null;
  lastExecutedAt: Date | null;
  rawWorkflowJson: unknown;
}

function hasErrorWorkflow(rawWorkflowJson: unknown): boolean {
  if (
    rawWorkflowJson != null &&
    typeof rawWorkflowJson === "object" &&
    "settings" in rawWorkflowJson
  ) {
    const settings = (rawWorkflowJson as Record<string, unknown>).settings;
    if (
      settings != null &&
      typeof settings === "object" &&
      "errorWorkflow" in settings
    ) {
      const val = (settings as Record<string, unknown>).errorWorkflow;
      return typeof val === "string" && val.length > 0;
    }
  }
  return false;
}

export function computeGovernanceDot(input: GovernanceDotInput): GovernanceDot {
  // ── Critical (red) — check first, highest priority ──
  if (input.isActive && input.errorRate != null && input.errorRate > 0.20) {
    return "critical";
  }
  if (
    input.impact?.level === "critical" &&
    input.detectability?.level === "silent"
  ) {
    return "critical";
  }

  // ── Attention (amber) ──
  if (
    input.isActive &&
    input.errorRate != null &&
    input.errorRate >= 0.05 &&
    input.errorRate <= 0.20
  ) {
    return "attention";
  }
  if (!input.isActive && input.lastExecutedAt != null) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (input.lastExecutedAt >= thirtyDaysAgo) {
      return "attention";
    }
  }
  if (
    (input.impact?.level === "critical" || input.impact?.level === "high") &&
    !hasErrorWorkflow(input.rawWorkflowJson)
  ) {
    return "attention";
  }

  // ── Healthy (green) — everything else ──
  return "healthy";
}

