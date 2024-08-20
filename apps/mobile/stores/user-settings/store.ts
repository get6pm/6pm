import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface UserSettingsStore {
  preferredCurrency?: string
  setPreferredCurrency: (preferredCurrency: string) => void
  enabledPushNotifications: boolean
  setEnabledPushNotifications: (enabledPushNotifications: boolean) => void
}

export const useUserSettingsStore = create<UserSettingsStore>()(
  persist(
    (set) => ({
      preferredCurrency: undefined,
      setPreferredCurrency: (preferredCurrency) => set({ preferredCurrency }),
      enabledPushNotifications: false,
      setEnabledPushNotifications: (enabledPushNotifications) =>
        set({ enabledPushNotifications }),
    }),
    {
      name: 'user-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
