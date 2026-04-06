"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { AlertMessage } from "@/components/alert-message";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <>
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-foreground">Expliq</h2>
        <p className="text-sm text-text-tertiary">Automation Intelligence Platform</p>
      </div>
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-foreground">Sign in</h1>
        <p className="text-sm text-text-secondary">Enter your credentials to access your workspace</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div id="login-error"><AlertMessage variant="error">{error}</AlertMessage></div>}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-[#374151]">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={loading}
            aria-describedby={error ? "login-error" : undefined}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-[#374151]">
            Password
          </label>
          <PasswordInput
            id="password"
            name="password"
            required
            autoComplete="current-password"
            disabled={loading}
            aria-describedby={error ? "login-error" : undefined}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}
