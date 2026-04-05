import { cn } from "@/lib/utils";

export function FactCard({
  label,
  value,
  subtitle,
  className,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("p-4", className)}>
      <div className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary mb-1">
        {label}
      </div>
      <div className="text-xl font-mono font-semibold text-foreground">{value}</div>
      {subtitle && (
        <div className="text-[11px] text-text-tertiary mt-0.5">{subtitle}</div>
      )}
    </div>
  );
}
