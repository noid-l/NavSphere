import { NextResponse } from 'next/server'

import { AdminInputError, reorderAdminLinks } from '@/lib/data/admin'
import { hasSupabaseEnv } from '@/lib/env'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!hasSupabaseEnv) {
    return NextResponse.json(
      { error: 'Supabase 环境变量未配置，暂时无法使用后台能力。' },
      { status: 503 },
    )
  }

  const supabase = await createRouteHandlerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '请先登录后再访问后台。' }, { status: 401 })
  }

  const payload = await request.json().catch(() => null)
  const orderedIds = Array.isArray(payload?.orderedIds) ? payload.orderedIds : []
  const categoryId = typeof payload?.categoryId === 'string' ? payload.categoryId : ''

  try {
    await reorderAdminLinks(supabase, user.id, categoryId, orderedIds)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '链接排序保存失败。'
    const status = error instanceof AdminInputError ? error.status : 500
    return NextResponse.json({ error: message }, { status })
  }
}
