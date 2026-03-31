import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  height?: "sm" | "md" | "lg";
  color?: string;
  showPercentage?: boolean;
  className?: string;
}

function getDefaultColor(value: number): string {
  if (value >= 80) return "#14b8a6";
  if (value >= 60) return "#22c55e";
  if (value >= 40) return "#f59e0b";
  return "#ef4444";
}

const heightStyles = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function ProgressBar({
  value,
  height = "md",
  color,
  showPercentage = false,
  className,
}: ProgressBarProps) {
  const barColor = color ?? getDefaultColor(value);

  return (
    <div className={cn("w-full", className)}>
      {showPercentage && (
        <div className="flex justify-end mb-1">
          <span className="text-xs text-neutral-400 font-mono">{Math.round(value)}%</span>
        </div>
      )}
      <div className={cn("rounded-full bg-neutral-100 overflow-hidden", heightStyles[height])}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
    </div>
  );
}
