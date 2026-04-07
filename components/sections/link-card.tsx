import type { NavLink } from '@/lib/types'

type LinkCardProps = {
  link: NavLink
  styleDelay?: number
}

const envMap = {
  prod: { label: '生产', tone: 'bg-[rgba(15,118,110,0.12)] text-[var(--page-brand)]' },
  test: { label: '测试', tone: 'bg-[rgba(245,158,11,0.14)] text-[#a16207]' },
} as const

export function LinkCard({ link, styleDelay = 0 }: LinkCardProps) {
  const avatarStyle = link.icon
    ? { backgroundImage: `url(${link.icon})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className="link-card-enter group rounded-[1.5rem] border border-[var(--page-line)] bg-white/75 p-4 transition hover:-translate-y-0.5 hover:border-[rgba(15,118,110,0.32)] hover:bg-white"
      style={{ animationDelay: `${styleDelay}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--page-line)] bg-[var(--page-brand-soft)] text-lg font-semibold uppercase text-[var(--page-brand)]"
            style={avatarStyle}
          >
            {!link.icon ? link.name.slice(0, 1) : ''}
          </div>
          <div>
            <p className="text-lg font-semibold tracking-[-0.03em]">{link.name}</p>
            <p className="mt-1 font-mono text-xs text-[var(--page-muted)]">{link.url}</p>
          </div>
        </div>
        <span className="text-lg text-[var(--page-muted)] transition group-hover:translate-x-0.5">
          ↗
        </span>
      </div>
      {link.description ? (
        <p className="mt-4 text-sm leading-6 text-[var(--page-muted)]">{link.description}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium">
        <span className={`rounded-full px-2.5 py-1 ${envMap[link.env].tone}`}>
          {envMap[link.env].label}
        </span>
        <span className="rounded-full border border-[var(--page-line)] px-2.5 py-1 text-[var(--page-muted)]">
          {link.isPublic ? '公开可见' : '私有'}
        </span>
      </div>
    </a>
  )
}

