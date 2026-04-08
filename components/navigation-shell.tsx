"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import type { NavigationSnapshot } from "@/lib/types";

import { DataImportPanel } from "./panels/data-import-panel";
import { AuthPanel } from "./panels/auth-panel";
import { SearchBar } from "./search-bar";
import { CategorySidebar } from "./sections/category-sidebar";
import { CategoryList } from "./sections/category-list";

type NavigationShellProps = {
  snapshot: NavigationSnapshot;
  initialUserEmail: string | null;
};

const loginRoute = "/login" as Route;

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase();
}

export function NavigationShell({
  snapshot,
  initialUserEmail,
}: NavigationShellProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [activeDrawer, setActiveDrawer] = useState<
    "auth" | "import" | null
  >(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    null,
  );
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebouncedValue(query, 300);
  const deferredQuery = useDeferredValue(debouncedQuery);
  const keyword = normalizeKeyword(deferredQuery);

  const filteredGroups = !keyword
    ? snapshot.groups
    : snapshot.groups
        .map((group) => ({
          ...group,
          links: group.links.filter((link) => {
            const haystack = [
              group.category.name,
              group.category.description ?? "",
              link.name,
              link.description ?? "",
              link.url,
            ]
              .join(" ")
              .toLowerCase();

            return haystack.includes(keyword);
          }),
        }))
        .filter((group) => group.links.length > 0);

  const totalVisibleLinks = filteredGroups.reduce(
    (total, group) => total + group.links.length,
    0,
  );

  const hasSidebar = snapshot.groups.length > 1;

  // ⌘K → focus search, Esc → close drawer/sidebar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setActiveDrawer(null);
        setMobileSidebar(false);
        searchRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // IntersectionObserver — track which category section is visible
  useEffect(() => {
    if (!hasSidebar) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategoryId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    const sections = document.querySelectorAll(
      "section[id]",
    ) as NodeListOf<HTMLElement>;
    for (const section of sections) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, [hasSidebar, filteredGroups]);

  function handleSidebarNavigate(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileSidebar(false);
  }

  return (
    <>
      {/* ── sticky header ── */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* mobile sidebar toggle */}
          {hasSidebar && (
            <button
              type="button"
              onClick={() => setMobileSidebar(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--ink-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] lg:hidden"
              title="分类导航"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}

          {/* logo */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)] text-xs font-bold text-white">
              N
            </div>
            <span className="text-[15px] font-bold tracking-tight">
              NavSphere
            </span>
          </div>

          {/* search */}
          <div className="mx-auto w-full max-w-lg">
            <SearchBar
              ref={searchRef}
              query={query}
              isPending={isPending}
              onQueryChange={(v) => startTransition(() => setQuery(v))}
            />
          </div>

          {/* right actions */}
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-1 text-[11px] text-[var(--ink-tertiary)] sm:flex">
              <span className="font-medium text-[var(--ink-secondary)]">
                {snapshot.totalCategories}
              </span>{" "}
              分类 ·{" "}
              <span className="font-medium text-[var(--ink-secondary)]">
                {totalVisibleLinks}
              </span>{" "}
              链接
            </span>

            {/* import — only shown for logged-in users */}
            {initialUserEmail && (
              <>
                <button
                  type="button"
                  onClick={() => router.push("/admin" as Route)}
                  className="hidden h-8 items-center justify-center rounded-lg border border-[var(--border)] px-2.5 text-sm text-[var(--ink-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] sm:flex"
                  title="进入后台"
                >
                  后台
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDrawer("import")}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--ink-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                  title="导入数据"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </button>
              </>
            )}

            {/* auth */}
            <button
              type="button"
              onClick={() => {
                if (initialUserEmail) {
                  setActiveDrawer("auth");
                  return;
                }

                router.push(loginRoute);
              }}
              className="flex h-8 items-center justify-center rounded-lg border border-[var(--border)] px-2.5 text-sm text-[var(--ink-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
              title="账户"
            >
              {initialUserEmail ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--emerald)]" />
                  <span className="hidden max-w-[100px] truncate sm:inline">
                    {initialUserEmail}
                  </span>
                </span>
              ) : (
                "登录"
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── body: sidebar + main ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-0 lg:gap-8">
          {/* desktop sidebar */}
          {hasSidebar && (
            <aside className="hidden w-52 shrink-0 lg:block">
              <CategorySidebar
                groups={snapshot.groups}
                activeId={activeCategoryId}
                onNavigate={handleSidebarNavigate}
              />
            </aside>
          )}

          {/* main content */}
          <main className="min-w-0 flex-1 py-8">
            {snapshot.source === "error" && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                当前无法从 Supabase 读取导航数据。
                {snapshot.errorMessage ? ` ${snapshot.errorMessage}` : ""}
              </div>
            )}

            <CategoryList groups={filteredGroups} keyword={keyword} />
          </main>
        </div>
      </div>

      {/* ── mobile sidebar overlay ── */}
      {mobileSidebar && (
        <>
          <div
            className="cat-sidebar-overlay"
            onClick={() => setMobileSidebar(false)}
          />
          <div className="cat-sidebar-mobile">
            <div className="cat-sidebar-mobile-header">
              <span className="cat-sidebar-mobile-title">分类导航</span>
              <button
                type="button"
                onClick={() => setMobileSidebar(false)}
                className="cat-sidebar-mobile-close"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <CategorySidebar
              groups={snapshot.groups}
              activeId={activeCategoryId}
              onNavigate={handleSidebarNavigate}
            />
          </div>
        </>
      )}

      {/* ── drawer overlay ── */}
      {activeDrawer && (
        <>
          {/* backdrop */}
          <div
            className="fade-in fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={() => setActiveDrawer(null)}
          />

          {/* panel */}
          <div className="slide-in-right fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
              <h2 className="text-sm font-semibold">
                {activeDrawer === "auth" ? "账户" : "导入数据"}
              </h2>
              <button
                type="button"
                onClick={() => setActiveDrawer(null)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-tertiary)] transition-colors hover:bg-gray-100 hover:text-[var(--ink)]"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {activeDrawer === "auth" ? (
                <AuthPanel
                  initialUserEmail={initialUserEmail}
                  isConfigured={snapshot.isConfigured}
                />
              ) : (
                <DataImportPanel
                  initialUserEmail={initialUserEmail}
                  isConfigured={snapshot.isConfigured}
                />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
