import getMetadata from '@/lib/get-metadata'

export const metadata = getMetadata({
  title: 'Onboarding',
})

export default async function OnboardingPage() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <h1 className="text-2xl font-bold">Onboarding</h1>
      <p className="mt-4">Welcome to the onboarding process!</p>
    </div>
  )
}
