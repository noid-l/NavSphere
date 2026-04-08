"use client";

import { useCallback, useRef, useState } from "react";

import {
  isDataImportBatchPayload,
  isDataImportPayload,
} from "@/lib/data/validators";
import type { DataImportPayload } from "@/lib/types";

type DataImportPanelProps = {
  initialUserEmail: string | null;
  isConfigured: boolean;
};

type ImportResult = {
  importedCategories: number;
  insertedCount: number;
};

type ParsedPreview = {
  items: DataImportPayload[];
  categoryNames: string[];
  totalLinks: number;
};

export function DataImportPanel({
  initialUserEmail,
  isConfigured,
}: DataImportPanelProps) {
  const [jsonText, setJsonText] = useState("");
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setJsonText("");
    setPreview(null);
    setParseError(null);
    setResult(null);
    setResultError(null);
  }, []);

  function parseJson(text: string) {
    setParseError(null);
    setPreview(null);
    setResult(null);
    setResultError(null);

    const trimmed = text.trim();
    if (!trimmed) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      setParseError("JSON 格式无效，请检查语法。");
      return;
    }

    const items = isDataImportPayload(parsed)
      ? [parsed]
      : isDataImportBatchPayload(parsed)
        ? parsed
        : null;

    if (!items) {
      setParseError(
        "结构不匹配。需要包含 category.name 和 links 数组，或传入分类数组。",
      );
      return;
    }

    setPreview({
      items,
      categoryNames: items.map((item) => item.category.name),
      totalLinks: items.reduce((sum, item) => sum + item.links.length, 0),
    });
  }

  function handleTextChange(value: string) {
    setJsonText(value);
    if (value.trim()) {
      parseJson(value);
    } else {
      setPreview(null);
      setParseError(null);
    }
  }

  function handleFileDrop(file: File) {
    if (!file.name.endsWith(".json")) {
      setParseError("仅支持 .json 文件。");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setJsonText(text);
      parseJson(text);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!preview || !initialUserEmail) return;

    setIsImporting(true);
    setResultError(null);

    try {
      const payload =
        preview.items.length === 1 ? preview.items[0] : preview.items;

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setResultError(data.error ?? `请求失败 (${res.status})`);
        return;
      }

      setResult({
        importedCategories: data.importedCategories ?? preview.items.length,
        insertedCount: data.insertedCount ?? 0,
      });
    } catch {
      setResultError("网络错误，请稍后重试。");
    } finally {
      setIsImporting(false);
    }
  }

  /* ── Guards ── */

  if (!isConfigured) {
    return (
      <div className="import-panel-guard">
        <div className="import-guard-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-sm leading-6 text-[var(--ink-secondary)]">
          Supabase 环境变量未配置，暂时无法导入数据。
        </p>
      </div>
    );
  }

  if (!initialUserEmail) {
    return (
      <div className="import-panel-guard">
        <div className="import-guard-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <p className="text-sm leading-6 text-[var(--ink-secondary)]">
          请先登录后再导入导航数据。
        </p>
        <a
          href="/login"
          className="import-btn-primary mt-4 inline-flex items-center gap-2"
        >
          前往登录
        </a>
      </div>
    );
  }

  /* ── Success State ── */
  if (result) {
    return (
      <div className="import-success">
        <div className="import-success-ring">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-base font-semibold">导入完成</h3>
        <p className="text-sm text-[var(--ink-secondary)]">
          成功导入{" "}
          <span className="font-semibold text-[var(--ink)]">
            {result.importedCategories}
          </span>{" "}
          个分类、{" "}
          <span className="font-semibold text-[var(--ink)]">
            {result.insertedCount}
          </span>{" "}
          条链接。
        </p>
        <div className="import-success-actions">
          <button
            type="button"
            onClick={reset}
            className="import-btn-secondary"
          >
            继续导入
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="import-btn-primary"
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }

  /* ── Main Import Form ── */
  return (
    <div className="import-panel space-y-5">
      {/* Introduction */}
      <p className="text-[13px] leading-6 text-[var(--ink-secondary)]">
        粘贴或上传 JSON 文件，将导航分类与链接批量写入数据库。
      </p>

      {/* Drop Zone / Textarea */}
      <div
        className={`import-drop-zone ${isDragOver ? "import-drop-zone--active" : ""} ${parseError ? "import-drop-zone--error" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFileDrop(file);
        }}
      >
        {isDragOver ? (
          <div className="import-drop-overlay">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="text-sm font-medium">释放文件以上传</span>
          </div>
        ) : (
          <textarea
            value={jsonText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={`{\n  "category": { "name": "工具" },\n  "links": [\n    { "name": "示例", "url": "https://..." }\n  ]\n}`}
            className="import-json-input"
            spellCheck={false}
          />
        )}

        {/* File upload trigger */}
        <div className="import-file-bar">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="import-file-btn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            选择文件
          </button>
          <span className="text-[11px] text-[var(--ink-tertiary)]">
            支持 .json，或直接拖拽到此区域
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileDrop(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Parse error */}
      {parseError && (
        <div className="import-error-msg">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {parseError}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="import-preview">
          <div className="import-preview-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>数据预览</span>
          </div>
          <div className="import-preview-body">
            {preview.categoryNames.map((name, i) => {
              const links = preview.items[i].links;
              return (
                <div key={`${name}-${i}`} className="import-preview-item">
                  <div className="import-preview-cat">
                    <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                  <span className="import-preview-count">
                    {links.length} 条链接
                  </span>
                </div>
              );
            })}
          </div>
          <div className="import-preview-summary">
            共{" "}
            <span className="font-semibold text-[var(--ink)]">
              {preview.categoryNames.length}
            </span>{" "}
            个分类 ·{" "}
            <span className="font-semibold text-[var(--ink)]">
              {preview.totalLinks}
            </span>{" "}
            条链接
          </div>
        </div>
      )}

      {/* Import button */}
      {preview && (
        <button
          type="button"
          onClick={handleImport}
          disabled={isImporting}
          className="import-btn-primary w-full"
        >
          {isImporting ? (
            <>
              <span className="import-spinner" />
              正在导入...
            </>
          ) : (
            "确认导入"
          )}
        </button>
      )}

      {/* Import error */}
      {resultError && (
        <div className="import-error-msg">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {resultError}
        </div>
      )}

      {/* Format hint */}
      <details className="import-hint">
        <summary>JSON 格式说明</summary>
        <pre className="import-hint-code">{`{
  "category": {
    "name": "分类名称",
    "description": "可选描述"
  },
  "links": [
    {
      "name": "链接名",
      "url": "https://example.com"
    }
  ]
}

// 也支持数组格式批量导入：
[
  { "category": {...}, "links": [...] },
  { "category": {...}, "links": [...] }
]`}</pre>
      </details>
    </div>
  );
}
