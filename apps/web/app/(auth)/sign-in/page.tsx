import { syncClerkUser } from '@6pm/db/services/user'
import { auth } from '@clerk/nextjs/server'
import { RedirectType, redirect } from 'next/navigation'

export default async function SignInPage(props: {
  searchParams?: Promise<{
    next?: string
  }>
}) {
  const { userId, redirectToSignIn } = await auth()

  if (!userId) {
    return redirectToSignIn()
  }

  // Find the user in the database or sync it from Clerk
  await syncClerkUser(userId)

  const { next } = (await props.searchParams) || {}
  return redirect(next || '/spaces', RedirectType.replace)
}
