import { NavigationShell } from '@/components/navigation-shell'
import { getNavigationSnapshot } from '@/lib/data/navigation'
import { getOptionalCurrentUser } from '@/lib/supabase/auth'

export default async function HomePage() {
  const [snapshot, user] = await Promise.all([
    getNavigationSnapshot(),
    getOptionalCurrentUser(),
  ])

  return <NavigationShell snapshot={snapshot} initialUserEmail={user?.email ?? null} />
}

