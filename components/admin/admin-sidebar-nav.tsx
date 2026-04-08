"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin" as Route, label: "概览", exact: true },
  { href: "/admin/categories" as Route, label: "分类管理" },
  { href: "/admin/links" as Route, label: "链接管理" },
  { href: "/admin/import" as Route, label: "数据导入" },
];

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1" aria-label="后台导航">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
              isActive
                ? "bg-[var(--ink)] text-white shadow-[0_12px_30px_rgba(15,23,42,0.14)]"
                : "text-[var(--ink-secondary)] hover:bg-white hover:text-[var(--ink)]"
            }`}
          >
            <span>{item.label}</span>
            <span className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-white/70" : "bg-[var(--border)]"}`} />
          </Link>
        );
      })}
    </nav>
  );
}
