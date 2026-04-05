import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TierBadge } from "@/components/tier-badge";

describe("TierBadge", () => {
  it("renders 'ACT NOW' for act-now tier", () => {
    render(<TierBadge tier="act-now" />);
    expect(screen.getByText("ACT NOW")).toBeInTheDocument();
  });

  it("renders 'INVESTIGATE' for investigate tier", () => {
    render(<TierBadge tier="investigate" />);
    expect(screen.getByText("INVESTIGATE")).toBeInTheDocument();
  });

  it("renders 'EXPLORE' for explore tier", () => {
    render(<TierBadge tier="explore" />);
    expect(screen.getByText("EXPLORE")).toBeInTheDocument();
  });

  it("applies green styling for act-now", () => {
    const { container } = render(<TierBadge tier="act-now" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-status-healthy");
  });

  it("applies amber styling for investigate", () => {
    const { container } = render(<TierBadge tier="investigate" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-status-attention");
  });

  it("applies gray styling for explore", () => {
    const { container } = render(<TierBadge tier="explore" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-text-tertiary");
  });
});
