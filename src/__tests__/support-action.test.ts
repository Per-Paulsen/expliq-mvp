import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────

const { mockPrisma, mockGetRequiredSession } = vi.hoisted(() => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn().mockResolvedValue({ email: "test@example.com" }),
    },
  };
  const mockGetRequiredSession = vi.fn().mockResolvedValue({
    user: { id: "user-1", workspaceId: "ws-1" },
  });
  return { mockPrisma, mockGetRequiredSession };
});

// ── Module mocks ──────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/session", () => ({
  getRequiredSession: mockGetRequiredSession,
}));

// ── Imports ───────────────────────────────────────────

import { sendSupportMessage } from "@/lib/actions/support";

// ── Helpers ───────────────────────────────────────────

function makeInput(
  overrides: Partial<Parameters<typeof sendSupportMessage>[0]> = {}
) {
  return {
    message: "How do I create an automation?",
    history: [],
    pagePath: "/dashboard",
    automationId: null,
    ...overrides,
  };
}

function mockFetchOk(category = "question", reply = "Here is how you do it.") {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ category, reply }),
    })
  );
}

// ── Tests ─────────────────────────────────────────────

describe("sendSupportMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();

    mockGetRequiredSession.mockResolvedValue({
      user: { id: "user-1", workspaceId: "ws-1" },
    });
    mockPrisma.user.findUnique.mockResolvedValue({ email: "test@example.com" });

    vi.stubEnv("N8N_SUPPORT_WEBHOOK_URL", "https://n8n.example.com/webhook/support");
    vi.stubEnv("N8N_SUPPORT_WEBHOOK_SECRET", "secret-abc");
  });

  // A1: valid input calls fetch once with correct URL, header, and exact payload shape
  describe("A1 — valid input calls fetch with correct payload", () => {
    it("calls fetch exactly once with the correct URL and x-webhook-secret header", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ category: "question", reply: "Answer." }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await sendSupportMessage(makeInput());

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
      expect(url).toBe("https://n8n.example.com/webhook/support");
      expect(options.headers["x-webhook-secret"]).toBe("secret-abc");
    });

    it("sends the exact payload shape with trimmed message and correct context fields", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ category: "bug", reply: "Fixed." }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const input = makeInput({
        message: "  Is this a bug?  ",
        history: [
          { role: "user", content: "Hi" },
          { role: "assistant", content: "Hello" },
        ],
        pagePath: "/processes",
        automationId: "auto-42",
      });

      const result = await sendSupportMessage(input);

      expect(result).toEqual({
        success: true,
        category: "bug",
        reply: "Fixed.",
        actionsTaken: [],
      });

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, { body: string }])[1].body
      );
      expect(body.message).toBe("Is this a bug?");
      expect(body.history).toEqual([
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello" },
      ]);
      expect(body.context).toEqual({
        pagePath: "/processes",
        automationId: "auto-42",
        workspaceId: "ws-1",
      });
      expect(body.user).toEqual({ email: "test@example.com" });
      expect(typeof body.timestamp).toBe("string");
      expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
    });

    it("caps history to the last 6 entries", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ category: "question", reply: "ok" }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const longHistory = Array.from({ length: 10 }, (_, i) => ({
        role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
        content: `msg-${i}`,
      }));

      await sendSupportMessage(makeInput({ history: longHistory }));

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, { body: string }])[1].body
      );
      expect(body.history).toHaveLength(6);
      expect(body.history).toEqual(longHistory.slice(-6));
    });

    it("returns { success, category, reply, actionsTaken } from the webhook response", async () => {
      mockFetchOk("feature-request", "We will add that!");

      const result = await sendSupportMessage(makeInput());

      expect(result).toEqual({
        success: true,
        category: "feature-request",
        reply: "We will add that!",
        actionsTaken: [],
      });
    });

    it("workspaceId comes from the session, not from the client payload", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ category: "question", reply: "ok" }),
      });
      vi.stubGlobal("fetch", fetchMock);

      mockGetRequiredSession.mockResolvedValue({
        user: { id: "user-1", workspaceId: "ws-authoritative" },
      });

      // Even if the client were to pass a different workspaceId in context,
      // the action always reads from the session.
      await sendSupportMessage(makeInput({ pagePath: "/dashboard" }));

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, { body: string }])[1].body
      );
      expect(body.context.workspaceId).toBe("ws-authoritative");
    });
  });

  // A1b: actionsTaken parsed from the agentic (Epic 19) response contract
  describe("A1b — actionsTaken from the agentic response", () => {
    it("returns the actionsTaken array verbatim when the webhook includes it", async () => {
      const actionsTaken = [
        { type: "github-issue", ref: "https://github.com/Per-Paulsen/expliq-support-sandbox/issues/2" },
      ];
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            category: "bug",
            reply: "Filed as a bug.",
            actionsTaken,
            slackSummary: "internal-only audit text",
          }),
        })
      );

      const result = await sendSupportMessage(makeInput());

      expect(result).toEqual({
        success: true,
        category: "bug",
        reply: "Filed as a bug.",
        actionsTaken,
      });
    });

    it("defaults actionsTaken to [] when the webhook omits it", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ category: "question", reply: "Here you go." }),
        })
      );

      const result = await sendSupportMessage(makeInput());

      expect(result).toEqual({
        success: true,
        category: "question",
        reply: "Here you go.",
        actionsTaken: [],
      });
    });
  });

  // A2: empty/whitespace message -> { error }, no fetch
  describe("A2 — empty or whitespace message", () => {
    it("returns { error } for an empty string and does not call fetch", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const result = await sendSupportMessage(makeInput({ message: "" }));

      expect(result).toHaveProperty("error");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns { error } for a whitespace-only string and does not call fetch", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const result = await sendSupportMessage(makeInput({ message: "   \t\n  " }));

      expect(result).toHaveProperty("error");
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  // A3: message > 2000 chars -> { error }, no fetch
  describe("A3 — message exceeds 2000 chars", () => {
    it("returns { error } when message is 2001 chars and does not call fetch", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const result = await sendSupportMessage(
        makeInput({ message: "a".repeat(2001) })
      );

      expect(result).toHaveProperty("error");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("accepts a message of exactly 2000 chars", async () => {
      mockFetchOk();
      const result = await sendSupportMessage(
        makeInput({ message: "a".repeat(2000) })
      );
      expect(result).toEqual(
        expect.objectContaining({ success: true })
      );
    });
  });

  // A4: exceeding rate limit (8/min) -> { error }, no fetch
  describe("A4 — rate limit exceeded", () => {
    it("returns { error } on the 9th request within 60s and stops calling fetch", async () => {
      // Use a fresh user ID for this test to isolate the rate-limit state
      const userId = `rate-test-user-${Date.now()}`;
      mockGetRequiredSession.mockResolvedValue({
        user: { id: userId, workspaceId: "ws-1" },
      });

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ category: "question", reply: "ok" }),
      });
      vi.stubGlobal("fetch", fetchMock);

      // First 8 should succeed
      for (let i = 0; i < 8; i++) {
        const res = await sendSupportMessage(makeInput());
        expect(res).toEqual(
          expect.objectContaining({ success: true })
        );
      }

      // 9th should be rate-limited
      const ninthResult = await sendSupportMessage(makeInput());
      expect(ninthResult).toHaveProperty("error");
      // fetch should have been called 8 times, not 9
      expect(fetchMock).toHaveBeenCalledTimes(8);
    });
  });

  // A5: env unset / fetch rejects / non-OK response -> { error }, never throws
  describe("A5 — graceful errors, never throws", () => {
    it("returns { error } when N8N_SUPPORT_WEBHOOK_URL is unset", async () => {
      vi.unstubAllEnvs();
      vi.stubEnv("N8N_SUPPORT_WEBHOOK_SECRET", "secret-abc");
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const result = await sendSupportMessage(makeInput());

      expect(result).toHaveProperty("error");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns { error } when N8N_SUPPORT_WEBHOOK_SECRET is unset", async () => {
      vi.unstubAllEnvs();
      vi.stubEnv("N8N_SUPPORT_WEBHOOK_URL", "https://n8n.example.com/webhook/support");
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const result = await sendSupportMessage(makeInput());

      expect(result).toHaveProperty("error");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns { error } when both env vars are unset", async () => {
      vi.unstubAllEnvs();
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const result = await sendSupportMessage(makeInput());

      expect(result).toHaveProperty("error");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns { error } when fetch rejects (network error) and does not throw", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("Network error"))
      );

      const result = await sendSupportMessage(makeInput());

      expect(result).toHaveProperty("error");
    });

    it("returns { error } when webhook returns a non-OK status and does not throw", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 503 })
      );

      const result = await sendSupportMessage(makeInput());

      expect(result).toHaveProperty("error");
    });

    it("never throws — all error paths return { error } without rejecting", async () => {
      // Verify none of the error paths throw by checking they all resolve
      vi.unstubAllEnvs();
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fail")));

      await expect(sendSupportMessage(makeInput())).resolves.toHaveProperty("error");
    });
  });

  // A6: email obtained via prisma.user.findUnique, not from the session
  describe("A6 — email comes from prisma, not the session", () => {
    it("calls prisma.user.findUnique with the session user id", async () => {
      // Use a fresh user ID to avoid the module-level rate limiter
      const userId = `a6-test-user-${Date.now()}-1`;
      mockGetRequiredSession.mockResolvedValue({
        user: { id: userId, workspaceId: "ws-1" },
      });
      mockFetchOk();

      await sendSupportMessage(makeInput());

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { email: true },
      });
    });

    it("uses the email returned by prisma, not any email from the session", async () => {
      // The mocked session has no email field — this is intentional
      const userId = `a6-test-user-${Date.now()}-2`;
      mockGetRequiredSession.mockResolvedValue({
        user: { id: userId, workspaceId: "ws-1" },
      });
      mockPrisma.user.findUnique.mockResolvedValue({ email: "from-db@example.com" });

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ category: "question", reply: "ok" }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await sendSupportMessage(makeInput());

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, { body: string }])[1].body
      );
      expect(body.user.email).toBe("from-db@example.com");
    });

    it("does not read email off the session object", async () => {
      // Session mock deliberately omits email; use a fresh user ID
      const userId = `a6-test-user-${Date.now()}-3`;
      mockGetRequiredSession.mockResolvedValue({
        user: { id: userId, workspaceId: "ws-1" },
      });
      mockFetchOk();

      const result = await sendSupportMessage(makeInput());

      // Should still succeed because email comes from DB
      expect(result).toHaveProperty("success", true);
      // prisma must have been called
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
    });
  });
});
