import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ExpliqCardProps {
  children: ReactNode;
  className?: string;
}

export function ExpliqCard({ children, className }: ExpliqCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200 bg-white shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
