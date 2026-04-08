"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  AdminCategoryOption,
  AdminLinkItem,
  LinkEnv,
} from "@/lib/types";

type AdminLinksManagerProps = {
  initialLinks: AdminLinkItem[];
  categoryOptions: AdminCategoryOption[];
};

type LinkFormState = {
  name: string;
  url: string;
  category_id: string;
  env: LinkEnv;
  description: string;
  icon: string;
  sort: string;
  is_public: boolean;
};

type DragState = {
  id: string;
  categoryId: string;
} | null;

const defaultLinkForm = (categoryId = ""): LinkFormState => ({
  name: "",
  url: "",
  category_id: categoryId,
  env: "prod",
  description: "",
  icon: "",
  sort: "",
  is_public: false,
});

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function arrayMove<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function sortLinks(items: AdminLinkItem[], categories: AdminCategoryOption[]) {
  const orderMap = new Map(categories.map((category, index) => [category.id, index]));
  const next = [...items];
  next.sort((left, right) => {
    const leftIndex = orderMap.get(left.categoryId) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = orderMap.get(right.categoryId) ?? Number.MAX_SAFE_INTEGER;

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    return left.sort - right.sort;
  });
  return next;
}

export function AdminLinksManager({
  initialLinks,
  categoryOptions,
}: AdminLinksManagerProps) {
  const router = useRouter();
  const [links, setLinks] = useState(sortLinks(initialLinks, categoryOptions));
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [visibility, setVisibility] = useState<"all" | "public" | "private">(
    "all",
  );
  const [env, setEnv] = useState<"all" | LinkEnv>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [isBatchMoving, setIsBatchMoving] = useState(false);
  const [dragging, setDragging] = useState<DragState>(null);
  const [dirtyCategoryIds, setDirtyCategoryIds] = useState<string[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminLinkItem | null>(null);
  const [form, setForm] = useState<LinkFormState>(
    defaultLinkForm(categoryOptions[0]?.id ?? ""),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const keyword = query.trim().toLowerCase();
  const canDrag = !keyword && visibility === "all" && env === "all";

  const filteredLinks = links.filter((item) => {
    if (categoryId !== "all" && item.categoryId !== categoryId) {
      return false;
    }

    if (visibility === "public" && !item.isPublic) {
      return false;
    }

    if (visibility === "private" && item.isPublic) {
      return false;
    }

    if (env !== "all" && item.env !== env) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    return [item.name, item.url, item.description ?? "", item.categoryName]
      .join(" ")
      .toLowerCase()
      .includes(keyword);
  });

  const groupedLinks = categoryOptions
    .filter((category) => categoryId === "all" || category.id === categoryId)
    .map((category) => ({
      category,
      links: filteredLinks.filter((item) => item.categoryId === category.id),
    }))
    .filter((section) => section.links.length > 0 || categoryId === section.category.id);

  function resetMessages() {
    setMessage(null);
    setError(null);
  }

  async function reloadLinks() {
    const response = await fetch("/api/admin/links");
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "链接列表刷新失败。");
      return;
    }

    setLinks(sortLinks(data.items as AdminLinkItem[], categoryOptions));
  }

  function openCreateSheet() {
    setEditingItem(null);
    setForm(defaultLinkForm(categoryOptions[0]?.id ?? ""));
    resetMessages();
    setIsSheetOpen(true);
  }

  function openEditSheet(item: AdminLinkItem) {
    setEditingItem(item);
    setForm({
      name: item.name,
      url: item.url,
      category_id: item.categoryId,
      env: item.env,
      description: item.description ?? "",
      icon: item.icon ?? "",
      sort: String(item.sort),
      is_public: item.isPublic,
    });
    resetMessages();
    setIsSheetOpen(true);
  }

  function closeSheet() {
    setIsSheetOpen(false);
    setEditingItem(null);
    setForm(defaultLinkForm(categoryOptions[0]?.id ?? ""));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();
    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        url: form.url,
        category_id: form.category_id,
        env: form.env,
        description: form.description,
        icon: form.icon,
        is_public: form.is_public,
      };

      if (form.sort.trim()) {
        payload.sort = Number(form.sort);
      }

      const endpoint = editingItem
        ? `/api/admin/links/${editingItem.id}`
        : "/api/admin/links";
      const method = editingItem ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "链接保存失败。");
        return;
      }

      await reloadLinks();
      setMessage(editingItem ? "链接已更新。" : "链接已创建。");
      setDirtyCategoryIds([]);
      setSelectedIds([]);
      closeSheet();
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(item: AdminLinkItem) {
    const confirmed = window.confirm(`确认删除链接“${item.name}”吗？`);
    if (!confirmed) {
      return;
    }

    resetMessages();
    const response = await fetch(`/api/admin/links/${item.id}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "链接删除失败。");
      return;
    }

    await reloadLinks();
    setSelectedIds((current) => current.filter((id) => id !== item.id));
    setMessage("链接已删除。");
    router.refresh();
  }

  async function handleSaveRowSort(item: AdminLinkItem) {
    resetMessages();

    const response = await fetch(`/api/admin/links/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sort: item.sort }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "排序值保存失败。");
      return;
    }

    await reloadLinks();
    setDirtyCategoryIds((current) =>
      current.filter((category) => category !== item.categoryId),
    );
    setMessage(`已保存链接“${item.name}”的排序值。`);
    router.refresh();
  }

  function handleDrop(targetCategoryId: string, targetLinkId: string) {
    if (
      !canDrag ||
      !dragging ||
      dragging.id === targetLinkId ||
      dragging.categoryId !== targetCategoryId
    ) {
      return;
    }

    setLinks((current) => {
      const categoryLinks = current
        .filter((item) => item.categoryId === targetCategoryId)
        .sort((left, right) => left.sort - right.sort);
      const fromIndex = categoryLinks.findIndex((item) => item.id === dragging.id);
      const toIndex = categoryLinks.findIndex((item) => item.id === targetLinkId);

      if (fromIndex === -1 || toIndex === -1) {
        return current;
      }

      const reordered = arrayMove(categoryLinks, fromIndex, toIndex).map(
        (item, index) => ({
          ...item,
          sort: index + 1,
        }),
      );
      const reorderMap = new Map(reordered.map((item) => [item.id, item]));

      return sortLinks(
        current.map((item) => reorderMap.get(item.id) ?? item),
        categoryOptions,
      );
    });

    setDragging(null);
    setDirtyCategoryIds((current) =>
      current.includes(targetCategoryId)
        ? current
        : [...current, targetCategoryId],
    );
    setMessage("分类内拖拽顺序已更新，记得保存当前分类排序。");
    setError(null);
  }

  async function saveCategoryOrder(targetCategoryId: string) {
    resetMessages();
    const orderedIds = links
      .filter((item) => item.categoryId === targetCategoryId)
      .sort((left, right) => left.sort - right.sort)
      .map((item) => item.id);

    const response = await fetch("/api/admin/links/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: targetCategoryId,
        orderedIds,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "分类内排序保存失败。");
      return;
    }

    await reloadLinks();
    setDirtyCategoryIds((current) =>
      current.filter((item) => item !== targetCategoryId),
    );
    setMessage("当前分类下的链接排序已保存。");
    router.refresh();
  }

  async function handleBatchMove() {
    if (!bulkCategoryId || selectedIds.length === 0) {
      setError("请先选择链接并指定目标分类。");
      return;
    }

    resetMessages();
    setIsBatchMoving(true);

    try {
      const response = await fetch("/api/admin/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulkMove",
          linkIds: selectedIds,
          categoryId: bulkCategoryId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "批量调整分类失败。");
        return;
      }

      await reloadLinks();
      setSelectedIds([]);
      setDirtyCategoryIds([]);
      setBulkCategoryId("");
      setMessage("批量调整分类已完成。");
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试。");
    } finally {
      setIsBatchMoving(false);
    }
  }

  function toggleSelected(linkId: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(linkId) ? current : [...current, linkId];
      }

      return current.filter((id) => id !== linkId);
    });
  }

  if (categoryOptions.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-8 text-sm leading-7 text-[var(--ink-secondary)]">
        还没有任何分类。请先去分类管理页创建至少一个分类，再回来录入链接。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-tertiary)]">
              Links
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              链接管理
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-secondary)]">
              链接必须归属到单个分类，排序仅在所属分类内生效。你可以逐条编辑，也可以先勾选多条链接后批量调整分类。
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateSheet}
            className="inline-flex items-center justify-center rounded-xl bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            新建链接
          </button>
        </div>

        <div className="mt-6 grid gap-3 xl:grid-cols-[1.35fr_1fr_0.8fr_0.8fr]">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-tertiary)]">
              搜索
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索名称、URL 或描述"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[color:color-mix(in_srgb,var(--accent)_12%,white)]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-tertiary)]">
              分类筛选
            </span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
            >
              <option value="all">全部分类</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-tertiary)]">
              公开状态
            </span>
            <select
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as "all" | "public" | "private")
              }
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
            >
              <option value="all">全部</option>
              <option value="public">仅公开</option>
              <option value="private">仅私有</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-tertiary)]">
              环境
            </span>
            <select
              value={env}
              onChange={(event) => setEnv(event.target.value as "all" | LinkEnv)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
            >
              <option value="all">全部环境</option>
              <option value="prod">prod</option>
              <option value="test">test</option>
            </select>
          </label>
        </div>

        {!canDrag && (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--ink-secondary)]">
            分类内拖拽排序只在“无搜索词 + 全部公开状态 + 全部环境”时开放，避免你在筛选条件下误改排序。
          </div>
        )}

        {selectedIds.length > 0 && (
          <div className="mt-4 grid gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--bg)] p-4 xl:grid-cols-[1fr_220px_160px]">
            <div className="text-sm leading-7 text-[var(--ink-secondary)]">
              已选择
              {" "}
              <span className="font-semibold text-[var(--ink)]">
                {selectedIds.length}
              </span>
              {" "}
              条链接，可批量调整到新的分类。
            </div>
            <select
              value={bulkCategoryId}
              onChange={(event) => setBulkCategoryId(event.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
            >
              <option value="">选择目标分类</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void handleBatchMove()}
              disabled={isBatchMoving}
              className="inline-flex items-center justify-center rounded-2xl bg-[var(--ink)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBatchMoving ? "处理中..." : "批量改分类"}
            </button>
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-2xl border border-[color:color-mix(in_srgb,var(--emerald)_20%,white)] bg-[var(--emerald-soft)] px-4 py-3 text-sm text-[var(--emerald)]">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-[color:color-mix(in_srgb,var(--amber)_20%,white)] bg-[var(--amber-soft)] px-4 py-3 text-sm text-[var(--amber)]">
            {error}
          </div>
        )}
      </section>

      <section className="space-y-5">
        {groupedLinks.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--ink-secondary)]">
            当前筛选条件下没有链接。
          </div>
        ) : (
          groupedLinks.map((section) => {
            const isDirty = dirtyCategoryIds.includes(section.category.id);

            return (
              <article
                key={section.category.id}
                className="rounded-2xl border border-[var(--border)] bg-white p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold tracking-tight">
                        {section.category.name}
                      </h3>
                      <span className="rounded-full bg-[var(--bg)] px-2.5 py-1 text-xs font-medium text-[var(--ink-secondary)]">
                        {section.links.length} 条链接
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-secondary)]">
                      链接排序在该分类内生效。
                    </p>
                  </div>

                  {isDirty && (
                    <button
                      type="button"
                      onClick={() => void saveCategoryOrder(section.category.id)}
                      className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--ink-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                    >
                      保存当前分类排序
                    </button>
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  {section.links.map((item) => (
                    <div
                      key={item.id}
                      draggable={canDrag}
                      onDragStart={() =>
                        setDragging({ id: item.id, categoryId: item.categoryId })
                      }
                      onDragOver={(event) => {
                        if (
                          canDrag &&
                          dragging?.categoryId === section.category.id
                        ) {
                          event.preventDefault();
                        }
                      }}
                      onDrop={() => handleDrop(section.category.id, item.id)}
                      onDragEnd={() => setDragging(null)}
                      className={`grid gap-4 rounded-[24px] border p-4 transition xl:grid-cols-[auto_2.2fr_1fr_0.9fr_0.9fr_1.4fr] ${
                        dragging?.id === item.id
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]/40"
                          : "border-[var(--border)]"
                      }`}
                    >
                      <label className="flex items-start pt-1">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={(event) =>
                            toggleSelected(item.id, event.target.checked)
                          }
                          className="h-4 w-4 accent-[var(--accent)]"
                        />
                      </label>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-base font-semibold">
                            {item.name}
                          </div>
                          <span className="rounded-full bg-[var(--bg)] px-2.5 py-1 text-xs font-medium text-[var(--ink-secondary)]">
                            {item.env}
                          </span>
                          {item.isPublic ? (
                            <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
                              公开
                            </span>
                          ) : (
                            <span className="rounded-full bg-[var(--bg)] px-2.5 py-1 text-xs font-medium text-[var(--ink-secondary)]">
                              私有
                            </span>
                          )}
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 block truncate text-sm text-[var(--accent)] underline-offset-4 hover:underline"
                        >
                          {item.url}
                        </a>
                        <p className="mt-2 text-sm leading-6 text-[var(--ink-secondary)]">
                          {item.description || "暂无描述。"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[var(--bg)] px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.16em] text-[var(--ink-tertiary)]">
                          更新时间
                        </div>
                        <div className="mt-2 text-sm font-medium">
                          {formatDateTime(item.updatedAt)}
                        </div>
                      </div>

                      <div className="space-y-2 rounded-2xl bg-[var(--bg)] px-4 py-3">
                        <label className="text-xs uppercase tracking-[0.16em] text-[var(--ink-tertiary)]">
                          排序值
                        </label>
                        <input
                          value={String(item.sort)}
                          onChange={(event) => {
                            const nextSort = Number(event.target.value || 0);
                            setLinks((current) =>
                              sortLinks(
                                current.map((entry) =>
                                  entry.id === item.id
                                    ? {
                                        ...entry,
                                        sort: Number.isInteger(nextSort)
                                          ? nextSort
                                          : entry.sort,
                                      }
                                    : entry,
                                ),
                                categoryOptions,
                              ),
                            );
                          }}
                          className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const target = links.find((entry) => entry.id === item.id);
                            if (target) {
                              void handleSaveRowSort(target);
                            }
                          }}
                          className="inline-flex rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-medium text-[var(--ink-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                        >
                          保存排序
                        </button>
                      </div>

                      <div className="rounded-2xl bg-[var(--bg)] px-4 py-3 text-sm text-[var(--ink-secondary)]">
                        <div className="text-xs uppercase tracking-[0.16em] text-[var(--ink-tertiary)]">
                          所属分类
                        </div>
                        <div className="mt-2 font-medium text-[var(--ink)]">
                          {item.categoryName}
                        </div>
                        {canDrag && (
                          <div className="mt-3 rounded-xl border border-dashed border-[var(--border)] px-3 py-2 text-xs text-[var(--ink-tertiary)]">
                            分类内可拖拽
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-start justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditSheet(item)}
                          className="inline-flex rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(item)}
                          className="inline-flex rounded-xl border border-[color:color-mix(in_srgb,var(--amber)_20%,white)] bg-[var(--amber-soft)] px-4 py-2 text-sm font-medium text-[var(--amber)] transition hover:opacity-90"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })
        )}
      </section>

      {isSheetOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(15,23,42,0.28)] backdrop-blur-sm">
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-tertiary)]">
                  Link Form
                </div>
                <h3 className="mt-2 text-xl font-semibold tracking-tight">
                  {editingItem ? "编辑链接" : "新建链接"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeSheet}
                className="inline-flex rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--ink-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
              >
                关闭
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-medium">名称</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">URL</span>
                <input
                  value={form.url}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, url: event.target.value }))
                  }
                  placeholder="https://example.com"
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium">所属分类</span>
                  <select
                    value={form.category_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category_id: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                    required
                  >
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">环境</span>
                  <select
                    value={form.env}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        env: event.target.value as LinkEnv,
                      }))
                    }
                    className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                  >
                    <option value="prod">prod</option>
                    <option value="test">test</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium">图标 URL</span>
                  <input
                    value={form.icon}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, icon: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                    placeholder="可选"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">排序值</span>
                  <input
                    value={form.sort}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, sort: event.target.value }))
                    }
                    inputMode="numeric"
                    placeholder="留空则自动放到分类末尾"
                    className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium">描述</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                  placeholder="可选，用于补充背景说明。"
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3">
                <div>
                  <div className="text-sm font-medium">是否公开</div>
                  <div className="mt-1 text-xs text-[var(--ink-tertiary)]">
                    未公开的链接仅当前用户可见。
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      is_public: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[var(--accent)]"
                />
              </label>

              {error && (
                <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--amber)_20%,white)] bg-[var(--amber-soft)] px-4 py-3 text-sm text-[var(--amber)]">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeSheet}
                  className="inline-flex rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex rounded-xl bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "保存中..." : editingItem ? "保存修改" : "创建链接"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
