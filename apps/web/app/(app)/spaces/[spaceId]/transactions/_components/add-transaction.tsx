'use client'
import { createTransaction } from '@/actions/create-transaction'
import type { TransactionValues } from '@/schemas/transaction'
import type { Account, SpendingCategory } from '@6pm/db'
import { Button } from '@6pm/ui/components/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@6pm/ui/components/sheet'
import { toast } from '@6pm/ui/components/sonner'
import { type FC, type ReactNode, useState } from 'react'
import { useSpaceContext } from '../../_components/space-context'
import { TransactionForm, TransactionFormContent } from './transaction-form'

export type AddTransactionProps = {
  children: ReactNode
  categories: SpendingCategory[]
  accounts: Account[]
}

export const AddTransaction: FC<AddTransactionProps> = ({
  children,
  categories,
  accounts,
}) => {
  const { space } = useSpaceContext()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const handleCreateTransaction = async (values: TransactionValues) => {
    const { error, success } = await createTransaction({
      spaceId: space.id,
      data: values,
    })
    if (success) {
      setIsSheetOpen(false)
    } else {
      toast.error('Unable to create transaction', { description: error })
    }
  }

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      {children}
      <SheetContent
        backdropBlur
        className="!max-w-none w-[650px] [&>.sheet-close-button]:top-6.5"
      >
        <TransactionForm>
          <TransactionFormContent
            className="p-4"
            onSubmit={handleCreateTransaction}
            categories={categories}
            accounts={accounts}
          >
            {({ isSubmitting }) => (
              <SheetHeader>
                <SheetTitle className="mr-8 flex items-center justify-between">
                  <span className="font-serif text-2xl">
                    Add new transaction
                  </span>
                  <Button
                    type="submit"
                    variant="accent"
                    disabled={isSubmitting}
                  >
                    Save
                  </Button>
                </SheetTitle>
              </SheetHeader>
            )}
          </TransactionFormContent>
        </TransactionForm>
      </SheetContent>
    </Sheet>
  )
}
