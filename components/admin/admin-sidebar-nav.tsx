"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

/* ---------- Icons ---------- */

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="2.5" width="5.5" height="5.5" rx="1.5" />
      <rect x="10" y="2.5" width="5.5" height="5.5" rx="1.5" />
      <rect x="2.5" y="10" width="5.5" height="5.5" rx="1.5" />
      <rect x="10" y="10" width="5.5" height="5.5" rx="1.5" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 5.5A2 2 0 0 1 4.5 3.5H7.6L9.2 5.1H13.5A2 2 0 0 1 15.5 7.1V13.5A2 2 0 0 1 13.5 15.5H4.5A2 2 0 0 1 2.5 13.5V5.5Z" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.8 10.2a3.2 3.2 0 0 0 4.5 0l1.8-1.8a3.2 3.2 0 0 0-4.5-4.5L8.4 5.1" />
      <path d="M10.2 7.8a3.2 3.2 0 0 0-4.5 0L3.9 9.6a3.2 3.2 0 0 0 4.5 4.5L9.6 12.9" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12V3M9 3L6.5 5.5M9 3l2.5 2.5" />
      <path d="M3 12v2.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V12" />
    </svg>
  );
}

/* ---------- Nav Config ---------- */

const navItems = [
  {
    href: "/admin" as Route,
    label: "概览",
    icon: IconDashboard,
    exact: true,
  },
  {
    href: "/admin/categories" as Route,
    label: "分类管理",
    icon: IconFolder,
    exact: false,
  },
  {
    href: "/admin/links" as Route,
    label: "链接管理",
    icon: IconLink,
    exact: false,
  },
  {
    href: "/admin/import" as Route,
    label: "数据导入",
    icon: IconUpload,
    exact: false,
  },
];

/* ---------- Component ---------- */

export function AdminSidebarNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<Route | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    for (const item of navItems) {
      router.prefetch(item.href);
    }
  }, [router]);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  function handleNavigate(href: Route) {
    if (pathname === href) {
      return;
    }

    setPendingHref(href);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <nav className="space-y-0.5" aria-label="后台导航">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const isNavigating = isPending && pendingHref === item.href;
        const Icon = item.icon;

        return (
          <button
            key={item.href}
            type="button"
            onClick={() => handleNavigate(item.href)}
            disabled={isNavigating}
            aria-busy={isNavigating}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-150 admin-nav-link ${isActive ? "admin-nav-active" : ""} ${isNavigating ? "cursor-wait opacity-90" : ""}`}
          >
            <span className="icon-wrap">
              {isNavigating ? (
                <span className="inline-block h-[18px] w-[18px] animate-spin rounded-full border-2 border-current border-r-transparent" />
              ) : (
                <Icon />
              )}
            </span>
            <span className="flex-1">{isNavigating ? "切换中..." : item.label}</span>
            {(isActive || isNavigating) && (
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
