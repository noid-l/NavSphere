import { NextResponse } from 'next/server'

import { importDataItems, parseDataImportItems } from '@/lib/data/import-service'
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
  const items = parseDataImportItems(payload)

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

  const result = await importDataItems(supabase, user.id, items)

  if ('error' in result) {
    return NextResponse.json(
      {
        error: result.error,
        importedCategories: result.results.map((entry) => entry.category.name),
        insertedCount: result.results.reduce((total, entry) => total + entry.insertedCount, 0),
      },
      { status: 500 },
    )
  }

  const { results } = result

  return NextResponse.json({
    category: results[0]?.category ?? null,
    categories: results.map((entry) => entry.category),
    insertedCount: results.reduce((total, entry) => total + entry.insertedCount, 0),
    importedCategories: results.length,
    links: results.flatMap((entry) => entry.links),
  })
}
