import { cn } from "@/lib/utils";

const statusStyles = {
  healthy: "bg-status-healthy",
  attention: "bg-status-attention",
  critical: "bg-status-critical",
} as const;

export function StatusDot({
  status,
  className,
}: {
  status: "healthy" | "attention" | "critical";
  className?: string;
}) {
  return (
    <span
      className={cn("w-2.5 h-2.5 rounded-full", statusStyles[status], className)}
    />
  );
}
