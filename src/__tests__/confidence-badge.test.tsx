import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ConfidenceBadge } from "@/components/confidence-badge";

describe("ConfidenceBadge", () => {
  it("renders 'data driven' text for data-driven level", () => {
    render(<ConfidenceBadge level="data-driven" />);
    expect(screen.getByText("data driven")).toBeInTheDocument();
  });

  it("renders 'benchmark based' for benchmark-based level", () => {
    render(<ConfidenceBadge level="benchmark-based" />);
    expect(screen.getByText("benchmark based")).toBeInTheDocument();
  });

  it("renders 'ai suggested' for ai-suggested level", () => {
    render(<ConfidenceBadge level="ai-suggested" />);
    expect(screen.getByText("ai suggested")).toBeInTheDocument();
  });

  it("uses solid border for data-driven", () => {
    const { container } = render(<ConfidenceBadge level="data-driven" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("border-status-healthy/50");
    expect(badge.className).not.toContain("border-dashed");
  });

  it("uses dashed border for benchmark-based", () => {
    const { container } = render(<ConfidenceBadge level="benchmark-based" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("border-dashed");
  });

  it("uses subtle border for ai-suggested", () => {
    const { container } = render(<ConfidenceBadge level="ai-suggested" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("border-text-tertiary/30");
  });
});
