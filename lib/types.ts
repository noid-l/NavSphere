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
  source: 'sample' | 'supabase' | 'error'
  errorMessage?: string
}

export type AiImportPayload = {
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

export type AiImportBatchPayload = AiImportPayload[]
