import { redirect } from "next/navigation";
import Link from "next/link";

import { GitHubLoginCard } from "@/components/auth/github-login-card";
import { hasSupabaseEnv } from "@/lib/env";
import { getOptionalCurrentUser } from "@/lib/supabase/auth";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
  }>;
};

function getSafeNext(value?: string | string[]) {
  const next = Array.isArray(value) ? value[0] : value;

  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";

  return next;
}

function getSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [resolvedSearchParams, user] = await Promise.all([
    searchParams,
    getOptionalCurrentUser(),
  ]);

  const next = getSafeNext(resolvedSearchParams.next);
  const errorCode = getSingleValue(resolvedSearchParams.error);

  if (user) {
    redirect(next as Parameters<typeof redirect>[0]);
  }

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
      {/* ── Left: Dark Brand Panel ── */}
      <div className="login-brand relative hidden overflow-hidden bg-[#0a0c10] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Decorative orbits */}
        <div className="orbit-ring orbit-ring-1" />
        <div className="orbit-ring orbit-ring-2" />
        <div className="orbit-ring orbit-ring-3" />
        <div className="orbit-center" />
        <div className="orbit-grid" />

        {/* Content */}
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-[var(--accent)] shadow-[0_0_20px_rgba(13,148,136,0.5)]" />
            <span className="text-lg font-semibold tracking-tight">
              NavSphere
            </span>
          </div>

          <h1 className="max-w-lg text-5xl font-bold leading-[1.08] tracking-[-0.04em] xl:text-6xl">
            导航你的
            <br />
            <span className="text-[var(--accent)]">开发者世界</span>
          </h1>

          <p className="max-w-md text-[15px] leading-7 text-white/45">
            登录后即可管理导航书签与项目集合。
            <br />
            使用 GitHub 账号快速开始。
          </p>
        </div>

        {/* Bottom tech stack */}
        <div className="relative z-10 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/20">
          <span>Supabase</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span>GitHub</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span>Vercel</span>
        </div>
      </div>

      {/* ── Right: Login Form Panel ── */}
      <div
        className="relative flex flex-col items-center justify-center px-6 py-12 lg:px-12 xl:px-16"
        style={{ background: "var(--bg)" }}
      >
        {/* Mobile brand header */}
        <h1 className="mb-12 flex items-center gap-2.5 text-lg font-semibold tracking-tight text-[var(--ink)] lg:hidden">
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
          NavSphere
        </h1>

        <GitHubLoginCard
          isConfigured={hasSupabaseEnv}
          next={next}
          errorCode={errorCode}
        />

        <Link
          href="/"
          className="mt-10 text-sm text-[var(--ink-tertiary)] transition-colors hover:text-[var(--ink)]"
        >
          ← 返回首页
        </Link>
      </div>
    </main>
  );
}
