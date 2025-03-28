'use client'
import { getColorValue } from '@/lib/get-color-value'
import { getCurrencyInputProps } from '@/lib/get-currency-input-props'
import type { AccountType, Transaction } from '@6pm/db'
import { Label } from '@6pm/ui/components/label'
import { NumericFormat } from '@6pm/ui/components/number-format'
import { Textarea } from '@6pm/ui/components/textarea'
import { format } from '@6pm/ui/lib/date-fns'
import { cn } from '@6pm/ui/lib/utils'
import { CalendarIcon } from 'lucide-react'
import Image from 'next/image'
import type { FC } from 'react'

export type TransactionDetailsProps = {
  transaction: Transaction & {
    space: { baseCurrencyCode: string }
    user: {
      id: string
      firstName: string | null
      lastName: string | null
      profilePictureUrl: string | null
    }
    account: {
      id: string
      name: string
      institution: string | null
      lastDigits: string | null
      color: string
      type: AccountType
    }
    category: {
      id: string
      name: string
      color: string
      icon: string
      isExclusive: boolean
    } | null
  }
}

export const TransactionDetails: FC<TransactionDetailsProps> = ({
  transaction,
}) => {
  return (
    <div className="w-full space-y-8 px-3 lg:px-11">
      <header className="mt-8 w-full">
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <CalendarIcon className="size-4" />
          {format(transaction.date, 'EEEE, MMM d, yyyy')}
        </div>
        <div className="flex w-full items-baseline justify-between gap-4">
          <div className="text-2xl">{transaction.name}</div>
          <div className="text-2xl">
            <NumericFormat
              value={Math.abs(transaction.amount)}
              className={cn(
                'text-right font-medium',
                transaction.amount > 0 && 'text-green-700',
              )}
              {...getCurrencyInputProps(transaction.space.baseCurrencyCode, {
                noCode: true,
              })}
            />
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-5xl gap-8">
        {transaction.category && (
          <div className="space-y-2">
            <Label>Category</Label>
            <div
              className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-2 font-bold text-gray-100 text-sm"
              style={{
                backgroundColor: getColorValue(transaction.category.color),
              }}
            >
              <span>{transaction.category.icon}</span>
              <span>{transaction.category.name}</span>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label>Account</Label>
          <div
            className="flex min-w-[150px] items-center gap-2 rounded bg-gray-100 px-3 py-2 font-bold text-gray-100 text-sm"
            style={{
              backgroundColor: getColorValue(transaction.account.color),
            }}
          >
            <span className="flex-1">{transaction.account.name}</span>
            {transaction.account.lastDigits && (
              <span className="opacity-80">
                {transaction.account.lastDigits}
              </span>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Created by</Label>
          <div className="flex items-center gap-2 font-bold text-sm">
            <Image
              alt={`${transaction.user.firstName} ${transaction.user.lastName}`}
              src={transaction.user.profilePictureUrl!}
              width={36}
              height={36}
              className="rounded-full"
            />
            <span>
              {transaction.user.firstName} {transaction.user.lastName}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea defaultValue={transaction.notes ?? ''} className="bg-card" />
      </div>
    </div>
  )
}
