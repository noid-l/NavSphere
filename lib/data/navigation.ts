import { hasSupabaseEnv } from '@/lib/env'
import type { NavigationSnapshot } from '@/lib/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type CategoryQueryRow = {
  id: string
  name: string
  description: string | null
  sort: number
  is_public: boolean
}

type LinkQueryRow = {
  id: string
  name: string
  url: string
  env: 'test' | 'prod'
  description: string | null
  icon: string | null
  sort: number
  is_public: boolean
  category_id: string
}

export async function getNavigationSnapshot(): Promise<NavigationSnapshot> {
  if (!hasSupabaseEnv) {
    return {
      groups: [],
      totalCategories: 0,
      totalLinks: 0,
      isConfigured: false,
      source: 'error',
      errorMessage: 'Supabase 环境变量缺失，当前无法读取导航数据。',
    }
  }

  try {
    const supabase = await createServerSupabaseClient()

    const [{ data: categories, error: categoriesError }, { data: links, error: linksError }] =
      await Promise.all([
        supabase
          .from('categories')
          .select('id, name, description, sort, is_public')
          .order('sort', { ascending: true }),
        supabase
          .from('links')
          .select('id, name, url, env, description, icon, sort, is_public, category_id')
          .order('sort', { ascending: true }),
      ])

    if (categoriesError) {
      throw categoriesError
    }

    if (linksError) {
      throw linksError
    }

    return buildSnapshot(categories ?? [], links ?? [])
  } catch (error) {
    return {
      groups: [],
      totalCategories: 0,
      totalLinks: 0,
      isConfigured: true,
      source: 'error',
      errorMessage: error instanceof Error ? error.message : '未知错误',
    }
  }
}

function buildSnapshot(
  categories: CategoryQueryRow[],
  links: LinkQueryRow[],
): NavigationSnapshot {
  const categoriesMap = new Map(
    categories.map((category) => [
      category.id,
      {
        id: category.id,
        name: category.name,
        description: category.description,
        sort: category.sort,
        isPublic: category.is_public,
      },
    ]),
  )

  const grouped = new Map<string, NavigationSnapshot['groups'][number]>()

  for (const category of categoriesMap.values()) {
    grouped.set(category.id, {
      category,
      links: [],
    })
  }

  for (const link of links) {
    const existingGroup = grouped.get(link.category_id)

    if (!existingGroup) {
      continue
    }

    existingGroup.links.push({
      id: link.id,
      name: link.name,
      url: link.url,
      env: link.env,
      description: link.description,
      icon: link.icon,
      sort: link.sort,
      isPublic: link.is_public,
      categoryId: link.category_id,
    })
  }

  const groups = Array.from(grouped.values())
    .filter((group) => group.links.length > 0)
    .sort((left, right) => left.category.sort - right.category.sort)

  return {
    groups,
    totalCategories: groups.length,
    totalLinks: groups.reduce((total, group) => total + group.links.length, 0),
    isConfigured: true,
    source: 'supabase',
  }
}
