export type LinkEnv = 'test' | 'prod'

export type CategoryRecord = {
  id: string
  name: string
  description: string | null
  sort: number
  isPublic: boolean
}

export type NavLink = {
  id: string
  name: string
  url: string
  env: LinkEnv
  description: string | null
  icon: string | null
  sort: number
  isPublic: boolean
  categoryId: string
}

export type CategoryGroup = {
  category: CategoryRecord
  links: NavLink[]
}

export type NavigationSnapshot = {
  groups: CategoryGroup[]
  totalCategories: number
  totalLinks: number
  isConfigured: boolean
  source: 'supabase' | 'error'
  errorMessage?: string
}

export type DataImportPayload = {
  category: {
    name: string
    description?: string | null
    sort?: number
    is_public?: boolean
  }
  links: Array<{
    name: string
    url: string
    env?: LinkEnv
    description?: string | null
    icon?: string | null
    sort?: number
    is_public?: boolean
  }>
}

export type DataImportBatchPayload = DataImportPayload[]

export type AiImportPayload = DataImportPayload
export type AiImportBatchPayload = DataImportBatchPayload

export type AdminOverviewStats = {
  totalCategories: number
  totalLinks: number
  emptyCategories: number
  privateLinks: number
  recentUpdatedAt: string | null
}

export type AdminCategoryItem = {
  id: string
  name: string
  description: string | null
  sort: number
  isPublic: boolean
  updatedAt: string
  linkCount: number
  isEmpty: boolean
}

export type AdminCategoryOption = {
  id: string
  name: string
  sort: number
}

export type AdminLinkItem = {
  id: string
  name: string
  url: string
  env: LinkEnv
  description: string | null
  icon: string | null
  sort: number
  isPublic: boolean
  updatedAt: string
  categoryId: string
  categoryName: string
}
