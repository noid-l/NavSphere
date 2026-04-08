import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
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
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;

  const [stats, categories] = await Promise.all([
    getAdminOverviewStats(supabase, userId),
    listAdminCategoryOptions(supabase, userId),
  ]);

  const cards = [
    { label: "分类数", value: stats.totalCategories, hint: "用于组织前台区块顺序" },
    { label: "链接数", value: stats.totalLinks, hint: "支持在所属分类内排序" },
    { label: "空分类", value: stats.emptyCategories, hint: "空分类不会在前台展示" },
    { label: "未公开链接", value: stats.privateLinks, hint: "仅当前用户可见" },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <article
            key={card.label}
            className="card-enter rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-[0_20px_40px_rgba(15,23,42,0.04)]"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-tertiary)]">
              {card.label}
            </div>
            <div className="mt-4 text-4xl font-semibold tracking-tight">
              {card.value}
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-secondary)]">
              {card.hint}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[30px] border border-[var(--border)] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-tertiary)]">
                快捷入口
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                开始维护导航内容
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--ink-secondary)]">
                分类排序会同步影响前台主内容区与侧边栏顺序；路径式分类名会同步影响前台分组展示。
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--ink-secondary)]">
              最近更新时间：{formatDateTime(stats.recentUpdatedAt)}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              {
                href: "/admin/categories",
                title: "新建分类",
                description: "维护名称、公开状态和排序值。",
              },
              {
                href: "/admin/links",
                title: "新建链接",
                description: "录入 URL、所属分类和环境信息。",
              },
              {
                href: "/admin/import",
                title: "导入数据",
                description: "粘贴 JSON 或上传文件后批量写入。",
              },
              {
                href: "/admin/categories",
                title: "继续排序",
                description: "拖拽分类顺序并同步到前台展示。",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href as Route}
                className="group rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#fbfbf8_100%)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--border-hover)] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
              >
                <div className="text-sm font-semibold">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-secondary)]">
                  {item.description}
                </p>
                <div className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  立即前往
                </div>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-[30px] border border-[var(--border)] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-tertiary)]">
            提醒信息
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            当前数据状态
          </h2>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="text-sm font-medium">空分类数量</div>
              <div className="mt-1 text-2xl font-semibold">
                {stats.emptyCategories}
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-secondary)]">
                空分类允许存在，但当前前台不会渲染没有链接的分类区块。
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="text-sm font-medium">未公开链接数量</div>
              <div className="mt-1 text-2xl font-semibold">
                {stats.privateLinks}
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-secondary)]">
                保持私有的链接只会在你自己的导航空间中可见。
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-dashed border-[var(--border)] p-4">
            <div className="text-sm font-medium">分类命名预览</div>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-secondary)]">
              当前共有 {categories.length} 个分类。像
              {" "}
              <span className="font-medium text-[var(--ink)]">研发 / AI工具</span>
              {" "}
              这样的名称会在前台侧边栏显示为“研发”分组下的“AI工具”。
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
