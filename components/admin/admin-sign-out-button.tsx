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
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-medium text-[var(--ink-secondary)] transition hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white disabled:hover:text-[var(--ink-secondary)] disabled:hover:border-[var(--border)]"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
        <path d="M10 11l3-3-3-3" />
        <path d="M13 8H6" />
      </svg>
      {isSubmitting ? "退出中..." : "退出登录"}
    </button>
  );
}
