import { redirect } from 'next/navigation'

export default async function SpacesPage() {
  const userSpaces = []

  if (userSpaces.length === 0) {
    return redirect('/onboarding')
  }

  return <>Spaces</>
}
