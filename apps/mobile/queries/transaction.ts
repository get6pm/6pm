import { getHonoClient } from '@/lib/client'
import { TransactionPopulatedSchema } from '@6pm/validation'
// import { createQueryKeys } from '@lukemorales/query-key-factory'
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

export type TransactionFilters = {
  walletAccountId?: string
  budgetId?: string
  last?: number
  before?: Date
}

/**
 * Manual define query keys to avoid conflict with infinite query v5
 * https://github.com/lukemorales/query-key-factory/issues/73
 */
export const transactionQueries = {
  all: ['transaction'],
  list: (filters: TransactionFilters) => ({
    queryKey: ['transaction', { filters }],
    queryFn: async (before?: string) => {
      const hc = await getHonoClient()
      const res = await hc.v1.transactions.$get({
        query: {
          wallet_id: filters.walletAccountId,
          budget_id: filters.budgetId,
          last: filters.last?.toString(),
          before: before || undefined,
        },
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }

      const result = await res.json()
      const transactions = result.transactions.map((item) =>
        TransactionPopulatedSchema.parse(item),
      )
      return {
        ...result,
        transactions,
      }
    },
  }),
  detail: (transactionId: string) => ({
    queryKey: ['transaction', { transactionId }],
    queryFn: async () => {
      const hc = await getHonoClient()
      const res = await hc.v1.transactions[':transactionId'].$get({
        param: { transactionId },
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }

      const transaction = await res.json()
      return TransactionPopulatedSchema.parse(transaction)
    },
  }),
}

export function useTransactions(filters: TransactionFilters) {
  const queryClient = useQueryClient()
  return useInfiniteQuery({
    queryKey: transactionQueries.list(filters).queryKey,
    queryFn: async ({ pageParam = filters.before?.toString() }) => {
      const result = await transactionQueries.list(filters).queryFn(pageParam)
      result.transactions?.forEach((transaction) => {
        queryClient.setQueryData(
          transactionQueries.detail(transaction.id).queryKey,
          transaction,
        )
      })
      return result
    },
    initialPageParam: '',
    getNextPageParam: (lastPage) => {
      return lastPage.meta.paginationMeta.after?.toString()
    },
  })
}

export function useTransactionDetail(transactionId: string) {
  return useQuery({
    ...transactionQueries.detail(transactionId),
  })
}
