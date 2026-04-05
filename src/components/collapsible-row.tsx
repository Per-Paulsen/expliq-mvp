"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollapsibleRow({
  header,
  children,
  defaultOpen = false,
  className,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("border-b border-border", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 cursor-pointer hover:bg-surface transition-colors"
      >
        <span className="flex-1">{header}</span>
        <ChevronRight
          className={cn(
            "w-4 h-4 text-text-tertiary transition-transform duration-200",
            open && "rotate-90",
          )}
        />
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}
