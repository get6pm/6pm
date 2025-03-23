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

  const { next } = (await props.searchParams) || {}
  return redirect(next || '/spaces', RedirectType.replace)
}
