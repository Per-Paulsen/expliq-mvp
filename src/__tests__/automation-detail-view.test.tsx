import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRouter = vi.hoisted(() => ({
  back: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/automations/test-id",
}));

vi.mock("@/lib/actions/automation", () => ({
  saveAutomationEdits: vi.fn(),
  markAsReviewed: vi.fn(),
}));

vi.mock("@/lib/actions/llm", () => ({
  regenerateAutomation: vi.fn(),
}));

import { AutomationDetailView } from "@/components/automation-detail-view";
import type { AutomationDetail } from "@/lib/automation-detail-types";

function makeAutomationDetail(
  overrides: Partial<AutomationDetail> = {}
): AutomationDetail {
  return {
    id: "test-id",
    name: "Test Automation",
    description: "A test automation description",
    platform: "n8n",
    status: "active",
    statusOverride: null,
    effectiveStatus: "active",
    owner: "Alice",
    systemsTouched: ["Slack", "Salesforce"],
    trigger: "When a new lead is created",
    triggerType: "webhook",
    coreLogic:
      "Step 1: Fetch lead data\nStep 2: Create Slack notification\nStep 3: Update Salesforce",
    dataTypes: ["Lead", "Contact"],
    sideEffects: ["Creates Slack message", "Updates Salesforce record"],
    businessContext:
      "This automation ensures sales team is notified immediately when new leads arrive.",
    impactProposal: "high",
    impactOverride: null,
    effectiveImpact: "high",
    impactReasoning: "Handles critical lead notification workflow",
    riskLevel: "medium",
    signals: {
      documentationOutdated: true,
      automationStale: false,
      overdueReview: true,
      noOwnerAssigned: false,
      inactive: false,
    },
    reviewCadenceDays: 30,
    lastReviewDate: new Date().toISOString(),
    automationLastUpdated: new Date().toISOString(),
    documentationLastUpdated: new Date().toISOString(),
    externalId: "ext-123",
    n8nWorkflowUrl: "https://n8n.example.com/workflow/ext-123",
    ...overrides,
  };
}

describe("AutomationDetailView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders automation name", () => {
    render(<AutomationDetailView automation={makeAutomationDetail()} />);
    expect(screen.getByText("Test Automation")).toBeInTheDocument();
  });

  it("renders 'Untitled automation' when name is null", () => {
    render(
      <AutomationDetailView
        automation={makeAutomationDetail({ name: null })}
      />
    );
    expect(screen.getByText("Untitled automation")).toBeInTheDocument();
  });

  it("renders platform badge and effective status badge", () => {
    render(<AutomationDetailView automation={makeAutomationDetail()} />);
    expect(screen.getByText("n8n")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<AutomationDetailView automation={makeAutomationDetail()} />);
    expect(
      screen.getByText("A test automation description")
    ).toBeInTheDocument();
  });

  it("renders 'Pending generation' when description is null", () => {
    render(
      <AutomationDetailView
        automation={makeAutomationDetail({ description: null })}
      />
    );
    expect(
      screen.getAllByText("Pending generation").length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders trigger text", () => {
    render(<AutomationDetailView automation={makeAutomationDetail()} />);
    expect(
      screen.getByText("When a new lead is created")
    ).toBeInTheDocument();
  });

  it("renders core logic as bullet list", () => {
    render(<AutomationDetailView automation={makeAutomationDetail()} />);
    expect(screen.getByText("Step 1: Fetch lead data")).toBeInTheDocument();
    expect(
      screen.getByText("Step 2: Create Slack notification")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Step 3: Update Salesforce")
    ).toBeInTheDocument();
  });

  it("renders data types as badges", () => {
    render(<AutomationDetailView automation={makeAutomationDetail()} />);
    expect(screen.getByText("Lead")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });

  it("renders side effects as list items", () => {
    render(<AutomationDetailView automation={makeAutomationDetail()} />);
    expect(screen.getByText("Creates Slack message")).toBeInTheDocument();
    expect(
      screen.getByText("Updates Salesforce record")
    ).toBeInTheDocument();
  });

  it("renders business context", () => {
    render(<AutomationDetailView automation={makeAutomationDetail()} />);
    expect(
      screen.getByText(
        "This automation ensures sales team is notified immediately when new leads arrive."
      )
    ).toBeInTheDocument();
  });

  it("renders risk level badge with correct label", () => {
    render(<AutomationDetailView automation={makeAutomationDetail()} />);
    expect(screen.getByText("Medium risk")).toBeInTheDocument();
  });

  it("renders impact with override distinction", () => {
    render(
      <AutomationDetailView
        automation={makeAutomationDetail({
          impactProposal: "medium",
          impactOverride: "critical",
          effectiveImpact: "critical",
        })}
      />
    );
    expect(screen.getByText("Critical impact")).toBeInTheDocument();
    expect(screen.getByText("LLM: medium")).toBeInTheDocument();
  });

  it("renders governance signals as badges", () => {
    render(<AutomationDetailView automation={makeAutomationDetail()} />);
    expect(
      screen.getByText("Documentation outdated")
    ).toBeInTheDocument();
    expect(screen.getByText("Overdue review")).toBeInTheDocument();
    expect(
      screen.queryByText("Automation stale")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("No owner assigned")
    ).not.toBeInTheDocument();
  });

  it("renders 'No active risk signals' when no signals active", () => {
    render(
      <AutomationDetailView
        automation={makeAutomationDetail({
          signals: {
            documentationOutdated: false,
            automationStale: false,
            overdueReview: false,
            noOwnerAssigned: false,
            inactive: false,
          },
        })}
      />
    );
    expect(
      screen.getByText("No active risk signals")
    ).toBeInTheDocument();
  });

  it("renders 'Mark as reviewed' button", () => {
    render(<AutomationDetailView automation={makeAutomationDetail()} />);
    expect(screen.getByText("Mark as reviewed")).toBeInTheDocument();
  });

  it("renders metadata: owner, trigger type, timestamps, systems", () => {
    render(<AutomationDetailView automation={makeAutomationDetail()} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("webhook")).toBeInTheDocument();
    // Systems
    expect(screen.getByText("Slack")).toBeInTheDocument();
    expect(screen.getByText("Salesforce")).toBeInTheDocument();
  });

  it("shows 'Open in n8n' link when n8nWorkflowUrl provided", () => {
    render(<AutomationDetailView automation={makeAutomationDetail()} />);
    const link = screen.getByText("Open in n8n ↗").closest("a");
    expect(link).toHaveAttribute(
      "href",
      "https://n8n.example.com/workflow/ext-123"
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("hides 'Open in n8n' when n8nWorkflowUrl is null", () => {
    render(
      <AutomationDetailView
        automation={makeAutomationDetail({ n8nWorkflowUrl: null })}
      />
    );
    expect(screen.queryByText("Open in n8n ↗")).not.toBeInTheDocument();
  });

  it("shows 'Regenerate' button", () => {
    render(<AutomationDetailView automation={makeAutomationDetail()} />);
    expect(screen.getByText("Regenerate")).toBeInTheDocument();
  });

  it("edit button enters edit mode with Save and Cancel buttons", () => {
    render(<AutomationDetailView automation={makeAutomationDetail()} />);
    fireEvent.click(screen.getByText("Edit"));
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    // Edit button should be hidden
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("cancel exits edit mode", () => {
    render(<AutomationDetailView automation={makeAutomationDetail()} />);
    fireEvent.click(screen.getByText("Edit"));
    expect(screen.getByText("Save")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });
});
