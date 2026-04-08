import type { CategoryGroup } from "@/lib/types";

import { LinkCard } from "./link-card";

const ACCENT_PALETTE = [
  { main: "#0d9488", soft: "#ecfdf5" },
  { main: "#6366f1", soft: "#eef2ff" },
  { main: "#e11d48", soft: "#fff1f2" },
  { main: "#d97706", soft: "#fffbeb" },
  { main: "#7c3aed", soft: "#f5f3ff" },
  { main: "#0284c7", soft: "#e0f2fe" },
  { main: "#be185d", soft: "#fdf2f8" },
  { main: "#059669", soft: "#ecfdf5" },
];

type CategoryListProps = {
  groups: CategoryGroup[];
  keyword: string;
};

export function CategoryList({ groups, keyword }: CategoryListProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
          🔍
        </div>
        <h3 className="text-lg font-semibold">没有匹配结果</h3>
        <p className="mt-2 max-w-sm text-sm text-[var(--ink-secondary)]">
          {keyword
            ? `"${keyword}" 未命中任何导航。试试项目简称、域名或环境名。`
            : "暂无导航数据。"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {groups.map((group, groupIndex) => {
        const accent = ACCENT_PALETTE[groupIndex % ACCENT_PALETTE.length];

        return (
          <section
            key={group.category.id}
            id={group.category.id}
            className="scroll-mt-20 lg:scroll-mt-24"
          >
            {/* category header */}
            <div className="mb-4 flex items-center gap-3">
              <div
                className="h-5 w-1 rounded-full"
                style={{ backgroundColor: accent.main }}
              />
              <h2 className="text-[15px] font-bold tracking-tight">
                {group.category.name}
              </h2>
              {group.category.description && (
                <>
                  <span className="text-[var(--ink-tertiary)]">·</span>
                  <span className="text-sm text-[var(--ink-secondary)]">
                    {group.category.description}
                  </span>
                </>
              )}
              <span className="ml-auto text-xs tabular-nums text-[var(--ink-tertiary)]">
                {group.links.length}
              </span>
            </div>

            {/* link grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.links.map((link, index) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  accent={accent}
                  styleDelay={index * 40}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
