import { NextResponse } from 'next/server'

import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler'

function getSafeNext(value: string | null) {
  if (!value) {
    return '/'
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/'
  }

  return value
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = getSafeNext(requestUrl.searchParams.get('next'))

  const redirectUrl = new URL(next, requestUrl.origin)
  const loginUrl = new URL('/login', requestUrl.origin)
  loginUrl.searchParams.set('next', next)

  if (!code) {
    loginUrl.searchParams.set('error', 'missing_code')
    return NextResponse.redirect(loginUrl)
  }

  const supabase = await createRouteHandlerSupabaseClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    loginUrl.searchParams.set('error', 'oauth_exchange_failed')
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.redirect(redirectUrl)
}
