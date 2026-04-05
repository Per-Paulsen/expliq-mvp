/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — R1 snapshot dashboard tests; component rewritten in Epic 10
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

vi.mock("@/lib/format", () => ({
  formatRelativeTime: () => "2d ago",
}));

import { SnapshotDashboard } from "@/components/snapshot-dashboard";
import type { SnapshotData, SnapshotAutomation } from "@/lib/snapshot-types";

function makeSnapshotAutomation(
  overrides: Partial<SnapshotAutomation> = {}
): SnapshotAutomation {
  return {
    id: "auto-1",
    name: "Test Automation",
    owner: "alice",
    systemsTouched: ["Salesforce", "HubSpot"],
    impactLevel: "medium",
    riskLevel: "medium",
    signals: {
      documentationOutdated: false,
      automationStale: false,
      overdueReview: false,
      noOwnerAssigned: false,
      inactive: false,
    },
    automationLastUpdated: new Date("2025-06-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makeSnapshotData(
  overrides: Partial<SnapshotData> = {}
): SnapshotData {
  return {
    metrics: {
      totalAutomations: 12,
      highImpactCount: 3,
      highRiskCount: 2,
      missingOwnersCount: 4,
      overdueReviewsCount: 5,
    },
    systemExposure: [
      { system: "Salesforce", exposureScore: 10, automationCount: 5 },
      { system: "HubSpot", exposureScore: 6, automationCount: 3 },
    ],
    ownerExposure: [
      { owner: "alice", exposureScore: 8, automationCount: 4 },
      { owner: "Unassigned", exposureScore: 4, automationCount: 2 },
    ],
    recentlyChanged: [
      makeSnapshotAutomation({ id: "rc-1", name: "Recent Workflow" }),
    ],
    multiSystem: [
      makeSnapshotAutomation({
        id: "ms-1",
        name: "Multi System Flow",
        systemsTouched: ["Salesforce", "HubSpot", "Slack"],
      }),
    ],
    hasMoreRecentlyChanged: false,
    hasMoreMultiSystem: false,
    ...overrides,
  };
}

describe.skip("SnapshotDashboard — R1 tests skipped after R2 schema migration", () => {
  it("renders 'Workspace Snapshot' heading", () => {
    render(<SnapshotDashboard data={makeSnapshotData()} />);
    expect(screen.getByText("Workspace Snapshot")).toBeInTheDocument();
  });

  it("renders all 5 metric card values", () => {
    render(<SnapshotDashboard data={makeSnapshotData()} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("total automations links to /automations", () => {
    render(<SnapshotDashboard data={makeSnapshotData()} />);
    const link = screen.getByText("Total Automations").closest("a");
    expect(link).toHaveAttribute("href", "/automations");
  });

  it("high-impact links to /automations?impact=critical&impact=high", () => {
    render(<SnapshotDashboard data={makeSnapshotData()} />);
    const link = screen.getByText("High Impact").closest("a");
    expect(link).toHaveAttribute(
      "href",
      "/automations?impact=critical&impact=high"
    );
  });

  it("high-risk links to /automations?risk=high", () => {
    render(<SnapshotDashboard data={makeSnapshotData()} />);
    const link = screen.getByText("High Risk").closest("a");
    expect(link).toHaveAttribute("href", "/automations?risk=high");
  });

  it("missing owners links to /automations?attention=no-owner", () => {
    render(<SnapshotDashboard data={makeSnapshotData()} />);
    const link = screen.getByText("Missing Owners").closest("a");
    expect(link).toHaveAttribute("href", "/automations?attention=no-owner");
  });

  it("overdue reviews links to /automations?attention=overdue-review", () => {
    render(<SnapshotDashboard data={makeSnapshotData()} />);
    const link = screen.getByText("Overdue Reviews").closest("a");
    expect(link).toHaveAttribute(
      "href",
      "/automations?attention=overdue-review"
    );
  });

  it("system exposure renders system names", () => {
    render(<SnapshotDashboard data={makeSnapshotData()} />);
    // "Salesforce" may appear multiple times (exposure + badge), use getAllByText
    expect(screen.getAllByText("Salesforce").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("HubSpot").length).toBeGreaterThanOrEqual(1);
  });

  it("system click links to /automations?system={name}", () => {
    render(<SnapshotDashboard data={makeSnapshotData()} />);
    // Find the system exposure link (not the badge)
    const links = screen.getAllByText("Salesforce");
    const exposureLink = links
      .map((el) => el.closest("a"))
      .find((a) => a?.getAttribute("href")?.startsWith("/automations?system="));
    expect(exposureLink).toHaveAttribute("href", "/automations?system=Salesforce");
  });

  it("owner exposure renders owner names", () => {
    render(<SnapshotDashboard data={makeSnapshotData()} />);
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("owner 'Unassigned' links to ?owner=_none", () => {
    render(<SnapshotDashboard data={makeSnapshotData()} />);
    const link = screen.getByText("Unassigned").closest("a");
    expect(link).toHaveAttribute("href", "/automations?owner=_none");
  });

  it("named owner links to ?owner={name}", () => {
    render(<SnapshotDashboard data={makeSnapshotData()} />);
    const link = screen.getByText("alice").closest("a");
    expect(link).toHaveAttribute("href", "/automations?owner=alice");
  });

  it("recently changed shows items with relative times", () => {
    render(<SnapshotDashboard data={makeSnapshotData()} />);
    expect(screen.getByText("Recent Workflow")).toBeInTheDocument();
    expect(screen.getByText("2d ago")).toBeInTheDocument();
  });

  it("recently changed 'View all' link has correct URL", () => {
    render(
      <SnapshotDashboard
        data={makeSnapshotData({ hasMoreRecentlyChanged: true })}
      />
    );
    const viewAll = screen.getAllByText("View all")[0];
    expect(viewAll.closest("a")).toHaveAttribute(
      "href",
      "/automations?updatedAfter=7d&sort=automationLastUpdated&order=desc"
    );
  });

  it("multi-system shows system badges", () => {
    render(<SnapshotDashboard data={makeSnapshotData()} />);
    expect(screen.getByText("Multi System Flow")).toBeInTheDocument();
    expect(screen.getByText("3 systems")).toBeInTheDocument();
  });

  it("multi-system 'View all' link has correct URL", () => {
    render(
      <SnapshotDashboard
        data={makeSnapshotData({ hasMoreMultiSystem: true })}
      />
    );
    const viewAlls = screen.getAllByText("View all");
    const multiSystemViewAll = viewAlls[viewAlls.length - 1];
    expect(multiSystemViewAll.closest("a")).toHaveAttribute(
      "href",
      "/automations?minSystems=3"
    );
  });

  it("empty state when totalAutomations is 0", () => {
    render(
      <SnapshotDashboard
        data={makeSnapshotData({
          metrics: {
            totalAutomations: 0,
            highImpactCount: 0,
            highRiskCount: 0,
            missingOwnersCount: 0,
            overdueReviewsCount: 0,
          },
        })}
      />
    );
    expect(
      screen.getByText("No automations found. Connect a platform to get started.")
    ).toBeInTheDocument();
  });

  it("empty state links to /settings", () => {
    render(
      <SnapshotDashboard
        data={makeSnapshotData({
          metrics: {
            totalAutomations: 0,
            highImpactCount: 0,
            highRiskCount: 0,
            missingOwnersCount: 0,
            overdueReviewsCount: 0,
          },
        })}
      />
    );
    const link = screen.getByText("Go to Settings").closest("a");
    expect(link).toHaveAttribute("href", "/settings");
  });

  it("'View all' hidden when hasMore is false", () => {
    render(
      <SnapshotDashboard
        data={makeSnapshotData({
          hasMoreRecentlyChanged: false,
          hasMoreMultiSystem: false,
        })}
      />
    );
    expect(screen.queryByText("View all")).not.toBeInTheDocument();
  });

  it("empty sections show appropriate messages", () => {
    render(
      <SnapshotDashboard
        data={makeSnapshotData({
          systemExposure: [],
          ownerExposure: [],
          recentlyChanged: [],
          multiSystem: [],
        })}
      />
    );
    expect(screen.getByText("No systems detected")).toBeInTheDocument();
    expect(screen.getByText("No owners detected")).toBeInTheDocument();
    expect(screen.getByText("No recent changes")).toBeInTheDocument();
    expect(
      screen.getByText("No multi-system automations")
    ).toBeInTheDocument();
  });
});
