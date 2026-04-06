import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import LoginPage from "@/app/(auth)/login/page";

describe("LoginPage", () => {
  it('renders the "Sign in" heading and Expliq branding', () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: "Sign in", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Expliq", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("Automation Intelligence Platform")).toBeInTheDocument();
  });

  it("renders email and password input fields", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders a sign-in submit button", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("button", { name: "Sign in" })
    ).toBeInTheDocument();
  });

  it('renders a link to /signup with text "Sign up"', () => {
    render(<LoginPage />);
    const link = screen.getByRole("link", { name: "Sign up" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/signup");
  });
});
