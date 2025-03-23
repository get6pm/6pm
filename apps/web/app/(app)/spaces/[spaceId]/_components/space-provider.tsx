'use client'
import type { PropsWithChildren } from 'react'
import { SpaceContext, type SpaceContextType } from './space-context'

const SpaceProvider: React.FC<PropsWithChildren & SpaceContextType> = ({
  children,
  space,
}) => {
  return (
    <SpaceContext.Provider value={{ space }}>{children}</SpaceContext.Provider>
  )
}

export default SpaceProvider
