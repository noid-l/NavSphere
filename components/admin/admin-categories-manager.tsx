"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminCategoryItem } from "@/lib/types";

type AdminCategoriesManagerProps = {
  initialCategories: AdminCategoryItem[];
};

type CategoryFormState = {
  name: string;
  description: string;
  sort: string;
  is_public: boolean;
};

const defaultForm: CategoryFormState = {
  name: "",
  description: "",
  sort: "100",
  is_public: false,
};

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

function sortByMode(
  items: AdminCategoryItem[],
  sortMode: "sort" | "updated" | "name",
) {
  const next = [...items];

  if (sortMode === "name") {
    next.sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
    return next;
  }

  if (sortMode === "updated") {
    next.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return next;
  }

  next.sort((left, right) => left.sort - right.sort);
  return next;
}

function normalizeCategories(items: AdminCategoryItem[]) {
  return sortByMode(items, "sort");
}

function buildPathPreview(name: string) {
  const parts = name
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return {
      type: "plain" as const,
      label: parts[0] ?? "分类名称",
    };
  }

  return {
    type: "path" as const,
    parent: parts[0],
    child: parts.slice(1).join(" / "),
  };
}

export function AdminCategoriesManager({
  initialCategories,
}: AdminCategoriesManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(
    normalizeCategories(initialCategories),
  );
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<"all" | "public" | "private">(
    "all",
  );
  const [sortMode, setSortMode] = useState<"sort" | "updated" | "name">(
    "sort",
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hasOrderDraft, setHasOrderDraft] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminCategoryItem | null>(
    null,
  );
  const [form, setForm] = useState<CategoryFormState>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const keyword = query.trim().toLowerCase();
  const canDrag = sortMode === "sort" && !keyword && visibility === "all";

  const filteredCategories = sortByMode(
    categories.filter((item) => {
      if (visibility === "public" && !item.isPublic) {
        return false;
      }

      if (visibility === "private" && item.isPublic) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return [item.name, item.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    }),
    sortMode,
  );

  function openCreateSheet() {
    setEditingItem(null);
    setForm(defaultForm);
    setError(null);
    setMessage(null);
    setIsSheetOpen(true);
  }

  function openEditSheet(item: AdminCategoryItem) {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      sort: String(item.sort),
      is_public: item.isPublic,
    });
    setError(null);
    setMessage(null);
    setIsSheetOpen(true);
  }

  function closeSheet() {
    setIsSheetOpen(false);
    setEditingItem(null);
    setForm(defaultForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const endpoint = editingItem
        ? `/api/admin/categories/${editingItem.id}`
        : "/api/admin/categories";
      const method = editingItem ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "分类保存失败。");
        return;
      }

      const item = data.item as AdminCategoryItem;
      setCategories((current) => {
        const next = editingItem
          ? current.map((entry) => (entry.id === item.id ? item : entry))
          : [...current, item];
        return normalizeCategories(next);
      });
      setMessage(editingItem ? "分类已更新。" : "分类已创建。");
      setHasOrderDraft(false);
      closeSheet();
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(item: AdminCategoryItem) {
    const confirmed = window.confirm(
      `确认删除分类“${item.name}”吗？如果该分类下仍有链接，系统会阻止删除。`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/categories/${item.id}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "分类删除失败。");
      return;
    }

    setCategories((current) => current.filter((entry) => entry.id !== item.id));
    setMessage("分类已删除。");
    setHasOrderDraft(false);
    router.refresh();
  }

  async function handleSaveRowSort(item: AdminCategoryItem) {
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/categories/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sort: item.sort }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "排序值保存失败。");
      return;
    }

    setCategories((current) =>
      normalizeCategories(
        current.map((entry) => (entry.id === item.id ? data.item : entry)),
      ),
    );
    setMessage(`已保存分类“${item.name}”的排序值。`);
    setHasOrderDraft(false);
    router.refresh();
  }

  function handleDragDrop(targetId: string) {
    if (!canDrag || !draggingId || draggingId === targetId) {
      return;
    }

    setCategories((current) => {
      const ordered = normalizeCategories(current);
      const fromIndex = ordered.findIndex((item) => item.id === draggingId);
      const toIndex = ordered.findIndex((item) => item.id === targetId);

      if (fromIndex === -1 || toIndex === -1) {
        return current;
      }

      const next = arrayMove(ordered, fromIndex, toIndex).map((item, index) => ({
        ...item,
        sort: index + 1,
      }));
      return next;
    });

    setHasOrderDraft(true);
    setDraggingId(null);
    setMessage("拖拽顺序已更新，记得点击“保存拖拽排序”。");
    setError(null);
  }

  async function saveDragOrder() {
    setIsSavingOrder(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderedIds: normalizeCategories(categories).map((item) => item.id),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "拖拽排序保存失败。");
        return;
      }

      setCategories((current) =>
        normalizeCategories(current).map((item, index) => ({
          ...item,
          sort: index + 1,
        })),
      );
      setHasOrderDraft(false);
      setMessage("分类拖拽排序已保存。");
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试。");
    } finally {
      setIsSavingOrder(false);
    }
  }

  const preview = buildPathPreview(form.name);

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-[var(--border)] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-tertiary)]">
              Categories
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              分类管理
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-secondary)]">
              分类排序会同步影响前台主内容区与侧边栏顺序；空分类允许存在，但不会在前台显示。分类名里的
              {" "}
              <code className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-[12px]">
                /
              </code>
              {" "}
              仅用于前台分组展示。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openCreateSheet}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              新建分类
            </button>
            {hasOrderDraft && (
              <button
                type="button"
                onClick={saveDragOrder}
                disabled={isSavingOrder}
                className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--ink-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingOrder ? "保存中..." : "保存拖拽排序"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 xl:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-tertiary)]">
              搜索
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索分类名称或描述"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[color:color-mix(in_srgb,var(--accent)_12%,white)]"
            />
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
              排序模式
            </span>
            <select
              value={sortMode}
              onChange={(event) =>
                setSortMode(event.target.value as "sort" | "updated" | "name")
              }
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
            >
              <option value="sort">按排序值</option>
              <option value="updated">按更新时间</option>
              <option value="name">按名称</option>
            </select>
          </label>
        </div>

        {!canDrag && sortMode === "sort" && (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--ink-secondary)]">
            为避免误排，拖拽排序只在“无搜索词 + 全部状态”时开放；手动排序值编辑仍然可用。
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

      <section className="space-y-3">
        {filteredCategories.length === 0 ? (
          <div className="rounded-[30px] border border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--ink-secondary)] shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
            当前条件下没有分类。可以先新建一个普通分类，或使用路径式名称创建分组展示。
          </div>
        ) : (
          filteredCategories.map((item) => (
            <article
              key={item.id}
              draggable={canDrag}
              onDragStart={() => setDraggingId(item.id)}
              onDragOver={(event) => {
                if (canDrag) {
                  event.preventDefault();
                }
              }}
              onDrop={() => handleDragDrop(item.id)}
              onDragEnd={() => setDraggingId(null)}
              className={`rounded-[28px] border bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.04)] transition ${
                draggingId === item.id
                  ? "border-[var(--accent)] opacity-70"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="grid gap-4 xl:grid-cols-[2.4fr_0.9fr_0.9fr_1.1fr_1.4fr]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-base font-semibold">{item.name}</div>
                    {item.isPublic ? (
                      <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
                        公开
                      </span>
                    ) : (
                      <span className="rounded-full bg-[var(--bg)] px-2.5 py-1 text-xs font-medium text-[var(--ink-secondary)]">
                        私有
                      </span>
                    )}
                    {item.isEmpty && (
                      <span className="rounded-full bg-[var(--amber-soft)] px-2.5 py-1 text-xs font-medium text-[var(--amber)]">
                        空分类
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-secondary)]">
                    {item.description || "暂无描述。"}
                  </p>
                  {item.isEmpty && (
                    <p className="mt-2 text-xs leading-6 text-[var(--ink-tertiary)]">
                      空分类不会在前台展示，但可作为后续链接的承接容器。
                    </p>
                  )}
                </div>

                <div className="rounded-2xl bg-[var(--bg)] px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-[var(--ink-tertiary)]">
                    链接数
                  </div>
                  <div className="mt-2 text-2xl font-semibold">
                    {item.linkCount}
                  </div>
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
                      setCategories((current) =>
                        current.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, sort: Number.isInteger(nextSort) ? nextSort : entry.sort }
                            : entry,
                        ),
                      );
                    }}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const target = categories.find((entry) => entry.id === item.id);
                      if (target) {
                        void handleSaveRowSort(target);
                      }
                    }}
                    className="inline-flex rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-medium text-[var(--ink-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                  >
                    保存排序
                  </button>
                </div>

                <div className="flex flex-wrap items-start justify-end gap-2">
                  {canDrag && (
                    <div className="inline-flex items-center rounded-xl border border-dashed border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--ink-tertiary)]">
                      拖拽排序
                    </div>
                  )}
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
            </article>
          ))
        )}
      </section>

      {isSheetOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(15,23,42,0.28)] backdrop-blur-sm">
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-tertiary)]">
                  Category Form
                </div>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                  {editingItem ? "编辑分类" : "新建分类"}
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
                  placeholder="例如：研发 / AI工具"
                  className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                  required
                />
              </label>

              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-tertiary)]">
                  路径式名称预览
                </div>
                {preview.type === "path" ? (
                  <div className="mt-3">
                    <div className="text-sm text-[var(--ink-secondary)]">
                      前台侧边栏分组：
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-medium shadow-sm">
                        {preview.parent}
                      </span>
                      <span className="text-[var(--ink-tertiary)]">/</span>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-medium shadow-sm">
                        {preview.child}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-[var(--ink-secondary)]">
                    当前会作为普通分类直接显示为“{preview.label}”。
                  </p>
                )}
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
                  placeholder="可选，用于后台辨识分类用途。"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium">排序值</span>
                  <input
                    value={form.sort}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, sort: event.target.value }))
                    }
                    inputMode="numeric"
                    className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">是否公开</div>
                    <div className="mt-1 text-xs text-[var(--ink-tertiary)]">
                      公开后其他用户可读取该分类。
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
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 text-sm leading-7 text-[var(--ink-secondary)]">
                空分类可以正常创建，但当前前台只会渲染有链接的分类。删除含链接的分类会被阻止，需要先迁移或删除链接。
              </div>

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
                  {isSubmitting ? "保存中..." : editingItem ? "保存修改" : "创建分类"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
