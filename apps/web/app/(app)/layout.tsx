import { syncUserFromClerk } from '@/actions/sync-user-from-clerk'
import { AppProvider } from '@/store/app-provider'
import { RedirectType, redirect } from 'next/navigation'
import type { PropsWithChildren } from 'react'
import { AppProvider as LegacyAppProvider } from './_components/app-provider'

export default async function AppLayout(props: PropsWithChildren) {
  // Find the user in the database or sync it from Clerk
  const { data: user, success } = await syncUserFromClerk()

  if (!success) {
    return redirect('/', RedirectType.replace)
  }

  return (
    <LegacyAppProvider user={user}>
      <AppProvider user={user} spaceMemberships={user.spaceMemberships}>
        {props.children}
      </AppProvider>
    </LegacyAppProvider>
  )
}
