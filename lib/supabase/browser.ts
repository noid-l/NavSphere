'use client'

import { createBrowserClient } from '@supabase/ssr'

import { supabaseAnonKey, supabaseUrl } from '@/lib/env'
import type { Database } from '@/lib/supabase/types'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createOptionalBrowserSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  return browserClient
}

