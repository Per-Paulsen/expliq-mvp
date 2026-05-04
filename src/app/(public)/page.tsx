import Link from "next/link";

import { demoLoginAction } from "./demo-login-action";

export default function LandingPage() {
  const isDemo = process.env.DEMO_MODE === "true";

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6">
      {/* Text block */}
      <div className="flex flex-col items-center text-center max-w-[640px] space-y-2">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground">Expliq</h1>
        <p className="text-xl md:text-2xl font-semibold text-primary">
          Automation Intelligence
        </p>
        <p className="text-lg text-text-secondary">
          See what&apos;s working, what&apos;s broken, and what to build next.
        </p>
        {isDemo ? (
          <div className="!mt-6 flex w-full max-w-md flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-5 text-left">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Live demo
              </p>
              <p className="text-sm text-text-secondary">
                Pre-seeded with the FairTix workspace — 9 analyzed n8n workflows + recommendations.
              </p>
            </div>
            <div className="flex flex-col gap-1 rounded border border-border bg-background p-3 font-mono text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-text-secondary">email</span>
                <span>demo@example.com</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-text-secondary">password</span>
                <span>demo</span>
              </div>
            </div>
            <p className="text-xs text-text-secondary">
              State resets daily at 03:00 UTC.
            </p>
            <div className="flex gap-2">
              <form action={demoLoginAction}>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-9 px-4 transition-all hover:bg-primary/80"
                >
                  Open demo →
                </button>
              </form>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg border border-border text-sm font-medium h-9 px-4 transition-all hover:bg-muted"
              >
                Or sign up
              </Link>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="!mt-4 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-base font-medium h-11 px-8 transition-all hover:bg-primary/80"
          >
            Try it out
          </Link>
        )}
      </div>
    </div>
  );
}
