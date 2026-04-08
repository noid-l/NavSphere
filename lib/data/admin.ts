import type {
  AdminCategoryItem,
  AdminCategoryOption,
  AdminLinkItem,
  AdminOverviewStats,
  LinkEnv,
} from '@/lib/types'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

type CategoryRow = {
  id: string
  name: string
  description: string | null
  sort: number
  is_public: boolean
  updated_at: string
}

type LinkRow = {
  id: string
  name: string
  url: string
  env: LinkEnv
  description: string | null
  icon: string | null
  sort: number
  is_public: boolean
  updated_at: string
  category_id: string
}

export type CategoryFilters = {
  query?: string | null
  visibility?: 'all' | 'public' | 'private'
  sortMode?: 'sort' | 'updated' | 'name'
}

export type LinkFilters = {
  query?: string | null
  categoryId?: string | null
  visibility?: 'all' | 'public' | 'private'
  env?: 'all' | LinkEnv
}

export class AdminInputError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'AdminInputError'
    this.status = status
  }
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeOptionalText(value: unknown) {
  const text = normalizeText(value)
  return text || null
}

function normalizeCategoryName(value: unknown) {
  const text = normalizeText(value)
  return text
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join(' / ')
}

function normalizeSort(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isInteger(parsed)) {
      return parsed
    }
  }

  return fallback
}

function ensureHttpUrl(url: string) {
  if (!/^https?:\/\//i.test(url)) {
    throw new AdminInputError('链接 URL 必须以 http:// 或 https:// 开头。')
  }
}

async function ensureOwnedCategory(supabase: SupabaseClient, userId: string, categoryId: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, sort')
    .eq('created_by', userId)
    .eq('id', categoryId)
    .maybeSingle()

  if (error) {
    throw new AdminInputError(error.message, 500)
  }

  if (!data) {
    throw new AdminInputError('未找到目标分类，或该分类不属于当前用户。', 404)
  }

  return data
}

async function getNextLinkSort(supabase: SupabaseClient, userId: string, categoryId: string) {
  const { data, error } = await supabase
    .from('links')
    .select('sort')
    .eq('created_by', userId)
    .eq('category_id', categoryId)
    .order('sort', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new AdminInputError(error.message, 500)
  }

  return (data?.sort ?? 0) + 1
}

function handleDatabaseError(error: { code?: string | null; message: string }): never {
  if (error.code === '23505') {
    throw new AdminInputError('检测到重复名称，请调整后重试。', 409)
  }

  throw new AdminInputError(error.message, 500)
}

function compareByCategoryAndSort(
  left: AdminLinkItem,
  right: AdminLinkItem,
  categoryMap: Map<string, AdminCategoryOption>,
) {
  const leftCategory = categoryMap.get(left.categoryId)
  const rightCategory = categoryMap.get(right.categoryId)

  if (leftCategory && rightCategory && leftCategory.sort !== rightCategory.sort) {
    return leftCategory.sort - rightCategory.sort
  }

  if (left.categoryName !== right.categoryName) {
    return left.categoryName.localeCompare(right.categoryName, 'zh-CN')
  }

  return left.sort - right.sort
}

export async function getAdminOverviewStats(
  supabase: SupabaseClient,
  userId: string,
): Promise<AdminOverviewStats> {
  const [{ data: categories, error: categoriesError }, { data: links, error: linksError }] =
    await Promise.all([
      supabase
        .from('categories')
        .select('id, updated_at')
        .eq('created_by', userId),
      supabase
        .from('links')
        .select('id, category_id, is_public, updated_at')
        .eq('created_by', userId),
    ])

  if (categoriesError) {
    throw new AdminInputError(categoriesError.message, 500)
  }

  if (linksError) {
    throw new AdminInputError(linksError.message, 500)
  }

  const counts = new Map<string, number>()

  for (const link of links ?? []) {
    counts.set(link.category_id, (counts.get(link.category_id) ?? 0) + 1)
  }

  const timestamps = [...(categories ?? []), ...(links ?? [])].map((item) => item.updated_at)
  const recentUpdatedAt = timestamps.length
    ? timestamps.sort((left, right) => right.localeCompare(left))[0]
    : null

  return {
    totalCategories: categories?.length ?? 0,
    totalLinks: links?.length ?? 0,
    emptyCategories: (categories ?? []).filter((category) => !counts.get(category.id)).length,
    privateLinks: (links ?? []).filter((link) => !link.is_public).length,
    recentUpdatedAt,
  }
}

export async function listAdminCategoryOptions(
  supabase: SupabaseClient,
  userId: string,
): Promise<AdminCategoryOption[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, sort')
    .eq('created_by', userId)
    .order('sort', { ascending: true })

  if (error) {
    throw new AdminInputError(error.message, 500)
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    sort: item.sort,
  }))
}

export async function listAdminCategories(
  supabase: SupabaseClient,
  userId: string,
  filters: CategoryFilters = {},
): Promise<AdminCategoryItem[]> {
  const [{ data: categories, error: categoriesError }, { data: links, error: linksError }] =
    await Promise.all([
      supabase
        .from('categories')
        .select('id, name, description, sort, is_public, updated_at')
        .eq('created_by', userId),
      supabase.from('links').select('id, category_id').eq('created_by', userId),
    ])

  if (categoriesError) {
    throw new AdminInputError(categoriesError.message, 500)
  }

  if (linksError) {
    throw new AdminInputError(linksError.message, 500)
  }

  const counts = new Map<string, number>()
  for (const link of links ?? []) {
    counts.set(link.category_id, (counts.get(link.category_id) ?? 0) + 1)
  }

  const keyword = normalizeText(filters.query).toLowerCase()

  const items = (categories ?? [])
    .map<AdminCategoryItem>((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      sort: category.sort,
      isPublic: category.is_public,
      updatedAt: category.updated_at,
      linkCount: counts.get(category.id) ?? 0,
      isEmpty: !counts.get(category.id),
    }))
    .filter((item) => {
      if (filters.visibility === 'public' && !item.isPublic) {
        return false
      }

      if (filters.visibility === 'private' && item.isPublic) {
        return false
      }

      if (!keyword) {
        return true
      }

      return [item.name, item.description ?? ''].join(' ').toLowerCase().includes(keyword)
    })

  if (filters.sortMode === 'name') {
    items.sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
  } else if (filters.sortMode === 'updated') {
    items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  } else {
    items.sort((left, right) => left.sort - right.sort)
  }

  return items
}

export async function listAdminLinks(
  supabase: SupabaseClient,
  userId: string,
  filters: LinkFilters = {},
): Promise<AdminLinkItem[]> {
  const [categories, linksResponse] = await Promise.all([
    listAdminCategoryOptions(supabase, userId),
    supabase
      .from('links')
      .select('id, name, url, env, description, icon, sort, is_public, updated_at, category_id')
      .eq('created_by', userId),
  ])

  if (linksResponse.error) {
    throw new AdminInputError(linksResponse.error.message, 500)
  }

  const categoryMap = new Map(categories.map((category) => [category.id, category]))
  const keyword = normalizeText(filters.query).toLowerCase()

  const items = (linksResponse.data ?? [])
    .map<AdminLinkItem | null>((link) => {
      const category = categoryMap.get(link.category_id)
      if (!category) {
        return null
      }

      return {
        id: link.id,
        name: link.name,
        url: link.url,
        env: link.env,
        description: link.description,
        icon: link.icon,
        sort: link.sort,
        isPublic: link.is_public,
        updatedAt: link.updated_at,
        categoryId: link.category_id,
        categoryName: category.name,
      }
    })
    .filter((item): item is AdminLinkItem => Boolean(item))
    .filter((item) => {
      if (filters.categoryId && item.categoryId !== filters.categoryId) {
        return false
      }

      if (filters.visibility === 'public' && !item.isPublic) {
        return false
      }

      if (filters.visibility === 'private' && item.isPublic) {
        return false
      }

      if (filters.env && filters.env !== 'all' && item.env !== filters.env) {
        return false
      }

      if (!keyword) {
        return true
      }

      return [item.name, item.url, item.description ?? '', item.categoryName]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    })

  items.sort((left, right) => compareByCategoryAndSort(left, right, categoryMap))
  return items
}

export async function createAdminCategory(supabase: SupabaseClient, userId: string, payload: unknown) {
  const body = typeof payload === 'object' && payload !== null ? payload : {}
  const name = normalizeCategoryName((body as Record<string, unknown>).name)

  if (!name) {
    throw new AdminInputError('分类名称不能为空。')
  }

  const row: Database['public']['Tables']['categories']['Insert'] = {
    name,
    description: normalizeOptionalText((body as Record<string, unknown>).description),
    sort: normalizeSort((body as Record<string, unknown>).sort, 100),
    is_public: Boolean((body as Record<string, unknown>).is_public),
    created_by: userId,
  }

  const { data, error } = await supabase
    .from('categories')
    .insert(row)
    .select('id, name, description, sort, is_public, updated_at')
    .single()

  if (error || !data) {
    handleDatabaseError(error ?? { message: '分类创建失败。' })
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    sort: data.sort,
    isPublic: data.is_public,
    updatedAt: data.updated_at,
    linkCount: 0,
    isEmpty: true,
  } satisfies AdminCategoryItem
}

export async function updateAdminCategory(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  payload: unknown,
) {
  await ensureOwnedCategory(supabase, userId, id)

  const body = typeof payload === 'object' && payload !== null ? payload : {}
  const updates: Database['public']['Tables']['categories']['Update'] = {}

  if ('name' in body) {
    const name = normalizeCategoryName((body as Record<string, unknown>).name)
    if (!name) {
      throw new AdminInputError('分类名称不能为空。')
    }
    updates.name = name
  }

  if ('description' in body) {
    updates.description = normalizeOptionalText((body as Record<string, unknown>).description)
  }

  if ('sort' in body) {
    updates.sort = normalizeSort((body as Record<string, unknown>).sort, 100)
  }

  if ('is_public' in body) {
    updates.is_public = Boolean((body as Record<string, unknown>).is_public)
  }

  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('created_by', userId)
    .eq('id', id)
    .select('id, name, description, sort, is_public, updated_at')
    .single()

  if (error || !data) {
    handleDatabaseError(error ?? { message: '分类更新失败。' })
  }

  const { count, error: countError } = await supabase
    .from('links')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId)
    .eq('category_id', id)

  if (countError) {
    throw new AdminInputError(countError.message, 500)
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    sort: data.sort,
    isPublic: data.is_public,
    updatedAt: data.updated_at,
    linkCount: count ?? 0,
    isEmpty: (count ?? 0) === 0,
  } satisfies AdminCategoryItem
}

export async function deleteAdminCategory(
  supabase: SupabaseClient,
  userId: string,
  id: string,
) {
  await ensureOwnedCategory(supabase, userId, id)

  const { count, error: countError } = await supabase
    .from('links')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId)
    .eq('category_id', id)

  if (countError) {
    throw new AdminInputError(countError.message, 500)
  }

  if ((count ?? 0) > 0) {
    throw new AdminInputError('该分类下仍有链接，请先迁移或删除链接后再删除分类。', 409)
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('created_by', userId)
    .eq('id', id)

  if (error) {
    throw new AdminInputError(error.message, 500)
  }
}

export async function reorderAdminCategories(
  supabase: SupabaseClient,
  userId: string,
  orderedIds: string[],
) {
  const ids = [...new Set(orderedIds.filter(Boolean))]

  const { data, error } = await supabase
    .from('categories')
    .select('id, sort')
    .eq('created_by', userId)
    .order('sort', { ascending: true })

  if (error) {
    throw new AdminInputError(error.message, 500)
  }

  const existingIds = (data ?? []).map((item) => item.id)
  const existingSet = new Set(existingIds)

  for (const id of ids) {
    if (!existingSet.has(id)) {
      throw new AdminInputError('排序请求中包含无效分类。', 400)
    }
  }

  const nextOrder = [...ids, ...existingIds.filter((id) => !ids.includes(id))]

  for (let index = 0; index < nextOrder.length; index += 1) {
    const categoryId = nextOrder[index]
    const { error: updateError } = await supabase
      .from('categories')
      .update({ sort: index + 1 })
      .eq('created_by', userId)
      .eq('id', categoryId)

    if (updateError) {
      throw new AdminInputError(updateError.message, 500)
    }
  }
}

export async function createAdminLink(supabase: SupabaseClient, userId: string, payload: unknown) {
  const body = typeof payload === 'object' && payload !== null ? payload : {}
  const name = normalizeText((body as Record<string, unknown>).name)
  const url = normalizeText((body as Record<string, unknown>).url)
  const categoryId = normalizeText((body as Record<string, unknown>).category_id)
  const env = ((body as Record<string, unknown>).env ?? 'prod') as LinkEnv

  if (!name) {
    throw new AdminInputError('链接名称不能为空。')
  }

  if (!categoryId) {
    throw new AdminInputError('请选择所属分类。')
  }

  ensureHttpUrl(url)

  if (env !== 'test' && env !== 'prod') {
    throw new AdminInputError('环境字段仅支持 test 或 prod。')
  }

  await ensureOwnedCategory(supabase, userId, categoryId)

  const sortValue =
    'sort' in body
      ? normalizeSort((body as Record<string, unknown>).sort, 100)
      : await getNextLinkSort(supabase, userId, categoryId)

  const row: Database['public']['Tables']['links']['Insert'] = {
    name,
    url,
    env,
    category_id: categoryId,
    description: normalizeOptionalText((body as Record<string, unknown>).description),
    icon: normalizeOptionalText((body as Record<string, unknown>).icon),
    sort: sortValue,
    is_public: Boolean((body as Record<string, unknown>).is_public),
    created_by: userId,
  }

  const { data, error } = await supabase
    .from('links')
    .insert(row)
    .select('id, name, url, env, description, icon, sort, is_public, updated_at, category_id')
    .single()

  if (error || !data) {
    handleDatabaseError(error ?? { message: '链接创建失败。' })
  }

  const category = await ensureOwnedCategory(supabase, userId, data.category_id)

  return {
    id: data.id,
    name: data.name,
    url: data.url,
    env: data.env,
    description: data.description,
    icon: data.icon,
    sort: data.sort,
    isPublic: data.is_public,
    updatedAt: data.updated_at,
    categoryId: data.category_id,
    categoryName: category.name,
  } satisfies AdminLinkItem
}

export async function updateAdminLink(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  payload: unknown,
) {
  const { data: existing, error: existingError } = await supabase
    .from('links')
    .select('id, category_id')
    .eq('created_by', userId)
    .eq('id', id)
    .maybeSingle()

  if (existingError) {
    throw new AdminInputError(existingError.message, 500)
  }

  if (!existing) {
    throw new AdminInputError('未找到目标链接。', 404)
  }

  const body = typeof payload === 'object' && payload !== null ? payload : {}
  const updates: Database['public']['Tables']['links']['Update'] = {}

  if ('name' in body) {
    const name = normalizeText((body as Record<string, unknown>).name)
    if (!name) {
      throw new AdminInputError('链接名称不能为空。')
    }
    updates.name = name
  }

  if ('url' in body) {
    const url = normalizeText((body as Record<string, unknown>).url)
    ensureHttpUrl(url)
    updates.url = url
  }

  let nextCategoryId = existing.category_id
  if ('category_id' in body) {
    nextCategoryId = normalizeText((body as Record<string, unknown>).category_id)
    if (!nextCategoryId) {
      throw new AdminInputError('请选择所属分类。')
    }
    await ensureOwnedCategory(supabase, userId, nextCategoryId)
    updates.category_id = nextCategoryId
  }

  if ('env' in body) {
    const env = (body as Record<string, unknown>).env
    if (env !== 'test' && env !== 'prod') {
      throw new AdminInputError('环境字段仅支持 test 或 prod。')
    }
    updates.env = env
  }

  if ('description' in body) {
    updates.description = normalizeOptionalText((body as Record<string, unknown>).description)
  }

  if ('icon' in body) {
    updates.icon = normalizeOptionalText((body as Record<string, unknown>).icon)
  }

  if ('sort' in body) {
    updates.sort = normalizeSort((body as Record<string, unknown>).sort, 100)
  } else if ('category_id' in body && nextCategoryId !== existing.category_id) {
    updates.sort = await getNextLinkSort(supabase, userId, nextCategoryId)
  }

  if ('is_public' in body) {
    updates.is_public = Boolean((body as Record<string, unknown>).is_public)
  }

  const { data, error } = await supabase
    .from('links')
    .update(updates)
    .eq('created_by', userId)
    .eq('id', id)
    .select('id, name, url, env, description, icon, sort, is_public, updated_at, category_id')
    .single()

  if (error || !data) {
    handleDatabaseError(error ?? { message: '链接更新失败。' })
  }

  const category = await ensureOwnedCategory(supabase, userId, data.category_id)

  return {
    id: data.id,
    name: data.name,
    url: data.url,
    env: data.env,
    description: data.description,
    icon: data.icon,
    sort: data.sort,
    isPublic: data.is_public,
    updatedAt: data.updated_at,
    categoryId: data.category_id,
    categoryName: category.name,
  } satisfies AdminLinkItem
}

export async function deleteAdminLink(supabase: SupabaseClient, userId: string, id: string) {
  const { error } = await supabase
    .from('links')
    .delete()
    .eq('created_by', userId)
    .eq('id', id)

  if (error) {
    throw new AdminInputError(error.message, 500)
  }
}

export async function moveAdminLinksToCategory(
  supabase: SupabaseClient,
  userId: string,
  linkIds: string[],
  categoryId: string,
) {
  const ids = [...new Set(linkIds.filter(Boolean))]

  if (ids.length === 0) {
    throw new AdminInputError('请先选择要调整分类的链接。')
  }

  await ensureOwnedCategory(supabase, userId, categoryId)

  const { data: links, error } = await supabase
    .from('links')
    .select('id, name, sort, category_id')
    .eq('created_by', userId)
    .in('id', ids)
    .order('sort', { ascending: true })

  if (error) {
    throw new AdminInputError(error.message, 500)
  }

  if ((links ?? []).length !== ids.length) {
    throw new AdminInputError('部分链接不存在或不属于当前用户。', 404)
  }

  const { data: existing, error: existingError } = await supabase
    .from('links')
    .select('id, name, sort')
    .eq('created_by', userId)
    .eq('category_id', categoryId)

  if (existingError) {
    throw new AdminInputError(existingError.message, 500)
  }

  const movingSet = new Set(ids)
  const occupiedNames = new Set(
    (existing ?? []).filter((item) => !movingSet.has(item.id)).map((item) => item.name),
  )
  const movedNames = new Set<string>()

  for (const link of links ?? []) {
    if (occupiedNames.has(link.name) || movedNames.has(link.name)) {
      throw new AdminInputError(
        `目标分类中存在同名链接“${link.name}”，请先处理重名后再批量调整分类。`,
        409,
      )
    }

    movedNames.add(link.name)
  }

  const baseSort = Math.max(
    0,
    ...(existing ?? []).filter((item) => !movingSet.has(item.id)).map((item) => item.sort),
  )

  for (let index = 0; index < (links ?? []).length; index += 1) {
    const link = links?.[index]
    if (!link) {
      continue
    }

    const { error: updateError } = await supabase
      .from('links')
      .update({
        category_id: categoryId,
        sort: baseSort + index + 1,
      })
      .eq('created_by', userId)
      .eq('id', link.id)

    if (updateError) {
      handleDatabaseError(updateError)
    }
  }
}

export async function reorderAdminLinks(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  orderedIds: string[],
) {
  await ensureOwnedCategory(supabase, userId, categoryId)

  const ids = [...new Set(orderedIds.filter(Boolean))]
  const { data, error } = await supabase
    .from('links')
    .select('id, sort')
    .eq('created_by', userId)
    .eq('category_id', categoryId)
    .order('sort', { ascending: true })

  if (error) {
    throw new AdminInputError(error.message, 500)
  }

  const existingIds = (data ?? []).map((item) => item.id)
  const existingSet = new Set(existingIds)

  for (const id of ids) {
    if (!existingSet.has(id)) {
      throw new AdminInputError('排序请求中包含无效链接。', 400)
    }
  }

  const nextOrder = [...ids, ...existingIds.filter((id) => !ids.includes(id))]

  for (let index = 0; index < nextOrder.length; index += 1) {
    const linkId = nextOrder[index]
    const { error: updateError } = await supabase
      .from('links')
      .update({ sort: index + 1 })
      .eq('created_by', userId)
      .eq('id', linkId)

    if (updateError) {
      throw new AdminInputError(updateError.message, 500)
    }
  }
}
