'use client'
import { AmountCurrency } from '@/components/amount-currency'
import { useSpaceAccounts } from '@/hooks/accounts'
import { useSpaceCategories } from '@/hooks/categories'
import { useCurrentSpace } from '@/hooks/spaces'
import { useSpaceTransactionList } from '@/hooks/transactions'
import { getColorValue } from '@/lib/get-color-value'
import { format, isThisYear, isToday, isYesterday } from '@6pm/ui/lib/date-fns'
import { cn } from '@6pm/ui/lib/utils'
import { groupBy, orderBy } from 'lodash-es'
import { TextIcon } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { FC } from 'react'

export type TransactionListProps = {}

export const TransactionList: FC<TransactionListProps> = () => {
  const space = useCurrentSpace()
  const allTransactions = useSpaceTransactionList(space.id)

  const transactions = allTransactions.filter((t) => !t.deletedAt)

  if (transactions.length === 0) {
    return (
      <p>
        Your space doesn't have any transactions yet. Add one to get started!
      </p>
    )
  }

  const transactionsByDate = groupBy(
    orderBy(transactions, 'date', 'desc'),
    (transaction) => {
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
    },
  )

  return (
    <div className="w-full space-y-8">
      {Object.entries(transactionsByDate).map(([date, transactions]) => (
        <div key={date}>
          <h2 className="mb-4 font-bold text-muted-foreground text-xs uppercase">
            {date}
          </h2>
          <div className="-mx-2 space-y-1">
            {transactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transactionId={transaction.id}
                name={transaction.name}
                amount={transaction.amount}
                spaceId={transaction.spaceId}
                categoryId={transaction.categoryId}
                accountId={transaction.accountId}
                notes={transaction.notes}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export type TransactionItemProps = {
  transactionId: string
  name: string
  amount: number
  spaceId: string
  categoryId?: string | null
  accountId?: string | null
  notes?: string | null
}

export const TransactionItem: FC<TransactionItemProps> = ({
  transactionId,
  name,
  amount,
  spaceId,
  accountId,
  categoryId,
  notes,
}) => {
  const params = useParams<{ transactionId: string }>()
  const isActive = transactionId === params.transactionId
  const categories = useSpaceCategories(spaceId)
  const accounts = useSpaceAccounts(spaceId)

  const category = categoryId && categories[categoryId]
  const account = accountId && accounts[accountId]

  return (
    <Link
      className={cn(
        'block w-full space-y-0.5 rounded-lg p-2',
        'transition-all duration-200 ease-in-out hover:ring hover:ring-foreground/10 active:ring-2',
        isActive && '!ring-2 !ring-primary/20',
      )}
      href="/s/[spaceId]/transactions/[transactionId]"
      as={`/s/${spaceId}/transactions/${transactionId}`}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-baseline gap-2">
          {name}
          {notes && <TextIcon className="size-3 text-muted-foreground" />}
        </span>
        <span className="font-bold text-sm">
          <AmountCurrency amount={amount} />
        </span>
      </div>
      <div className="flex items-center gap-2">
        {category && (
          <div
            className="flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-xs"
            style={{
              backgroundColor: `${getColorValue(category.color)}20`,
            }}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </div>
        )}
        {account && (
          <div
            className="flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-xs"
            style={{
              backgroundColor: `${getColorValue(account.color)}20`,
            }}
          >
            <span
              className="size-1.5 rounded-xs"
              style={{
                backgroundColor: `${getColorValue(account.color)}`,
              }}
            />
            <span>{account.name}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
