import { cn } from "@/lib/utils";

const tierStyles = {
  "act-now": "bg-status-healthy/10 text-status-healthy border border-status-healthy/20",
  investigate: "bg-status-attention/10 text-status-attention border border-status-attention/20",
  explore: "bg-surface-raised text-text-tertiary border border-text-tertiary/20",
} as const;

const tierLabels = {
  "act-now": "ACT NOW",
  investigate: "INVESTIGATE",
  explore: "EXPLORE",
} as const;

export function TierBadge({
  tier,
  className,
}: {
  tier: "act-now" | "investigate" | "explore";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded",
        tierStyles[tier],
        className,
      )}
    >
      {tierLabels[tier]}
    </span>
  );
}
