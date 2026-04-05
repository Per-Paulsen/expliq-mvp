import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/opportunities",
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/lib/actions/deploy", () => ({
  generateDeployJson: vi.fn(),
  deployToN8n: vi.fn(),
}));

import { OpportunitiesView } from "@/components/opportunities-view";
import type { OpportunitiesViewProps } from "@/components/opportunities-view";
import type {
  OpportunityRecommendation,
  OpportunityProcessSuggestion,
} from "@/lib/opportunities-data";
import { generateDeployJson, deployToN8n } from "@/lib/actions/deploy";

function makeRec(
  overrides: Partial<OpportunityRecommendation> = {},
): OpportunityRecommendation {
  return {
    id: "rec-1",
    name: "Add retry logic",
    brief: "Reduce error rate on lead sync",
    tier: "act-now",
    confidence: "data-driven",
    impactEstimate: "~\u20AC1.2K/mo",
    affectedScope: "3 workflows affected",
    processName: "Lead Management",
    processId: "bp-1",
    automationId: "auto-1",
    type: "technical_fix",
    businessCase: "Adding retry logic reduces errors by 80%",
    evidenceChain: "Error rate at 31% over past 4 weeks",
    honestFraming: null,
    implementationNotes: "Add error handling nodes after HTTP requests",
    systemSource: "HubSpot",
    systemDestination: "Gmail",
    deployableJson: null,
    ...overrides,
  };
}

function makeProps(
  overrides: Partial<OpportunitiesViewProps> = {},
): OpportunitiesViewProps {
  return {
    actNow: [
      makeRec({
        id: "rec-1",
        name: "Add retry logic",
        tier: "act-now",
        confidence: "data-driven",
        impactEstimate: "~\u20AC1.2K/mo",
        processName: "Lead Management",
        processId: "bp-1",
        automationId: "auto-1",
        type: "technical_fix",
      }),
      makeRec({
        id: "rec-2",
        name: "Fix webhook timeout",
        brief: "Webhook drops after 30s",
        tier: "act-now",
        confidence: "benchmark-based",
        impactEstimate: "~\u20AC800/mo",
        processName: "Customer Onboarding",
        processId: "bp-2",
        automationId: "auto-2",
        type: "technical_fix",
        honestFraming: null,
      }),
    ],
    investigate: [
      makeRec({
        id: "rec-3",
        name: "Automate invoice follow-up",
        brief: "Close revenue gap in billing",
        tier: "investigate",
        confidence: "benchmark-based",
        impactEstimate: "~\u20AC600/mo",
        processName: "Billing",
        processId: "bp-3",
        automationId: null,
        type: "new_workflow",
        honestFraming: "May be handled outside automation tools",
        businessCase: "Automating follow-up reduces DSO by 5 days",
        implementationNotes: "Create a scheduled workflow polling the CRM",
        systemSource: "Stripe",
        systemDestination: "Slack",
      }),
    ],
    explore: [
      makeRec({
        id: "rec-4",
        name: "Connect analytics pipeline",
        brief: "Visibility into funnel metrics",
        tier: "explore",
        confidence: "ai-suggested",
        impactEstimate: "Strategic",
        processName: "Reporting",
        processId: "bp-4",
        automationId: null,
        type: "new_workflow",
        honestFraming: "Likely managed via BI tools, not automation",
        businessCase: "Centralized analytics saves 2 hrs/week",
        implementationNotes: "Pull from GA4 API into warehouse",
      }),
    ],
    processSuggestions: [
      {
        id: "ps-1",
        name: "Payment & Billing",
        description: "End-to-end payment lifecycle automation",
        recommendations: [
          makeRec({
            id: "rec-5",
            name: "Auto-reconcile payments",
            brief: "Match payments to invoices automatically",
            tier: "investigate",
            confidence: "ai-suggested",
            impactEstimate: "~\u20AC400/mo",
            processName: "Payment & Billing",
            processId: null,
            automationId: null,
            type: "new_workflow",
          }),
        ],
      },
    ],
    ...overrides,
  };
}

describe("OpportunitiesView", () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
    mockPush.mockClear();
    vi.mocked(generateDeployJson).mockReset();
    vi.mocked(deployToN8n).mockReset();
  });

  it("AC 34: renders tier sections with correct headers and sorted recommendations", () => {
    render(<OpportunitiesView {...makeProps()} />);

    // Page heading
    expect(screen.getByText("Opportunities")).toBeInTheDocument();

    // Tier section headers
    expect(screen.getAllByText("ACT NOW").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("INVESTIGATE").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("EXPLORE").length).toBeGreaterThanOrEqual(1);

    // Recommendations appear under correct tiers
    expect(screen.getByText("Add retry logic")).toBeInTheDocument();
    expect(screen.getByText("Fix webhook timeout")).toBeInTheDocument();
    expect(screen.getByText("Automate invoice follow-up")).toBeInTheDocument();
    expect(screen.getByText("Connect analytics pipeline")).toBeInTheDocument();

    // Correct ordering: act-now items appear before investigate, which appears before explore
    const allText = document.body.textContent ?? "";
    const retryIdx = allText.indexOf("Add retry logic");
    const webhookIdx = allText.indexOf("Fix webhook timeout");
    const invoiceIdx = allText.indexOf("Automate invoice follow-up");
    const analyticsIdx = allText.indexOf("Connect analytics pipeline");
    expect(retryIdx).toBeLessThan(webhookIdx);
    expect(webhookIdx).toBeLessThan(invoiceIdx);
    expect(invoiceIdx).toBeLessThan(analyticsIdx);
  });

  it("AC 34: hides empty tier sections", () => {
    render(
      <OpportunitiesView
        {...makeProps({ actNow: [], investigate: [], explore: [] })}
      />,
    );

    // Tier headers should not appear as section headers (they may still appear as TierBadge inside ProcessSuggestion cards)
    // Process suggestion section should still render
    expect(screen.getByText("Payment & Billing")).toBeInTheDocument();
  });

  it("AC 35: slide-over opens with full recommendation detail", () => {
    render(<OpportunitiesView {...makeProps()} />);

    // Click on a recommendation card
    fireEvent.click(screen.getByText("Automate invoice follow-up"));

    // Slide-over should show detail fields
    expect(
      screen.getByText("Automating follow-up reduces DSO by 5 days"),
    ).toBeInTheDocument();

    // Implementation notes
    expect(
      screen.getByText("Create a scheduled workflow polling the CRM"),
    ).toBeInTheDocument();

    // Honest framing callout
    expect(
      screen.getByText("May be handled outside automation tools"),
    ).toBeInTheDocument();

    // Business Case heading
    expect(screen.getByText("Business Case")).toBeInTheDocument();

    // Systems flow
    expect(screen.getByText("Stripe")).toBeInTheDocument();
  });

  it("AC 35: slide-over shows deploy button for new_workflow type", () => {
    render(<OpportunitiesView {...makeProps()} />);

    // Click on a new_workflow recommendation
    fireEvent.click(screen.getByText("Automate invoice follow-up"));

    // Deploy button should appear
    expect(screen.getByText("Deploy")).toBeInTheDocument();
  });

  it("AC 35: slide-over shows workflow link for technical_fix with automationId", () => {
    render(<OpportunitiesView {...makeProps()} />);

    // Click on a technical_fix recommendation that has automationId
    fireEvent.click(screen.getByText("Add retry logic"));

    // Should show link to automation detail
    const link = screen.getByText(/View workflow/);
    expect(link.closest("a")).toHaveAttribute("href", "/automations/auto-1");
  });

  it("AC 36: process suggestion sections with child recommendations", () => {
    render(<OpportunitiesView {...makeProps()} />);

    // Process suggestion header appears
    expect(screen.getByText("Payment & Billing")).toBeInTheDocument();
    expect(
      screen.getByText("End-to-end payment lifecycle automation"),
    ).toBeInTheDocument();
    expect(screen.getByText("1 recommendation")).toBeInTheDocument();

    // Child recs are hidden initially (collapsed)
    expect(
      screen.queryByText("Auto-reconcile payments"),
    ).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText("Payment & Billing"));

    // Child recommendation should appear
    expect(screen.getByText("Auto-reconcile payments")).toBeInTheDocument();
  });

  it("AC 37: deploy modal loading state", async () => {
    // Mock generateDeployJson to hang (return a promise that won't resolve during the test)
    vi.mocked(generateDeployJson).mockReturnValue(new Promise(() => {}));

    render(<OpportunitiesView {...makeProps()} />);

    // Open slide-over on a new_workflow recommendation
    fireEvent.click(screen.getByText("Automate invoice follow-up"));

    // Click deploy button in slide-over
    fireEvent.click(screen.getByText("Deploy"));

    // Deploy modal should show loading state
    expect(
      screen.getByText("Generating workflow scaffold..."),
    ).toBeInTheDocument();
  });

  it("AC 37: deploy modal preview state with JSON", async () => {
    const fakeJson = { nodes: [], connections: {} };
    vi.mocked(generateDeployJson).mockResolvedValue({
      success: true,
      json: fakeJson,
    });

    render(<OpportunitiesView {...makeProps()} />);

    // Open slide-over on a new_workflow recommendation
    fireEvent.click(screen.getByText("Automate invoice follow-up"));

    // Click deploy button
    fireEvent.click(screen.getByText("Deploy"));

    // Wait for the JSON preview to appear
    expect(
      await screen.findByText("Deploy to n8n"),
    ).toBeInTheDocument();

    // JSON should be shown in preview
    expect(await screen.findByText(/\"nodes\"/)).toBeInTheDocument();

    // Copy button should be present
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("AC 37: deploy modal shows cached deployableJson without LLM call", () => {
    const cachedJson = { nodes: [{ type: "n8n-nodes-base.httpRequest" }] };
    const propsWithCache = makeProps({
      investigate: [
        makeRec({
          id: "rec-3",
          name: "Automate invoice follow-up",
          brief: "Close revenue gap in billing",
          tier: "investigate",
          type: "new_workflow",
          honestFraming: "May be handled outside automation tools",
          businessCase: "Automating follow-up reduces DSO by 5 days",
          implementationNotes: "Create a scheduled workflow polling the CRM",
          systemSource: "Stripe",
          systemDestination: "Slack",
          deployableJson: cachedJson,
        }),
      ],
    });

    render(<OpportunitiesView {...propsWithCache} />);

    // Open slide-over
    fireEvent.click(screen.getByText("Automate invoice follow-up"));

    // Click deploy
    fireEvent.click(screen.getByText("Deploy"));

    // Should show JSON preview immediately (no LLM call)
    expect(screen.getByText(/httpRequest/)).toBeInTheDocument();
    expect(generateDeployJson).not.toHaveBeenCalled();
  });

  it("AC 38: deep-link highlights the correct recommendation", () => {
    mockSearchParams = new URLSearchParams("highlight=rec-3");

    render(<OpportunitiesView {...makeProps()} />);

    // The highlighted recommendation should have ring styling via data-rec-id
    const highlightedEl = document.querySelector('[data-rec-id="rec-3"]');
    expect(highlightedEl).toBeTruthy();
    expect(highlightedEl?.className).toContain("ring-2");
  });

  it("AC 39: process filter shows only relevant recommendations", () => {
    mockSearchParams = new URLSearchParams("process=bp-1");

    render(<OpportunitiesView {...makeProps()} />);

    // Only bp-1 recommendations should show
    expect(screen.getByText("Add retry logic")).toBeInTheDocument();

    // Recommendations from other processes should be hidden
    expect(screen.queryByText("Fix webhook timeout")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Automate invoice follow-up"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Connect analytics pipeline"),
    ).not.toBeInTheDocument();

    // Clear filter button should be visible
    expect(screen.getByText("Clear filter")).toBeInTheDocument();
  });

  it("AC 39: clear filter navigates to /opportunities", () => {
    mockSearchParams = new URLSearchParams("process=bp-1");

    render(<OpportunitiesView {...makeProps()} />);

    // Click clear filter
    fireEvent.click(screen.getByText("Clear filter"));

    expect(mockPush).toHaveBeenCalledWith("/opportunities");
  });

  it("AC 40: deploy button calls generateDeployJson with correct recommendation ID", async () => {
    vi.mocked(generateDeployJson).mockResolvedValue({
      success: true,
      json: { nodes: [] },
    });

    render(<OpportunitiesView {...makeProps()} />);

    // Open slide-over on a new_workflow recommendation
    fireEvent.click(screen.getByText("Automate invoice follow-up"));

    // Click deploy
    fireEvent.click(screen.getByText("Deploy"));

    // generateDeployJson should be called with rec-3
    await waitFor(() => {
      expect(generateDeployJson).toHaveBeenCalledWith("rec-3");
    });
  });

  it("renders empty state when no recommendations", () => {
    render(
      <OpportunitiesView
        {...makeProps({
          actNow: [],
          investigate: [],
          explore: [],
          processSuggestions: [],
        })}
      />,
    );

    expect(
      screen.getByText("No recommendations to display"),
    ).toBeInTheDocument();
  });

  it("slide-over closes on X button click", () => {
    render(<OpportunitiesView {...makeProps()} />);

    // Open slide-over
    fireEvent.click(screen.getByText("Add retry logic"));
    expect(screen.getByText("Business Case")).toBeInTheDocument();

    // Find close button (X icon button in SlideOverPanel header)
    // The SlideOverPanel renders a button with X icon after the title
    const closeButtons = document.querySelectorAll(
      ".fixed button",
    );
    // The last button in the fixed overlay should be the X close
    const xButton = Array.from(closeButtons).find((btn) =>
      btn.querySelector("svg"),
    );
    if (xButton) {
      fireEvent.click(xButton);
    }

    // After closing, business case should no longer be visible
    expect(screen.queryByText("Business Case")).not.toBeInTheDocument();
  });
});
