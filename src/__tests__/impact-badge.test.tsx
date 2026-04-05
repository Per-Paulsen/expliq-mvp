import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ImpactBadge } from "@/components/impact-badge";

describe("ImpactBadge", () => {
  it("renders 'critical' for critical level", () => {
    render(<ImpactBadge level="critical" />);
    expect(screen.getByText("critical")).toBeInTheDocument();
  });

  it("renders 'high' for high level", () => {
    render(<ImpactBadge level="high" />);
    expect(screen.getByText("high")).toBeInTheDocument();
  });

  it("renders 'medium' for medium level", () => {
    render(<ImpactBadge level="medium" />);
    expect(screen.getByText("medium")).toBeInTheDocument();
  });

  it("renders 'low' for low level", () => {
    render(<ImpactBadge level="low" />);
    expect(screen.getByText("low")).toBeInTheDocument();
  });

  it("applies red styling for critical", () => {
    const { container } = render(<ImpactBadge level="critical" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-status-critical");
  });

  it("applies amber styling for high", () => {
    const { container } = render(<ImpactBadge level="high" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-status-attention");
  });
});
