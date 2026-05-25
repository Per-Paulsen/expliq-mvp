"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { sendSupportMessage } from "@/lib/actions/support";

// ── Types ─────────────────────────────────────────────────

type Role = "user" | "assistant";

interface Message {
  role: Role;
  content: string;
  category?: string;
}

type SendState = "idle" | "sending" | "error";

const MAX_CHARS = 2000;
const COUNTER_THRESHOLD = 1800;

// ── Category badge ────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  "bug": "Bug",
  "feature-request": "Feature Request",
  "question": "Question",
  "urgent": "Urgent",
};

function CategoryBadge({ category }: { category: string }) {
  const label = CATEGORY_LABELS[category] ?? category;
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wide rounded-full bg-[#0d9488]/10 text-[#0d9488]">
      {label}
    </span>
  );
}

// ── Support Widget ────────────────────────────────────────

export function SupportWidget() {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastInput, setLastInput] = useState("");

  const charCount = draft.length;
  const overLimit = charCount > MAX_CHARS;
  const isEmpty = draft.trim() === "";
  const isSending = sendState === "sending";
  const canSend = !isEmpty && !overLimit && !isSending;

  // ── Dialog open/close ─────────────────────────────────

  function openPanel() {
    if (!dialogRef.current) return;
    dialogRef.current.showModal();
    setIsOpen(true);
  }

  function closePanel() {
    if (!dialogRef.current) return;
    dialogRef.current.close();
    setIsOpen(false);
    launcherRef.current?.focus();
  }

  // Focus the textarea when the panel opens
  useEffect(() => {
    if (isOpen) {
      // Small delay so the dialog is visible before focusing
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  // Handle backdrop click (native dialog emits a "cancel" on Escape; backdrop
  // click is not a close — we only close on explicit Escape or X button)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function onCancel(e: Event) {
      e.preventDefault();
      closePanel();
    }

    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  });

  // ── Send logic ────────────────────────────────────────

  async function handleSend() {
    if (!canSend) return;
    const message = draft.trim();
    setLastInput(message);
    setDraft("");
    setSendState("sending");
    setErrorMessage("");

    // Append the user message immediately
    const history: { role: Role; content: string }[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    setMessages((prev) => [...prev, { role: "user", content: message }]);

    const result = await sendSupportMessage({
      message,
      history,
      pagePath: pathname,
      automationId: null,
    });

    if ("error" in result) {
      setSendState("error");
      setErrorMessage(result.error);
    } else {
      setSendState("idle");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.reply,
          category: result.category,
        },
      ]);
    }
  }

  async function handleRetry() {
    if (!lastInput) return;
    setDraft(lastInput);
    setSendState("idle");
    setErrorMessage("");
    // Remove the last user message that failed so we don't duplicate
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "user" && last.content === lastInput) {
        return prev.slice(0, -1);
      }
      return prev;
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Render ────────────────────────────────────────────

  return (
    <>
      {/* Launcher button */}
      <button
        ref={launcherRef}
        type="button"
        aria-label="Open support chat"
        onClick={openPanel}
        className={cn(
          "fixed bottom-6 right-6 z-40",
          "flex items-center gap-2 px-4 py-3",
          "rounded-full shadow-lg",
          "bg-[#0d9488] text-white",
          "text-sm font-semibold",
          "transition-opacity duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] focus-visible:ring-offset-2",
          "motion-safe:hover:opacity-90",
          // min 24×24 guaranteed by the padding above; explicit min for clarity
          "min-w-[44px] min-h-[44px]",
        )}
      >
        <MessageCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <span>Support</span>
      </button>

      {/* Modal dialog */}
      <dialog
        ref={dialogRef}
        aria-label="Support chat"
        className={cn(
          // Reset browser dialog defaults
          "m-0 p-0 border-0 bg-transparent",
          // Full-screen on mobile, floating card on desktop
          "w-full max-w-full h-full max-h-full",
          "sm:w-[400px] sm:max-w-[calc(100vw-2rem)] sm:h-auto sm:max-h-[calc(100vh-5rem)]",
          // Anchor bottom-right on desktop: reset the UA modal `inset:0` (top/left:0)
          // so only bottom/right apply — otherwise top/left win and the panel pins top-left.
          "sm:fixed sm:top-auto sm:left-auto sm:bottom-24 sm:right-6 sm:m-0",
          // Backdrop (Tailwind can't target ::backdrop directly; use backdrop pseudo styles via global CSS or inline)
          "backdrop:bg-black/40 backdrop:backdrop-blur-sm",
          // Respects reduced motion
          "motion-safe:transition-opacity",
        )}
        onClick={(e) => {
          // Close on backdrop click (the dialog element is the backdrop area)
          if (e.target === dialogRef.current) closePanel();
        }}
      >
        {/* Card */}
        <div
          className={cn(
            "flex flex-col bg-white rounded-xl shadow-sm",
            "w-full h-full",
            "sm:h-auto sm:min-h-[400px] sm:max-h-[calc(100vh-7rem)]",
            "overflow-hidden",
          )}
          // Prevent clicks inside the card from closing the dialog
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb] flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#0d9488]" aria-hidden="true" />
              <span className="text-sm font-semibold text-[#111827]">Support</span>
            </div>
            <button
              type="button"
              aria-label="Close support chat"
              onClick={closePanel}
              className={cn(
                "rounded-md p-1 text-[#6b7280] hover:text-[#111827]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]",
                "transition-colors",
              )}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Message list */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0"
            aria-live="polite"
            aria-label="Conversation"
          >
            {messages.length === 0 && (
              <p className="text-sm text-[#9ca3af] text-center mt-4">
                Ask anything about Expliq — we&apos;re here to help.
              </p>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col gap-1",
                  msg.role === "user" ? "items-end" : "items-start",
                )}
              >
                {msg.category && <CategoryBadge category={msg.category} />}
                <div
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm max-w-[85%]",
                    msg.role === "user"
                      ? "bg-[#0d9488] text-white"
                      : "bg-[#f5f5f7] text-[#111827]",
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Sending indicator */}
            {isSending && (
              <div className="flex items-start">
                <div className="rounded-xl px-3 py-2 bg-[#f5f5f7] text-[#6b7280] text-sm flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  Thinking…
                </div>
              </div>
            )}

            {/* Error state */}
            {sendState === "error" && (
              <div
                role="alert"
                className="rounded-xl px-3 py-2 bg-red-50 text-red-700 text-sm space-y-1"
              >
                <p>{errorMessage || "Something went wrong. Please try again."}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium text-red-700 underline underline-offset-2",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded",
                  )}
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="px-4 py-3 border-t border-[#e5e7eb] flex-shrink-0 space-y-2">
            {/* Character counter — only near the limit */}
            {charCount > COUNTER_THRESHOLD && (
              <p
                className={cn(
                  "text-xs text-right",
                  overLimit ? "text-red-600 font-medium" : "text-[#9ca3af]",
                )}
                aria-live="polite"
              >
                {charCount}/{MAX_CHARS}
              </p>
            )}

            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question…"
                rows={3}
                maxLength={MAX_CHARS + 100}
                disabled={isSending}
                aria-label="Message"
                className="flex-1 text-sm"
              />

              <button
                type="button"
                aria-label="Send message"
                onClick={handleSend}
                disabled={!canSend}
                className={cn(
                  "flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center",
                  "bg-[#0d9488] text-white",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] focus-visible:ring-offset-1",
                  "transition-opacity",
                )}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <p className="text-xs text-[#9ca3af]">
              Press Enter to send, Shift+Enter for a new line.
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}
