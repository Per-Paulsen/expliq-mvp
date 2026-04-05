// TODO: Epic 10 — R1 automation edit actions stubbed. Fields removed in schema
// migration (owner, impactOverride, statusOverride, reviewCadenceDays,
// lastReviewDate). R2 detail view will have different edit capabilities.
"use server";

import type { EditFormState } from "@/lib/automation-detail-types";

/**
 * @deprecated R1 edit action — target fields removed in Epic 10.
 */
export async function saveAutomationEdits(
  _automationId: string,
  _data: EditFormState,
) {
  return { error: "R1 edit actions disabled — Epic 10 schema migration removed target fields." };
}

/**
 * @deprecated R1 review action — lastReviewDate removed in Epic 10.
 */
export async function markAsReviewed(_automationId: string) {
  return { error: "R1 review actions disabled — Epic 10 schema migration removed target fields." };
}
