import { syncUserFromClerk } from '@6pm/db/services/user'
import { auth } from '@clerk/nextjs/server'
import { RedirectType, redirect } from 'next/navigation'
import type { PropsWithChildren } from 'react'
import { AppProvider } from './_components/app-provider'

export default async function AppLayout(props: PropsWithChildren) {
  const { userId } = await auth()
  if (!userId) {
    return redirect('/', RedirectType.replace)
  }

  // Find the user in the database or sync it from Clerk
  const user = await syncUserFromClerk(userId)

  return <AppProvider user={user}>{props.children}</AppProvider>
}
