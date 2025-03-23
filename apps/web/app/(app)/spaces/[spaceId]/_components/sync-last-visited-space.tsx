'use client'
import {
  UserMetadataKey,
  useUserMetadata,
} from '@/app/(app)/_components/app-context'
import { type FC, useEffect } from 'react'

export type SyncLastVisitedSpaceProps = {
  spaceId: string
}

export const SyncLastVisitedSpace: FC<SyncLastVisitedSpaceProps> = ({
  spaceId,
}) => {
  const { setMetadata, getMetadata } = useUserMetadata()
  const lastVisitedSpaceId = getMetadata(UserMetadataKey.LastVisitedSpaceId)

  useEffect(() => {
    if (lastVisitedSpaceId !== spaceId) {
      setMetadata(UserMetadataKey.LastVisitedSpaceId, spaceId)
    }
  }, [spaceId, lastVisitedSpaceId, setMetadata])

  return null
}
