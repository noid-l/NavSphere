import { NextResponse } from 'next/server'

import {
  AdminInputError,
  deleteAdminCategory,
  updateAdminCategory,
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRouteContext()
  if (context instanceof NextResponse) {
    return context
  }

  try {
    const payload = await request.json().catch(() => null)
    const { id } = await params
    const item = await updateAdminCategory(context.supabase, context.user.id, id, payload)
    return NextResponse.json({ item })
  } catch (error) {
    const message = error instanceof Error ? error.message : '分类更新失败。'
    const status = error instanceof AdminInputError ? error.status : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRouteContext()
  if (context instanceof NextResponse) {
    return context
  }

  try {
    const { id } = await params
    await deleteAdminCategory(context.supabase, context.user.id, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '分类删除失败。'
    const status = error instanceof AdminInputError ? error.status : 500
    return NextResponse.json({ error: message }, { status })
  }
}
