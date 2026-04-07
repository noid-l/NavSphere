'use client'

import { useDeferredValue, useState, useTransition } from 'react'

import { useDebouncedValue } from '@/lib/hooks/use-debounced-value'
import type { NavigationSnapshot } from '@/lib/types'

import { AiImportPanel } from './panels/ai-import-panel'
import { AuthPanel } from './panels/auth-panel'
import { SearchBar } from './search-bar'
import { CategoryList } from './sections/category-list'

type NavigationShellProps = {
  snapshot: NavigationSnapshot
  initialUserEmail: string | null
}

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase()
}

export function NavigationShell({
  snapshot,
  initialUserEmail,
}: NavigationShellProps) {
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const debouncedQuery = useDebouncedValue(query, 300)
  const deferredQuery = useDeferredValue(debouncedQuery)
  const keyword = normalizeKeyword(deferredQuery)

  const filteredGroups = !keyword
    ? snapshot.groups
    : snapshot.groups
        .map((group) => ({
          ...group,
          links: group.links.filter((link) => {
            const haystack = [
              group.category.name,
              group.category.description ?? '',
              link.name,
              link.description ?? '',
              link.url,
            ]
              .join(' ')
              .toLowerCase()

            return haystack.includes(keyword)
          }),
        }))
        .filter((group) => group.links.length > 0)

  const totalVisibleLinks = filteredGroups.reduce(
    (total, group) => total + group.links.length,
    0,
  )

  return (
    <main className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 grid-fade" />
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="surface-card relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10">
          <div className="absolute inset-y-0 right-0 hidden w-80 bg-[radial-gradient(circle_at_center,rgba(15,118,110,0.16),transparent_68%)] lg:block" />
          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--page-line)] bg-[var(--page-surface-strong)] px-3 py-1 text-xs font-medium uppercase tracking-[0.28em] text-[var(--page-muted)]">
                Dev Navigation OS
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
                  把项目入口、开发工具和 AI 工作台整理成一个可被人和模型同时使用的导航层。
                </h1>
                <p className="max-w-2xl text-balance text-sm leading-7 text-[var(--page-muted)] sm:text-base">
                  NavSphere 以 Next.js 驱动前端，以 Supabase 承担数据、认证与权限控制。
                  现在就能搜索、分类浏览，并通过 AI JSON 一键写入导航数据。
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="分类数" value={String(snapshot.totalCategories)} />
                <StatCard label="链接数" value={String(snapshot.totalLinks)} />
                <StatCard
                  label="数据源"
                  value={snapshot.source === 'supabase' ? 'Supabase' : 'Demo'}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <AuthPanel
                initialUserEmail={initialUserEmail}
                isConfigured={snapshot.isConfigured}
              />
              <div className="rounded-[1.5rem] border border-[var(--page-line)] bg-[rgba(255,255,255,0.7)] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--page-muted)]">当前状态</p>
                    <p className="mt-1 text-lg font-semibold">
                      {snapshot.isConfigured ? 'Supabase 已接入' : '演示模式'}
                    </p>
                  </div>
                  <div className="rounded-full bg-[var(--page-brand-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--page-brand)]">
                    {snapshot.isConfigured ? 'Live Data' : 'Starter Mode'}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--page-muted)]">
                  {!snapshot.isConfigured
                    ? '填入 `.env.local` 中的 Supabase 地址与匿名 Key 后，页面会切换为真实数据读取。'
                    : '匿名访问只会看到公开数据，登录后可读取和维护自己的私有导航。'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
          <div className="space-y-5">
            <SearchBar
              query={query}
              isPending={isPending}
              totalVisibleLinks={totalVisibleLinks}
              onQueryChange={(nextQuery) => {
                startTransition(() => {
                  setQuery(nextQuery)
                })
              }}
            />
            <CategoryList groups={filteredGroups} keyword={keyword} />
          </div>
          <div className="space-y-5">
            <AiImportPanel
              isConfigured={snapshot.isConfigured}
              initialUserEmail={initialUserEmail}
            />
            <aside className="surface-card rounded-[1.75rem] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--page-muted)]">
                工作流
              </p>
              <ol className="mt-4 space-y-4 text-sm leading-6 text-[var(--page-muted)]">
                <li>
                  1. AI 产出固定 JSON。
                </li>
                <li>
                  2. 前端或 `POST /api/ai-import` 提交给 Supabase。
                </li>
                <li>
                  3. RLS 控制可见范围，页面刷新后立刻生效。
                </li>
              </ol>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-[var(--page-line)] bg-[rgba(255,255,255,0.72)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--page-muted)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">{value}</p>
    </div>
  )
}
