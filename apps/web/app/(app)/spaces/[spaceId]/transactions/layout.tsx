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

export default async function TransactionsLayout({
  children,
  params,
}: { children: ReactNode; params: Promise<{ spaceId: string }> }) {
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
                  <AddTransaction>
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
          <p>
            Your space doesn't have any transactions yet. Add one to get
            started!
          </p>
        </SpaceMainLayout>
      }
      right={children}
    />
  )
}
