import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SlideOverPanel } from "@/components/slide-over-panel";

describe("SlideOverPanel", () => {
  it("renders content when open is true", () => {
    render(
      <SlideOverPanel open={true} onClose={() => {}} title="Test Panel">
        <p>Panel content</p>
      </SlideOverPanel>
    );
    expect(screen.getByText("Test Panel")).toBeInTheDocument();
    expect(screen.getByText("Panel content")).toBeInTheDocument();
  });

  it("does not render content when open is false", () => {
    render(
      <SlideOverPanel open={false} onClose={() => {}} title="Test Panel">
        <p>Panel content</p>
      </SlideOverPanel>
    );
    expect(screen.queryByText("Test Panel")).not.toBeInTheDocument();
    expect(screen.queryByText("Panel content")).not.toBeInTheDocument();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <SlideOverPanel open={true} onClose={onClose} title="Test Panel">
        <p>Content</p>
      </SlideOverPanel>
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when X button is clicked", async () => {
    const onClose = vi.fn();
    render(
      <SlideOverPanel open={true} onClose={onClose} title="Test Panel">
        <p>Content</p>
      </SlideOverPanel>
    );

    // The X button is the button inside the header
    const buttons = screen.getAllByRole("button");
    await buttons[0].click();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <SlideOverPanel open={true} onClose={onClose} title="Test Panel">
        <p>Content</p>
      </SlideOverPanel>
    );

    // The backdrop is the first fixed element (bg-black/50)
    const backdrop = container.querySelector(".bg-black\\/50");
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
