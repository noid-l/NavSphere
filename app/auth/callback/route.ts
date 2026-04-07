import { NextResponse } from 'next/server'

import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  const redirectUrl = new URL(next, requestUrl.origin)

  if (!code) {
    return NextResponse.redirect(redirectUrl)
  }

  const supabase = await createRouteHandlerSupabaseClient()
  await supabase.auth.exchangeCodeForSession(code)

  return NextResponse.redirect(redirectUrl)
}

