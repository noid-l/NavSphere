import { redirect } from "next/navigation";

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

  if (!next) {
    return "/";
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(217,119,6,0.12),_transparent_24%),var(--bg)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--ink-tertiary)]">
              Unified Sign-In
            </p>
            <div className="space-y-4">
              <h2 className="max-w-2xl text-5xl font-semibold tracking-[-0.06em] text-[var(--ink)] sm:text-6xl">
                一个登录入口，解决导航数据的全部编辑权限。
              </h2>
              <p className="max-w-2xl text-base leading-8 text-[var(--ink-secondary)]">
                这个项目把业务身份统一收敛到 Supabase Auth，GitHub 只作为唯一
                OAuth 登录来源。Vercel 负责部署，不负责站内用户会话。
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-5 backdrop-blur">
              <p className="text-sm font-semibold text-[var(--ink)]">
                只保留 GitHub
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-secondary)]">
                不再维护邮箱魔法链接和双入口，减少回调配置复杂度。
              </p>
            </div>
            <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-5 backdrop-blur">
              <p className="text-sm font-semibold text-[var(--ink)]">
                Supabase 管会话
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-secondary)]">
                导入和写入权限继续沿用现有 RLS，不需要重做数据权限模型。
              </p>
            </div>
            <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-5 backdrop-blur">
              <p className="text-sm font-semibold text-[var(--ink)]">
                Vercel 管部署
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-secondary)]">
                除非额外开启部署保护，否则访问站点不需要第二次登录。
              </p>
            </div>
          </div>
        </section>

        <GitHubLoginCard
          isConfigured={hasSupabaseEnv}
          next={next}
          errorCode={errorCode}
        />
      </div>
    </main>
  );
}
