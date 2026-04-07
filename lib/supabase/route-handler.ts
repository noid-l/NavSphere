import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { supabasePublishableKey, supabaseUrl } from '@/lib/env'
import type { Database } from '@/lib/supabase/types'

export async function createRouteHandlerSupabaseClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Supabase env is missing.')
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      },
    },
  })
}
