"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createOptionalBrowserSupabaseClient } from "@/lib/supabase/browser";

export function AdminSignOutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createOptionalBrowserSupabaseClient();

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    setIsSubmitting(true);
    await supabase.auth.signOut();
    setIsSubmitting(false);
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSubmitting || !supabase}
      className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--ink-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSubmitting ? "退出中..." : "退出登录"}
    </button>
  );
}
