import { getAuthUser } from '@/actions/get-auth-user'
import { OnboardingWizard } from '@/app/(app)/onboarding/_components/onboarding-wizard'
import getMetadata from '@/lib/get-metadata'

export const metadata = getMetadata({
  title: 'Onboarding',
})

export default async function OnboardingPage() {
  const { data: user } = await getAuthUser()
  if (!user) {
    return null
  }
  return <OnboardingWizard userName={user.firstName} />
}
