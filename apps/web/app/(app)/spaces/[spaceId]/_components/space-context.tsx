'use client'

import type { findSpace } from '@6pm/db/services/space'
import { createContext, useContext } from 'react'

export type SpaceContextType = {
  space: NonNullable<Awaited<ReturnType<typeof findSpace>>>
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
