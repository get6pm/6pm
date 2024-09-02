import {
  type TransactionPopulated,
  TransactionPopulatedSchema,
  type UpdateTransaction,
} from '@6pm/validation'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { orderBy, uniqBy } from 'lodash-es'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type Transaction = TransactionPopulated

type DraftTransaction = UpdateTransaction & { id: string; imageUri?: string }

export interface TransactionStore {
  transactions: Transaction[]
  draftTransactions: DraftTransaction[]
  _reset: () => void
  setTransactions: (transactions: Transaction[]) => void
  addTransactions: (transactions: Transaction[]) => void
  updateTransactionsByRange: (args: {
    transactions: Transaction[]
    from: Date
    to: Date
  }) => void
  updateTransaction: (transaction: Transaction) => void
  removeTransaction: (transactionId: string) => void
  addDraftTransaction: (transaction: DraftTransaction) => void
  updateDraftTransaction: (transaction: DraftTransaction) => void
  removeDraftTransaction: (transactionId: string) => void
}

function normalizeTransactions(transactions: Transaction[]) {
  return orderBy(
    uniqBy(transactions, 'id'),
    ['date', 'createdAt'],
    ['desc', 'desc'],
  ).map((t) => TransactionPopulatedSchema.parse(t))
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set) => ({
      transactions: [],
      draftTransactions: [],
      // biome-ignore lint/style/useNamingConvention: <explanation>
      _reset: () => set({ transactions: [], draftTransactions: [] }),
      setTransactions: (transactions) => {
        set({ transactions: normalizeTransactions(transactions) })
      },
      addTransactions: (transactions) => {
        set((state) => {
          const newTransactions = normalizeTransactions([
            ...state.transactions,
            ...transactions,
          ])
          return { transactions: newTransactions }
        })
      },
      updateTransactionsByRange: ({ transactions, from, to }) => {
        set((state) => {
          const outOfRangeTransactions = state.transactions.filter(
            (t) =>
              new Date(t.date) < new Date(from) ||
              new Date(t.date) > new Date(to),
          )

          return {
            transactions: normalizeTransactions([
              ...outOfRangeTransactions,
              ...transactions,
            ]),
          }
        })
      },
      updateTransaction: (transaction) => {
        set((state) => {
          const index = state.transactions.findIndex(
            (t) => t.id === transaction.id,
          )
          if (index === -1) {
            return {
              transactions: normalizeTransactions([
                ...state.transactions,
                transaction,
              ]),
            }
          }

          state.transactions[index] = transaction
          return { transactions: normalizeTransactions(state.transactions) }
        })
      },
      removeTransaction: (transactionId) => {
        set((state) => {
          const index = state.transactions.findIndex(
            (t) => t.id === transactionId,
          )
          if (index === -1) {
            return { transactions: state.transactions }
          }

          state.transactions.splice(index, 1)
          return { transactions: normalizeTransactions(state.transactions) }
        })
      },
      addDraftTransaction: (transaction) => {
        set((state) => ({
          draftTransactions: state.draftTransactions.find(
            (i) => i.id === transaction.id,
          )
            ? state.draftTransactions.map((i) =>
                i.id === transaction.id ? transaction : i,
              )
            : [transaction, ...state.draftTransactions],
        }))
      },
      updateDraftTransaction: (transaction) => {
        set((state) => ({
          draftTransactions: state.draftTransactions.map((i) =>
            i.id === transaction.id ? transaction : i,
          ),
        }))
      },
      removeDraftTransaction: (transactionId) => {
        set((state) => ({
          draftTransactions: state.draftTransactions.filter(
            (t) => t.id !== transactionId,
          ),
        }))
      },
    }),
    {
      name: 'transaction-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
