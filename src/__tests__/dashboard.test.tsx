import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

import { DashboardView } from "@/components/dashboard-view";
import type { DashboardViewProps } from "@/components/dashboard-view";

function makeProps(overrides: Partial<DashboardViewProps> = {}): DashboardViewProps {
  return {
    deltaSummary: null,
    nextMoveText: null,
    workflowCount: 0,
    processCount: 0,
    systemCount: 0,
    activeCount: 0,
    recommendationCount: 0,
    aggregateEstimates: null,
    attentionItems: [],
    topOpportunities: [],
    processCoverage: [],
    systemLandscape: [],
    ...overrides,
  };
}

const fullProps: DashboardViewProps = {
  deltaSummary: "2 new workflows detected",
  nextMoveText: "Fix the lottery-win error rate",
  workflowCount: 8,
  processCount: 3,
  systemCount: 4,
  activeCount: 6,
  recommendationCount: 5,
  aggregateEstimates: {
    totalTimeSavings: "~15 hrs/wk",
    totalValueAtRisk: "~€3K/mo",
  },
  attentionItems: [
    {
      id: "auto-1",
      name: "Broken Workflow",
      governanceDot: "critical" as const,
      businessNarrative: "This workflow has errors",
    },
    {
      id: "auto-2",
      name: "Stale Workflow",
      governanceDot: "attention" as const,
      businessNarrative: "Inactive but recently executed",
    },
  ],
  topOpportunities: [
    {
      id: "rec-1",
      name: "Add retry logic",
      brief: "Reduce error rate",
      tier: "act-now" as const,
      impactEstimate: "High",
    },
    {
      id: "rec-2",
      name: "Automate onboarding",
      brief: "Streamline new hire flow",
      tier: "investigate" as const,
      impactEstimate: "Medium",
    },
  ],
  processCoverage: [
    {
      id: "bp-1",
      name: "Ticket Lifecycle",
      automatedSteps: 3,
      totalSteps: 5,
      coveragePercentage: 60,
      reliability: 95,
      recommendationCount: 2,
    },
  ],
  systemLandscape: [
    { name: "Gmail", workflowCount: 4 },
    { name: "Sheets", workflowCount: 3 },
  ],
};

describe("DashboardView", () => {
  it("renders Dashboard heading", () => {
    render(<DashboardView {...makeProps()} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("shows empty attention and opportunity states", () => {
    render(<DashboardView {...makeProps()} />);
    expect(screen.getByText("No issues detected")).toBeInTheDocument();
    expect(screen.getByText("No recommendations yet")).toBeInTheDocument();
  });

  it("does not render delta banner when null", () => {
    render(<DashboardView {...makeProps()} />);
    expect(screen.queryByText("Since last analysis")).not.toBeInTheDocument();
  });

  it("does not render next move when null", () => {
    render(<DashboardView {...makeProps()} />);
    expect(screen.queryByText("Your Next Move")).not.toBeInTheDocument();
  });

  it("does not render process coverage when empty", () => {
    render(<DashboardView {...makeProps()} />);
    expect(screen.queryByText("Process Coverage")).not.toBeInTheDocument();
  });

  it("does not render systems section when empty", () => {
    render(<DashboardView {...makeProps()} />);
    // The FactCard "Systems" label always renders; the systems chip section should not
    const systemHeaders = screen.getAllByText("Systems");
    // Only one instance (the FactCard label), not the section header
    expect(systemHeaders).toHaveLength(1);
  });

  describe("full dashboard", () => {
    it("renders delta summary", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText("2 new workflows detected")).toBeInTheDocument();
      expect(screen.getByText("Since last analysis")).toBeInTheDocument();
    });

    it("dismisses delta banner on click", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText("2 new workflows detected")).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText("Dismiss"));
      expect(screen.queryByText("2 new workflows detected")).not.toBeInTheDocument();
    });

    it("renders next move section", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText("Your Next Move")).toBeInTheDocument();
      expect(screen.getByText("Fix the lottery-win error rate")).toBeInTheDocument();
      const link = screen.getByText("View recommendations →");
      expect(link.closest("a")).toHaveAttribute("href", "/opportunities");
    });

    it("renders fact card values", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("6")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("renders aggregate estimates", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText(/~15 hrs\/wk/)).toBeInTheDocument();
      expect(screen.getByText(/~€3K\/mo/)).toBeInTheDocument();
    });

    it("renders attention items", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText("Needs Attention")).toBeInTheDocument();
      expect(screen.getByText("Broken Workflow")).toBeInTheDocument();
      expect(screen.getByText("Stale Workflow")).toBeInTheDocument();
    });

    it("renders opportunity items with tier badges", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText("Top Opportunities")).toBeInTheDocument();
      expect(screen.getByText("Add retry logic")).toBeInTheDocument();
      expect(screen.getByText("ACT NOW")).toBeInTheDocument();
      expect(screen.getByText("Automate onboarding")).toBeInTheDocument();
      expect(screen.getByText("INVESTIGATE")).toBeInTheDocument();
    });

    it("renders process coverage table", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText("Process Coverage")).toBeInTheDocument();
      expect(screen.getByText("Ticket Lifecycle")).toBeInTheDocument();
      expect(screen.getByText("3 of 5")).toBeInTheDocument();
      expect(screen.getByText("95%")).toBeInTheDocument();
    });

    it("renders systems chips", () => {
      render(<DashboardView {...fullProps} />);
      // Two "Systems" texts: FactCard label + section header
      const systemHeaders = screen.getAllByText("Systems");
      expect(systemHeaders).toHaveLength(2);
      expect(screen.getByText("Gmail (4)")).toBeInTheDocument();
      expect(screen.getByText("Sheets (3)")).toBeInTheDocument();
    });
  });

  describe("navigation links", () => {
    it("attention items link to /automations/[id]", () => {
      render(<DashboardView {...fullProps} />);
      const link1 = screen.getByText("Broken Workflow").closest("a");
      expect(link1).toHaveAttribute("href", "/automations/auto-1");
      const link2 = screen.getByText("Stale Workflow").closest("a");
      expect(link2).toHaveAttribute("href", "/automations/auto-2");
    });

    it("opportunity items link to /opportunities?highlight=[id]", () => {
      render(<DashboardView {...fullProps} />);
      const link1 = screen.getByText("Add retry logic").closest("a");
      expect(link1).toHaveAttribute("href", "/opportunities?highlight=rec-1");
      const link2 = screen.getByText("Automate onboarding").closest("a");
      expect(link2).toHaveAttribute("href", "/opportunities?highlight=rec-2");
    });

    it("process rows link to /processes", () => {
      render(<DashboardView {...fullProps} />);
      const link = screen.getByText("Ticket Lifecycle").closest("a");
      expect(link).toHaveAttribute("href", "/processes");
    });
  });

  describe("conditional rendering", () => {
    it("shows 'View all' link when 5 attention items", () => {
      const fiveItems = Array.from({ length: 5 }, (_, i) => ({
        id: `auto-${i}`,
        name: `Workflow ${i}`,
        governanceDot: "critical" as const,
        businessNarrative: `Issue ${i}`,
      }));
      render(<DashboardView {...makeProps({ attentionItems: fiveItems })} />);
      expect(screen.getByText("View all on Process Map →")).toBeInTheDocument();
    });

    it("does not show 'View all' link when fewer than 5 attention items", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.queryByText("View all on Process Map →")).not.toBeInTheDocument();
    });

    it("shows dash for null reliability", () => {
      const props = makeProps({
        processCoverage: [
          {
            id: "bp-1",
            name: "Test Process",
            automatedSteps: 2,
            totalSteps: 4,
            coveragePercentage: 50,
            reliability: null,
            recommendationCount: 1,
          },
        ],
      });
      render(<DashboardView {...props} />);
      expect(screen.getByText("—")).toBeInTheDocument();
    });

    it("renders impact estimate on opportunities", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText("High")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
    });
  });
});
