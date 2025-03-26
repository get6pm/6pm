'use client'
import { TransactionValues } from '@/schemas/transaction'
import { Button } from '@6pm/ui/components/button'
import { useFormContext } from '@6pm/ui/components/form'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@6pm/ui/components/sheet'
import type { FC, ReactNode } from 'react'
import { TransactionForm, TransactionFormContent } from './transaction-form'

export type AddTransactionProps = {
  children: ReactNode
}

export const AddTransaction: FC<AddTransactionProps> = ({ children }) => {
  return (
    <Sheet>
      {children}
      <SheetContent
        backdropBlur
        className="!max-w-none w-[650px] [&>.sheet-close-button]:top-6.5"
      >
        <TransactionForm>
          <TransactionFormContent className="p-4" onSubmit={() => {}}>
            {({ isSubmitting }) => (
              <SheetHeader>
                <SheetTitle className="mr-8 flex items-center justify-between">
                  <span className="font-serif text-2xl">
                    Add new transaction
                  </span>
                  <SaveButton />
                </SheetTitle>
              </SheetHeader>
            )}
          </TransactionFormContent>
        </TransactionForm>
      </SheetContent>
    </Sheet>
  )
}

const SaveButton: FC = () => {
  const form = useFormContext<TransactionValues>()
  return (
    <Button
      type="submit"
      variant="accent"
      disabled={form.formState.isSubmitting}
    >
      Save
    </Button>
  )
}
