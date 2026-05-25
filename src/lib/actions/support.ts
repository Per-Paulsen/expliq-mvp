"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";

// ── Types ──────────────────────────────────────────────

export interface SupportMessage {
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
  pagePath: string;
  automationId: string | null;
}

export type SupportResult =
  | { success: true; category: string; reply: string }
  | { error: string };

// ── Rate limiter ───────────────────────────────────────

// Best-effort in-memory rate limit. Does not survive serverless instance
// recycling; acceptable for M1 because the only exposure is LLM spend.
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(userId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return true;
  }
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return false;
}

// ── Action ─────────────────────────────────────────────

export async function sendSupportMessage(
  input: SupportMessage
): Promise<SupportResult> {
  const session = await getRequiredSession();
  const { id: userId, workspaceId } = session.user;

  // Validate message
  const trimmed = input.message.trim();
  if (trimmed.length === 0) {
    return { error: "Message cannot be empty." };
  }
  if (trimmed.length > 2000) {
    return { error: "Message exceeds the 2000-character limit." };
  }

  // Rate limit
  if (isRateLimited(userId)) {
    return { error: "Too many requests. Please wait before sending again." };
  }

  // Fetch email from DB — email is not on the session
  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  // Env check
  const webhookUrl = process.env.N8N_SUPPORT_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_SUPPORT_WEBHOOK_SECRET;
  if (!webhookUrl || !webhookSecret) {
    return { error: "Support service is not configured." };
  }

  // Build payload — history capped to last 6 entries
  const payload = {
    message: trimmed,
    history: input.history.slice(-6),
    context: {
      pagePath: input.pagePath,
      automationId: input.automationId,
      workspaceId,
    },
    user: {
      email: userRecord?.email ?? null,
    },
    timestamp: new Date().toISOString(),
  };

  // Post to n8n webhook
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": webhookSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { error: `Webhook returned status ${res.status}.` };
    }

    const json = await res.json();
    return { success: true, category: json.category, reply: json.reply };
  } catch {
    return { error: "Could not reach the support service. Please try again." };
  }
}
