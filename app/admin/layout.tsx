import Link from "next/link";

import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { AdminSignOutButton } from "@/components/admin/admin-sign-out-button";
import { hasSupabaseEnv } from "@/lib/env";
import { getRequiredCurrentUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!hasSupabaseEnv) {
    return (
      <div className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--ink)] sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
          <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--ink-tertiary)]">
            Admin
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">
            后台暂时不可用
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--ink-secondary)]">
            当前未检测到 Supabase
            环境变量，后台与前台的数据写入能力都会受到影响。请先补齐环境配置后再使用用户自管后台。
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

  const user = await getRequiredCurrentUser();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        {/* ---------- Desktop Sidebar ---------- */}
        <aside className="admin-sidebar-glow hidden w-[260px] shrink-0 bg-[#13131a] lg:flex lg:flex-col">
          {/* Logo */}
          <div className="px-5 pt-6 pb-4">
            <Link
              href="/"
              className="flex items-center gap-3 group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition-transform group-hover:scale-105">
                N
              </div>
              <div>
                <div className="text-sm font-semibold text-white tracking-tight group-hover:text-teal-300 transition-colors">
                  NavSphere
                </div>
                <div className="text-[11px] text-[#5e5e6e]">管理控制台</div>
              </div>
            </Link>
          </div>

          {/* Separator */}
          <div className="mx-5 h-px bg-white/[0.06]" />

          {/* Navigation */}
          <nav className="flex-1 px-3 pt-4">
            <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4a4a5a]">
              导航
            </div>
            <AdminSidebarNav />
          </nav>

          {/* User Card */}
          <div className="p-3">
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400/20 to-teal-600/20 text-xs font-bold text-teal-400">
                  {(user.email ?? "U")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-white">
                    {user.email ?? "已登录用户"}
                  </div>
                  <div className="text-[11px] text-[#5e5e6e]">
                    仅管理自己的数据
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ---------- Main Content ---------- */}
        <div className="min-w-0 flex-1">
          {/* Top Header */}
          <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/80 backdrop-blur-xl">
            <div className="flex items-center justify-between px-6 py-3">
              <div>
                <h1 className="text-base font-semibold tracking-tight">
                  维护你的导航数据
                </h1>
                <p className="text-xs text-[var(--ink-secondary)]">
                  管理分类、链接和批量导入数据
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-medium text-[var(--ink-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 13L1 8l5-5M1 8h14" />
                  </svg>
                  返回前台
                </Link>
                <AdminSignOutButton />
              </div>
            </div>

            {/* Mobile Nav */}
            <div className="border-t border-[var(--border)] px-3 py-2 lg:hidden">
              <AdminSidebarNav />
            </div>
          </header>

          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
