import AsyncStorage from '@react-native-async-storage/async-storage'
import { type ClassValue, clsx } from 'clsx'
import { Platform } from 'react-native'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function clearAsyncStorage() {
  const asyncStorageKeys = await AsyncStorage.getAllKeys()
  if (asyncStorageKeys.length > 0) {
    if (Platform.OS === 'android') {
      await AsyncStorage.clear()
    }
    if (Platform.OS === 'ios') {
      await AsyncStorage.multiRemove(asyncStorageKeys)
    }
  }
}
