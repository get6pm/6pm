'use client'
import type { syncUserFromClerk } from '@6pm/db/services/user'
import { createContext, useContext, useState } from 'react'
import { updateUserMetadataAction } from '../actions'

export type AppContextType = {
  user: Awaited<ReturnType<typeof syncUserFromClerk>>
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
    const updatedMetadata = await updateUserMetadataAction({ key, value })
    setMetadata(updatedMetadata)
  }

  return { getMetadata, setMetadata: handleSetMetadata }
}
