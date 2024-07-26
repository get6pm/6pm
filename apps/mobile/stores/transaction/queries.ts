import { getHonoClient } from '@/lib/client'
import { dayjsExtended } from '@6pm/utilities'
import { TransactionPopulatedSchema } from '@6pm/validation'
import { createQueryKeys } from '@lukemorales/query-key-factory'
import type { TransactionStore } from './store'

export type TransactionFilters = {
  from: Date
  to: Date
}

export const transactionQueries = createQueryKeys('transactions', {
  list: ({
    filters,
    updateTransactionsByRangeInStore: updateTransactionsByRange,
  }: {
    filters: TransactionFilters
    updateTransactionsByRangeInStore?: TransactionStore['updateTransactionsByRange']
  }) => ({
    queryKey: [filters],
    queryFn: async () => {
      const { from, to } = filters
      const hc = await getHonoClient()

      const before = dayjsExtended(to).add(-1, 'ms').toISOString()
      const after = dayjsExtended(from).add(1, 'ms').toISOString()

      const res = await hc.v1.transactions.$get({
        query: {
          before,
          after,
        },
      })
      if (!res.ok) {
        console.error('🚀 ~ queryFn: ~ res:', res)
        throw new Error(await res.text())
      }

      const result = await res.json()
      let transactions = []
      try {
        transactions = result.transactions.map((item) =>
          TransactionPopulatedSchema.parse(item),
        )
      } catch (error) {
        console.error('🚀 ~ queryFn: ~ error:', error)
        throw error
      }

      updateTransactionsByRange?.({ transactions, from, to })

      return transactions
    },
  }),
  detail: ({
    transactionId,
    updateTransactionInStore: updateTransaction,
    removeTransactionInStore: removeTransaction,
  }: {
    transactionId: string
    updateTransactionInStore?: TransactionStore['updateTransaction']
    removeTransactionInStore?: TransactionStore['removeTransaction']
  }) => ({
    queryKey: [transactionId],
    queryFn: async () => {
      const hc = await getHonoClient()
      const res = await hc.v1.transactions[':transactionId'].$get({
        param: { transactionId },
      })

      if (!res.ok) {
        // handle not found
        if (res.status === 404) {
          removeTransaction?.(transactionId)
          return null
        }
        throw new Error(await res.text())
      }

      const result = await res.json()
      const transaction = TransactionPopulatedSchema.parse(result)

      updateTransaction?.(transaction)

      return transaction
    },
  }),
})
