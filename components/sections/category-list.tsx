import type { CategoryGroup } from '@/lib/types'

import { LinkCard } from './link-card'

type CategoryListProps = {
  groups: CategoryGroup[]
  keyword: string
}

export function CategoryList({ groups, keyword }: CategoryListProps) {
  if (groups.length === 0) {
    return (
      <section className="surface-card rounded-[1.75rem] p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--page-muted)]">
          No Match
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
          没找到匹配项
        </h3>
        <p className="mt-3 text-sm leading-6 text-[var(--page-muted)]">
          {keyword
            ? `当前关键词“${keyword}”没有命中任何导航，试试项目简称、域名或环境名。`
            : '还没有导航数据。'}
        </p>
      </section>
    )
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.category.id} className="surface-card rounded-[1.75rem] p-5">
          <div className="flex flex-col gap-2 border-b border-[var(--page-line)] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--page-muted)]">
                Category
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                {group.category.name}
              </h3>
              {group.category.description ? (
                <p className="mt-2 text-sm leading-6 text-[var(--page-muted)]">
                  {group.category.description}
                </p>
              ) : null}
            </div>
            <div className="rounded-full border border-[var(--page-line)] bg-[var(--page-surface-strong)] px-3 py-1 text-xs font-medium text-[var(--page-muted)]">
              {group.links.length} 个入口
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {group.links.map((link, index) => (
              <LinkCard key={link.id} link={link} styleDelay={index * 60} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

