import { prisma } from '@6pm/db'
import { Button } from '@6pm/ui/components/button'
import { SheetTrigger } from '@6pm/ui/components/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@6pm/ui/components/tooltip'
import { PlusIcon, SearchIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { SpaceMainLayout } from '../_components/space-main-layout'
import { SpaceSplitLayout } from '../_components/space-split-layout'
import { AddTransaction } from './_components/add-transaction'
import { TransactionList } from './_components/transaction-list'

export default async function TransactionsLayout({
  children,
  params,
}: { children: ReactNode; params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params

  const [categories, accounts] = await Promise.all([
    prisma.spendingCategory.findMany({
      where: {
        spaceId: spaceId,
      },
    }),
    prisma.account.findMany({
      where: {
        spaceId: spaceId,
      },
    }),
  ])

  return (
    <SpaceSplitLayout
      left={
        <SpaceMainLayout
          headerTitle="Transactions"
          toolbar={
            <TooltipProvider>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="outline">
                      <SearchIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Search</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <AddTransaction categories={categories} accounts={accounts}>
                    <TooltipTrigger asChild>
                      <SheetTrigger asChild>
                        <Button size="icon" variant="outline">
                          <PlusIcon />
                        </Button>
                      </SheetTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Add transaction</TooltipContent>
                  </AddTransaction>
                </Tooltip>
              </div>
            </TooltipProvider>
          }
        >
          <TransactionList spaceId={spaceId} />
        </SpaceMainLayout>
      }
      right={children}
    />
  )
}
