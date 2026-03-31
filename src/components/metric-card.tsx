import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  accentColor?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  accentColor,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className="text-3xl font-semibold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div
            className="shrink-0 text-neutral-400"
            style={accentColor ? { color: accentColor } : undefined}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
