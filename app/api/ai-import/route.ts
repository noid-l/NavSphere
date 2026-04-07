import { NextResponse } from 'next/server'

import { isAiImportPayload } from '@/lib/data/validators'
import { hasSupabaseEnv } from '@/lib/env'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!hasSupabaseEnv) {
    return NextResponse.json(
      { error: 'Supabase 环境变量未配置，暂时无法写入数据。' },
      { status: 503 },
    )
  }

  const payload = await request.json().catch(() => null)

  if (!isAiImportPayload(payload)) {
    return NextResponse.json(
      { error: 'JSON 结构无效，请检查 category 与 links 字段。' },
      { status: 400 },
    )
  }

  const supabase = await createRouteHandlerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '请先登录后再导入导航数据。' }, { status: 401 })
  }

  const normalizedCategory = {
    name: payload.category.name.trim(),
    description: payload.category.description?.trim() || null,
    sort: payload.category.sort ?? 100,
    is_public: payload.category.is_public ?? false,
    created_by: user.id,
  }

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .upsert(normalizedCategory, {
      onConflict: 'created_by,name',
    })
    .select('id, name')
    .single()

  if (categoryError || !category) {
    return NextResponse.json(
      { error: categoryError?.message ?? '分类创建失败。' },
      { status: 500 },
    )
  }

  const rows = payload.links.map((link, index) => ({
    name: link.name.trim(),
    url: link.url.trim(),
    env: link.env ?? 'prod',
    description: link.description?.trim() || null,
    icon: link.icon?.trim() || null,
    sort: link.sort ?? (index + 1) * 10,
    is_public: link.is_public ?? false,
    category_id: category.id,
    created_by: user.id,
  }))

  const { data: links, error: linksError } = await supabase
    .from('links')
    .upsert(rows, {
      onConflict: 'created_by,category_id,name',
    })
    .select('id, name, url, env')

  if (linksError) {
    return NextResponse.json({ error: linksError.message }, { status: 500 })
  }

  return NextResponse.json({
    category,
    insertedCount: links?.length ?? 0,
    links,
  })
}

