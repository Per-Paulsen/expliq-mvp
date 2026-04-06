import { cn } from "@/lib/utils";

const variantStyles = {
  success: "bg-status-healthy/10 text-status-healthy",
  error: "bg-status-critical/10 text-status-critical",
  warning: "bg-status-attention/10 text-status-attention",
} as const;

interface AlertMessageProps {
  variant: "success" | "error" | "warning";
  children: React.ReactNode;
  className?: string;
}

export function AlertMessage({
  variant,
  children,
  className,
}: AlertMessageProps) {
  return (
    <div className={cn("rounded-lg p-3 text-sm", variantStyles[variant], className)}>
      {children}
    </div>
  );
}
