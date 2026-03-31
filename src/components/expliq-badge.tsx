import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "risk" | "impact" | "system" | "status" | "attention" | "healthy";
type BadgeSize = "sm" | "md";

interface ExpliqBadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  risk: "bg-red-100 text-red-800 border-red-500/20",
  impact: "bg-amber-100 text-amber-800 border-amber-500/20",
  attention: "bg-amber-100 text-amber-800 border-amber-500/20",
  healthy: "bg-green-100 text-green-800 border-green-500/20",
  system: "bg-neutral-100 text-neutral-600 border-neutral-300/50",
  status: "bg-teal-100 text-teal-800 border-teal-500/20",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-3 py-1 text-xs",
};

export function ExpliqBadge({
  children,
  variant = "system",
  size = "sm",
  className,
}: ExpliqBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
