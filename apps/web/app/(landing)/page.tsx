import { auth } from '@clerk/nextjs/server'

export default async function Page() {
  const { userId, redirectToSignIn } = await auth()
  if (!userId) return redirectToSignIn()
  // Redirect to last workspace
}
