'use client'
import type { Space, SpaceMembership, User } from '@6pm/db'
import { keyBy } from 'lodash-es'
import {
  type FC,
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
} from 'react'
import { type ExtractState, useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'
import { type AppStore, createAppStore } from './app-store'

const AppContext = createContext<AppStore | null>(null)

export type AppProviderProps = {
  children: ReactNode
  user: User
  spaceMemberships: (SpaceMembership & { space: Space })[]
}

export const AppProvider: FC<AppProviderProps> = ({
  user,
  spaceMemberships,
  children,
}) => {
  const storeRef = useRef<AppStore>(null)

  if (!storeRef.current) {
    const spaces = spaceMemberships.map((membership) => ({
      ...membership.space,
      spaceMembership: membership,
      categories: {},
      accounts: {},
      transactions: {},
    }))

    const store = createAppStore({
      lastSyncedAt: null,
      user,
      spaces: keyBy(
        spaces.map((space) => ({
          ...space,
          categories: {},
          accounts: {},
          transactions: {},
          spaceMemberships: {},
        })),
        'id',
      ),
    })
    storeRef.current = store
  }

  return (
    <AppContext value={storeRef.current}>
      {children}
      <SpacesDataFetcher />
    </AppContext>
  )
}

export function useAppContext<T>(
  selector: (state: ExtractState<AppStore>) => T,
): T {
  const store = useContext(AppContext)
  const shallow = useShallow(selector)
  if (!store) {
    throw new Error('Missing AppContext.Provider in the tree')
  }
  return useStore(store, shallow)
}

export type SpacesDataFetcherProps = {}

export const SpacesDataFetcher: FC<SpacesDataFetcherProps> = () => {
  const { fetchSpacesData } = useAppContext((state) => ({
    fetchSpacesData: state.fetchSpacesData,
  }))

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null
    const fetchData = async () => {
      try {
        await fetchSpacesData()
      } finally {
        timeout = setTimeout(fetchData, 1000 * 30)
      }
    }

    fetchData()

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [])

  return null
}
