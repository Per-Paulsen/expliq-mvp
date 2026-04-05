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
  },
}));

vi.mock("@/lib/actions/connector", () => ({
  saveConnectorConfig: vi.fn(),
  verifyAndDiscover: vi.fn(),
  updateSelectedTags: vi.fn(),
  syncAndAnalyze: vi.fn(),
}));

describe("Route smoke tests", () => {
  describe("/ (Dashboard)", () => {
    it("renders Dashboard heading", async () => {
      const { default: DashboardPage } = await import("@/app/(app)/page");
      render(<DashboardPage />);
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });

  describe("/processes (Process Map)", () => {
    it("renders Process Map heading", async () => {
      const { default: ProcessMapPage } = await import(
        "@/app/(app)/processes/page"
      );
      render(<ProcessMapPage />);
      expect(screen.getByText("Process Map")).toBeInTheDocument();
    });
  });

  describe("/opportunities (Opportunities)", () => {
    it("renders Opportunities heading", async () => {
      const { default: OpportunitiesPage } = await import(
        "@/app/(app)/opportunities/page"
      );
      render(<OpportunitiesPage />);
      expect(screen.getByText("Opportunities")).toBeInTheDocument();
    });
  });

  describe("/automations/[id] (Automation Detail)", () => {
    it("renders Automation Detail heading with id", async () => {
      const { default: AutomationDetailPage } = await import(
        "@/app/(app)/automations/[id]/page"
      );
      // Async server component — call it as a function and await
      const element = await AutomationDetailPage({
        params: Promise.resolve({ id: "test-123" }),
      });
      render(element);
      expect(screen.getByText("Automation Detail")).toBeInTheDocument();
      expect(screen.getByText(/test-123/)).toBeInTheDocument();
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
