import { cn } from "@/lib/utils";

export type KpiCardProps = {
  label: string;
  value: string;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
  className?: string;
};

export function KpiCard({
  label,
  value,
  delta,
  deltaType,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "bg-surface rounded-xl border border-border shadow-sm p-5",
        className,
      )}
    >
      <p className="text-sm font-medium text-text-secondary mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono tracking-tight text-foreground">
        {value}
      </p>
      {delta && (
        <p
          className={cn(
            "text-sm mt-1",
            deltaType === "positive" && "text-status-healthy",
            deltaType === "negative" && "text-status-attention",
            deltaType === "neutral" && "text-text-tertiary",
          )}
        >
          {deltaType === "positive" && "↑ "}
          {deltaType === "negative" && "↓ "}
          {delta}
        </p>
      )}
    </div>
  );
}
