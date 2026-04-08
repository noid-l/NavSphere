"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createOptionalBrowserSupabaseClient } from "@/lib/supabase/browser";

type AuthPanelProps = {
  initialUserEmail: string | null;
  isConfigured: boolean;
};

const loginRoute = "/login" as Route;

export function AuthPanel({ initialUserEmail, isConfigured }: AuthPanelProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createOptionalBrowserSupabaseClient();

  async function signOut() {
    if (!supabase) return;

    setIsSubmitting(true);
    const { error } = await supabase.auth.signOut();
    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!isConfigured && (
        <p className="text-sm text-[var(--ink-secondary)]">
          当前未配置 Supabase。请先补齐环境变量并启用 GitHub Provider。
        </p>
      )}

      {initialUserEmail ? (
        <>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--emerald)]" />
            <span className="text-sm font-medium">{initialUserEmail}</span>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={isSubmitting || !supabase}
            className="inline-flex rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            退出登录
          </button>
        </>
      ) : (
        <>
          <p className="text-sm leading-6 text-[var(--ink-secondary)]">
            登录入口已经收敛到独立页面，只保留 GitHub 作为唯一登录方式。
          </p>
          <Link
            href={loginRoute}
            className="inline-flex rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--surface-hover)]"
          >
            前往登录页
          </Link>
        </>
      )}

      {message && (
        <p className="text-sm text-[var(--ink-secondary)]">{message}</p>
      )}
    </div>
  );
}
