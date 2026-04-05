import { cn } from "@/lib/utils";

export function SystemFlow({
  systems,
  className,
}: {
  systems: string[];
  className?: string;
}) {
  if (systems.length === 0) return null;

  return (
    <span className={cn("flex items-center gap-1.5 text-[11px] font-mono", className)}>
      {systems.map((system, i) => (
        <span key={i} className="contents">
          <span className="text-text-secondary">{system}</span>
          {i < systems.length - 1 && (
            <span className="text-text-tertiary">&rarr;</span>
          )}
        </span>
      ))}
    </span>
  );
}
