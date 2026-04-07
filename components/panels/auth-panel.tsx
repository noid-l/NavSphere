'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createOptionalBrowserSupabaseClient } from '@/lib/supabase/browser'

type AuthPanelProps = {
  initialUserEmail: string | null
  isConfigured: boolean
}

export function AuthPanel({ initialUserEmail, isConfigured }: AuthPanelProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createOptionalBrowserSupabaseClient()

  async function signInWithMagicLink() {
    if (!supabase || !email.trim()) {
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    })

    setMessage(error ? error.message : '登录链接已发送，请检查邮箱。')
    setIsSubmitting(false)
  }

  async function signInWithGitHub() {
    if (!supabase) {
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo },
    })

    if (error) {
      setMessage(error.message)
      setIsSubmitting(false)
    }
  }

  async function signOut() {
    if (!supabase) {
      return
    }

    setIsSubmitting(true)
    const { error } = await supabase.auth.signOut()
    setIsSubmitting(false)

    if (error) {
      setMessage(error.message)
      return
    }

    router.refresh()
  }

  return (
    <div className="rounded-[1.5rem] border border-[var(--page-line)] bg-[rgba(255,255,255,0.72)] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--page-muted)]">
            Auth
          </p>
          <p className="mt-1 text-lg font-semibold">
            {initialUserEmail ? '已登录' : '未登录'}
          </p>
        </div>
        <div className="rounded-full bg-[var(--page-brand-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--page-brand)]">
          {initialUserEmail ? 'Owner Mode' : 'Visitor'}
        </div>
      </div>

      {!isConfigured ? (
        <p className="mt-4 text-sm leading-6 text-[var(--page-muted)]">
          当前是演示模式。配置 Supabase 后即可开启邮箱登录与 GitHub 登录。
        </p>
      ) : null}

      {initialUserEmail ? (
        <>
          <p className="mt-4 text-sm leading-6 text-[var(--page-muted)]">{initialUserEmail}</p>
          <button
            type="button"
            onClick={signOut}
            disabled={isSubmitting || !supabase}
            className="mt-4 inline-flex rounded-full bg-[var(--page-ink)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[rgba(19,34,29,0.86)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            退出登录
          </button>
        </>
      ) : (
        <>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium">邮箱登录</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-2xl border border-[var(--page-line)] bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-[var(--page-brand)] focus:ring-4 focus:ring-[rgba(15,118,110,0.12)]"
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={signInWithMagicLink}
              disabled={!isConfigured || isSubmitting || !email.trim()}
              className="inline-flex rounded-full bg-[var(--page-brand)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[rgba(15,118,110,0.88)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              发送魔法链接
            </button>
            <button
              type="button"
              onClick={signInWithGitHub}
              disabled={!isConfigured || isSubmitting}
              className="inline-flex rounded-full border border-[var(--page-line)] px-4 py-2 text-sm font-medium transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              GitHub 登录
            </button>
          </div>
        </>
      )}

      {message ? (
        <p className="mt-4 text-sm leading-6 text-[var(--page-muted)]">{message}</p>
      ) : null}
    </div>
  )
}

