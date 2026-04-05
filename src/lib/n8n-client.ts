export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface N8nTag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface N8nExecution {
  id: number;
  finished: boolean;
  mode: string;
  status: string;
  workflowId: string;
  startedAt: string;
  stoppedAt: string | null;
}

export interface N8nCredential {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface N8nUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isPending: boolean;
}

export interface N8nProject {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface N8nVariable {
  id: string;
  key: string;
  value: string;
  type: string;
}

export interface N8nDiscoverResponse {
  data: {
    scopes: string[];
    resources: Record<string, unknown>;
    [key: string]: unknown;
  };
}

export interface N8nClient {
  testConnection(): Promise<{ ok: true } | { ok: false; error: string }>;
  listWorkflows(tags?: string[]): Promise<N8nWorkflow[]>;
  getWorkflow(id: string): Promise<N8nWorkflow>;
  fetchDiscover(): Promise<N8nDiscoverResponse | null>;
  fetchTags(): Promise<N8nTag[]>;
  fetchExecutions(workflowId: string, limit?: number): Promise<N8nExecution[]>;
  fetchCredentials(): Promise<N8nCredential[] | null>;
  fetchUsers(): Promise<N8nUser[] | null>;
  fetchProjects(): Promise<N8nProject[] | null>;
  fetchVariables(): Promise<N8nVariable[] | null>;
  deployWorkflow(workflowData: object): Promise<N8nWorkflow>;
  activateWorkflow(id: string): Promise<N8nWorkflow>;
}

interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
}

const MAX_PAGES = 100;
const DEFAULT_EXECUTION_LIMIT = 250;

async function fetchOptional<T>(
  url: string,
  headers: Record<string, string>,
): Promise<T[] | null> {
  try {
    const res = await fetch(url, { headers });
    if (res.status === 403) return null;
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const body = await res.json();
    return body.data ?? body;
  } catch {
    return null;
  }
}

export function createN8nClient(
  instanceUrl: string,
  apiKey: string,
): N8nClient {
  const baseUrl = instanceUrl.replace(/\/+$/, "");

  const headers: Record<string, string> = {
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

    async listWorkflows(tags?: string[]) {
      const workflows: N8nWorkflow[] = [];
      let cursor: string | undefined;

      for (let page = 0; page < MAX_PAGES; page++) {
        const url = new URL(`${baseUrl}/api/v1/workflows`);
        if (cursor) {
          url.searchParams.set("cursor", cursor);
        }
        if (tags && tags.length > 0) {
          url.searchParams.set("tags", tags.join(","));
        }

        const res = await fetch(url.toString(), { headers });

        if (!res.ok) {
          throw new Error(`Failed to list workflows: ${res.status}`);
        }

        const body: PaginatedResponse<N8nWorkflow> = await res.json();
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

    async fetchDiscover() {
      try {
        const res = await fetch(`${baseUrl}/api/v1/discover`, { headers });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    },

    async fetchTags() {
      const tags: N8nTag[] = [];
      let cursor: string | undefined;

      for (let page = 0; page < MAX_PAGES; page++) {
        const url = new URL(`${baseUrl}/api/v1/tags`);
        if (cursor) {
          url.searchParams.set("cursor", cursor);
        }

        const res = await fetch(url.toString(), { headers });

        if (!res.ok) {
          throw new Error(`Failed to fetch tags: ${res.status}`);
        }

        const body: PaginatedResponse<N8nTag> = await res.json();
        tags.push(...body.data);

        if (!body.nextCursor) {
          break;
        }
        cursor = body.nextCursor;
      }

      return tags;
    },

    async fetchExecutions(workflowId: string, limit?: number) {
      const maxResults = limit ?? DEFAULT_EXECUTION_LIMIT;
      const executions: N8nExecution[] = [];
      let cursor: string | undefined;

      for (let page = 0; page < MAX_PAGES; page++) {
        const url = new URL(`${baseUrl}/api/v1/executions`);
        url.searchParams.set("workflowId", workflowId);
        url.searchParams.set("limit", String(maxResults));
        if (cursor) {
          url.searchParams.set("cursor", cursor);
        }

        const res = await fetch(url.toString(), { headers });

        if (!res.ok) {
          throw new Error(`Failed to fetch executions: ${res.status}`);
        }

        const body: PaginatedResponse<N8nExecution> = await res.json();
        executions.push(...body.data);

        if (executions.length >= maxResults || !body.nextCursor) {
          break;
        }
        cursor = body.nextCursor;
      }

      return executions.slice(0, maxResults);
    },

    async fetchCredentials() {
      return fetchOptional<N8nCredential>(
        `${baseUrl}/api/v1/credentials`,
        headers,
      );
    },

    async fetchUsers() {
      return fetchOptional<N8nUser>(
        `${baseUrl}/api/v1/users`,
        headers,
      );
    },

    async fetchProjects() {
      return fetchOptional<N8nProject>(
        `${baseUrl}/api/v1/projects`,
        headers,
      );
    },

    async fetchVariables() {
      return fetchOptional<N8nVariable>(
        `${baseUrl}/api/v1/variables`,
        headers,
      );
    },

    async deployWorkflow(workflowData: object) {
      const res = await fetch(`${baseUrl}/api/v1/workflows`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workflowData),
      });

      if (!res.ok) {
        throw new Error(`Failed to deploy workflow: ${res.status}`);
      }

      return res.json();
    },

    async activateWorkflow(id: string) {
      const res = await fetch(
        `${baseUrl}/api/v1/workflows/${id}/activate`,
        {
          method: "POST",
          headers,
        },
      );

      if (!res.ok) {
        throw new Error(`Failed to activate workflow ${id}: ${res.status}`);
      }

      return res.json();
    },
  };
}
