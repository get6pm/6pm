import { useUserSettingsStore } from '@/stores/user-settings/store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

// 30 seconds
const BIO_AUTH_EXPIRATION_TIME = 1000 * 30

export function useLocalAuth() {
  const [shouldAuthLocal, setShouldAuthLocal] = useState(false)
  const { enabledLocalAuth } = useUserSettingsStore()

  const changeAppStateListener = useCallback(
    async (status: AppStateStatus) => {
      if (!enabledLocalAuth) {
        AsyncStorage.removeItem('movedToBackgroundAt')
        return
      }

      if (status === 'background') {
        const date = Date.now()
        await AsyncStorage.setItem('movedToBackgroundAt', date.toString())
      }

      if (status === 'active') {
        const date = await AsyncStorage.getItem('movedToBackgroundAt')
        if (date && Date.now() - Number(date) >= BIO_AUTH_EXPIRATION_TIME) {
          await AsyncStorage.removeItem('movedToBackgroundAt')
          setShouldAuthLocal(true)
        }
      }
    },
    [enabledLocalAuth],
  )

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      changeAppStateListener,
    )
    return subscription.remove
  }, [changeAppStateListener])

  return {
    shouldAuthLocal,
    setShouldAuthLocal,
  }
}
