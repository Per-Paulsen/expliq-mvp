export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface N8nClient {
  testConnection(): Promise<{ ok: true } | { ok: false; error: string }>;
  listWorkflows(): Promise<N8nWorkflow[]>;
  getWorkflow(id: string): Promise<N8nWorkflow>;
}

interface ListWorkflowsResponse {
  data: N8nWorkflow[];
  nextCursor?: string;
}

const MAX_PAGES = 100;

export function createN8nClient(
  instanceUrl: string,
  apiKey: string,
): N8nClient {
  const baseUrl = instanceUrl.replace(/\/+$/, "");

  const headers = {
    "X-N8N-API-KEY": apiKey,
    Accept: "application/json",
  };

  return {
    async testConnection() {
      try {
        const res = await fetch(
          `${baseUrl}/api/v1/workflows?limit=1`,
          { headers },
        );

        if (res.ok) {
          return { ok: true as const };
        }

        if (res.status === 401) {
          return { ok: false, error: "Invalid API key" };
        }

        return { ok: false, error: `Unexpected status ${res.status}` };
      } catch {
        return { ok: false, error: "Instance unreachable" };
      }
    },

    async listWorkflows() {
      const workflows: N8nWorkflow[] = [];
      let cursor: string | undefined;

      for (let page = 0; page < MAX_PAGES; page++) {
        const url = new URL(`${baseUrl}/api/v1/workflows`);
        if (cursor) {
          url.searchParams.set("cursor", cursor);
        }

        const res = await fetch(url.toString(), { headers });

        if (!res.ok) {
          throw new Error(`Failed to list workflows: ${res.status}`);
        }

        const body: ListWorkflowsResponse = await res.json();
        workflows.push(...body.data);

        if (!body.nextCursor) {
          break;
        }
        cursor = body.nextCursor;
      }

      return workflows;
    },

    async getWorkflow(id: string) {
      const res = await fetch(
        `${baseUrl}/api/v1/workflows/${id}`,
        { headers },
      );

      if (!res.ok) {
        throw new Error(`Failed to get workflow ${id}: ${res.status}`);
      }

      return res.json();
    },
  };
}
