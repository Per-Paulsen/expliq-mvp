import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/actions/connector", () => ({
  saveConnectorConfig: vi.fn(),
  testConnection: vi.fn(),
  syncWorkflows: vi.fn(),
}));

import { SettingsForm } from "@/components/settings-form";

describe("SettingsForm", () => {
  it("renders the Settings heading", () => {
    render(<SettingsForm hasApiKey={false} lastSyncAt={null} />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders Instance URL and API Key inputs", () => {
    render(<SettingsForm hasApiKey={false} lastSyncAt={null} />);
    expect(screen.getByLabelText("Instance URL")).toBeInTheDocument();
    expect(screen.getByLabelText("API Key")).toBeInTheDocument();
  });

  it("renders Save and Test Connection buttons", () => {
    render(<SettingsForm hasApiKey={false} lastSyncAt={null} />);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Test Connection" })
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

  it("hides Sync section when hasApiKey is false", () => {
    render(<SettingsForm hasApiKey={false} lastSyncAt={null} />);
    expect(screen.queryByText("Sync")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sync Now" })
    ).not.toBeInTheDocument();
  });

  it("shows Sync section when hasApiKey is true", () => {
    render(<SettingsForm hasApiKey={true} lastSyncAt={null} />);
    expect(screen.getByText("Sync")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sync Now" })
    ).toBeInTheDocument();
  });

  it("displays 'Never synced' when lastSyncAt is null", () => {
    render(<SettingsForm hasApiKey={true} lastSyncAt={null} />);
    expect(screen.getByText("Never synced")).toBeInTheDocument();
  });

  it("displays formatted last sync date when lastSyncAt is provided", () => {
    render(
      <SettingsForm
        hasApiKey={true}
        lastSyncAt="2025-01-15T10:30:00.000Z"
      />
    );
    expect(screen.getByText(/Last synced:/)).toBeInTheDocument();
  });
});
