import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { AdminSignOutButton } from "@/components/admin/admin-sign-out-button";
import { hasSupabaseEnv } from "@/lib/env";
import { getOptionalCurrentUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!hasSupabaseEnv) {
    return (
      <div className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--ink)] sm:px-6">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.06)]">
          <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-tertiary)]">
            Admin
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">
            后台暂时不可用
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--ink-secondary)]">
            当前未检测到 Supabase 环境变量，后台与前台的数据写入能力都会受到影响。请先补齐环境配置后再使用用户自管后台。
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            返回前台
          </Link>
        </div>
      </div>
    );
  }

  const user = await getOptionalCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-[32px] bg-[linear-gradient(180deg,#f3f1eb_0%,#f8f7f4_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] lg:flex lg:flex-col">
          <Link href="/" className="flex items-center gap-3 rounded-2xl px-3 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-sm font-bold text-white shadow-[0_16px_30px_rgba(13,148,136,0.25)]">
              N
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">NavSphere</div>
              <div className="text-xs text-[var(--ink-tertiary)]">
                用户自管后台
              </div>
            </div>
          </Link>

          <div className="mt-6 flex-1">
            <AdminSidebarNav />
          </div>

          <div className="rounded-[24px] border border-white/70 bg-white/70 p-4 backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-tertiary)]">
              当前账号
            </div>
            <div className="mt-2 text-sm font-medium">{user.email ?? "已登录用户"}</div>
            <p className="mt-2 text-xs leading-6 text-[var(--ink-secondary)]">
              你只能管理自己的分类与链接数据，公开能力仍遵循当前 RLS 规则。
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="rounded-[32px] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(244,247,246,0.98))] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-[var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-tertiary)]">
                  Workspace
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight">
                  维护你的导航数据
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--ink-secondary)]">
                  在这里管理分类、链接和批量导入数据。分类名中的
                  {" "}
                  <span className="font-medium text-[var(--ink)]">/</span>
                  {" "}
                  会直接影响前台侧边栏分组展示，但不会创建真实树结构。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--ink-tertiary)]">
                    当前登录
                  </div>
                  <div className="mt-1 font-medium">{user.email ?? "已登录用户"}</div>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                >
                  返回前台
                </Link>
                <AdminSignOutButton />
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-dashed border-[var(--border)] bg-white/70 p-3 lg:hidden">
              <AdminSidebarNav />
            </div>
          </header>

          <main className="py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
