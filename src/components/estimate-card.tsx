import { cn } from "@/lib/utils";
import { ConfidenceBadge } from "@/components/confidence-badge";

export type EstimateCardProps = {
  label: string;
  value: string;
  confidence: "data-driven" | "benchmark-based" | "ai-suggested";
  deltaType: "positive" | "negative";
  className?: string;
};

export function EstimateCard({
  label,
  value,
  confidence,
  deltaType,
  className,
}: EstimateCardProps) {
  return (
    <div
      className={cn(
        "bg-surface rounded-xl border border-border shadow-sm p-5",
        className,
      )}
    >
      <p className="text-sm font-medium text-text-secondary mb-1">{label}</p>
      <p
        className={cn(
          "text-2xl font-bold font-mono tracking-tight",
          deltaType === "positive" ? "text-primary" : "text-status-attention",
        )}
      >
        {value}
      </p>
      <div className="mt-2">
        <ConfidenceBadge level={confidence} />
      </div>
    </div>
  );
}
