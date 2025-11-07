"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authLogin, authRegister } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HttpError } from "@/lib/http";

type Mode = "login" | "register";

export default function AuthForm({ initialMode = "login" as Mode }) {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>(initialMode);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!email.trim()) return setErr("Please enter your email.");
    if (!password) return setErr("Please enter your password.");
    if (mode === "register" && password !== confirm) {
      return setErr("Passwords do not match.");
    }

    setLoading(true);
    try {
      const fn = mode === "login" ? authLogin : authRegister;
      const res = await fn({ email: email.trim(), password });

      if (res?.token) localStorage.setItem("token", res.token);

      router.replace("/");
    } catch (e: any) {
      if (e instanceof HttpError) {
        setErr(e.message || "Authentication failed");
      } else {
        setErr("Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Centered logo above form */}
      <div className="flex justify-center mb-6">
        <Image
          src="/favicon.svg"
          alt="App logo"
          width={70}
          height={70}
          priority
          className="rounded-full"
        />
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-[var(--color-ink)]">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {mode === "login" ? "Sign in to continue" : "Register to get started"}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {mode === "register" && (
            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          )}

          {err && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-[var(--color-green)] hover:bg-[var(--color-green)]/90"
            disabled={loading}
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="text-[var(--color-green)] underline-offset-2 hover:underline"
                onClick={() => {
                  setMode("register");
                  setErr(null);
                }}
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="text-[var(--color-green)] underline-offset-2 hover:underline"
                onClick={() => {
                  setMode("login");
                  setErr(null);
                }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
