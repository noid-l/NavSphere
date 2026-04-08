import Link from "next/link";
import type { Route } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRequiredCurrentUser } from "@/lib/supabase/auth";
import {
  getAdminOverviewStats,
  listAdminCategoryOptions,
} from "@/lib/data/admin";

function formatDateTime(value: string | null) {
  if (!value) {
    return "暂无数据";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminOverviewPage() {
  const user = await getRequiredCurrentUser();
  const supabase = await createServerSupabaseClient();

  const userId = user.id;

  const [stats, categories] = await Promise.all([
    getAdminOverviewStats(supabase, userId),
    listAdminCategoryOptions(supabase, userId),
  ]);

  const cards = [
    {
      label: "分类数",
      value: stats.totalCategories,
      hint: "用于组织前台区块顺序",
      color: "teal" as const,
    },
    {
      label: "链接数",
      value: stats.totalLinks,
      hint: "支持在所属分类内排序",
      color: "blue" as const,
    },
    {
      label: "空分类",
      value: stats.emptyCategories,
      hint: "空分类不会在前台展示",
      color: "amber" as const,
    },
    {
      label: "未公开链接",
      value: stats.privateLinks,
      hint: "仅当前用户可见",
      color: "slate" as const,
    },
  ];

  const colorMap = {
    teal: "from-teal-50/80 to-transparent",
    blue: "from-blue-50/80 to-transparent",
    amber: "from-amber-50/80 to-transparent",
    slate: "from-slate-100/80 to-transparent",
  };

  const dotColorMap = {
    teal: "bg-teal-400",
    blue: "bg-blue-400",
    amber: "bg-amber-400",
    slate: "bg-slate-400",
  };

  const quickActions = [
    {
      href: "/admin/categories",
      title: "新建分类",
      description: "维护名称、公开状态和排序值。",
      iconPath: "M9 3v12M3 9h12",
    },
    {
      href: "/admin/links",
      title: "新建链接",
      description: "录入 URL、所属分类和环境信息。",
      iconPath: "M7.8 10.2a3.2 3.2 0 0 0 4.5 0l1.8-1.8a3.2 3.2 0 0 0-4.5-4.5L8.4 5.1 M10.2 7.8a3.2 3.2 0 0 0-4.5 0L3.9 9.6a3.2 3.2 0 0 0 4.5 4.5L9.6 12.9",
    },
    {
      href: "/admin/import",
      title: "导入数据",
      description: "粘贴 JSON 或上传文件后批量写入。",
      iconPath: "M9 12V3M9 3L6.5 5.5M9 3l2.5 2.5 M3 12v2.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V12",
    },
    {
      href: "/admin/categories",
      title: "继续排序",
      description: "拖拽分类顺序并同步到前台展示。",
      iconPath: "M3 6h12M3 12h12",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ---------- Stats Grid ---------- */}
      <section className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <article
            key={card.label}
            className="admin-card-enter group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-5"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dotColorMap[card.color]}`} />
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-tertiary)]">
                  {card.label}
                </div>
              </div>
              <div className="mt-3 text-[36px] font-bold tracking-tight leading-none tabular-nums">
                {card.value}
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--ink-secondary)]">
                {card.hint}
              </p>
            </div>
            <div className={`absolute -top-6 -right-6 h-28 w-28 rounded-full bg-gradient-to-br ${colorMap[card.color]} opacity-60 transition-opacity group-hover:opacity-100`} />
          </article>
        ))}
      </section>

      {/* ---------- Quick Actions + Status ---------- */}
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-tertiary)]">
                快捷入口
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                开始维护导航内容
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--ink-secondary)]">
                分类排序会同步影响前台主内容区与侧边栏顺序；路径式分类名会同步影响前台分组展示。
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-xs text-[var(--ink-secondary)] whitespace-nowrap">
              最近更新：{formatDateTime(stats.recentUpdatedAt)}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href as Route}
                className="group flex items-start gap-3 rounded-xl border border-[var(--border)] bg-white p-4 transition-all duration-200 hover:border-[var(--border-hover)] hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-100">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    {action.iconPath.split(" M").map((d, i) => (
                      <path key={i} d={i === 0 ? d : `M${d}`} />
                    ))}
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{action.title}</div>
                  <p className="mt-1 text-xs leading-5 text-[var(--ink-secondary)]">
                    {action.description}
                  </p>
                  <div className="mt-2 text-[11px] font-semibold text-[var(--accent)] transition-transform group-hover:translate-x-0.5">
                    前往 →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-tertiary)]">
            数据状态
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            当前数据概览
          </h2>

          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">空分类数量</div>
                <div className="text-lg font-bold tabular-nums">
                  {stats.emptyCategories}
                </div>
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--ink-secondary)]">
                空分类允许存在，但当前前台不会渲染没有链接的分类区块。
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">未公开链接数量</div>
                <div className="text-lg font-bold tabular-nums">
                  {stats.privateLinks}
                </div>
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--ink-secondary)]">
                保持私有的链接只会在你自己的导航空间中可见。
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] p-4">
            <div className="text-sm font-medium">分类命名预览</div>
            <p className="mt-2 text-xs leading-5 text-[var(--ink-secondary)]">
              当前共有 {categories.length} 个分类。像
              <span className="font-medium text-[var(--ink)]">
                {" "}研发 / AI工具{" "}
              </span>
              这样的名称会在前台侧边栏显示为"研发"分组下的"AI工具"。
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
