import type { DataImportPayload, LinkEnv } from '@/lib/types'

import { isDataImportBatchPayload, isDataImportPayload } from '@/lib/data/validators'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler'

type SupabaseClient = Awaited<ReturnType<typeof createRouteHandlerSupabaseClient>>

export type ImportedCategoryResult = {
  category: {
    id: string
    name: string
  }
  insertedCount: number
  links: Array<{
    id: string
    name: string
    url: string
    env: LinkEnv
  }>
}

export function parseDataImportItems(payload: unknown): DataImportPayload[] | null {
  if (isDataImportPayload(payload)) {
    return [payload]
  }

  if (isDataImportBatchPayload(payload)) {
    return payload
  }

  return null
}

async function importCategory(
  supabase: SupabaseClient,
  userId: string,
  payload: DataImportPayload,
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

  const seen = new Map<string, number>()

  payload.links.forEach((link, index) => {
    seen.set(link.name.trim(), index)
  })

  const rows = [...seen.values()].map((index) => ({
    name: payload.links[index].name.trim(),
    url: payload.links[index].url.trim(),
    env: payload.links[index].env ?? 'prod',
    description: payload.links[index].description?.trim() || null,
    icon: payload.links[index].icon?.trim() || null,
    sort: payload.links[index].sort ?? index + 1,
    is_public: payload.links[index].is_public ?? false,
    category_id: category.id,
    created_by: userId,
  }))

  if (rows.length === 0) {
    return {
      category,
      insertedCount: 0,
      links: [],
    }
  }

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

export async function importDataItems(
  supabase: SupabaseClient,
  userId: string,
  items: DataImportPayload[],
) {
  const results: ImportedCategoryResult[] = []

  for (const item of items) {
    const result = await importCategory(supabase, userId, item)

    if ('error' in result) {
      return {
        error: `分类"${item.category.name}"导入失败：${result.error}`,
        results,
      }
    }

    results.push(result)
  }

  return { results }
}
