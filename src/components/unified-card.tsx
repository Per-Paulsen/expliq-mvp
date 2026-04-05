import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { StatusDot } from "@/components/status-dot";
import { TierBadge } from "@/components/tier-badge";
import { ConfidenceBadge } from "@/components/confidence-badge";

export type UnifiedCardProps = {
  type: "attention" | "recommendation";
  name: string;
  description: string;
  metric: string;
  scope?: string;
  process: string;
  severity?: "critical" | "attention";
  tier?: "act-now" | "investigate" | "explore";
  confidence?: "data-driven" | "benchmark-based" | "ai-suggested";
  className?: string;
};

export function UnifiedCard({
  type,
  name,
  description,
  metric,
  scope,
  process,
  severity,
  tier,
  confidence,
  className,
}: UnifiedCardProps) {
  const isAttention = type === "attention";

  const borderColor = isAttention
    ? severity === "critical"
      ? "border-l-status-critical"
      : "border-l-status-attention"
    : tier === "act-now"
      ? "border-l-status-healthy"
      : tier === "investigate"
        ? "border-l-status-attention"
        : "border-l-text-tertiary";

  const metricColor = isAttention
    ? severity === "critical"
      ? "text-status-critical"
      : "text-status-attention"
    : "text-primary";

  return (
    <div
      className={cn(
        "bg-surface rounded-xl border border-border border-l-[3px] shadow-sm p-5 hover:border-text-tertiary/50 transition cursor-pointer group",
        borderColor,
        className,
      )}
    >
      {/* Row 1: Badges + confidence */}
      <div className="flex items-center gap-2 mb-2">
        {isAttention && severity && <StatusDot status={severity} />}
        {!isAttention && tier && (
          <>
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <TierBadge tier={tier} />
          </>
        )}
        <span className="flex-1" />
        {confidence && <ConfidenceBadge level={confidence} />}
      </div>

      {/* Row 2: Name */}
      <h4 className="text-[15px] font-semibold text-foreground group-hover:text-primary transition mb-1">
        {name}
      </h4>

      {/* Row 3: Description */}
      <p className="text-sm text-text-secondary leading-relaxed mb-3 line-clamp-2">
        {description}
      </p>

      {/* Row 4: Metric + scope + process */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className={cn("text-lg font-bold font-mono", metricColor)}>
          {metric}
        </span>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          {scope && <span>{scope}</span>}
          {scope && <span>·</span>}
          <span>{process}</span>
        </div>
      </div>
    </div>
  );
}
