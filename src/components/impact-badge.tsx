import { cn } from "@/lib/utils";

const levelStyles = {
  critical: "bg-status-critical/10 text-status-critical border border-status-critical/20",
  high: "bg-status-attention/10 text-status-attention border border-status-attention/20",
  medium: "text-text-secondary border border-border",
  low: "text-text-tertiary border border-text-tertiary/20",
} as const;

export function ImpactBadge({
  level,
  className,
}: {
  level: "critical" | "high" | "medium" | "low";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded",
        levelStyles[level],
        className,
      )}
    >
      {level}
    </span>
  );
}
