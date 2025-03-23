'use client'
import type { PropsWithChildren } from 'react'
import { AppContext, type AppContextType } from './app-context'

export const AppProvider = ({
  children,
  user,
}: PropsWithChildren & AppContextType) => {
  return <AppContext.Provider value={{ user }}>{children}</AppContext.Provider>
}
