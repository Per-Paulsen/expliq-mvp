import { cn } from "@/lib/utils";

export type ProcessCardProps = {
  name: string;
  maturityLevel?: string | null;
  automatedSteps: number;
  totalSteps: number;
  coverage: number;
  reliability: number | null;
  recommendations: number;
  valueAtStake?: string | null;
  className?: string;
};

const maturityStyles: Record<string, string> = {
  Production: "bg-status-healthy/10 text-status-healthy",
  Developing: "bg-blue-50 text-blue-700",
  Emerging: "bg-status-attention/10 text-status-attention",
  Prototype: "bg-surface-raised text-text-tertiary",
  Optimized: "bg-primary/10 text-primary",
};

export function ProcessCard({
  name,
  maturityLevel,
  automatedSteps,
  totalSteps,
  coverage,
  reliability,
  recommendations,
  valueAtStake,
  className,
}: ProcessCardProps) {
  return (
    <div
      className={cn(
        "bg-surface rounded-xl border border-border shadow-sm p-5 hover:border-text-tertiary/50 transition cursor-pointer group",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-semibold text-foreground group-hover:text-primary transition">
          {name}
        </h4>
        {maturityLevel != null && (
          <span
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-full",
              maturityStyles[maturityLevel] ??
                "bg-surface-raised text-text-tertiary",
            )}
          >
            {maturityLevel}
          </span>
        )}
      </div>

      {/* Coverage bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-text-secondary">Coverage</span>
          <span className="text-sm font-semibold font-mono text-text-secondary">
            {automatedSteps} of {totalSteps} steps
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-surface-raised overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${coverage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-lg font-bold font-mono text-primary">
            {coverage}%
          </span>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
        <div>
          <p className="text-xs text-text-tertiary mb-0.5">Reliability</p>
          <p className="text-base font-semibold font-mono text-text-secondary">
            {reliability != null ? `${reliability}%` : "\u2014"}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary mb-0.5">At Risk</p>
          <p className="text-base font-semibold font-mono text-status-attention">
            {valueAtStake ?? "\u2014"}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary mb-0.5">Recommendations</p>
          <p className="text-base font-semibold font-mono text-primary">
            {recommendations}
          </p>
        </div>
      </div>
    </div>
  );
}
