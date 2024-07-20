import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface UserSettingsStore {
  preferredCurrency?: string
  setPreferredCurrency: (preferredCurrency: string) => void
}

export const useUserSettingsStore = create<UserSettingsStore>()(
  persist(
    (set) => ({
      preferredCurrency: undefined,
      setPreferredCurrency: (preferredCurrency) => set({ preferredCurrency }),
    }),
    {
      name: 'user-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
