import { createAccount } from '@/actions/create-account'
import { createCategory } from '@/actions/create-category'
import { createTransaction } from '@/actions/create-transaction'
import { deleteAccount } from '@/actions/delete-account'
import { deleteCategory } from '@/actions/delete-category'
import { deleteTransaction } from '@/actions/delete-transaction'
import { getUserSpaceMemberships } from '@/actions/get-user-space-memberships'
import { updateAccount } from '@/actions/update-account'
import { updateCategory } from '@/actions/update-category'
import { updateTransaction } from '@/actions/update-transaction'
import ErrorCode from '@/constants/error-codes'
import { type AccountValues, zAccount } from '@/schemas/account'
import { type CategoryValues, zCategory } from '@/schemas/category'
import type { TransactionValues } from '@/schemas/transaction'
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
  lastSyncedAt: Date | null
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

  // accounts
  createAccount: (args: {
    spaceId: string
    data: AccountValues
  }) => ReturnType<typeof createAccount>
  updateAccount: (args: {
    spaceId: string
    data: AccountValues
  }) => ReturnType<typeof updateAccount>
  deleteAccount: (args: {
    id: string
  }) => ReturnType<typeof deleteAccount>

  // categories
  createCategory: (args: {
    spaceId: string
    data: CategoryValues
  }) => ReturnType<typeof createCategory>
  updateCategory: (args: {
    spaceId: string
    data: CategoryValues
  }) => ReturnType<typeof updateCategory>
  deleteCategory: (args: {
    id: string
  }) => ReturnType<typeof deleteCategory>

  // transactions
  createTransaction: (args: {
    spaceId: string
    data: TransactionValues
  }) => ReturnType<typeof createTransaction>
  updateTransaction: (args: {
    spaceId: string
    data: TransactionValues
  }) => ReturnType<typeof updateTransaction>
  deleteTransaction: (args: {
    spaceId: string
    transactionId: string
  }) => ReturnType<typeof deleteTransaction>
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
        lastSyncedAt: new Date(),
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
        deletedAt: null,
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
    updateAccount: async ({ spaceId, data }) => {
      const { id = createId() } = zAccount.parse(data)

      const existingAccount = get().spaces[spaceId]?.accounts[id]

      if (!existingAccount) {
        throw new Error('Account not found')
      }

      const account: Account = {
        ...existingAccount,
        ...data,
      }

      set((state) =>
        R.assocPath(['spaces', spaceId, 'accounts', id], account, state),
      )

      const result = await updateAccount({ data })

      if (result.data) {
        set((state) =>
          R.assocPath(['spaces', spaceId, 'accounts', id], result.data, state),
        )
      }

      if (result.error) {
        console.error('Failed to update account', result.error)
        set((state) =>
          R.assocPath(
            ['spaces', spaceId, 'accounts', id],
            existingAccount,
            state,
          ),
        )
      }

      get().fetchSpacesData()

      return result
    },
    deleteAccount: async ({ id }) => {
      const existingAccount = R.pipe(
        R.values,
        R.map(R.prop('accounts')),
        R.map(R.values),
        R.flatten,
        R.find(R.propEq('id', id)),
      )(get().spaces)

      const spaceId = existingAccount?.spaceId
      if (!existingAccount || !spaceId) {
        throw new Error('Account not found')
      }

      set((state) =>
        R.assocPath(
          ['spaces', spaceId, 'accounts', id, 'deletedAt'],
          new Date(),
          state,
        ),
      )

      const result = await deleteAccount({ id })

      if (result.data) {
        set((state) =>
          R.assocPath(['spaces', spaceId, 'accounts', id], result.data, state),
        )
      }

      if (result.error) {
        console.error('Failed to delete account', result.error)
        set((state) =>
          R.assocPath(
            ['spaces', spaceId, 'accounts', id],
            existingAccount,
            state,
          ),
        )
      }

      get().fetchSpacesData()

      return result
    },

    // categories
    createCategory: async ({ spaceId, data }) => {
      const id = createId()

      const category: SpendingCategory = {
        id,
        spaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
        color: data.color ?? 'gray',
        name: data.name,
        deletedAt: null,
        groupId: null,
        icon: data.icon,
        isExclusive: false,
      }

      set((state) =>
        R.assocPath(['spaces', spaceId, 'categories', id], category, state),
      )

      const result = await createCategory({ spaceId, data })

      if (result.data) {
        set((state) =>
          R.assocPath(
            ['spaces', spaceId, 'categories', id],
            result.data,
            state,
          ),
        )
      }

      if (result.error) {
        console.error('Failed to create category', result.error)
        set((state) =>
          R.dissocPath(['spaces', spaceId, 'categories', id], state),
        )
      }

      get().fetchSpacesData()

      return result
    },
    updateCategory: async ({ spaceId, data }) => {
      const { id = createId() } = zCategory.parse(data)

      const existingCategory = get().spaces[spaceId]?.categories[id]

      if (!existingCategory) {
        throw new Error('Category not found')
      }

      const category: SpendingCategory = {
        ...existingCategory,
        ...data,
      }

      set((state) =>
        R.assocPath(['spaces', spaceId, 'categories', id], category, state),
      )

      const result = await updateCategory({ data })

      if (result.data) {
        set((state) =>
          R.assocPath(
            ['spaces', spaceId, 'categories', id],
            result.data,
            state,
          ),
        )
      }

      if (result.error) {
        console.error('Failed to update category', result.error)
        set((state) =>
          R.assocPath(
            ['spaces', spaceId, 'categories', id],
            existingCategory,
            state,
          ),
        )
      }

      get().fetchSpacesData()

      return result
    },
    deleteCategory: async ({ id }) => {
      const existingCategory = R.pipe(
        R.values,
        R.map(R.prop('categories')),
        R.map(R.values),
        R.flatten,
        R.find(R.propEq('id', id)),
      )(get().spaces)

      const spaceId = existingCategory?.spaceId
      if (!existingCategory || !spaceId) {
        throw new Error('Category not found')
      }

      set((state) =>
        R.assocPath(
          ['spaces', spaceId, 'categories', id, 'deletedAt'],
          new Date(),
          state,
        ),
      )

      const result = await deleteCategory({ id })

      if (result.data) {
        set((state) =>
          R.assocPath(
            ['spaces', spaceId, 'categories', id],
            result.data,
            state,
          ),
        )
      }

      if (result.error) {
        console.error('Failed to delete category', result.error)
        set((state) =>
          R.assocPath(
            ['spaces', spaceId, 'categories', id],
            existingCategory,
            state,
          ),
        )
      }

      get().fetchSpacesData()

      return result
    },

    // transactions
    createTransaction: async ({ spaceId, data }) => {
      const id = createId()

      const amount = Math.abs(data.amount) * (data.isNegative ? -1 : 1)
      const spaceMembership = get().spaces[spaceId]?.spaceMembership

      if (!spaceMembership) {
        throw new Error('Space membership not found')
      }

      const transaction: Transaction = {
        id,
        spaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
        amount,
        date: data.date,
        accountId: data.accountId,
        categoryId: data.categoryId ?? null,
        notes: data.notes ?? null,
        isExclusive: data.isExclusive ?? false,
        type: data.type,
        deletedAt: null,
        name: data.name,
        description: null,
        memberId: spaceMembership.id,
      }

      set((state) =>
        R.assocPath(
          ['spaces', spaceId, 'transactions', id],
          transaction,
          state,
        ),
      )

      const result = await createTransaction({ spaceId, data })

      if (result.data) {
        set((state) =>
          R.assocPath(
            ['spaces', spaceId, 'transactions', id],
            result.data,
            state,
          ),
        )
      }

      if (result.error) {
        console.error('Failed to create transaction', result.error)
        set((state) =>
          R.dissocPath(['spaces', spaceId, 'transactions', id], state),
        )
      }

      get().fetchSpacesData()

      return result
    },
    updateTransaction: async ({ data, spaceId }) => {
      const id = data.id

      if (!id) {
        throw new Error(ErrorCode.InvalidInput)
      }

      const currentTransaction = get().spaces[spaceId]?.transactions[id]

      if (!currentTransaction) {
        throw new Error(ErrorCode.NotFound)
      }

      const amount = Math.abs(data.amount) * (data.isNegative ? -1 : 1)
      const updatedTransaction = {
        ...currentTransaction,
        amount,
        updatedAt: new Date(),
        date: data.date,
        accountId: data.accountId,
        categoryId: data.categoryId ?? null,
        notes: data.notes ?? null,
        isExclusive: data.isExclusive ?? false,
        name: data.name,
        description: null,
      }

      set((state) =>
        R.assocPath(
          ['spaces', spaceId, 'transactions', id],
          updatedTransaction,
          state,
        ),
      )

      const result = await updateTransaction({ data })

      if (result.data) {
        set((state) =>
          R.assocPath(
            ['spaces', spaceId, 'transactions', id],
            result.data,
            state,
          ),
        )
      }

      if (result.error) {
        console.error('Failed to create transaction', result.error)
        set((state) =>
          R.assocPath(
            ['spaces', spaceId, 'transactions', id],
            currentTransaction,
            state,
          ),
        )
      }

      get().fetchSpacesData()

      return result
    },
    deleteTransaction: async ({ transactionId: id, spaceId }) => {
      if (!id) {
        throw new Error(ErrorCode.InvalidInput)
      }

      const currentTransaction = get().spaces[spaceId]?.transactions[id]

      if (!currentTransaction) {
        throw new Error(ErrorCode.NotFound)
      }

      set((state) =>
        R.assocPath(
          ['spaces', spaceId, 'transactions', id, 'deletedAt'],
          new Date(),
          state,
        ),
      )

      const result = await deleteTransaction({ id })

      if (result.data) {
        set((state) =>
          R.assocPath(
            ['spaces', spaceId, 'transactions', id],
            result.data,
            state,
          ),
        )
      }

      if (result.error) {
        console.error('Failed to create transaction', result.error)
        set((state) =>
          R.assocPath(
            ['spaces', spaceId, 'transactions', id, 'deletedAt'],
            null,
            state,
          ),
        )
      }

      get().fetchSpacesData()

      return result
    },
  }))
}

export type AppStore = ReturnType<typeof createAppStore>
