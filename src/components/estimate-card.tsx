import { cn } from "@/lib/utils";
import { ConfidenceBadge } from "@/components/confidence-badge";

export type EstimateCardProps = {
  label: string;
  value: string;
  explanation: string;
  confidence: "data-driven" | "benchmark-based" | "ai-suggested";
  deltaType: "positive" | "negative";
  className?: string;
};

export function EstimateCard({
  label,
  value,
  explanation,
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
      <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
        {explanation}
      </p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <ConfidenceBadge level={confidence} />
        <button className="text-xs text-primary font-medium hover:underline">
          methodology →
        </button>
      </div>
    </div>
  );
}
