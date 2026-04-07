type SearchBarProps = {
  query: string
  isPending: boolean
  totalVisibleLinks: number
  onQueryChange: (value: string) => void
}

export function SearchBar({
  query,
  isPending,
  totalVisibleLinks,
  onQueryChange,
}: SearchBarProps) {
  return (
    <section className="surface-card rounded-[1.75rem] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--page-muted)]">
            Search
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            快速定位你要的入口
          </h2>
        </div>
        <div className="rounded-full border border-[var(--page-line)] bg-[var(--page-surface-strong)] px-3 py-1 text-xs font-medium text-[var(--page-muted)]">
          当前展示 {totalVisibleLinks} 个链接
        </div>
      </div>
      <label className="mt-5 block">
        <span className="sr-only">搜索导航</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="输入项目名、描述、地址或分类名"
          className="w-full rounded-[1.25rem] border border-[var(--page-line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--page-brand)] focus:ring-4 focus:ring-[rgba(15,118,110,0.12)]"
        />
      </label>
      <p className="mt-3 text-xs text-[var(--page-muted)]">
        支持模糊匹配。输入状态会平滑更新{isPending ? '，正在过滤...' : '。'}
      </p>
    </section>
  )
}

