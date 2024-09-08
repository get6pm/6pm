import type { WalletAccountWithBalance } from '@6pm/validation'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface WalletStore {
  wallets: WalletAccountWithBalance[]
  _reset: () => void
  setWallets: (wallets: WalletAccountWithBalance[]) => void
  updateWallet: (wallet: WalletAccountWithBalance) => void
  removeWallet: (walletId: string) => void
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      wallets: [],
      // biome-ignore lint/style/useNamingConvention: <explanation>
      _reset: () => set({ wallets: [] }),
      setWallets: (wallets: WalletAccountWithBalance[]) => set({ wallets }),
      updateWallet: (wallet: WalletAccountWithBalance) =>
        set((state) => {
          const index = state.wallets.findIndex((c) => c.id === wallet.id)
          if (index === -1) {
            return {
              wallets: [...state.wallets, wallet],
            }
          }

          return {
            wallets: state.wallets.map((c) =>
              c.id === wallet.id ? wallet : c,
            ),
          }
        }),
      removeWallet: (walletId) =>
        set((state) => {
          return { wallets: state.wallets.filter((c) => c.id !== walletId) }
        }),
    }),
    {
      name: 'wallet-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
