import { NextResponse } from 'next/server'

import { isAiImportBatchPayload, isAiImportPayload } from '@/lib/data/validators'
import { hasSupabaseEnv } from '@/lib/env'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler'
import type { AiImportPayload } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function importCategory(
  supabase: Awaited<ReturnType<typeof createRouteHandlerSupabaseClient>>,
  userId: string,
  payload: AiImportPayload,
) {
  const normalizedCategory = {
    name: payload.category.name.trim(),
    description: payload.category.description?.trim() || null,
    sort: payload.category.sort ?? 100,
    is_public: payload.category.is_public ?? false,
    created_by: userId,
  }

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .upsert(normalizedCategory, {
      onConflict: 'created_by,name',
    })
    .select('id, name')
    .single()

  if (categoryError || !category) {
    return {
      error: categoryError?.message ?? '分类创建失败。',
    }
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
    created_by: userId,
  }))

  const { data: links, error: linksError } = await supabase
    .from('links')
    .upsert(rows, {
      onConflict: 'created_by,category_id,name',
    })
    .select('id, name, url, env')

  if (linksError) {
    return { error: linksError.message }
  }

  return {
    category,
    insertedCount: links?.length ?? 0,
    links: links ?? [],
  }
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv) {
    return NextResponse.json(
      { error: 'Supabase 环境变量未配置，暂时无法写入数据。' },
      { status: 503 },
    )
  }

  const payload = await request.json().catch(() => null)

  const items = isAiImportPayload(payload)
    ? [payload]
    : isAiImportBatchPayload(payload)
      ? payload
      : null

  if (!items) {
    return NextResponse.json(
      { error: 'JSON 结构无效，请检查 category 与 links 字段，或传入分类数组。' },
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

  const results = []

  for (const item of items) {
    const result = await importCategory(supabase, user.id, item)
    if ('error' in result) {
      return NextResponse.json(
        {
          error: `分类"${item.category.name}"导入失败：${result.error}`,
          importedCategories: results.map((entry) => entry.category.name),
          insertedCount: results.reduce((total, entry) => total + entry.insertedCount, 0),
        },
        { status: 500 },
      )
    }

    results.push(result)
  }

  return NextResponse.json({
    category: results[0]?.category ?? null,
    categories: results.map((entry) => entry.category),
    insertedCount: results.reduce((total, entry) => total + entry.insertedCount, 0),
    importedCategories: results.length,
    links: results.flatMap((entry) => entry.links),
  })
}
