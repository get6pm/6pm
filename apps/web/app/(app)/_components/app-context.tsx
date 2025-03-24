'use client'
import type { syncUserFromClerk } from '@/actions/sync-user-from-clerk'
import { updateUserMetadata } from '@/actions/update-user-metadata'
import { createContext, useContext, useState } from 'react'

export type AppContextType = {
  user: NonNullable<Awaited<ReturnType<typeof syncUserFromClerk>>['data']>
}

export const AppContext = createContext<AppContextType | undefined>(undefined)

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppContext.Provider')
  }
  return context
}

export enum UserMetadataKey {
  LastVisitedSpaceId = 'last_visited_space_id',
}

export const useUserMetadata = () => {
  const context = useAppContext()
  const [metadata, setMetadata] = useState(context.user.metadata)

  const getMetadata = (key: UserMetadataKey) =>
    metadata.find((m) => m.key === key)?.value

  const handleSetMetadata = async (key: UserMetadataKey, value: string) => {
    const { data: updatedMetadata, success } = await updateUserMetadata({
      key,
      value,
    })

    if (success) {
      setMetadata(updatedMetadata)
    } else {
      console.error('Failed to update user metadata')
    }
  }

  return { getMetadata, setMetadata: handleSetMetadata }
}
