import type { TransactionValues } from '@/schemas/transaction'
import { useAppContext } from '@/store/app-provider'
import { orderBy } from 'lodash-es'
import { useState } from 'react'
import { useSpace } from './spaces'

export const useTransactions = () => {
  const space = useSpace()
  const { transactions } = useAppContext((state) => ({
    transactions: state.spaces[space.id]?.transactions,
  }))
  return transactions ?? {}
}

export const useTransactionList = ({
  includeDeleted,
}: { includeDeleted?: boolean } = {}) => {
  const transactions = useTransactions()
  const transactionList = orderBy(
    Object.values(transactions),
    ['createdAt'],
    ['desc'],
  )

  if (!includeDeleted) {
    return transactionList.filter((transaction) => !transaction.deletedAt)
  }

  return transactionList
}

export const useTransaction = (transactionId: string) => {
  const transactions = useTransactions()
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

// export const useUpdateTransaction = () => {
//   const [isPending, setIsPending] = useState(false)

//   const { updateTransaction: updateTransactionAction } = useAppContext((state) => ({
//     updateTransaction: state.updateTransaction,
//   }))

//   const updateTransaction = async (args: {
//     spaceId: string
//     data: TransactionValues
//   }) => {
//     setIsPending(true)

//     try {
//       const { spaceId, data } = args
//       const result = await updateTransactionAction({ spaceId, data })
//       return result
//     } catch (error) {
//       console.error('Failed to update transaction', error)
//     } finally {
//       setIsPending(false)
//     }
//   }

//   return { updateTransaction, isPending }
// }

// export const useDeleteTransaction = () => {
//   const [isPending, setIsPending] = useState(false)

//   const { deleteTransaction: deleteTransactionAction } = useAppContext((state) => ({
//     deleteTransaction: state.deleteTransaction,
//   }))

//   const deleteTransaction = async (args: {
//     id: string
//   }) => {
//     setIsPending(true)

//     try {
//       const result = await deleteTransactionAction({ id: args.id })
//       return result
//     } catch (error) {
//       console.error('Failed to delete transaction', error)
//     } finally {
//       setIsPending(false)
//     }
//   }

//   return { deleteTransaction, isPending }
// }
