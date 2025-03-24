import { syncUserFromClerk } from '@/actions/sync-user-from-clerk'
import { RedirectType, redirect } from 'next/navigation'
import type { PropsWithChildren } from 'react'
import { AppProvider } from './_components/app-provider'

export default async function AppLayout(props: PropsWithChildren) {
  // Find the user in the database or sync it from Clerk
  const { data: user, success } = await syncUserFromClerk()

  if (!success) {
    return redirect('/', RedirectType.replace)
  }

  return <AppProvider user={user}>{props.children}</AppProvider>
}
