/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — R1 portfolio view tests; types trimmed in Epic 10
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

const mockRouter = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: vi.fn(() => mockRouter),
  usePathname: vi.fn(() => "/automations"),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { PortfolioView } from "@/components/portfolio-view";
import type { PortfolioAutomation } from "@/lib/portfolio-types";

function makeAutomation(
  overrides: Partial<PortfolioAutomation> = {}
): PortfolioAutomation {
  return {
    id: `auto-${Math.random().toString(36).slice(2, 8)}`,
    name: "Test Workflow",
    description: "A test description",
    platform: "n8n",
    status: "active",
    owner: "alice@example.com",
    systemsTouched: ["Slack"],
    impactLevel: "medium",
    riskLevel: "low",
    signals: {
      documentationOutdated: false,
      automationStale: false,
      overdueReview: false,
      noOwnerAssigned: false,
      inactive: false,
    },
    automationLastUpdated: "2025-12-01T10:00:00.000Z",
    documentationLastUpdated: "2025-12-01T09:00:00.000Z",
    ...overrides,
  };
}

describe("PortfolioView", () => {
  it("renders with automations", () => {
    const automations = [makeAutomation({ name: "Workflow A" })];
    render(
      <PortfolioView automations={automations} lastSyncAt={null} />
    );
    expect(screen.getByText("Workflow A")).toBeInTheDocument();
  });

  it("shows empty workspace state when automations array is empty", () => {
    render(<PortfolioView automations={[]} lastSyncAt={null} />);
    expect(screen.getByText("No automations yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Connect your automation platform in Settings/
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Go to Settings")).toBeInTheDocument();
  });

  it("shows no results state when filters produce zero matches", async () => {
    const { useSearchParams } = await import("next/navigation");
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("search=zzz_impossible_match") as ReturnType<
        typeof useSearchParams
      >
    );

    const automations = [makeAutomation({ name: "Real Workflow" })];
    render(
      <PortfolioView automations={automations} lastSyncAt={null} />
    );
    expect(
      screen.getByText("No automations match your current filters")
    ).toBeInTheDocument();

    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams() as ReturnType<typeof useSearchParams>
    );
  });

  it("renders correct number of automation cards", () => {
    const automations = [
      makeAutomation({ id: "a1", name: "Workflow A" }),
      makeAutomation({ id: "a2", name: "Workflow B" }),
      makeAutomation({ id: "a3", name: "Workflow C" }),
    ];
    render(
      <PortfolioView automations={automations} lastSyncAt={null} />
    );
    expect(screen.getByText("Workflow A")).toBeInTheDocument();
    expect(screen.getByText("Workflow B")).toBeInTheDocument();
    expect(screen.getByText("Workflow C")).toBeInTheDocument();
    expect(screen.getByText("3 automations")).toBeInTheDocument();
  });

  it("displays sync status when lastSyncAt is provided", () => {
    const automations = [makeAutomation()];
    render(
      <PortfolioView
        automations={automations}
        lastSyncAt="2025-01-15T10:30:00.000Z"
      />
    );
    expect(screen.getByText(/Last synced:/)).toBeInTheDocument();
  });

  it("displays 'Never synced' when lastSyncAt is null", () => {
    const automations = [makeAutomation()];
    render(
      <PortfolioView automations={automations} lastSyncAt={null} />
    );
    expect(screen.getByText("Never synced")).toBeInTheDocument();
  });

  it("filter section starts collapsed by default", () => {
    const automations = [makeAutomation()];
    render(
      <PortfolioView automations={automations} lastSyncAt={null} />
    );
    // The filter chips rows should not be visible when collapsed
    expect(screen.queryByText("Systems")).not.toBeInTheDocument();
  });
});
