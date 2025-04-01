'use client'

import {
  TransactionAccountField,
  TransactionAmountField,
  TransactionCategoryField,
  TransactionDateField,
  TransactionForm,
  TransactionNameField,
  TransactionNotesField,
} from '@/components/forms/transaction-form'
import { useSpaceTransaction, useUpdateTransaction } from '@/hooks/transactions'
import type { TransactionValues } from '@/schemas/transaction'
import { useParams } from 'next/navigation'
import { DeleteTransaction } from './_components/delete-transaction'

export default function TransactionIdPage() {
  const { spaceId, transactionId } = useParams<{
    spaceId: string
    transactionId: string
  }>()
  const transaction = useSpaceTransaction({
    spaceId,
    transactionId,
  })
  const { updateTransaction } = useUpdateTransaction()

  if (!transaction) {
    return <div>Transaction not found</div>
  }

  const handleUpdateTransaction = async (data: TransactionValues) => {
    await updateTransaction({ spaceId, data })
  }

  return (
    <div className="relative p-4">
      <DeleteTransaction transactionId={transactionId} />
      <TransactionForm
        className="flex flex-col gap-4"
        initialValues={{
          name: transaction.name,
          date: transaction.date,
          notes: transaction.notes ?? '',
          isExclusive: transaction.isExclusive,
          tagIds: [],
          type: transaction.type,
          isNegative: transaction.amount < 0,
          amount: Math.abs(transaction.amount),
          categoryId: transaction.categoryId ?? undefined,
          accountId: transaction.accountId ?? undefined,
          id: transaction.id,
        }}
        onSubmit={handleUpdateTransaction}
      >
        <div>
          <TransactionDateField onFieldBlur={handleUpdateTransaction} />
          <TransactionNameField
            onFieldBlur={handleUpdateTransaction}
            className="text-2xl"
          />
        </div>
        <div>
          {/* <TransactionIsNegativeField /> */}
          <TransactionAmountField
            className="text-lg"
            onFieldBlur={handleUpdateTransaction}
          />
        </div>
        <div className="flex items-start gap-4">
          <TransactionCategoryField onFieldBlur={handleUpdateTransaction} />
          <TransactionAccountField onFieldBlur={handleUpdateTransaction} />
        </div>
        <TransactionNotesField onFieldBlur={handleUpdateTransaction} />
        <button type="submit" className="hidden" />
      </TransactionForm>
    </div>
  )
}
