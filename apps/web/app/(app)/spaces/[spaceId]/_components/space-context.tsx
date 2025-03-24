'use client'

import type { Space, SpaceMembership } from '@6pm/db'
import { createContext, useContext } from 'react'

export type SpaceContextType = {
  space: Space & { spaceMemberships: SpaceMembership[] }
}

export const SpaceContext = createContext<SpaceContextType | undefined>(
  undefined,
)

export const useSpaceContext = () => {
  const context = useContext(SpaceContext)
  if (!context) {
    throw new Error(
      'useSpaceContext must be used within a SpaceContext.Provider',
    )
  }
  return context
}
