"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const defaultPayload = `{
  "category": {
    "name": "AI工具",
    "description": "团队常用的 AI 平台入口"
  },
  "links": [
    {
      "name": "ChatGPT",
      "url": "https://chatgpt.com",
      "env": "prod"
    },
    {
      "name": "Claude",
      "url": "https://claude.ai",
      "env": "prod"
    }
  ]
}`;

type ParsedSummary = {
  categoryCount: number;
  linkCount: number;
  primaryCategoryName: string;
};

function getParsedSummary(rawPayload: string): ParsedSummary {
  try {
    const parsed = JSON.parse(rawPayload) as
      | { category?: { name?: string }; links?: unknown[] }
      | Array<{ category?: { name?: string }; links?: unknown[] }>;

    if (Array.isArray(parsed)) {
      return {
        categoryCount: parsed.length,
        linkCount: parsed.reduce(
          (total, item) =>
            total + (Array.isArray(item?.links) ? item.links.length : 0),
          0,
        ),
        primaryCategoryName:
          parsed[0]?.category?.name?.trim() || `${parsed.length} 个分类`,
      };
    }

    return {
      categoryCount: 1,
      linkCount: Array.isArray(parsed.links) ? parsed.links.length : 0,
      primaryCategoryName: parsed.category?.name?.trim() || "未识别",
    };
  } catch {
    return {
      categoryCount: 0,
      linkCount: 0,
      primaryCategoryName: "JSON 无效",
    };
  }
}

type AiImportPanelProps = {
  initialUserEmail: string | null;
  isConfigured: boolean;
};

export function AiImportPanel({
  initialUserEmail,
  isConfigured,
}: AiImportPanelProps) {
  const router = useRouter();
  const [payload, setPayload] = useState(defaultPayload);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedSummary = getParsedSummary(payload);

  async function submitPayload() {
    setIsSubmitting(true);
    setMessage(null);

    const response = await fetch("/api/ai-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });

    const result = (await response.json().catch(() => null)) as
      | {
          error?: string;
          insertedCount?: number;
          importedCategories?: number;
          category?: { name: string };
        }
      | null;

    if (!response.ok) {
      setMessage(result?.error ?? "导入失败，请检查 JSON 与登录状态。");
      setIsSubmitting(false);
      return;
    }

    const importedCategories = result?.importedCategories ?? 1;
    const importedLinks = result?.insertedCount ?? 0;

    setMessage(
      importedCategories > 1
        ? `已导入 ${importedCategories} 个分类，共 ${importedLinks} 条链接。`
        : `已导入 ${importedLinks} 条链接到分类"${result?.category?.name ?? "未命名"}"。`,
    );
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* parsed preview */}
      <div className="flex items-center gap-2 text-sm text-[var(--ink-secondary)]">
        <span className="font-medium">{parsedSummary.primaryCategoryName}</span>
        <span>·</span>
        <span>{parsedSummary.linkCount} 条链接</span>
        {parsedSummary.categoryCount > 1 && (
          <>
            <span>·</span>
            <span>{parsedSummary.categoryCount} 个分类</span>
          </>
        )}
      </div>

      <p className="text-sm text-[var(--ink-secondary)]">
        粘贴单个分类 JSON，或多个分类组成的数组，都可以写入 Supabase。接口默认执行
        upsert，适合 Codex / Claude Code 的批量维护流程。
      </p>

      <textarea
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
        spellCheck={false}
        className="min-h-56 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 font-mono text-xs leading-6 outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
      />

      {/* status bar */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-sm text-[var(--ink-secondary)]">
        {!isConfigured && "先配置 `.env.local` 后才能写入。"}
        {isConfigured &&
          !initialUserEmail &&
          "登录后才能写入私有或公开导航。"}
        {isConfigured &&
          initialUserEmail &&
          `将以 ${initialUserEmail} 身份写入。`}
      </div>

      <button
        type="button"
        onClick={submitPayload}
        disabled={!isConfigured || !initialUserEmail || isSubmitting}
        className="inline-flex rounded-lg bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        导入 JSON
      </button>

      {message && (
        <p className="text-sm text-[var(--ink-secondary)]">{message}</p>
      )}
    </div>
  );
}
