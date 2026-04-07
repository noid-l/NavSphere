'use client'

import { createBrowserClient } from '@supabase/ssr'

import { supabasePublishableKey, supabaseUrl } from '@/lib/env'
import type { Database } from '@/lib/supabase/types'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createOptionalBrowserSupabaseClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    return null
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabasePublishableKey)
  }

  return browserClient
}
