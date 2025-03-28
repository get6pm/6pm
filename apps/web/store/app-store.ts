import { getUserSpaceMemberships } from '@/actions/get-user-space-memberships'
import type {
  Account,
  Space,
  SpaceMembership,
  SpendingCategory,
  Transaction,
  User,
} from '@6pm/db'
import { keyBy } from 'lodash-es'
import { createStore } from 'zustand'

type AppState = {
  user: User
  spaces: Record<
    string,
    Space & {
      categories: Record<string, SpendingCategory>
      accounts: Record<string, Account>
      transactions: Record<string, Transaction>
      spaceMembership: SpaceMembership
      spaceMemberships: Record<string, SpaceMembership>
    }
  >
}

type AppActions = {
  fetchSpacesData: (stale?: number) => Promise<void>
}

export const createAppStore = (initialState: AppState) => {
  return createStore<AppState & AppActions>()((set, get) => ({
    ...initialState,
    fetchSpacesData: async (stale = 60000) => {
      const { data: spaceMemberships, error } = await getUserSpaceMemberships()

      if (stale) {
        setTimeout(() => {
          get().fetchSpacesData(stale)
        }, stale)
      }

      if (error) {
        console.error('Failed to fetch space memberships', error)
        return
      }

      if (!spaceMemberships) {
        return
      }

      set((state) => ({
        spaces: {
          ...state.spaces,
          ...keyBy(
            spaceMemberships.map((spaceMembership) => ({
              ...spaceMembership.space,
              spaceMembership,
              categories: keyBy(spaceMembership.space.categories, 'id'),
              accounts: keyBy(spaceMembership.space.accounts, 'id'),
              transactions:
                state.spaces[spaceMembership.spaceId]?.transactions || {},
              spaceMemberships: keyBy(spaceMemberships, 'id'),
            })),
            'id',
          ),
        },
      }))
    },
  }))
}

export type AppStore = ReturnType<typeof createAppStore>
