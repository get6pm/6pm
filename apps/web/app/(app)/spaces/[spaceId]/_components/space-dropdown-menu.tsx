'use client'
import { useAppContext } from '@/app/(app)/_components/app-context'
import { Button } from '@6pm/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@6pm/ui/components/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@6pm/ui/components/tooltip'
import { CheckIcon, ChevronUpIcon, PlusIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { FC } from 'react'
import { useSpaceContext } from './space-context'

export type SpaceDropdownMenuProps = {}

export const SpaceDropdownMenu: FC<SpaceDropdownMenuProps> = () => {
  const { user } = useAppContext()
  const { space } = useSpaceContext()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={null}
          size={null}
          className="inset-0 overflow-hidden border-1 bg-gradient-to-b from-bg-500/0 to-bg-500/40 px-2 py-1.5 ring-accent-main-100 ring-offset-2 ring-offset-bg-300 transition-all hover:border-border-200/50 focus-visible:outline-none focus-visible:ring-1"
        >
          <Image
            src={user.profilePictureUrl!}
            alt="User Avatar"
            width={28}
            height={28}
            className="rounded"
          />
          <div className="flex-1 overflow-hidden text-ellipsis text-left text-sm">
            {space.name}
          </div>
          <ChevronUpIcon className="!opacity-60 transition-opacity" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="z-50 w-60 bg-card">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>My spaces</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  asChild
                  size="icon"
                  variant="outline"
                  className="-mr-1 size-5 rounded-sm"
                >
                  <Link href="/onboarding" className="cursor-default">
                    <PlusIcon className="size-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create new space</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </DropdownMenuLabel>
        {user.spaceMemberships.map((membership) => (
          <DropdownMenuItem asChild key={membership.id}>
            <Link
              href="/spaces/[spaceId]"
              as={`/spaces/${membership.space.id}`}
              className="flex items-center gap-2"
            >
              <span className="line-clamp-1 flex-1 overflow-hidden text-ellipsis ">
                {membership.space.name}
              </span>
              {membership.spaceId === space.id && (
                <CheckIcon className="text-accent-main" />
              )}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/spaces/[spaceId]/settings"
            as={`/spaces/${space.id}/settings`}
          >
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
