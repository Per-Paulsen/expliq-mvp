import Link from "next/link";

export default function AutomationNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <h2 className="text-lg font-semibold">Automation not found</h2>
      <p className="text-muted-foreground text-sm">
        This automation doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link
        href="/automations"
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
      >
        Back to Automations
      </Link>
    </div>
  );
}
