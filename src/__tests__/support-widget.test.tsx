import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Polyfill HTMLDialogElement for jsdom ──────────────────
// jsdom does not implement showModal/close — we stub them so the dialog renders.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
}

// ── Mock server action ────────────────────────────────────
const mockSendSupportMessage = vi.fn();

vi.mock("@/lib/actions/support", () => ({
  sendSupportMessage: (...args: unknown[]) => mockSendSupportMessage(...args),
}));

// ── Mock next/navigation ──────────────────────────────────
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

// ── Import after mocks ────────────────────────────────────
import { SupportWidget } from "@/components/support-widget";

// ── Helpers ───────────────────────────────────────────────

function renderWidget() {
  return render(<SupportWidget />);
}

function getLauncher() {
  return screen.getByRole("button", { name: /open support chat/i });
}

async function openPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(getLauncher());
}

function getMessageInput() {
  return screen.getByRole("textbox", { name: /message/i });
}

function getSendButton() {
  return screen.getByRole("button", { name: /send message/i });
}

// ── Tests ─────────────────────────────────────────────────

describe("SupportWidget — A7: render + interaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the launcher button", () => {
    renderWidget();
    expect(getLauncher()).toBeInTheDocument();
  });

  it("shows the input panel after clicking the launcher", async () => {
    const user = userEvent.setup();
    renderWidget();

    await openPanel(user);

    expect(getMessageInput()).toBeInTheDocument();
    expect(getSendButton()).toBeInTheDocument();
  });

  it("renders the reply on a successful sendSupportMessage response", async () => {
    mockSendSupportMessage.mockResolvedValue({
      success: true,
      category: "question",
      reply: "Here is the answer to your question.",
    });

    const user = userEvent.setup();
    renderWidget();
    await openPanel(user);

    await user.type(getMessageInput(), "What does Expliq do?");
    await user.click(getSendButton());

    await waitFor(() => {
      expect(
        screen.getByText("Here is the answer to your question.")
      ).toBeInTheDocument();
    });
  });

  it("calls sendSupportMessage with the correct arguments", async () => {
    mockSendSupportMessage.mockResolvedValue({
      success: true,
      category: "question",
      reply: "Great question!",
    });

    const user = userEvent.setup();
    renderWidget();
    await openPanel(user);

    await user.type(getMessageInput(), "Hello");
    await user.click(getSendButton());

    await waitFor(() => {
      expect(mockSendSupportMessage).toHaveBeenCalledWith({
        message: "Hello",
        history: [],
        pagePath: "/dashboard",
        automationId: null,
      });
    });
  });

  it("renders the error state with Retry when sendSupportMessage returns an error", async () => {
    mockSendSupportMessage.mockResolvedValue({
      error: "Service unavailable. Please try again later.",
    });

    const user = userEvent.setup();
    renderWidget();
    await openPanel(user);

    await user.type(getMessageInput(), "Test question");
    await user.click(getSendButton());

    await waitFor(() => {
      expect(
        screen.getByText("Service unavailable. Please try again later.")
      ).toBeInTheDocument();
    });

    // Retry control is present
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("renders a category badge alongside a successful reply", async () => {
    mockSendSupportMessage.mockResolvedValue({
      success: true,
      category: "bug",
      reply: "We found the bug.",
    });

    const user = userEvent.setup();
    renderWidget();
    await openPanel(user);

    await user.type(getMessageInput(), "There is a bug");
    await user.click(getSendButton());

    await waitFor(() => {
      expect(screen.getByText("Bug")).toBeInTheDocument();
    });
  });
});

describe("SupportWidget — A8: input behaviour", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendSupportMessage.mockResolvedValue({
      success: true,
      category: "question",
      reply: "Got it.",
    });
  });

  it("pressing Enter triggers sendSupportMessage", async () => {
    const user = userEvent.setup();
    renderWidget();
    await openPanel(user);

    const input = getMessageInput();
    await user.type(input, "Hello");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(mockSendSupportMessage).toHaveBeenCalledOnce();
    });
  });

  it("pressing Shift+Enter does NOT send — it inserts a newline", async () => {
    const user = userEvent.setup();
    renderWidget();
    await openPanel(user);

    const input = getMessageInput();
    await user.type(input, "Line one");
    await user.keyboard("{Shift>}{Enter}{/Shift}");

    // No send call made
    expect(mockSendSupportMessage).not.toHaveBeenCalled();

    // The input now contains a newline
    expect((input as HTMLTextAreaElement).value).toContain("\n");
  });

  it("Send button is disabled when the input is empty", async () => {
    const user = userEvent.setup();
    renderWidget();
    await openPanel(user);

    expect(getSendButton()).toBeDisabled();
  });

  it("Send button is disabled when the input is whitespace-only", async () => {
    const user = userEvent.setup();
    renderWidget();
    await openPanel(user);

    await user.type(getMessageInput(), "   ");
    expect(getSendButton()).toBeDisabled();
  });

  it("Send button is enabled with valid text", async () => {
    const user = userEvent.setup();
    renderWidget();
    await openPanel(user);

    await user.type(getMessageInput(), "Hello");
    expect(getSendButton()).not.toBeDisabled();
  });

  it("Send button is disabled when input exceeds 2000 chars", async () => {
    const user = userEvent.setup();
    renderWidget();
    await openPanel(user);

    const longText = "a".repeat(2001);
    // fireEvent is faster than userEvent for large strings
    fireEvent.change(getMessageInput(), { target: { value: longText } });

    expect(getSendButton()).toBeDisabled();
  });

  it("character counter appears when input length exceeds 1800", async () => {
    const user = userEvent.setup();
    renderWidget();
    await openPanel(user);

    const nearLimitText = "a".repeat(1801);
    fireEvent.change(getMessageInput(), { target: { value: nearLimitText } });

    await waitFor(() => {
      expect(screen.getByText(/1801\/2000/)).toBeInTheDocument();
    });
  });

  it("character counter does not appear for short messages", async () => {
    const user = userEvent.setup();
    renderWidget();
    await openPanel(user);

    await user.type(getMessageInput(), "Hello");
    expect(screen.queryByText(/\/2000/)).not.toBeInTheDocument();
  });
});
