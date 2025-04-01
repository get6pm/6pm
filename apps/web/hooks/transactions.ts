import type { TransactionValues } from '@/schemas/transaction'
import { useAppContext } from '@/store/app-provider'
import { useState } from 'react'

export const useSpaceTransactions = (spaceId: string) => {
  const { spaces } = useAppContext((state) => ({
    spaces: state.spaces,
  }))

  const space = spaces[spaceId]

  if (!space) {
    return {}
  }

  return space.transactions
}

export const useSpaceTransactionList = (spaceId: string) => {
  const transactions = useSpaceTransactions(spaceId)
  return Object.values(transactions)
}

export const useSpaceTransaction = ({
  spaceId,
  transactionId,
}: { spaceId: string; transactionId: string }) => {
  const transactions = useSpaceTransactions(spaceId)
  return transactions[transactionId] ?? null
}

export const useCreateTransaction = () => {
  const [isPending, setIsPending] = useState(false)

  const { createTransaction: createTransactionAction } = useAppContext(
    (state) => ({
      createTransaction: state.createTransaction,
    }),
  )

  const createTransaction = async (args: {
    spaceId: string
    data: TransactionValues
  }) => {
    setIsPending(true)
    const { spaceId, data } = args
    const result = await createTransactionAction({ spaceId, data })
    setIsPending(false)
    return result
  }

  return { createTransaction, isPending }
}

export const useUpdateTransaction = () => {
  const [isPending, setIsPending] = useState(false)

  const { updateTransaction: updateTransactionAction } = useAppContext(
    (state) => ({
      updateTransaction: state.updateTransaction,
    }),
  )

  const updateTransaction = async (args: {
    spaceId: string
    data: TransactionValues
  }) => {
    setIsPending(true)

    try {
      const { spaceId, data } = args
      const result = await updateTransactionAction({ spaceId, data })
      return result
    } catch (error) {
      console.error('Failed to update transaction', error)
    } finally {
      setIsPending(false)
    }
  }

  return { updateTransaction, isPending }
}
