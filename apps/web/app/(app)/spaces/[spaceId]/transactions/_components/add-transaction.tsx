'use client'
import type { TransactionValues } from '@/schemas/transaction'
import { Button } from '@6pm/ui/components/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@6pm/ui/components/sheet'
import { toast } from '@6pm/ui/components/sonner'
import { type FC, type ReactNode, useState } from 'react'
import { useAccountList } from '../../_hooks/accounts'
import { useCategoryList } from '../../_hooks/categories'
import { useSpace } from '../../_hooks/spaces'
import { useCreateTransaction } from '../../_hooks/transactions'
import { TransactionForm, TransactionFormContent } from './transaction-form'

export type AddTransactionProps = {
  children: ReactNode
}

export const AddTransaction: FC<AddTransactionProps> = ({ children }) => {
  const space = useSpace()
  const categories = useCategoryList()
  const accounts = useAccountList()
  const { createTransaction } = useCreateTransaction()
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
