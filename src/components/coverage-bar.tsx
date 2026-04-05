import { cn } from "@/lib/utils";

export function CoverageBar({
  percentage,
  className,
}: {
  percentage: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percentage));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-1.5 rounded-full bg-surface-raised overflow-hidden">
        <div
          className="h-full rounded-full bg-status-healthy transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-[11px] font-mono font-semibold text-text-secondary">
        {percentage}%
      </span>
    </div>
  );
}
