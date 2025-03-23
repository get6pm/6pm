import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import getMetadata from '@/lib/get-metadata'
import { getUser } from '@6pm/db/services/user'
import { auth } from '@clerk/nextjs/server'
import { createSpaceAction } from './actions'

export const metadata = getMetadata({
  title: 'Onboarding',
})

export default async function OnboardingPage() {
  const { userId } = await auth()
  const user = await getUser({ id: userId! })
  return <OnboardingWizard user={user} createSpace={createSpaceAction} />
}
