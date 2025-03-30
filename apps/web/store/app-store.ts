import { createAccount } from '@/actions/create-account'
import { getUserSpaceMemberships } from '@/actions/get-user-space-memberships'
import type { AccountValues } from '@/schemas/account'
import type {
  Account,
  Space,
  SpaceMembership,
  SpendingCategory,
  Transaction,
  User,
} from '@6pm/db'
import { createId } from '@paralleldrive/cuid2'
import { keyBy } from 'lodash-es'
import * as R from 'ramda'
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
  fetchSpacesData: () => Promise<void>
  createAccount: (args: {
    spaceId: string
    data: AccountValues
  }) => ReturnType<typeof createAccount>
}

export const createAppStore = (initialState: AppState) => {
  return createStore<AppState & AppActions>()((set, get) => ({
    ...initialState,
    fetchSpacesData: async () => {
      const { data: spaceMemberships, error } = await getUserSpaceMemberships()

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
              transactions: keyBy(spaceMembership.space.transactions, 'id'),
              spaceMemberships: keyBy(spaceMemberships, 'id'),
            })),
            'id',
          ),
        },
      }))
    },

    // accounts
    createAccount: async ({ spaceId, data }) => {
      const id = createId()

      const account: Account = {
        id,
        spaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
        balance: data.balance ?? 0,
        color: data.color ?? 'gray',
        institution: data.institution ?? null,
        creditLimit: data.creditLimit ?? null,
        lastDigits: data.lastDigits ?? null,
        name: data.name,
        type: data.type,
      }

      set((state) =>
        R.assocPath(['spaces', spaceId, 'accounts', id], account, state),
      )

      const result = await createAccount({ spaceId, data })

      if (result.data) {
        set((state) =>
          R.assocPath(['spaces', spaceId, 'accounts', id], result.data, state),
        )
      }

      if (result.error) {
        console.error('Failed to create account', result.error)
        set((state) => R.dissocPath(['spaces', spaceId, 'accounts', id], state))
      }

      get().fetchSpacesData()

      return result
    },
  }))
}

export type AppStore = ReturnType<typeof createAppStore>
