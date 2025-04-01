'use client'

import { Button } from '@6pm/ui/components/button'
import { PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { TransactionList } from './_components/transaction-list'

export default function TransactionsPage() {
  const { spaceId } = useParams<{ spaceId: string }>()
  return (
    <div className="container mx-auto block w-full space-y-8 px-4 py-4 md:hidden">
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
  )
}
