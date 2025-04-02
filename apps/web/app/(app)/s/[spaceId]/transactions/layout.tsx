'use client'

import { Button } from '@6pm/ui/components/button'
import { cn } from '@6pm/ui/lib/utils'
import { PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import type { PropsWithChildren } from 'react'
import { TransactionList } from './_components/transaction-list'

export default function TransactionsLayout({ children }: PropsWithChildren) {
  const { transactionId, spaceId } = useParams<{
    transactionId: string
    spaceId: string
  }>()
  const pathname = usePathname()
  const showChildren =
    transactionId || pathname.endsWith('/transactions/create')

  return (
    <div
      className={cn(
        'pr-0 transition-[padding-right] delay-100 duration-500 ease-in-out',
        showChildren && 'md:pr-[514px]',
      )}
    >
      <div className="container mx-auto hidden max-w-md space-y-8 px-4 py-4 md:block md:py-8">
        <div className="flex items-center justify-between">
          <h1 className="font-medium text-2xl">Transactions</h1>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full font-medium"
          >
            <Link
              prefetch
              href="/s/[spaceId]/transactions/create"
              as={`/s/${spaceId}/transactions/create`}
            >
              <PlusIcon className="size-4" />
              Add transaction
            </Link>
          </Button>
        </div>
        <TransactionList />
      </div>

      <div
        className={cn(
          'backdrop-blur md:fixed md:top-8 md:right-8 md:bottom-8 md:w-[450px] md:translate-x-[482px] md:rounded-xl md:border md:opacity-0 md:shadow-none md:transition-all md:duration-500 md:ease-in-out',
          showChildren && 'md:translate-x-0 md:opacity-100 md:shadow-sm',
        )}
      >
        {children}
      </div>
    </div>
  )
}
