import type { TokenCache } from '@clerk/clerk-expo/dist/cache'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        return await SecureStore.getItemAsync(key)
      } catch (error) {
        console.error('secure store get item error: ', error)
        await SecureStore.deleteItemAsync(key)
        return null
      }
    },
    saveToken: (key: string, token: string) => {
      return SecureStore.setItemAsync(key, token)
    },
  }
}

// SecureStore is not supported on the web
// https://github.com/expo/expo/issues/7744#issuecomment-611093485
export const tokenCache = Platform.OS !== 'web' ? createTokenCache() : undefined
