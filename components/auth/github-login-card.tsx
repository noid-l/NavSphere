"use client";

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
    <div className="login-card w-full max-w-sm space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
          登录到 NavSphere
        </h2>
        <p className="text-sm leading-6 text-[var(--ink-secondary)]">
          使用 GitHub 账号安全登录，管理你的导航数据。
        </p>
      </div>

      {/* GitHub Button */}
      <button
        type="button"
        onClick={signInWithGitHub}
        disabled={!isConfigured || isSubmitting}
        className="login-btn flex w-full items-center justify-center gap-3 rounded-xl bg-[var(--ink)] px-5 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#2d2d2d] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 .5C5.65.5.5 5.8.5 12.35c0 5.24 3.3 9.68 7.88 11.25.58.11.79-.26.79-.58 0-.29-.01-1.25-.02-2.27-3.2.71-3.88-1.4-3.88-1.4-.52-1.37-1.28-1.73-1.28-1.73-1.04-.73.08-.72.08-.72 1.16.08 1.76 1.23 1.76 1.23 1.02 1.82 2.69 1.29 3.34.99.1-.76.4-1.28.72-1.58-2.55-.3-5.23-1.31-5.23-5.84 0-1.29.45-2.35 1.19-3.18-.12-.3-.52-1.5.11-3.12 0 0 .98-.32 3.2 1.21a10.8 10.8 0 0 1 5.82 0c2.22-1.53 3.2-1.21 3.2-1.21.63 1.62.23 2.82.11 3.12.74.83 1.19 1.89 1.19 3.18 0 4.54-2.68 5.54-5.24 5.84.41.36.77 1.05.77 2.12 0 1.53-.01 2.75-.01 3.12 0 .32.21.7.8.58 4.57-1.57 7.86-6.01 7.86-11.25C23.5 5.8 18.35.5 12 .5Z" />
        </svg>
        {isSubmitting ? "正在跳转..." : "使用 GitHub 登录"}
      </button>

      {/* Error Messages */}
      {!isConfigured && (
        <p className="text-sm text-[var(--amber)]">
          当前未配置 Supabase。请先配置 .env.local 和 Supabase GitHub
          Provider。
        </p>
      )}

      {message && (
        <div className="rounded-xl border border-[var(--amber)]/20 bg-[var(--amber-soft)] px-4 py-3 text-sm text-[var(--amber)]">
          {message}
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-xs text-[var(--ink-tertiary)]">
        登录即表示你同意将 GitHub 账号关联至 NavSphere
      </p>
    </div>
  );
}
