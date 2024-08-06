import { clearAsyncStorage } from '@/lib/utils'
import { useAuth } from '@clerk/clerk-expo'
import { useAsyncStorage } from '@react-native-async-storage/async-storage'
import { useQueryClient } from '@tanstack/react-query'
import {
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { StoreIntervalUpdate } from './store-interval-update'
import { useResetAllStores } from './use-reset-all-stores'

export type StoreProviderProps = {
  children: ReactNode
}

export const StoreProvider: FC<StoreProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false)
  const { userId } = useAuth()
  const queryClient = useQueryClient()
  const { getItem, setItem, removeItem } = useAsyncStorage('user-id')
  const resetAllStores = useResetAllStores()

  const handleUserChange = useCallback(async () => {
    const storedUserId = await getItem()

    if (storedUserId === userId) {
      return
    }

    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log('User changed, clearing storage', userId)

    await clearAsyncStorage()
    queryClient.clear()
    queryClient.invalidateQueries()
    resetAllStores()

    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log('Storage cleared')

    if (userId) {
      await setItem(userId)
    } else {
      await removeItem()
    }
  }, [getItem, queryClient, userId, removeItem, setItem, resetAllStores])

  // Clear the async storage & queryClient when the user changes
  useEffect(() => {
    handleUserChange().catch((error) => {
      console.error('Failed to clear storage', error)
    })

    setIsReady(true)
  }, [handleUserChange])

  if (!isReady) {
    return null
  }

  return (
    <>
      <StoreIntervalUpdate />
      {children}
    </>
  )
}
