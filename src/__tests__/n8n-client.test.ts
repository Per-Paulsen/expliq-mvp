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

  describe("listWorkflows with tags", () => {
    it("passes tag filter in URL", async () => {
      const workflows = [
        { id: "1", name: "Tagged", active: true, updatedAt: "2024-01-01", createdAt: "2024-01-01" },
      ];
      mockFetch.mockResolvedValue(jsonResponse({ data: workflows }));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.listWorkflows(["production", "critical"]);

      expect(result).toEqual(workflows);
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("tags=production%2Ccritical");
    });

    it("omits tags param when no tags provided", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: [] }));

      const client = createN8nClient("https://n8n.example.com", "key");
      await client.listWorkflows();

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).not.toContain("tags=");
    });

    it("omits tags param when empty array provided", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: [] }));

      const client = createN8nClient("https://n8n.example.com", "key");
      await client.listWorkflows([]);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).not.toContain("tags=");
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

  describe("fetchDiscover", () => {
    it("returns discover data on success", async () => {
      const discoverData = {
        data: {
          scopes: ["workflow:read", "workflow:write"],
          resources: { workflows: { count: 5 } },
        },
      };
      mockFetch.mockResolvedValue(jsonResponse(discoverData));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.fetchDiscover();

      expect(result).toEqual(discoverData);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://n8n.example.com/api/v1/discover",
        expect.objectContaining({ headers: expect.objectContaining({ "X-N8N-API-KEY": "key" }) }),
      );
    });

    it("returns null on non-ok response", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ message: "Not Found" }, 404));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.fetchDiscover();

      expect(result).toBeNull();
    });

    it("returns null on network error", async () => {
      mockFetch.mockRejectedValue(new TypeError("fetch failed"));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.fetchDiscover();

      expect(result).toBeNull();
    });
  });

  describe("fetchTags", () => {
    it("returns tag array from single page", async () => {
      const tags = [
        { id: "1", name: "production", createdAt: "2024-01-01", updatedAt: "2024-01-01" },
        { id: "2", name: "staging", createdAt: "2024-01-02", updatedAt: "2024-01-02" },
      ];
      mockFetch.mockResolvedValue(jsonResponse({ data: tags }));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.fetchTags();

      expect(result).toEqual(tags);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("paginates tags using cursor", async () => {
      const page1 = [{ id: "1", name: "tag1", createdAt: "2024-01-01", updatedAt: "2024-01-01" }];
      const page2 = [{ id: "2", name: "tag2", createdAt: "2024-01-02", updatedAt: "2024-01-02" }];

      mockFetch
        .mockResolvedValueOnce(jsonResponse({ data: page1, nextCursor: "cursor-tags" }))
        .mockResolvedValueOnce(jsonResponse({ data: page2 }));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.fetchTags();

      expect(result).toEqual([...page1, ...page2]);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      const secondCallUrl = mockFetch.mock.calls[1][0];
      expect(secondCallUrl).toContain("cursor=cursor-tags");
    });
  });

  describe("fetchExecutions", () => {
    it("returns execution array", async () => {
      const executions = [
        { id: 1, finished: true, mode: "trigger", status: "success", workflowId: "10", startedAt: "2024-01-01T00:00:00Z", stoppedAt: "2024-01-01T00:01:00Z" },
        { id: 2, finished: false, mode: "manual", status: "running", workflowId: "10", startedAt: "2024-01-02T00:00:00Z", stoppedAt: null },
      ];
      mockFetch.mockResolvedValue(jsonResponse({ data: executions }));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.fetchExecutions("10");

      expect(result).toEqual(executions);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("workflowId=10");
      expect(calledUrl).toContain("limit=250");
    });

    it("respects custom limit", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: [{ id: 1 }] }));

      const client = createN8nClient("https://n8n.example.com", "key");
      await client.fetchExecutions("10", 50);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("limit=50");
    });

    it("paginates and stops when limit reached", async () => {
      const page1 = Array.from({ length: 3 }, (_, i) => ({
        id: i, finished: true, mode: "trigger", status: "success",
        workflowId: "10", startedAt: "2024-01-01T00:00:00Z", stoppedAt: "2024-01-01T00:01:00Z",
      }));
      const page2 = Array.from({ length: 3 }, (_, i) => ({
        id: i + 3, finished: true, mode: "trigger", status: "success",
        workflowId: "10", startedAt: "2024-01-01T00:00:00Z", stoppedAt: "2024-01-01T00:01:00Z",
      }));

      mockFetch
        .mockResolvedValueOnce(jsonResponse({ data: page1, nextCursor: "exec-cursor" }))
        .mockResolvedValueOnce(jsonResponse({ data: page2 }));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.fetchExecutions("10", 5);

      expect(result).toHaveLength(5);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("stops pagination when no more data", async () => {
      const executions = [
        { id: 1, finished: true, mode: "trigger", status: "success", workflowId: "10", startedAt: "2024-01-01T00:00:00Z", stoppedAt: "2024-01-01T00:01:00Z" },
      ];
      mockFetch.mockResolvedValue(jsonResponse({ data: executions }));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.fetchExecutions("10", 100);

      expect(result).toEqual(executions);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("fetchCredentials", () => {
    it("returns credential data on 200", async () => {
      const credentials = [
        { id: "1", name: "Slack OAuth", type: "slackOAuth2Api", createdAt: "2024-01-01", updatedAt: "2024-01-01" },
      ];
      mockFetch.mockResolvedValue(jsonResponse({ data: credentials }));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.fetchCredentials();

      expect(result).toEqual(credentials);
    });

    it("returns null on 403", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ message: "Forbidden" }, 403));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.fetchCredentials();

      expect(result).toBeNull();
    });
  });

  describe("fetchUsers", () => {
    it("returns user data on 200", async () => {
      const users = [
        { id: "u1", email: "admin@example.com", firstName: "Admin", lastName: "User", role: "owner", isPending: false },
      ];
      mockFetch.mockResolvedValue(jsonResponse({ data: users }));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.fetchUsers();

      expect(result).toEqual(users);
    });

    it("returns null on 403", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ message: "Forbidden" }, 403));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.fetchUsers();

      expect(result).toBeNull();
    });
  });

  describe("fetchProjects", () => {
    it("returns project data on 200", async () => {
      const projects = [
        { id: "p1", name: "My Project", type: "team", createdAt: "2024-01-01", updatedAt: "2024-01-01" },
      ];
      mockFetch.mockResolvedValue(jsonResponse({ data: projects }));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.fetchProjects();

      expect(result).toEqual(projects);
    });

    it("returns null on 403", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ message: "Forbidden" }, 403));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.fetchProjects();

      expect(result).toBeNull();
    });
  });

  describe("fetchVariables", () => {
    it("returns variable data on 200", async () => {
      const variables = [
        { id: "v1", key: "API_URL", value: "https://api.example.com", type: "string" },
      ];
      mockFetch.mockResolvedValue(jsonResponse({ data: variables }));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.fetchVariables();

      expect(result).toEqual(variables);
    });

    it("returns null on 403", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ message: "Forbidden" }, 403));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.fetchVariables();

      expect(result).toBeNull();
    });
  });

  describe("deployWorkflow", () => {
    it("sends POST with JSON body and returns created workflow", async () => {
      const workflowData = { name: "New Workflow", nodes: [], connections: {} };
      const created = { id: "99", name: "New Workflow", active: false, updatedAt: "2024-01-01", createdAt: "2024-01-01" };
      mockFetch.mockResolvedValue(jsonResponse(created));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.deployWorkflow(workflowData);

      expect(result).toEqual(created);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://n8n.example.com/api/v1/workflows",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "X-N8N-API-KEY": "key",
            "Content-Type": "application/json",
          }),
          body: JSON.stringify(workflowData),
        }),
      );
    });

    it("throws on non-ok response", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ message: "Bad Request" }, 400));

      const client = createN8nClient("https://n8n.example.com", "key");

      await expect(client.deployWorkflow({ name: "Bad" })).rejects.toThrow(
        "Failed to deploy workflow: 400",
      );
    });
  });

  describe("activateWorkflow", () => {
    it("sends POST to activate endpoint and returns workflow", async () => {
      const activated = { id: "42", name: "My Workflow", active: true, updatedAt: "2024-01-01", createdAt: "2024-01-01" };
      mockFetch.mockResolvedValue(jsonResponse(activated));

      const client = createN8nClient("https://n8n.example.com", "key");
      const result = await client.activateWorkflow("42");

      expect(result).toEqual(activated);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://n8n.example.com/api/v1/workflows/42/activate",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "X-N8N-API-KEY": "key" }),
        }),
      );
    });

    it("throws on non-ok response", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ message: "Not Found" }, 404));

      const client = createN8nClient("https://n8n.example.com", "key");

      await expect(client.activateWorkflow("999")).rejects.toThrow(
        "Failed to activate workflow 999: 404",
      );
    });
  });
});
