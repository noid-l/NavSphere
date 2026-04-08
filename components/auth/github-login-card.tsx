"use client";

import Link from "next/link";
import { useState } from "react";

import { createOptionalBrowserSupabaseClient } from "@/lib/supabase/browser";

type GitHubLoginCardProps = {
  isConfigured: boolean;
  next: string;
  errorCode?: string;
};

function getErrorMessage(errorCode?: string) {
  if (errorCode === "missing_code") {
    return "没有拿到 OAuth 授权结果，请重新发起 GitHub 登录。";
  }

  if (errorCode === "oauth_exchange_failed") {
    return "GitHub 已返回授权结果，但 Supabase 没能建立会话，请检查 GitHub Provider 配置。";
  }

  return null;
}

export function GitHubLoginCard({
  isConfigured,
  next,
  errorCode,
}: GitHubLoginCardProps) {
  const [message, setMessage] = useState<string | null>(
    getErrorMessage(errorCode),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createOptionalBrowserSupabaseClient();

  async function signInWithGitHub() {
    if (!supabase) {
      setMessage("Supabase 环境变量未配置，暂时无法发起登录。");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: callbackUrl.toString() },
    });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-[var(--accent)] via-[var(--amber)] to-[var(--emerald)]" />

      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-tertiary)]">
            GitHub Auth
          </p>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
              用 GitHub 登录 NavSphere
            </h1>
            <p className="max-w-md text-sm leading-6 text-[var(--ink-secondary)]">
              当前项目只保留 GitHub 作为唯一登录方式。登录成功后，
              Supabase 会接管业务会话和数据权限。
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 text-sm leading-6 text-[var(--ink-secondary)]">
          <p>业务登录由 Supabase Auth 管理，GitHub 只是 OAuth Provider。</p>
          <p>
            登录完成后将返回：
            <span className="ml-1 font-medium text-[var(--ink)]">{next}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={signInWithGitHub}
          disabled={!isConfigured || isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 .5C5.65.5.5 5.8.5 12.35c0 5.24 3.3 9.68 7.88 11.25.58.11.79-.26.79-.58 0-.29-.01-1.25-.02-2.27-3.2.71-3.88-1.4-3.88-1.4-.52-1.37-1.28-1.73-1.28-1.73-1.04-.73.08-.72.08-.72 1.16.08 1.76 1.23 1.76 1.23 1.02 1.82 2.69 1.29 3.34.99.1-.76.4-1.28.72-1.58-2.55-.3-5.23-1.31-5.23-5.84 0-1.29.45-2.35 1.19-3.18-.12-.3-.52-1.5.11-3.12 0 0 .98-.32 3.2 1.21a10.8 10.8 0 0 1 5.82 0c2.22-1.53 3.2-1.21 3.2-1.21.63 1.62.23 2.82.11 3.12.74.83 1.19 1.89 1.19 3.18 0 4.54-2.68 5.54-5.24 5.84.41.36.77 1.05.77 2.12 0 1.53-.01 2.75-.01 3.12 0 .32.21.7.8.58 4.57-1.57 7.86-6.01 7.86-11.25C23.5 5.8 18.35.5 12 .5Z" />
          </svg>
          {isSubmitting ? "跳转到 GitHub 中..." : "继续使用 GitHub"}
        </button>

        {!isConfigured && (
          <p className="text-sm text-amber-700">
            当前未配置 Supabase。请先配置 `.env.local` 和 Supabase GitHub Provider。
          </p>
        )}

        {message && (
          <p className="rounded-2xl border border-amber-200 bg-[var(--amber-soft)] px-4 py-3 text-sm text-amber-800">
            {message}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-[var(--ink-secondary)]">
          <Link href="/" className="transition hover:text-[var(--ink)]">
            返回首页
          </Link>
          <span>Next.js + Supabase Auth</span>
        </div>
      </div>
    </div>
  );
}
