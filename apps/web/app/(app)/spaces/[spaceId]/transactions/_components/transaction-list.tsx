'use client'
import { getTransactionList } from '@/actions/get-transaction-list'
import { getColorValue } from '@/lib/get-color-value'
import { getCurrencyInputProps } from '@/lib/get-currency-input-props'
import { NumericFormat } from '@6pm/ui/components/number-format'
import { format, isThisYear, isToday, isYesterday } from '@6pm/ui/lib/date-fns'
import { cn } from '@6pm/ui/lib/utils'
import { groupBy, minBy, orderBy, uniqBy } from 'lodash-es'
import Link from 'next/link'
import { type FC, useEffect, useState } from 'react'
import { useSpaceContext } from '../../_components/space-context'

export type TransactionItem = NonNullable<
  Awaited<ReturnType<typeof getTransactionList>>['data']
>[number]

export type TransactionListProps = {
  spaceId: string
}

export const TransactionList: FC<TransactionListProps> = ({ spaceId }) => {
  const { space } = useSpaceContext()
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = async () => {
    setLoading(true)
    const lastDate = minBy(transactions, 'date')?.date

    const { data } = await getTransactionList({ spaceId, before: lastDate })

    if (data?.length) {
      setTransactions((prev) =>
        orderBy(uniqBy([...prev, ...data], 'id'), ['date'], ['desc']),
      )
    }

    setLoading(false)
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    fetchTransactions()
  }, [])

  if (!loading && !transactions.length) {
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
    <>
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
                    <span className="text-muted-foreground text-sm">
                      {transaction.account.name}{' '}
                      {transaction.account.lastDigits}
                    </span>
                  </Link>
                  {transaction.category && (
                    <div
                      className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-1 font-bold text-gray-100 text-sm"
                      style={{
                        backgroundColor: getColorValue(
                          transaction.category.color,
                        ),
                      }}
                    >
                      <span>{transaction.category.icon}</span>
                      <span>{transaction.category.name}</span>
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
      {loading && 'loading...'}
    </>
  )
}
