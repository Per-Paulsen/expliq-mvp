import { cn } from "@/lib/utils";

const levelStyles = {
  "data-driven": "border border-status-healthy/50 bg-status-healthy/10 text-status-healthy",
  "benchmark-based": "border border-dashed border-status-attention/50 text-status-attention",
  "ai-suggested": "border border-text-tertiary/30 text-text-tertiary",
} as const;

export function ConfidenceBadge({
  level,
  className,
}: {
  level: "data-driven" | "benchmark-based" | "ai-suggested";
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
      {level.replace(/-/g, " ")}
    </span>
  );
}
