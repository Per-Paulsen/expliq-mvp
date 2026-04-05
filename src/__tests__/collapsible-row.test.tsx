import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { CollapsibleRow } from "@/components/collapsible-row";

describe("CollapsibleRow", () => {
  it("renders header content always", () => {
    render(
      <CollapsibleRow header={<span>Header Text</span>}>
        <p>Hidden content</p>
      </CollapsibleRow>
    );
    expect(screen.getByText("Header Text")).toBeInTheDocument();
  });

  it("hides children by default", () => {
    render(
      <CollapsibleRow header={<span>Header</span>}>
        <p>Child content</p>
      </CollapsibleRow>
    );
    expect(screen.queryByText("Child content")).not.toBeInTheDocument();
  });

  it("shows children when defaultOpen is true", () => {
    render(
      <CollapsibleRow header={<span>Header</span>} defaultOpen>
        <p>Child content</p>
      </CollapsibleRow>
    );
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("expands on click to show children", async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleRow header={<span>Header</span>}>
        <p>Child content</p>
      </CollapsibleRow>
    );

    expect(screen.queryByText("Child content")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button"));

    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("collapses on second click", async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleRow header={<span>Header</span>}>
        <p>Child content</p>
      </CollapsibleRow>
    );

    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Child content")).toBeInTheDocument();

    await user.click(screen.getByRole("button"));
    expect(screen.queryByText("Child content")).not.toBeInTheDocument();
  });
});
