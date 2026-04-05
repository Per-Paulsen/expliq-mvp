/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — R1 home page tests; snapshot types trimmed in Epic 10
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

import { SnapshotDashboard } from "@/components/snapshot-dashboard";
import type { SnapshotData } from "@/lib/snapshot-types";

function makeEmptySnapshotData(): SnapshotData {
  return {
    metrics: {
      totalAutomations: 0,
      highImpactCount: 0,
      highRiskCount: 0,
      missingOwnersCount: 0,
      overdueReviewsCount: 0,
    },
    systemExposure: [],
    ownerExposure: [],
    recentlyChanged: [],
    multiSystem: [],
    hasMoreRecentlyChanged: false,
    hasMoreMultiSystem: false,
  };
}

describe("WorkspaceSnapshotPage", () => {
  it("renders the empty state with heading", () => {
    render(<SnapshotDashboard data={makeEmptySnapshotData()} />);
    expect(screen.getByText("Workspace Snapshot")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No automations found. Connect a platform to get started."
      )
    ).toBeInTheDocument();
  });

  it("empty state has link to settings", () => {
    render(<SnapshotDashboard data={makeEmptySnapshotData()} />);
    const link = screen.getByText("Go to Settings").closest("a");
    expect(link).toHaveAttribute("href", "/settings");
  });
});
