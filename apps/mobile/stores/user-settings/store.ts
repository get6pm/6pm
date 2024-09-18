import { Palette } from '@/lib/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface UserSettingsStore {
  preferredCurrency?: string
  setPreferredCurrency: (preferredCurrency: string) => void
  enabledPushNotifications: boolean
  setEnabledPushNotifications: (enabledPushNotifications: boolean) => void
  enabledLocalAuth: boolean
  setEnabledLocalAuth: (enabledLocalAuth: boolean) => void
  preferredPalette: Palette
  setPreferredPalette: (preferredPalette: Palette) => void
}

export const useUserSettingsStore = create<UserSettingsStore>()(
  persist(
    (set) => ({
      preferredCurrency: undefined,
      setPreferredCurrency: (preferredCurrency) => set({ preferredCurrency }),
      enabledPushNotifications: false,
      setEnabledPushNotifications: (enabledPushNotifications) =>
        set({ enabledPushNotifications }),
      enabledLocalAuth: false,
      setEnabledLocalAuth: (enabledLocalAuth) => set({ enabledLocalAuth }),
      preferredPalette: Palette.Default,
      setPreferredPalette: (preferredPalette) => set({ preferredPalette }),
    }),
    {
      name: 'user-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
