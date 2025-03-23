import { auth } from '@clerk/nextjs/server'
import { RedirectType, redirect } from 'next/navigation'
import type { PropsWithChildren } from 'react'

export default async function ProtectedLayout(props: PropsWithChildren) {
  const { userId } = await auth()
  if (!userId) {
    return redirect('/', RedirectType.replace)
  }

  return props.children
}
