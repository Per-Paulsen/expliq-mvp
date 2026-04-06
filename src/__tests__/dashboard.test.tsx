import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

import { DashboardView } from "@/components/dashboard-view";
import type { DashboardViewProps } from "@/components/dashboard-view";
import type {
  DeltaSegment,
  KpiDeltas,
  NextMoveRecommendation,
  AttentionItem,
  OpportunityItem,
  ProcessCoverageItem,
} from "@/lib/dashboard-data";

function makeProps(overrides: Partial<DashboardViewProps> = {}): DashboardViewProps {
  return {
    deltaSummary: null,
    deltaSegments: [],
    nextMoveRecommendations: [],
    totalOpportunityValue: null,
    workflowCount: 0,
    processCount: 0,
    systemCount: 0,
    activeCount: 0,
    recommendationCount: 0,
    aggregateEstimates: null,
    kpiDeltas: {
      workflows: null,
      processes: null,
      active: { delta: "of 0 total", deltaType: "neutral" },
    },
    attentionItems: [],
    topOpportunities: [],
    processCoverage: [],
    systemLandscape: [],
    ...overrides,
  };
}

const fullProps: DashboardViewProps = {
  deltaSummary: "2 workflows updated, error rates improved on 1 workflow",
  deltaSegments: [
    { text: "2", type: "negative" },
    { text: " workflows updated, error rates ", type: "neutral" },
    { text: "improved", type: "positive" },
    { text: " on ", type: "neutral" },
    { text: "1", type: "positive" },
    { text: " workflow", type: "neutral" },
  ] as DeltaSegment[],
  nextMoveRecommendations: [
    {
      id: "rec-1",
      name: "Add error handling",
      brief: "Fix lead capture errors",
      tier: "act-now" as const,
      impactEstimate: "~€1.2K/mo",
      confidence: "data-driven",
      scope: "HubSpot → Gmail",
      processName: "Lead Management",
    },
    {
      id: "rec-2",
      name: "Automate lead scoring",
      brief: "Close the gap",
      tier: "investigate" as const,
      impactEstimate: "~€800/mo",
      confidence: "benchmark-based",
      scope: "CRM pipeline",
      processName: "Lead Management",
    },
  ] as NextMoveRecommendation[],
  totalOpportunityValue: "~€2K/mo",
  workflowCount: 8,
  processCount: 3,
  systemCount: 4,
  activeCount: 6,
  recommendationCount: 5,
  aggregateEstimates: {
    totalTimeSavings: "~15 hrs/wk",
    totalValueAtRisk: "~€3K/mo",
  },
  kpiDeltas: {
    workflows: { delta: "+2 since last sync", deltaType: "positive" },
    processes: null,
    active: { delta: "of 8 total", deltaType: "neutral" },
  } as KpiDeltas,
  attentionItems: [
    {
      id: "auto-1",
      name: "Broken Workflow",
      governanceDot: "critical" as const,
      businessNarrative: "This workflow has errors",
      metric: "31% error rate",
      scope: "Step 1 of 5",
      processName: "Lead Management",
    },
    {
      id: "auto-2",
      name: "Stale Workflow",
      governanceDot: "attention" as const,
      businessNarrative: "Inactive but recently executed",
      metric: null,
      scope: null,
      processName: null,
    },
  ] as AttentionItem[],
  topOpportunities: [
    {
      id: "rec-1",
      name: "Add retry logic",
      brief: "Reduce error rate",
      tier: "act-now" as const,
      impactEstimate: "~€1.2K/mo",
      confidence: "data-driven",
      scope: "3 workflows affected",
      processName: "Customer Communication",
    },
    {
      id: "rec-2",
      name: "Automate onboarding",
      brief: "Streamline new hire flow",
      tier: "investigate" as const,
      impactEstimate: "~€800/mo",
      confidence: "benchmark-based",
      scope: "CRM pipeline",
      processName: "HR Onboarding",
    },
  ] as OpportunityItem[],
  processCoverage: [
    {
      id: "bp-1",
      name: "Ticket Lifecycle",
      automatedSteps: 3,
      totalSteps: 5,
      coveragePercentage: 60,
      reliability: 95,
      recommendationCount: 2,
      maturityLevel: "Production",
      valueAtStake: "~€2.1K/mo",
    },
  ] as ProcessCoverageItem[],
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

  it("does not render delta banner when deltaSegments is empty", () => {
    render(<DashboardView {...makeProps()} />);
    expect(screen.queryByText("Since last analysis")).not.toBeInTheDocument();
  });

  it("does not render next move when nextMoveRecommendations is empty", () => {
    render(<DashboardView {...makeProps()} />);
    expect(screen.queryByText("Your Next Move")).not.toBeInTheDocument();
  });

  it("does not render process coverage when empty", () => {
    render(<DashboardView {...makeProps()} />);
    expect(screen.queryByText("Process Coverage")).not.toBeInTheDocument();
  });

  it("does not render systems section when empty", () => {
    render(<DashboardView {...makeProps()} />);
    const systemHeaders = screen.queryAllByText("Connected Systems");
    expect(systemHeaders).toHaveLength(0);
  });

  describe("full dashboard", () => {
    it("renders delta banner with colored segments", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText("Since last analysis")).toBeInTheDocument();
      // Check colored segment text appears (segments are in individual spans)
      expect(screen.getByText("improved")).toBeInTheDocument();
      expect(screen.getByText(/workflows updated/)).toBeInTheDocument();
    });

    it("dismisses delta banner on click", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText("Since last analysis")).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText("Dismiss"));
      expect(screen.queryByText("Since last analysis")).not.toBeInTheDocument();
    });

    it("renders next move section with first recommendation", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText("Your Next Move")).toBeInTheDocument();
      expect(screen.getByText("Add error handling")).toBeInTheDocument();
      // ACT NOW appears in both next-move and opportunities sections
      expect(screen.getAllByText("ACT NOW").length).toBeGreaterThanOrEqual(1);
    });

    it("renders follow-up card with second recommendation", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText(/Then/)).toBeInTheDocument();
      expect(screen.getByText("Automate lead scoring")).toBeInTheDocument();
    });

    it("renders total impact line", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText(/~€2K\/mo/)).toBeInTheDocument();
    });

    it("renders KPI card values", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText("8")).toBeInTheDocument(); // workflowCount
      expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1); // processCount
      expect(screen.getByText("6")).toBeInTheDocument(); // activeCount
      // recommendationCount not shown as standalone KpiCard — it's in the props but not directly rendered
      expect(screen.getByText("Workflows")).toBeInTheDocument();
      expect(screen.getByText("Processes")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("renders KPI deltas", () => {
      render(<DashboardView {...fullProps} />);
      // KpiCard prepends "↑ " for positive deltas
      expect(screen.getByText(/\+2 since last sync/)).toBeInTheDocument();
      // Active count shown without "of X total" (redundant with Workflows count)
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("renders aggregate estimates", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText(/~15 hrs\/wk/)).toBeInTheDocument();
      expect(screen.getByText(/~€3K\/mo/)).toBeInTheDocument();
    });

    it("renders attention items with metric and process name", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText("Needs Attention")).toBeInTheDocument();
      expect(screen.getByText("Broken Workflow")).toBeInTheDocument();
      expect(screen.getByText("31% error rate")).toBeInTheDocument();
      // "Lead Management" appears in multiple sections (attention + next move)
      expect(screen.getAllByText("Lead Management").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Stale Workflow")).toBeInTheDocument();
    });

    it("renders opportunity items with tier badges and confidence", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText("Top Opportunities")).toBeInTheDocument();
      expect(screen.getByText("Add retry logic")).toBeInTheDocument();
      // ACT NOW appears in multiple cards (next-move + opportunities)
      expect(screen.getAllByText("ACT NOW").length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText(/data.driven/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/~€1\.2K\/mo/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Automate onboarding")).toBeInTheDocument();
      expect(screen.getByText("INVESTIGATE")).toBeInTheDocument();
    });

    it("renders process coverage cards", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText("Process Coverage")).toBeInTheDocument();
      expect(screen.getByText("Ticket Lifecycle")).toBeInTheDocument();
      expect(screen.getByText("60%")).toBeInTheDocument();
      expect(screen.getByText("Production")).toBeInTheDocument();
      expect(screen.getByText("95%")).toBeInTheDocument();
      expect(screen.getByText(/~€2\.1K\/mo/)).toBeInTheDocument();
    });

    it("renders systems chips", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByText("Connected Systems")).toBeInTheDocument();
      // "Gmail" appears in system chips and recommendation scope ("HubSpot → Gmail")
      expect(screen.getAllByText(/Gmail/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Sheets/).length).toBeGreaterThanOrEqual(1);
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
    it("shows 'View all in Process Map' link in attention header", () => {
      render(<DashboardView {...fullProps} />);
      expect(screen.getByRole("link", { name: /View all in Process Map/ })).toBeInTheDocument();
    });

    it("single nextMoveRecommendation shows no follow-up card", () => {
      const props = makeProps({
        nextMoveRecommendations: [
          {
            id: "rec-1",
            name: "Add error handling",
            brief: "Fix errors",
            tier: "act-now" as const,
            impactEstimate: "~€1.2K/mo",
            confidence: "data-driven",
            scope: "HubSpot → Gmail",
            processName: "Lead Management",
          },
        ],
      });
      render(<DashboardView {...props} />);
      expect(screen.getByText("Add error handling")).toBeInTheDocument();
      expect(screen.queryByText(/Then/)).not.toBeInTheDocument();
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
            maturityLevel: null,
            valueAtStake: null,
          },
        ],
      });
      render(<DashboardView {...props} />);
      // "—" appears for both null reliability and null valueAtStake
      expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
    });

    it("shows no maturity badge when maturityLevel is null", () => {
      const props = makeProps({
        processCoverage: [
          {
            id: "bp-1",
            name: "Test Process",
            automatedSteps: 2,
            totalSteps: 4,
            coveragePercentage: 50,
            reliability: 90,
            recommendationCount: 1,
            maturityLevel: null,
            valueAtStake: null,
          },
        ],
      });
      render(<DashboardView {...props} />);
      expect(screen.queryByText("Production")).not.toBeInTheDocument();
    });

    it("shows dash for null valueAtStake", () => {
      const props = makeProps({
        processCoverage: [
          {
            id: "bp-1",
            name: "Test Process",
            automatedSteps: 2,
            totalSteps: 4,
            coveragePercentage: 50,
            reliability: 90,
            recommendationCount: 1,
            maturityLevel: "Production",
            valueAtStake: null,
          },
        ],
      });
      render(<DashboardView {...props} />);
      // The At Risk metric should show "—" when valueAtStake is null
      expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
    });
  });
});
