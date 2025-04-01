'use client'
import { Redirect } from '@/components/redirect'
import { useSpaceList } from '@/hooks/spaces'

export default function SpacesPage() {
  const spaces = useSpaceList()

  const redirectSpaceId = spaces[0]?.id

  if (spaces.length === 0 || !redirectSpaceId) {
    return <Redirect to="/onboarding" />
  }

  return <Redirect to={`/s/${redirectSpaceId}`} />
}
