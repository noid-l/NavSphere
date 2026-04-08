import { NextResponse } from 'next/server'

import {
  AdminInputError,
  createAdminLink,
  listAdminLinks,
  moveAdminLinksToCategory,
} from '@/lib/data/admin'
import { hasSupabaseEnv } from '@/lib/env'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler'

export const dynamic = 'force-dynamic'

async function getRouteContext() {
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

  return { supabase, user }
}

export async function GET(request: Request) {
  const context = await getRouteContext()
  if (context instanceof NextResponse) {
    return context
  }

  try {
    const { searchParams } = new URL(request.url)
    const items = await listAdminLinks(context.supabase, context.user.id, {
      query: searchParams.get('query'),
      categoryId: searchParams.get('categoryId'),
      visibility: (searchParams.get('visibility') as 'all' | 'public' | 'private' | null) ?? 'all',
      env: (searchParams.get('env') as 'all' | 'test' | 'prod' | null) ?? 'all',
    })

    return NextResponse.json({ items })
  } catch (error) {
    const message = error instanceof Error ? error.message : '链接列表读取失败。'
    const status = error instanceof AdminInputError ? error.status : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  const context = await getRouteContext()
  if (context instanceof NextResponse) {
    return context
  }

  try {
    const payload = await request.json().catch(() => null)

    if (payload && typeof payload === 'object' && payload.action === 'bulkMove') {
      const linkIds = Array.isArray(payload.linkIds) ? payload.linkIds : []
      const categoryId = typeof payload.categoryId === 'string' ? payload.categoryId : ''
      await moveAdminLinksToCategory(context.supabase, context.user.id, linkIds, categoryId)
      return NextResponse.json({ success: true })
    }

    const item = await createAdminLink(context.supabase, context.user.id, payload)
    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : '链接操作失败。'
    const status = error instanceof AdminInputError ? error.status : 500
    return NextResponse.json({ error: message }, { status })
  }
}
