import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/automations/auto-1",
  useSearchParams: () => new URLSearchParams(),
}));

import { DetailView } from "@/components/detail-view";
import type { DetailData } from "@/lib/detail-data";

function makeDetailData(overrides: Partial<DetailData> = {}): DetailData {
  return {
    id: "auto-1",
    name: "Lead Capture Sync",
    externalId: "123",
    status: "active",
    governanceDot: "critical",
    statusLabel: "Critical — 31% error rate",
    systemsTouched: ["HubSpot", "Gmail", "Sheets"],
    stepName: "Capture Lead",
    businessNarrative:
      "This workflow captures leads from HubSpot and syncs them to Gmail and Sheets for the sales team.",
    impact: {
      failureScenario:
        "Lost leads cascade into missed revenue opportunities for the quarter.",
      revenueConnection: "Directly feeds the sales pipeline worth ~€50K/mo.",
    },
    timeSavingsEstimate: "~4 hrs/wk",
    timeSavingsConfidence: "data-driven",
    revenueImpactEstimate: "~€2.5K/mo",
    revenueConfidence: "benchmark-based",
    technicalEvidence: {
      errorHandling:
        "No retry logic configured. Error workflow not set. Missing timeout handling on HTTP nodes.",
      credentials: ["HubSpot API Key", "Gmail OAuth", "Sheets Service Account"],
      keyFindings: [
        "HTTP request nodes lack timeout configuration",
        "No error workflow defined despite high error rate",
        "Credential rotation overdue by 90 days",
        "Missing input validation on webhook trigger",
        "Rate limiting not configured for HubSpot API calls",
        "Duplicate detection logic absent",
        "No logging or audit trail for processed records",
      ],
      complexity: { nodeCount: 12, branching: "Linear with one conditional" },
    },
    detectability: {
      level: "silent",
      reasoning: "No error notifications configured",
      evidence: "No Slack/email alerts in workflow",
    },
    runsPerWeek: 42.5,
    errorRate: 0.31,
    lastExecutedAt: new Date("2026-04-05T12:00:00Z"),
    avgDurationMs: 3450,
    process: {
      id: "bp-1",
      name: "Lead Management",
      maturityLevel: "Production",
      steps: [
        { name: "Capture Lead", isGap: false, isAutomated: true },
        { name: "Enrich Data", isGap: false, isAutomated: true },
        { name: "Score Lead", isGap: true, isAutomated: false },
        { name: "Route to Sales", isGap: false, isAutomated: true },
        { name: "Follow Up", isGap: true, isAutomated: false },
      ],
    },
    recommendations: [
      {
        id: "rec-1",
        name: "Add retry logic to HTTP nodes",
        brief: "Reduce error rate from 31% to under 5%",
        tier: "act-now",
        impactEstimate: "~€1.2K/mo",
      },
      {
        id: "rec-2",
        name: "Configure error workflow",
        brief: "Add alerting for workflow failures",
        tier: "investigate",
        impactEstimate: "~€400/mo",
      },
    ],
    upstream: [
      {
        id: "auto-2",
        name: "HubSpot Webhook Trigger",
        externalId: "456",
        businessNarrative: "Captures form submissions from HubSpot.",
        connectionType: "sub-workflow",
      },
    ],
    downstream: [
      {
        id: "auto-3",
        name: "Error Alert Handler",
        externalId: "789",
        businessNarrative: "Sends Slack alerts on workflow failures.",
        connectionType: "error-handler",
      },
    ],
    ...overrides,
  };
}

describe("DetailView", () => {
  // AC #36: Full render with all sections
  it("renders all card sections when fully populated", () => {
    render(<DetailView data={makeDetailData()} />);

    // Header
    expect(screen.getByText("Lead Capture Sync")).toBeInTheDocument();
    expect(
      screen.getByText("Critical — 31% error rate"),
    ).toBeInTheDocument();
    expect(screen.getByText("n8n")).toBeInTheDocument();

    // SystemFlow renders systems
    expect(screen.getByText("HubSpot")).toBeInTheDocument();
    expect(screen.getByText("Gmail")).toBeInTheDocument();

    // Step pill (process name appears in both pill and process position)
    expect(
      screen.getAllByText("Lead Management").length,
    ).toBeGreaterThanOrEqual(1);

    // Business Narrative
    expect(screen.getByText("Business Narrative")).toBeInTheDocument();
    expect(
      screen.getByText(
        /This workflow captures leads from HubSpot/,
      ),
    ).toBeInTheDocument();

    // Business Case
    expect(screen.getByText("Business Case")).toBeInTheDocument();
    expect(screen.getByText("Failure Impact")).toBeInTheDocument();
    expect(screen.getByText(/Lost leads cascade/)).toBeInTheDocument();
    expect(screen.getByText("~4 hrs/wk")).toBeInTheDocument();
    expect(screen.getByText("~€2.5K/mo")).toBeInTheDocument();

    // Confidence badges
    expect(screen.getAllByText(/data driven/i).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/benchmark based/i).length,
    ).toBeGreaterThanOrEqual(1);

    // Recommendations
    expect(
      screen.getByText("Recommendations for This Workflow"),
    ).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // count badge
    expect(screen.getByText("Add retry logic to HTTP nodes")).toBeInTheDocument();
    expect(screen.getByText("ACT NOW")).toBeInTheDocument();
    expect(screen.getByText("~€1.2K/mo")).toBeInTheDocument();

    // Process Position
    expect(screen.getByText("Process Position")).toBeInTheDocument();
    expect(screen.getAllByText("Lead Management").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Production")).toBeInTheDocument();
    expect(screen.getByText("Score Lead")).toBeInTheDocument();

    // Connected Automations
    expect(screen.getByText("Connected Automations")).toBeInTheDocument();
    expect(screen.getByText("Upstream")).toBeInTheDocument();
    expect(screen.getByText("Downstream")).toBeInTheDocument();
    expect(screen.getByText("HubSpot Webhook Trigger")).toBeInTheDocument();
    expect(screen.getByText("Error Alert Handler")).toBeInTheDocument();

    // Evidence collapsed by default — header visible
    expect(screen.getByText("How We Know This")).toBeInTheDocument();
  });

  // AC #37: Hidden sections
  it("hides connections card when no connections exist", () => {
    render(
      <DetailView data={makeDetailData({ upstream: [], downstream: [] })} />,
    );
    expect(
      screen.queryByText("Connected Automations"),
    ).not.toBeInTheDocument();
  });

  it("shows empty state for recommendations when none exist", () => {
    render(<DetailView data={makeDetailData({ recommendations: [] })} />);
    expect(
      screen.getByText("No recommendations linked to this workflow"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("View all opportunities →"),
    ).toBeInTheDocument();
  });

  // AC #38: Evidence collapsed by default, expands on click
  it("evidence section is collapsed by default and expands on click", () => {
    render(<DetailView data={makeDetailData()} />);

    // Evidence content not visible
    expect(screen.queryByText("Execution Stats")).not.toBeInTheDocument();

    // Click the collapsible header
    fireEvent.click(screen.getByText("How We Know This"));

    // Now visible
    expect(screen.getByText("Execution Stats")).toBeInTheDocument();
    expect(screen.getByText("42.5")).toBeInTheDocument(); // runsPerWeek
    expect(screen.getByText("31%")).toBeInTheDocument(); // errorRate
    expect(screen.getByText("3.5s")).toBeInTheDocument(); // avgDuration
    expect(screen.getByText("Error Handling")).toBeInTheDocument();
    expect(screen.getByText(/No retry logic configured/)).toBeInTheDocument();
    expect(
      screen.getByText("Credentials & System Dependencies"),
    ).toBeInTheDocument();
    expect(screen.getByText("HubSpot API Key")).toBeInTheDocument();
    expect(screen.getByText("Detectability")).toBeInTheDocument();
    expect(screen.getByText("silent")).toBeInTheDocument();
    expect(screen.getByText("Complexity")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument(); // nodeCount
  });

  // AC #39: Key findings capped at 5 with show more
  it("caps key findings at 5 and shows 'Show more' toggle", () => {
    render(<DetailView data={makeDetailData()} />);

    // Expand evidence
    fireEvent.click(screen.getByText("How We Know This"));

    expect(screen.getByText("Key Findings")).toBeInTheDocument();

    // Should show first 5 findings
    expect(
      screen.getByText("HTTP request nodes lack timeout configuration"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Rate limiting not configured for HubSpot API calls"),
    ).toBeInTheDocument();

    // Should NOT show 6th and 7th
    expect(
      screen.queryByText("Duplicate detection logic absent"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("No logging or audit trail for processed records"),
    ).not.toBeInTheDocument();

    // "Show 2 more" toggle
    expect(screen.getByText("Show 2 more")).toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText("Show 2 more"));

    // All findings now visible
    expect(
      screen.getByText("Duplicate detection logic absent"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No logging or audit trail for processed records"),
    ).toBeInTheDocument();
  });

  // AC #40: Step pill links to process map
  it("step pill links to /processes", () => {
    render(<DetailView data={makeDetailData()} />);
    const stepLinks = screen
      .getAllByText("Lead Management")
      .map((el) => el.closest("a"))
      .filter((a) => a?.classList.contains("inline-flex"));
    expect(stepLinks.length).toBe(1);
    expect(stepLinks[0]).toHaveAttribute("href", "/processes");
  });

  // AC #41: Connected automation links to detail page
  it("connected automations link to /automations/[id]", () => {
    render(<DetailView data={makeDetailData()} />);
    const upstreamLink = screen
      .getByText("HubSpot Webhook Trigger")
      .closest("a");
    expect(upstreamLink).toHaveAttribute("href", "/automations/auto-2");

    const downstreamLink = screen
      .getByText("Error Alert Handler")
      .closest("a");
    expect(downstreamLink).toHaveAttribute("href", "/automations/auto-3");
  });

  // AC #42: Recommendation links to opportunities with highlight
  it("recommendation rows link to /opportunities?highlight={id}", () => {
    render(<DetailView data={makeDetailData()} />);
    const recLink = screen
      .getByText("Add retry logic to HTTP nodes")
      .closest("a");
    expect(recLink).toHaveAttribute(
      "href",
      "/opportunities?highlight=rec-1",
    );

    const recLink2 = screen
      .getByText("Configure error workflow")
      .closest("a");
    expect(recLink2).toHaveAttribute(
      "href",
      "/opportunities?highlight=rec-2",
    );
  });

  // Process position shows current step as filled pill
  it("highlights the current step in process position", () => {
    render(<DetailView data={makeDetailData()} />);
    const captureStep = screen.getByText("Capture Lead");
    // Current step should have bg-primary styling
    expect(captureStep.className).toContain("bg-primary");
    expect(captureStep.className).toContain("text-white");

    // Other steps should have ghost styling
    const scoreStep = screen.getByText("Score Lead");
    expect(scoreStep.className).toContain("bg-surface-hover");
    expect(scoreStep.className).toContain("text-text-secondary");
  });

  // Connection type pills render
  it("renders connection type pills", () => {
    render(<DetailView data={makeDetailData()} />);
    expect(screen.getByText("sub workflow")).toBeInTheDocument();
    expect(screen.getByText("error handler")).toBeInTheDocument();
  });

  // N/A handling for business case
  it("shows 'Not applicable' for null business case fields", () => {
    render(
      <DetailView
        data={makeDetailData({
          impact: { failureScenario: null, revenueConnection: null },
          timeSavingsEstimate: null,
          revenueImpactEstimate: null,
        })}
      />,
    );
    expect(screen.getAllByText("Not applicable").length).toBe(3);
  });

  // Back link renders
  it("hides process position when no process", () => {
    render(<DetailView data={makeDetailData({ process: null })} />);
    expect(screen.queryByText("Process Position")).not.toBeInTheDocument();
  });

  // Empty state link works
  it("empty recommendations links to /opportunities", () => {
    render(<DetailView data={makeDetailData({ recommendations: [] })} />);
    const link = screen.getByText("View all opportunities →").closest("a");
    expect(link).toHaveAttribute("href", "/opportunities");
  });
});
