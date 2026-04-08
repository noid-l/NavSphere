import { cache } from 'react'
import { redirect } from 'next/navigation'

import { hasSupabaseEnv } from '@/lib/env'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const getCachedCurrentUser = cache(async () => {
  if (!hasSupabaseEnv) {
    return null
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
})

export async function getOptionalCurrentUser() {
  return getCachedCurrentUser()
}

export async function getRequiredCurrentUser() {
  const user = await getOptionalCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return user
}
