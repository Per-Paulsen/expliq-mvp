"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SlideOverPanel({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface border-l border-border flex flex-col animate-in slide-in-from-right",
          className,
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-1 text-text-tertiary hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </>
  );
}
