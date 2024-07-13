import { getHonoClient } from '@/lib/client'
import { TransactionPopulatedSchema } from '@6pm/validation'
// import { createQueryKeys } from '@lukemorales/query-key-factory'
import { useInfiniteQuery } from '@tanstack/react-query'

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
}

export function useTransactions(filters: TransactionFilters) {
  return useInfiniteQuery({
    queryKey: transactionQueries.list(filters).queryKey,
    queryFn: async ({ pageParam = filters.before?.toString() }) => {
      return transactionQueries.list(filters).queryFn(pageParam)
    },
    initialPageParam: '',
    getNextPageParam: (lastPage) => {
      return lastPage.meta.paginationMeta.after?.toString()
    },
  })
}
