import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

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

import { PortfolioAutomationCard } from "@/components/portfolio-automation-card";
import type { PortfolioAutomation } from "@/lib/portfolio-types";
import type { GovernanceSignals } from "@/lib/risk-engine";

function makePortfolioAutomation(
  overrides: Partial<PortfolioAutomation> = {}
): PortfolioAutomation {
  return {
    id: "auto-1",
    name: "Test Automation",
    description: "A test description",
    platform: "n8n",
    status: "active",
    owner: "alice@example.com",
    systemsTouched: ["Slack", "HubSpot"],
    impactLevel: "high",
    riskLevel: "medium",
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

describe("PortfolioAutomationCard", () => {
  it("renders automation name", () => {
    render(
      <PortfolioAutomationCard automation={makePortfolioAutomation()} />
    );
    expect(screen.getByText("Test Automation")).toBeInTheDocument();
  });

  it("renders 'Untitled automation' when name is null", () => {
    render(
      <PortfolioAutomationCard
        automation={makePortfolioAutomation({ name: null })}
      />
    );
    expect(screen.getByText("Untitled automation")).toBeInTheDocument();
  });

  it("renders status badge with effective status", () => {
    render(
      <PortfolioAutomationCard
        automation={makePortfolioAutomation({ status: "inactive" })}
      />
    );
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("renders platform badge", () => {
    render(
      <PortfolioAutomationCard automation={makePortfolioAutomation()} />
    );
    expect(screen.getByText("n8n")).toBeInTheDocument();
  });

  it("renders system tags", () => {
    render(
      <PortfolioAutomationCard automation={makePortfolioAutomation()} />
    );
    expect(screen.getByText("Slack")).toBeInTheDocument();
    expect(screen.getByText("HubSpot")).toBeInTheDocument();
  });

  it("renders owner name", () => {
    render(
      <PortfolioAutomationCard automation={makePortfolioAutomation()} />
    );
    expect(screen.getByText(/alice@example\.com/)).toBeInTheDocument();
  });

  it("renders 'No owner' when owner is null", () => {
    render(
      <PortfolioAutomationCard
        automation={makePortfolioAutomation({ owner: null })}
      />
    );
    expect(screen.getByText(/No owner/)).toBeInTheDocument();
  });

  it("renders description", () => {
    render(
      <PortfolioAutomationCard automation={makePortfolioAutomation()} />
    );
    expect(screen.getByText("A test description")).toBeInTheDocument();
  });

  it("renders 'No description available' when description is null", () => {
    render(
      <PortfolioAutomationCard
        automation={makePortfolioAutomation({ description: null })}
      />
    );
    expect(screen.getByText("No description available")).toBeInTheDocument();
  });

  it("shows governance badges only for active signals", () => {
    const signals: GovernanceSignals = {
      documentationOutdated: true,
      automationStale: false,
      overdueReview: true,
      noOwnerAssigned: false,
      inactive: false,
    };
    render(
      <PortfolioAutomationCard
        automation={makePortfolioAutomation({ signals })}
      />
    );
    expect(screen.getByText("Documentation outdated")).toBeInTheDocument();
    expect(screen.getByText("Overdue review")).toBeInTheDocument();
    expect(screen.queryByText("Automation stale")).not.toBeInTheDocument();
    expect(screen.queryByText("No owner assigned")).not.toBeInTheDocument();
  });

  it("shows no governance badges when all signals are false", () => {
    render(
      <PortfolioAutomationCard automation={makePortfolioAutomation()} />
    );
    expect(
      screen.queryByText("Documentation outdated")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Automation stale")).not.toBeInTheDocument();
    expect(screen.queryByText("Overdue review")).not.toBeInTheDocument();
    expect(screen.queryByText("No owner assigned")).not.toBeInTheDocument();
    expect(screen.queryByText("Inactive")).not.toBeInTheDocument();
  });

  it("links to /automations/[id]", () => {
    const { container } = render(
      <PortfolioAutomationCard automation={makePortfolioAutomation()} />
    );
    const link = container.querySelector("a");
    expect(link).toHaveAttribute("href", "/automations/auto-1");
  });

  it("renders timestamps", () => {
    render(
      <PortfolioAutomationCard automation={makePortfolioAutomation()} />
    );
    expect(screen.getByText(/Automation updated:/)).toBeInTheDocument();
    expect(screen.getByText(/Docs updated:/)).toBeInTheDocument();
  });
});
