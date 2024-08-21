import { getHonoClient } from '@/lib/client'
import { useMeQuery } from '@/queries/auth'
import {
  type TransactionFormValues,
  type TransactionPopulated,
  TransactionPopulatedSchema,
  TransactionSchema,
} from '@6pm/validation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { keyBy } from 'lodash-es'
import { useMemo } from 'react'
import { z } from 'zod'
import { useCategoryList } from '../category/hooks'
import { transactionQueries } from './queries'
import { useTransactionStore } from './store'

export function useTransactionList({
  from,
  to,
  walletAccountId,
  budgetId,
}: {
  from: Date
  to: Date
  walletAccountId?: string
  budgetId?: string
}) {
  const transactionsInRangeFromStore =
    useTransactionStore().transactions.filter(
      (t) =>
        new Date(t.date) >= new Date(from) && new Date(t.date) <= new Date(to),
    )
  const updateTransactionsByRange = useTransactionStore(
    (state) => state.updateTransactionsByRange,
  )
  const query = useQuery({
    ...transactionQueries.list({
      filters: { from, to },
      updateTransactionsByRangeInStore: updateTransactionsByRange,
    }),
    initialData:
      transactionsInRangeFromStore.length > 0
        ? transactionsInRangeFromStore
        : undefined,
  })

  const { transactions, transactionDict, totalExpense, totalIncome } =
    useMemo(() => {
      const transactions = transactionsInRangeFromStore.filter((t) => {
        if (walletAccountId && t.walletAccountId !== walletAccountId) {
          return false
        }

        if (budgetId && t.budgetId !== budgetId) {
          return false
        }

        return true
      })

      const transactionDict = keyBy(transactions, 'id')

      const totalIncome = transactions.reduce((acc, t) => {
        if (t.amountInVnd > 0) {
          return acc + t.amountInVnd
        }
        return acc
      }, 0)
      const totalExpense = transactions.reduce((acc, t) => {
        if (t.amountInVnd < 0) {
          return acc + t.amountInVnd
        }
        return acc
      }, 0)

      return { transactions, transactionDict, totalIncome, totalExpense }
    }, [transactionsInRangeFromStore, walletAccountId, budgetId])

  return {
    ...query,
    transactions,
    transactionDict,
    totalExpense,
    totalIncome,
  }
}

export function useTransaction(transactionId: string) {
  const transactions = useTransactionStore().transactions
  const updateTransaction = useTransactionStore(
    (state) => state.updateTransaction,
  )
  const removeTransaction = useTransactionStore(
    (state) => state.removeTransaction,
  )

  const transaction = useMemo(() => {
    const t = transactions.find((t) => t.id === transactionId) || null

    return t ? TransactionPopulatedSchema.parse(t) : null
  }, [transactions, transactionId])
  const query = useQuery({
    ...transactionQueries.detail({
      transactionId,
      updateTransactionInStore: updateTransaction,
      removeTransactionInStore: removeTransaction,
    }),
    initialData: transaction || undefined,
  })

  return { ...query, transaction }
}

export function useCreateTransaction() {
  const { data: userData } = useMeQuery()
  const updateTransactionInStore = useTransactionStore(
    (state) => state.updateTransaction,
  )
  const { categoriesDict } = useCategoryList()

  const mutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: { id: string; data: TransactionFormValues }) => {
      const hc = await getHonoClient()
      const result = await hc.v1.transactions.$post({
        json: {
          ...data,
          id,
          amount: -data.amount,
        },
      })

      if (!result.ok) {
        throw result
      }

      const response = await result.json()
      const transaction = TransactionSchema.merge(
        z.object({
          id: z.string(),
          amount: z.number({ coerce: true }),
          amountInVnd: z.number({ coerce: true }),
        }),
      ).parse(response)

      updateTransactionInStore(transaction)

      return transaction
    },
    onMutate({ id, data }) {
      const category = data.categoryId ? categoriesDict[data.categoryId] : null
      const categoryType = category?.type

      const amount =
        categoryType === 'INCOME'
          ? Math.abs(data.amount)
          : -Math.abs(data.amount)

      const transaction: TransactionPopulated = {
        id,
        ...data,
        amount,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByUserId: userData?.id!,
        amountInVnd: 0, // TODO: calculate amount in VND
        budgetId: data.budgetId || null,
        note: data.note || null,
        categoryId: data.categoryId || null,
      }

      updateTransactionInStore(transaction)

      return transaction
    },
  })

  return mutation
}

export function useUpdateTransaction() {
  const { data: userData } = useMeQuery()
  const updateTransactionInStore = useTransactionStore(
    (state) => state.updateTransaction,
  )
  const transactions = useTransactionStore().transactions
  const { categoriesDict } = useCategoryList()

  const mutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: TransactionFormValues
    }) => {
      const hc = await getHonoClient()
      const result = await hc.v1.transactions[':transactionId'].$put({
        param: { transactionId: id },
        json: {
          ...data,
          amount: -data.amount,
        },
      })

      if (!result.ok) {
        throw result
      }

      const res = await result.json()
      const transaction: TransactionPopulated = TransactionSchema.merge(
        z.object({
          amount: z.number({ coerce: true }),
          amountInVnd: z.number({ coerce: true }),
        }),
      ).parse(res)

      updateTransactionInStore(transaction)

      return transaction
    },
    onMutate({ id, data }) {
      const transactionInStore = transactions.find((t) => t.id === id)
      const category = data.categoryId ? categoriesDict[data.categoryId] : null
      const categoryType = category?.type

      const amount =
        categoryType === 'INCOME'
          ? Math.abs(data.amount)
          : -Math.abs(data.amount)

      const transaction: TransactionPopulated = {
        id,
        ...transactionInStore,
        ...data,
        amount,
        createdAt: transactionInStore?.createdAt ?? new Date(),
        updatedAt: new Date(),
        createdByUserId: transactionInStore?.createdByUserId ?? userData?.id!,
        amountInVnd: transactionInStore?.amountInVnd ?? 0, // TODO: calculate amount in VND
        budgetId: data.budgetId ?? transactionInStore?.budgetId ?? null,
        note: data.note ?? transactionInStore?.note ?? null,
        categoryId: data.categoryId ?? transactionInStore?.categoryId ?? null,
      }

      updateTransactionInStore(transaction)

      return transaction
    },
  })

  return mutation
}

export function useDeleteTransaction() {
  const removeTransactionInStore = useTransactionStore(
    (state) => state.removeTransaction,
  )

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const hc = await getHonoClient()
      await hc.v1.transactions[':transactionId'].$delete({
        param: { transactionId: id },
      })
    },
    onMutate(id) {
      removeTransactionInStore(id)
    },
  })

  return mutation
}
