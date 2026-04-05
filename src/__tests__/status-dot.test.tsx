import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusDot } from "@/components/status-dot";

describe("StatusDot", () => {
  it("renders healthy with green background", () => {
    render(<StatusDot status="healthy" data-testid="dot" />);
    const dot = document.querySelector(".bg-status-healthy");
    expect(dot).toBeInTheDocument();
  });

  it("renders attention with amber background", () => {
    render(<StatusDot status="attention" />);
    const dot = document.querySelector(".bg-status-attention");
    expect(dot).toBeInTheDocument();
  });

  it("renders critical with red background", () => {
    render(<StatusDot status="critical" />);
    const dot = document.querySelector(".bg-status-critical");
    expect(dot).toBeInTheDocument();
  });

  it("merges custom className", () => {
    const { container } = render(<StatusDot status="healthy" className="ml-2" />);
    expect(container.firstChild).toHaveClass("ml-2");
  });
});
