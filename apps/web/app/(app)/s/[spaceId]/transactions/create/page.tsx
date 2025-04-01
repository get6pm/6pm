'use client'
import {
  TransactionAccountField,
  TransactionAmountField,
  TransactionCategoryField,
  TransactionDateField,
  TransactionForm,
  TransactionIsNegativeField,
  TransactionNameField,
  TransactionNotesField,
  TransactionTypeField,
} from '@/components/forms/transaction-form'
import { useCurrentSpace } from '@/hooks/spaces'
import { useCreateTransaction } from '@/hooks/transactions'
import type { TransactionValues } from '@/schemas/transaction'
import { Button } from '@6pm/ui/components/button'
import { toast } from '@6pm/ui/components/sonner'
import { SaveIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CreateTransactionPage() {
  const space = useCurrentSpace()
  const { createTransaction } = useCreateTransaction()
  const router = useRouter()

  const handleCreateTransaction = async (data: TransactionValues) => {
    const { data: transaction, error } = await createTransaction({
      spaceId: space.id,
      data,
    })

    if (transaction) {
      router.push(`/s/${space.id}/transactions/${transaction.id}`)
      return
    }

    if (error) {
      toast.error('Failed to create transaction', { description: error })
      return
    }
  }

  return (
    <div className="p-4">
      <TransactionForm
        className="flex flex-col gap-4"
        onSubmit={handleCreateTransaction}
      >
        <h1 className="font-medium text-xl opacity-80">
          New <TransactionTypeField /> transaction
        </h1>
        <div>
          <TransactionDateField />
          <TransactionNameField autoFocus className="text-2xl" />
        </div>
        <div>
          <TransactionIsNegativeField />
          <TransactionAmountField className="text-lg" />
        </div>
        <div className="flex items-start gap-4">
          <TransactionCategoryField />
          <TransactionAccountField />
        </div>
        <TransactionNotesField />
        <Button type="submit" variant="secondary">
          <SaveIcon /> Save transaction
        </Button>
      </TransactionForm>
    </div>
  )
}
