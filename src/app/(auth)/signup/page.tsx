"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { AlertMessage } from "@/components/alert-message";
import { cn } from "@/lib/utils";
import { signup } from "@/lib/actions/auth";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const pwd = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (pwd !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const result = await signup(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password: pwd,
      redirect: false,
    });

    if (signInResult?.error) {
      setError("Account created but sign-in failed. Please try logging in.");
    } else {
      router.push("/dashboard");
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
        <h1 className="text-2xl font-bold text-foreground">Create account</h1>
        <p className="text-sm text-text-secondary">Get started with Automation Intelligence</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div id="signup-error"><AlertMessage variant="error">{error}</AlertMessage></div>}
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
            aria-describedby={error ? "signup-error" : undefined}
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
            autoComplete="new-password"
            minLength={8}
            disabled={loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={error ? "signup-error" : undefined}
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <Check className={cn("h-3.5 w-3.5", password.length >= 8 ? "text-status-healthy" : "text-text-tertiary")} />
              <span className={cn(password.length >= 8 ? "text-status-healthy" : "text-text-tertiary")}>At least 8 characters</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-[#374151]">
            Confirm Password
          </label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            required
            autoComplete="new-password"
            minLength={8}
            disabled={loading}
            aria-describedby={error ? "signup-error" : undefined}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
