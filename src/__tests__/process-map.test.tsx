import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/processes",
  useSearchParams: () => new URLSearchParams(),
}));

import { ProcessMapView } from "@/components/process-map-view";
import type {
  ProcessMapViewProps,
  ProcessMapProcess,
} from "@/components/process-map-view";

function makeProps(
  overrides: Partial<ProcessMapViewProps> = {},
): ProcessMapViewProps {
  const processes: ProcessMapProcess[] = [
    {
      id: "bp-1",
      name: "Lead Management",
      automatedSteps: 3,
      totalSteps: 5,
      coveragePercentage: 60,
      reliability: 95,
      recommendationCount: 2,
      maturityLevel: "Production",
      valueAtStake: "~€2.1K/mo",
      workflows: [
        {
          id: "wf-1",
          name: "HubSpot Lead Sync",
          governanceDot: "critical",
          businessNarrative: "Syncs leads from HubSpot to CRM",
          metric: "31% error rate",
          scope: "Step 2 of 5",
          processName: "Lead Management",
        },
        {
          id: "wf-2",
          name: "Lead Scoring Pipeline",
          governanceDot: "healthy",
          businessNarrative: "Scores incoming leads automatically",
          metric: "Active",
          scope: "Step 3 of 5",
          processName: "Lead Management",
        },
      ],
      gaps: [
        {
          stepName: "Lead Qualification",
          processId: "bp-1",
          recommendationCount: 2,
        },
      ],
    },
    {
      id: "bp-2",
      name: "Customer Onboarding",
      automatedSteps: 1,
      totalSteps: 4,
      coveragePercentage: 25,
      reliability: 80,
      recommendationCount: 3,
      maturityLevel: "Emerging",
      valueAtStake: "~€800/mo",
      workflows: [
        {
          id: "wf-3",
          name: "Welcome Email Sequence",
          governanceDot: "attention",
          businessNarrative: "Sends welcome emails to new customers",
          metric: "5% error rate",
          scope: "Step 1 of 4",
          processName: "Customer Onboarding",
        },
      ],
      gaps: [
        {
          stepName: "Account Setup",
          processId: "bp-2",
          recommendationCount: 1,
        },
        {
          stepName: "Training Assignment",
          processId: "bp-2",
          recommendationCount: 0,
        },
      ],
    },
  ];

  return { processes, ...overrides };
}

describe("ProcessMapView", () => {
  it("AC 21: renders processes in order with all columns", () => {
    render(<ProcessMapView {...makeProps()} />);
    expect(screen.getByText("Process Map")).toBeInTheDocument();

    // Both process names appear
    expect(screen.getByText("Lead Management")).toBeInTheDocument();
    expect(screen.getByText("Customer Onboarding")).toBeInTheDocument();

    // Coverage percentages
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();

    // Reliability percentages
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();

    // Maturity badges
    expect(screen.getByText("Production")).toBeInTheDocument();
    expect(screen.getByText("Emerging")).toBeInTheDocument();

    // Correct order: Lead Management appears before Customer Onboarding
    const allText = document.body.textContent ?? "";
    const leadIdx = allText.indexOf("Lead Management");
    const onboardIdx = allText.indexOf("Customer Onboarding");
    expect(leadIdx).toBeLessThan(onboardIdx);
  });

  it("AC 22: expanding a process shows workflow rows", () => {
    render(<ProcessMapView {...makeProps()} />);

    // Workflows should NOT be visible initially
    expect(screen.queryByText("HubSpot Lead Sync")).not.toBeInTheDocument();

    // Click to expand first process
    fireEvent.click(screen.getByText("Lead Management"));

    // Workflow cards should now appear
    expect(screen.getByText("HubSpot Lead Sync")).toBeInTheDocument();
    expect(screen.getByText("Lead Scoring Pipeline")).toBeInTheDocument();

    // Business narrative shown
    expect(
      screen.getByText("Syncs leads from HubSpot to CRM"),
    ).toBeInTheDocument();

    // Metric shown
    expect(screen.getByText("31% error rate")).toBeInTheDocument();
  });

  it("AC 23: show-gaps toggle shows and hides gap indicators", () => {
    render(<ProcessMapView {...makeProps()} />);

    // Expand the first process
    fireEvent.click(screen.getByText("Lead Management"));

    // Gaps should NOT be visible initially (toggle is off)
    expect(screen.queryByText("Lead Qualification")).not.toBeInTheDocument();

    // Toggle "Show gaps" ON
    fireEvent.click(screen.getByText("Show gaps"));

    // Gap card should now appear with step name and "Gap" label
    expect(screen.getByText("Lead Qualification")).toBeInTheDocument();
    expect(screen.getAllByText("Gap").length).toBeGreaterThanOrEqual(1);

    // Toggle "Show gaps" OFF
    fireEvent.click(screen.getByText("Show gaps"));

    // Gap cards should be hidden again
    expect(screen.queryByText("Lead Qualification")).not.toBeInTheDocument();
  });

  it("AC 24: search filters by process name", () => {
    render(<ProcessMapView {...makeProps()} />);

    const searchInput = screen.getByPlaceholderText(
      "Search processes or workflows...",
    );

    // Type a search query matching one process
    fireEvent.change(searchInput, { target: { value: "Lead" } });

    // Matching process shown (may appear multiple times: process name + workflow processName spans)
    expect(screen.getAllByText("Lead Management").length).toBeGreaterThanOrEqual(1);

    // Non-matching process hidden
    expect(screen.queryByText("Customer Onboarding")).not.toBeInTheDocument();
  });

  it("AC 25: search by workflow name shows parent process", () => {
    render(<ProcessMapView {...makeProps()} />);

    const searchInput = screen.getByPlaceholderText(
      "Search processes or workflows...",
    );

    // Search for a workflow name that does NOT match the process name
    fireEvent.change(searchInput, { target: { value: "Welcome Email" } });

    // Parent process should be shown (even though "Customer Onboarding" doesn't contain "Welcome Email")
    // May appear multiple times: in ProcessCard header + UnifiedCard processName span
    expect(screen.getAllByText("Customer Onboarding").length).toBeGreaterThanOrEqual(1);

    // The other process should be hidden — "Lead Management" should not appear at all
    expect(screen.queryByText("Lead Management")).not.toBeInTheDocument();

    // The matching workflow should be visible (auto-expanded)
    expect(screen.getByText("Welcome Email Sequence")).toBeInTheDocument();
  });

  it("AC 26: workflow click navigates to correct detail URL", () => {
    render(<ProcessMapView {...makeProps()} />);

    // Expand first process
    fireEvent.click(screen.getByText("Lead Management"));

    // Find workflow card and check its wrapping link
    const workflowLink = screen.getByText("HubSpot Lead Sync").closest("a");
    expect(workflowLink).toHaveAttribute("href", "/automations/wf-1");

    const workflowLink2 = screen
      .getByText("Lead Scoring Pipeline")
      .closest("a");
    expect(workflowLink2).toHaveAttribute("href", "/automations/wf-2");
  });

  it("AC 27: gap click navigates to correct opportunities URL", () => {
    render(<ProcessMapView {...makeProps()} />);

    // Toggle gaps ON
    fireEvent.click(screen.getByText("Show gaps"));

    // Expand first process
    fireEvent.click(screen.getByText("Lead Management"));

    // Find gap card and check its wrapping link
    const gapLink = screen.getByText("Lead Qualification").closest("a");
    expect(gapLink).toHaveAttribute("href", "/opportunities?process=bp-1");
  });
});
