'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
}`

type AiImportPanelProps = {
  initialUserEmail: string | null
  isConfigured: boolean
}

export function AiImportPanel({
  initialUserEmail,
  isConfigured,
}: AiImportPanelProps) {
  const router = useRouter()
  const [payload, setPayload] = useState(defaultPayload)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  let parsedCategoryName = '未识别'
  let parsedLinkCount = 0

  try {
    const parsed = JSON.parse(payload) as {
      category?: { name?: string }
      links?: unknown[]
    }

    parsedCategoryName = parsed.category?.name?.trim() || '未识别'
    parsedLinkCount = Array.isArray(parsed.links) ? parsed.links.length : 0
  } catch {
    parsedCategoryName = 'JSON 无效'
  }

  async function submitPayload() {
    setIsSubmitting(true)
    setMessage(null)

    const response = await fetch('/api/ai-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })

    const result = (await response.json().catch(() => null)) as
      | { error?: string; insertedCount?: number; category?: { name: string } }
      | null

    if (!response.ok) {
      setMessage(result?.error ?? '导入失败，请检查 JSON 与登录状态。')
      setIsSubmitting(false)
      return
    }

    setMessage(
      `已导入 ${result?.insertedCount ?? 0} 条链接到分类“${result?.category?.name ?? '未命名'}”。`,
    )
    setIsSubmitting(false)
    router.refresh()
  }

  return (
    <section className="surface-card rounded-[1.75rem] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--page-muted)]">
            AI Import
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            让模型直接写导航
          </h2>
        </div>
        <div className="rounded-full border border-[var(--page-line)] bg-[var(--page-surface-strong)] px-3 py-1 text-xs font-medium text-[var(--page-muted)]">
          {parsedCategoryName} / {parsedLinkCount} 条
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--page-muted)]">
        粘贴 AI 生成的 JSON 后即可写入 Supabase。接口默认执行 upsert，适合 Codex / Claude Code 的批量维护流程。
      </p>

      <textarea
        value={payload}
        onChange={(event) => setPayload(event.target.value)}
        spellCheck={false}
        className="mt-4 min-h-72 w-full rounded-[1.5rem] border border-[var(--page-line)] bg-[#fffdf8] p-4 font-mono text-xs leading-6 outline-none transition focus:border-[var(--page-brand)] focus:ring-4 focus:ring-[rgba(15,118,110,0.12)]"
      />

      <div className="mt-4 rounded-[1.25rem] border border-[var(--page-line)] bg-[rgba(255,255,255,0.72)] p-4 text-sm leading-6 text-[var(--page-muted)]">
        {!isConfigured ? '先配置 `.env.local` 后才能写入。' : null}
        {isConfigured && !initialUserEmail ? '登录后才能写入私有或公开导航。' : null}
        {isConfigured && initialUserEmail ? `当前将以 ${initialUserEmail} 身份写入。` : null}
      </div>

      <button
        type="button"
        onClick={submitPayload}
        disabled={!isConfigured || !initialUserEmail || isSubmitting}
        className="mt-4 inline-flex rounded-full bg-[var(--page-accent)] px-4 py-2 text-sm font-semibold text-[var(--page-ink)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        导入 JSON
      </button>

      {message ? (
        <p className="mt-4 text-sm leading-6 text-[var(--page-muted)]">{message}</p>
      ) : null}
    </section>
  )
}

