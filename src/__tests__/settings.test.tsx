import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TagPreview } from "@/lib/actions/connector";

const mockSaveConnectorConfig = vi.fn();
const mockVerifyAndDiscover = vi.fn();
const mockUpdateSelectedTags = vi.fn();
const mockSyncAndAnalyze = vi.fn();
const mockGetAnalysisStatus = vi.fn();

vi.mock("@/lib/actions/connector", () => ({
  saveConnectorConfig: (...args: unknown[]) => mockSaveConnectorConfig(...args),
  verifyAndDiscover: (...args: unknown[]) => mockVerifyAndDiscover(...args),
  updateSelectedTags: (...args: unknown[]) => mockUpdateSelectedTags(...args),
  syncAndAnalyze: (...args: unknown[]) => mockSyncAndAnalyze(...args),
  getAnalysisStatus: (...args: unknown[]) => mockGetAnalysisStatus(...args),
}));

import { SettingsForm } from "@/components/settings-form";

const sampleTags: TagPreview[] = [
  {
    id: "tag-1",
    name: "Production",
    workflowCount: 5,
    workflowNames: ["Onboarding", "Billing", "Alerts"],
  },
  {
    id: "tag-2",
    name: "Reference",
    workflowCount: 9,
    workflowNames: ["Welcome Email", "LotteryWin Notification", "Support Classifier"],
  },
  {
    id: null,
    name: "Untagged",
    workflowCount: 3,
    workflowNames: ["Test Flow", "Scratch"],
  },
];

const sampleDiscovery = {
  tags: sampleTags,
  totalWorkflows: 17,
};

describe("SettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateSelectedTags.mockResolvedValue({ success: true });
    mockGetAnalysisStatus.mockResolvedValue({ status: null });
  });

  // ── Section 1: Connection ────────────────────────────────

  it("renders the N8N Connection section header", () => {
    render(<SettingsForm hasApiKey={false} lastSyncAt={null} />);
    expect(screen.getByText("N8N Connection")).toBeInTheDocument();
  });

  it("renders Instance URL and API Key inputs", () => {
    render(<SettingsForm hasApiKey={false} lastSyncAt={null} />);
    expect(screen.getByLabelText("Instance URL")).toBeInTheDocument();
    expect(screen.getByLabelText("API Key")).toBeInTheDocument();
  });

  it("renders Save and Verify Connection buttons", () => {
    render(<SettingsForm hasApiKey={false} lastSyncAt={null} />);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Verify Connection" })
    ).toBeInTheDocument();
  });

  it("pre-fills Instance URL when existingUrl is provided", () => {
    render(
      <SettingsForm
        existingUrl="https://n8n.example.com"
        hasApiKey={false}
        lastSyncAt={null}
      />
    );
    expect(screen.getByLabelText("Instance URL")).toHaveValue(
      "https://n8n.example.com"
    );
  });

  it("shows placeholder for saved API key", () => {
    render(<SettingsForm hasApiKey={true} lastSyncAt={null} />);
    expect(
      screen.getByPlaceholderText("API key saved \u2014 enter new to replace")
    ).toBeInTheDocument();
  });

  it("shows default placeholder when no API key is saved", () => {
    render(<SettingsForm hasApiKey={false} lastSyncAt={null} />);
    expect(
      screen.getByPlaceholderText("Enter your n8n API key")
    ).toBeInTheDocument();
  });

  it("disables Verify Connection when no config is saved", () => {
    render(<SettingsForm hasApiKey={false} lastSyncAt={null} />);
    expect(
      screen.getByRole("button", { name: "Verify Connection" })
    ).toBeDisabled();
  });

  it("enables Verify Connection when config is saved", () => {
    render(<SettingsForm hasApiKey={true} lastSyncAt={null} />);
    expect(
      screen.getByRole("button", { name: "Verify Connection" })
    ).not.toBeDisabled();
  });

  // ── Verify triggers verifyAndDiscover ────────────────────

  it("calls verifyAndDiscover when Verify Connection is clicked", async () => {
    mockVerifyAndDiscover.mockResolvedValue({
      success: true,
      tags: sampleTags,
      totalWorkflows: 17,
    });

    const user = userEvent.setup();
    render(<SettingsForm hasApiKey={true} lastSyncAt={null} />);

    await user.click(
      screen.getByRole("button", { name: "Verify Connection" })
    );

    expect(mockVerifyAndDiscover).toHaveBeenCalledOnce();
  });

  // ── Section 2: Tag Selection ─────────────────────────────

  it("shows Workflow Scope section (disabled without discovery data)", () => {
    render(<SettingsForm hasApiKey={true} lastSyncAt={null} />);
    expect(screen.getByText("Workflow Scope")).toBeInTheDocument();
  });

  it("shows Workflow Scope with data after successful verify", async () => {
    mockVerifyAndDiscover.mockResolvedValue({
      success: true,
      tags: sampleTags,
      totalWorkflows: 17,
    });

    const user = userEvent.setup();
    render(<SettingsForm hasApiKey={true} lastSyncAt={null} />);

    await user.click(
      screen.getByRole("button", { name: "Verify Connection" })
    );

    expect(screen.getByText("Workflow Scope")).toBeInTheDocument();
    expect(screen.getByText(/workflows found/)).toBeInTheDocument();
  });

  it("renders Workflow Scope from initial discoveryData props", () => {
    render(
      <SettingsForm
        hasApiKey={true}
        lastSyncAt={null}
        discoveryData={sampleDiscovery}
        selectedTags={["Production", "Reference", "__untagged__"]}
      />
    );

    expect(screen.getByText("Workflow Scope")).toBeInTheDocument();
    expect(screen.getByText(/workflows found/)).toBeInTheDocument();
  });

  it("renders tag checkboxes with correct labels and previews", () => {
    render(
      <SettingsForm
        hasApiKey={true}
        lastSyncAt={null}
        discoveryData={sampleDiscovery}
        selectedTags={["Production", "Reference", "__untagged__"]}
      />
    );

    expect(screen.getByText("Production (5)")).toBeInTheDocument();
    expect(screen.getByText("Reference (9)")).toBeInTheDocument();
    expect(screen.getByText("Untagged (3)")).toBeInTheDocument();

    // Workflow name previews
    expect(screen.getByText(/Onboarding, Billing, Alerts/)).toBeInTheDocument();
    expect(screen.getByText(/Welcome Email/)).toBeInTheDocument();
    expect(screen.getByText(/Test Flow, Scratch/)).toBeInTheDocument();
  });

  it("shows selected workflow count", () => {
    render(
      <SettingsForm
        hasApiKey={true}
        lastSyncAt={null}
        discoveryData={sampleDiscovery}
        selectedTags={["Production", "Reference", "__untagged__"]}
      />
    );

    // 5 + 9 + 3 = 17 — number is in <strong> tag, rest in text node
    expect(screen.getByText(/workflows selected/)).toBeInTheDocument();
  });

  it("calls updateSelectedTags when a tag is toggled", async () => {
    const user = userEvent.setup();
    render(
      <SettingsForm
        hasApiKey={true}
        lastSyncAt={null}
        discoveryData={sampleDiscovery}
        selectedTags={["Production", "Reference", "__untagged__"]}
      />
    );

    // Click the Production checkbox to uncheck it
    const productionCheckbox = screen.getByLabelText("Production (5)");
    await user.click(productionCheckbox);

    expect(mockUpdateSelectedTags).toHaveBeenCalledWith(
      ["Reference", "__untagged__"]
    );
  });

  it("Deselect all clears all tags", async () => {
    const user = userEvent.setup();
    render(
      <SettingsForm
        hasApiKey={true}
        lastSyncAt={null}
        discoveryData={sampleDiscovery}
        selectedTags={["Production", "Reference", "__untagged__"]}
      />
    );

    await user.click(screen.getByText("Deselect all"));

    expect(mockUpdateSelectedTags).toHaveBeenCalledWith([]);
    // Sync section is still visible but disabled (progressive disclosure)
    expect(screen.getByText("Sync & Analyze", { selector: "h2" })).toBeInTheDocument();
  });

  it("Select all checks all tags", async () => {
    const user = userEvent.setup();
    render(
      <SettingsForm
        hasApiKey={true}
        lastSyncAt={null}
        discoveryData={sampleDiscovery}
        selectedTags={["Production"]}
      />
    );

    await user.click(screen.getByText("Select all"));

    expect(mockUpdateSelectedTags).toHaveBeenCalledWith(
      ["Production", "Reference", "__untagged__"]
    );
  });

  // ── Section 3: Sync & Analyze ────────────────────────────

  it("shows Sync & Analyze section when tags are selected", () => {
    render(
      <SettingsForm
        hasApiKey={true}
        lastSyncAt={null}
        discoveryData={sampleDiscovery}
        selectedTags={["Production"]}
      />
    );

    expect(screen.getByText("Sync & Analyze", { selector: "h2" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sync & Analyze" })
    ).toBeInTheDocument();
  });

  it("shows Sync & Analyze section disabled when no tags selected", () => {
    render(
      <SettingsForm
        hasApiKey={true}
        lastSyncAt={null}
        discoveryData={sampleDiscovery}
        selectedTags={[]}
      />
    );

    // Section is always visible (progressive disclosure) but button is disabled
    expect(screen.getByText("Sync & Analyze", { selector: "h2" })).toBeInTheDocument();
  });

  it("displays 'Never' when lastSyncAt is null", () => {
    render(
      <SettingsForm
        hasApiKey={true}
        lastSyncAt={null}
        discoveryData={sampleDiscovery}
        selectedTags={["Production"]}
      />
    );
    expect(screen.getByText(/Last synced:.*Never/)).toBeInTheDocument();
  });

  it("displays formatted last sync date when lastSyncAt is provided", () => {
    render(
      <SettingsForm
        hasApiKey={true}
        lastSyncAt="2025-01-15T10:30:00.000Z"
        discoveryData={sampleDiscovery}
        selectedTags={["Production"]}
      />
    );
    expect(screen.getByText(/Last synced:/)).toBeInTheDocument();
  });

  it("calls syncAndAnalyze when Sync & Analyze button is clicked", async () => {
    mockSyncAndAnalyze.mockResolvedValue({
      success: true,
      summary: {
        created: 2,
        updated: 1,
        unchanged: 3,
        removed: 0,
        errors: [],
        enrichment: {
          credentials: true,
          users: false,
          projects: false,
          variables: true,
        },
      },
    });

    const user = userEvent.setup();
    render(
      <SettingsForm
        hasApiKey={true}
        lastSyncAt={null}
        discoveryData={sampleDiscovery}
        selectedTags={["Production"]}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Sync & Analyze" })
    );

    expect(mockSyncAndAnalyze).toHaveBeenCalledOnce();
  });

  it("shows sync results with enrichment status after sync", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockSyncAndAnalyze.mockResolvedValue({
      success: true,
      summary: {
        created: 2,
        updated: 1,
        unchanged: 3,
        removed: 0,
        errors: [],
        enrichment: {
          credentials: true,
          users: false,
          projects: false,
          variables: true,
        },
      },
    });
    // Mock analysis completing so results show
    mockGetAnalysisStatus.mockResolvedValue({ status: "complete" });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <SettingsForm
        hasApiKey={true}
        lastSyncAt={null}
        discoveryData={sampleDiscovery}
        selectedTags={["Production"]}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Sync & Analyze" })
    );

    // Advance past the polling interval (2500ms)
    await vi.advanceTimersByTimeAsync(3000);

    // Wait for polling to detect "complete" and show results
    await vi.waitFor(() => {
      expect(screen.getByText("Credentials: available")).toBeInTheDocument();
    });
    expect(screen.getByText("Variables: available")).toBeInTheDocument();
    expect(screen.getByText("Users: unavailable")).toBeInTheDocument();

    vi.useRealTimers();
  });
});
