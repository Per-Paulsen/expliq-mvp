"use client";

export default function AutomationDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm text-status-critical mb-2">Something went wrong</p>
      <p className="text-sm text-text-secondary mb-4">
        {error.message || "Failed to load automation details."}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
