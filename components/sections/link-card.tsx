import type { NavLink } from "@/lib/types";

type Accent = { main: string; soft: string };

type LinkCardProps = {
  link: NavLink;
  accent: Accent;
  styleDelay?: number;
};

const ENV_MAP = {
  prod: { label: "生产", color: "#059669" },
  test: { label: "测试", color: "#d97706" },
} as const;

function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//, "");
}

export function LinkCard({ link, accent, styleDelay = 0 }: LinkCardProps) {
  const env = ENV_MAP[link.env];

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className="card-enter group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 transition-all duration-200 hover:border-[var(--border-hover)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
      style={{ animationDelay: `${styleDelay}ms` }}
    >
      {/* avatar / favicon */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
        style={{
          backgroundColor: accent.soft,
          color: accent.main,
          ...(link.icon
            ? {
                backgroundImage: `url(${link.icon})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {}),
        }}
      >
        {!link.icon ? link.name.slice(0, 1) : ""}
      </div>

      {/* text */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{link.name}</span>
          {/* external arrow – visible on hover */}
          <svg
            className="shrink-0 text-[var(--ink-tertiary)] opacity-0 transition-opacity group-hover:opacity-100"
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </div>
        <p className="truncate font-mono text-[11px] text-[var(--ink-tertiary)]">
          {stripProtocol(link.url)}
        </p>
        {link.description && (
          <p className="mt-0.5 truncate text-xs text-[var(--ink-secondary)]">
            {link.description}
          </p>
        )}
      </div>

      {/* environment indicator */}
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: env.color }}
        title={env.label}
      />
    </a>
  );
}
