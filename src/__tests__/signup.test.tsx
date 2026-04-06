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

vi.mock("@/lib/actions/auth", () => ({
  signup: vi.fn(),
}));

import SignupPage from "@/app/(auth)/signup/page";

describe("SignupPage", () => {
  it('renders the "Create account" heading and Expliq branding', () => {
    render(<SignupPage />);
    expect(screen.getByRole("heading", { name: "Create account", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Expliq", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("Automation Intelligence Platform")).toBeInTheDocument();
  });

  it("renders email, password, and confirm password input fields", () => {
    render(<SignupPage />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
  });

  it("renders a create account submit button", () => {
    render(<SignupPage />);
    expect(
      screen.getByRole("button", { name: "Create account" })
    ).toBeInTheDocument();
  });

  it('renders a link to /login with text "Sign in"', () => {
    render(<SignupPage />);
    const link = screen.getByRole("link", { name: "Sign in" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });
});
