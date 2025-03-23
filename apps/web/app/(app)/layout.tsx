import { syncUserFromClerk } from '@6pm/db/services/user'
import { auth } from '@clerk/nextjs/server'
import { RedirectType, redirect } from 'next/navigation'
import type { PropsWithChildren } from 'react'

export default async function ProtectedLayout(props: PropsWithChildren) {
  const { userId } = await auth()
  if (!userId) {
    return redirect('/', RedirectType.replace)
  }

  // Find the user in the database or sync it from Clerk
  await syncUserFromClerk(userId)

  return props.children
}
