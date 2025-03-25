import { Button } from '@6pm/ui/components/button'
import { DropdownMenuTrigger } from '@6pm/ui/components/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@6pm/ui/components/tooltip'
import { PlusIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { SpaceMainLayout } from '../_components/space-main-layout'
import { SpaceSplitLayout } from '../_components/space-split-layout'
import {
  AddAccount,
  AddAccountContent,
  AddAccountDialog,
} from './_components/add-account'

export default async function AccountsLayout({
  children,
  // params,
}: { children: ReactNode; params: Promise<{ spaceId: string }> }) {
  return (
    <SpaceSplitLayout
      left={
        <SpaceMainLayout
          headerTitle="Accounts"
          toolbar={
            <TooltipProvider>
              <AddAccount>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="outline">
                        <PlusIcon />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Add account</TooltipContent>
                </Tooltip>
                <AddAccountContent side="bottom" align="start" />
                <AddAccountDialog />
              </AddAccount>
            </TooltipProvider>
          }
        >
          <p>
            Your space doesn't have any accounts yet. Add one to get started!
          </p>
        </SpaceMainLayout>
      }
      right={children}
    />
  )
}
