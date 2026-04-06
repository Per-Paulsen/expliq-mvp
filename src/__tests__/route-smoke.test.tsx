import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock next/navigation for any component that might use it
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock modules that the settings page imports transitively
vi.mock("@/lib/session", () => ({
  getRequiredSession: vi.fn().mockResolvedValue({
    user: { id: "u1", workspaceId: "w1" },
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    connectorConfig: { findFirst: vi.fn().mockResolvedValue(null) },
    companyProfile: { findUnique: vi.fn().mockResolvedValue(null) },
    automation: { findMany: vi.fn().mockResolvedValue([]) },
    businessProcess: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
    recommendation: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

vi.mock("@/lib/actions/connector", () => ({
  saveConnectorConfig: vi.fn(),
  verifyAndDiscover: vi.fn(),
  updateSelectedTags: vi.fn(),
  syncAndAnalyze: vi.fn(),
  getAnalysisStatus: vi.fn().mockResolvedValue({ status: null }),
}));

vi.mock("@/lib/detail-data", () => ({
  prepareDetailData: vi.fn().mockResolvedValue({
    id: "test-123",
    name: "Test Automation",
    businessNarrative: null,
  }),
}));

describe("Route smoke tests", () => {
  describe("/ (Dashboard)", () => {
    it("renders empty state when no CompanyProfile", async () => {
      const { default: DashboardPage } = await import("@/app/(app)/page");
      const element = await DashboardPage();
      render(element);
      expect(
        screen.getByText("Connect your n8n instance in Settings to get started."),
      ).toBeInTheDocument();
    });
  });

  describe("/processes (Process Map)", () => {
    it("renders empty state when no processes", async () => {
      const { default: ProcessMapPage } = await import(
        "@/app/(app)/processes/page"
      );
      const element = await ProcessMapPage();
      render(element);
      expect(
        screen.getByText("No processes discovered yet. Sync your n8n instance to get started."),
      ).toBeInTheDocument();
    });
  });

  describe("/opportunities (Opportunities)", () => {
    it("renders empty state when no recommendations", async () => {
      const { default: OpportunitiesPage } = await import(
        "@/app/(app)/opportunities/page"
      );
      const element = await OpportunitiesPage();
      render(element);
      expect(
        screen.getByText("No recommendations yet. Sync your n8n instance to get started."),
      ).toBeInTheDocument();
    });
  });

  describe("/automations/[id] (Automation Detail)", () => {
    it("renders not-analyzed state when businessNarrative is null", async () => {
      const { default: AutomationDetailPage } = await import(
        "@/app/(app)/automations/[id]/page"
      );
      // Async server component — call it as a function and await
      const element = await AutomationDetailPage({
        params: Promise.resolve({ id: "test-123" }),
      });
      render(element);
      expect(screen.getByText("Test Automation")).toBeInTheDocument();
      expect(
        screen.getByText(/has not been analyzed yet/),
      ).toBeInTheDocument();
    });
  });

  describe("/settings (Settings)", () => {
    it("renders Settings heading via server component", async () => {
      const { default: SettingsPage } = await import(
        "@/app/(app)/settings/page"
      );
      // Async server component — call as function and render result
      const element = await SettingsPage();
      render(element);
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });
  });
});
