// src/app/(dashboard)/layout.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import ClientShell from "@/components/layout/client-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [authed, setAuthed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setMounted(true);
    router.prefetch("/auth");

    // Read token once on mount
    const token = localStorage.getItem("token");
    setAuthed(!!token);

    // Keep in sync across tabs/windows
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") setAuthed(!!e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [router]);

  React.useEffect(() => {
    if (!mounted) return;
    if (authed === false) router.replace("/auth");
  }, [mounted, authed, router]);

  // Avoid flicker/hydration issues
  if (!mounted) return null;
  // While redirecting when unauthenticated
  if (authed === false) return null;

  // Authenticated: render immediately, no loading flashes
  return <ClientShell>{children}</ClientShell>;
}
