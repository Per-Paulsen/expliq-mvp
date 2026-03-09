import { describe, it, expect, vi, beforeEach } from "vitest";
import { createN8nClient } from "@/lib/n8n-client";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createN8nClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("URL normalization", () => {
    it("strips trailing slashes from instanceUrl", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: [] }));

      const client = createN8nClient("https://n8n.example.com///", "key");
      await client.testConnection();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://n8n.example.com/api/v1/workflows?limit=1",
        expect.objectContaining({
          headers: expect.objectContaining({ "X-N8N-API-KEY": "key" }),
        }),
      );
    });
  });

  describe("testConnection", () => {
    it("returns ok true on 200", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: [] }));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.testConnection();

      expect(result).toEqual({ ok: true });
    });

    it("returns error on 401 (invalid key)", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ message: "Unauthorized" }, 401));

      const client = createN8nClient("https://n8n.example.com", "bad-key");
      const result = await client.testConnection();

      expect(result).toEqual({ ok: false, error: "Invalid API key" });
    });

    it("returns error on network failure", async () => {
      mockFetch.mockRejectedValue(new TypeError("fetch failed"));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.testConnection();

      expect(result).toEqual({ ok: false, error: "Instance unreachable" });
    });
  });

  describe("listWorkflows", () => {
    it("returns workflows from a single page", async () => {
      const workflows = [
        { id: "1", name: "Workflow 1", active: true, updatedAt: "2024-01-01", createdAt: "2024-01-01" },
      ];
      mockFetch.mockResolvedValue(jsonResponse({ data: workflows }));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.listWorkflows();

      expect(result).toEqual(workflows);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("paginates using cursor until no nextCursor", async () => {
      const page1 = [{ id: "1", name: "W1", active: true, updatedAt: "2024-01-01", createdAt: "2024-01-01" }];
      const page2 = [{ id: "2", name: "W2", active: false, updatedAt: "2024-01-02", createdAt: "2024-01-02" }];

      mockFetch
        .mockResolvedValueOnce(jsonResponse({ data: page1, nextCursor: "cursor-abc" }))
        .mockResolvedValueOnce(jsonResponse({ data: page2 }));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.listWorkflows();

      expect(result).toEqual([...page1, ...page2]);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      const secondCallUrl = mockFetch.mock.calls[1][0];
      expect(secondCallUrl).toContain("cursor=cursor-abc");
    });

    it("returns empty array when no workflows exist", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: [] }));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.listWorkflows();

      expect(result).toEqual([]);
    });
  });

  describe("getWorkflow", () => {
    it("returns the full workflow JSON", async () => {
      const workflow = {
        id: "42",
        name: "My Workflow",
        active: true,
        updatedAt: "2024-01-01",
        createdAt: "2024-01-01",
        nodes: [{ type: "n8n-nodes-base.start" }],
      };
      mockFetch.mockResolvedValue(jsonResponse(workflow));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.getWorkflow("42");

      expect(result).toEqual(workflow);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://n8n.example.com/api/v1/workflows/42",
        expect.objectContaining({
          headers: expect.objectContaining({ "X-N8N-API-KEY": "key" }),
        }),
      );
    });
  });
});
