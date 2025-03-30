'use client'
import { getColorValue } from '@/lib/get-color-value'
import { getCurrencyInputProps } from '@/lib/get-currency-input-props'
import type { Transaction } from '@6pm/db'
import { NumericFormat } from '@6pm/ui/components/number-format'
import { format, isThisYear, isToday, isYesterday } from '@6pm/ui/lib/date-fns'
import { cn } from '@6pm/ui/lib/utils'
import { groupBy } from 'lodash-es'
import Link from 'next/link'
import type { FC } from 'react'
import { useSpaceContext } from '../../_components/space-context'
import { useAccounts } from '../../_hooks/accounts'
import { useCategories } from '../../_hooks/categories'
import { useTransactionList } from '../../_hooks/transactions'

export type TransactionItem = Transaction

export type TransactionListProps = {
  spaceId: string
}

export const TransactionList: FC<TransactionListProps> = ({ spaceId }) => {
  const { space } = useSpaceContext()
  const transactions = useTransactionList()
  const categories = useCategories()
  const accounts = useAccounts()

  if (!transactions.length) {
    return (
      <p>
        Your space doesn't have any transactions yet. Add one to get started!
      </p>
    )
  }

  const transactionsByDate = groupBy(transactions, (transaction) => {
    const date = new Date(transaction.date)
    if (isToday(date)) {
      return 'Today'
    }
    if (isYesterday(date)) {
      return 'Yesterday'
    }
    if (isThisYear(date)) {
      return format(date, 'EEEE, MMMM d')
    }

    return format(date, 'EEEE, MMMM d, yyyy')
  })

  return (
    <div className="w-full space-y-4">
      {Object.entries(transactionsByDate).map(([date, transactions]) => (
        <div key={date}>
          <h2 className="mb-3 font-bold text-muted-foreground text-xs uppercase">
            {date}
          </h2>
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex w-full items-baseline space-x-2"
              >
                <Link
                  prefetch
                  href="/spaces/[spaceId]/transactions/[transactionId]"
                  as={`/spaces/${spaceId}/transactions/${transaction.id}`}
                  className="flex-1 space-x-4"
                >
                  <span className="font">{transaction.name}</span>
                  {accounts[transaction.accountId] && (
                    <span className="text-muted-foreground text-sm">
                      {accounts[transaction.accountId]?.name}{' '}
                      {accounts[transaction.accountId]?.lastDigits}
                    </span>
                  )}
                </Link>
                {transaction.categoryId &&
                  categories[transaction.categoryId] && (
                    <div
                      className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-1 font-bold text-gray-100 text-sm"
                      style={{
                        backgroundColor: getColorValue(
                          categories[transaction.categoryId]?.color,
                        ),
                      }}
                    >
                      <span>{categories[transaction.categoryId]?.icon}</span>
                      <span>{categories[transaction.categoryId]?.name}</span>
                    </div>
                  )}
                <div>
                  <NumericFormat
                    value={Math.abs(transaction.amount)}
                    className={cn(
                      'text-right font-bold text-sm',
                      transaction.amount > 0 && 'text-green-700',
                      // transaction.amount < 0 && 'text-red-700',
                    )}
                    {...getCurrencyInputProps(space.baseCurrencyCode, {
                      noCode: true,
                    })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
