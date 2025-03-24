import { getAuthUser } from '@/actions/get-auth-user'
import { redirect } from 'next/navigation'
import { UserMetadataKey } from '../_components/app-context'

export default async function SpacesPage() {
  const { data: user } = await getAuthUser()

  if (!user) {
    return null
  }

  const { spaceMemberships } = user

  if (spaceMemberships.length === 0) {
    return redirect('/onboarding')
  }

  const lastVisitedSpaceId = user.metadata.find(
    (m) => m.key === UserMetadataKey.LastVisitedSpaceId,
  )?.value
  const lastVisitedSpace = spaceMemberships.find(
    (m) => m.space.id === lastVisitedSpaceId,
  )
  const redirectSpaceId = lastVisitedSpace
    ? lastVisitedSpace.space.id
    : spaceMemberships[0]?.spaceId!

  return redirect(`/spaces/${redirectSpaceId}`)
}
