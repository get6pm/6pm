import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import getMetadata from '@/lib/get-metadata'

export const metadata = getMetadata({
  title: 'Onboarding',
})

export default async function OnboardingPage() {
  return <OnboardingWizard />
}
