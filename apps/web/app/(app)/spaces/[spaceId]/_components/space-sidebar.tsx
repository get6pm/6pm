'use client'
import config from '@/constants/config'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarRail,
  SidebarTrigger,
} from '@6pm/ui/components/sidebar'
import { cn } from '@6pm/ui/lib/utils'
import {
  ChartPieIcon,
  ChartSplineIcon,
  LayersIcon,
  type LucideIcon,
  WalletIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import type { FC } from 'react'
import { SpaceDropdownMenu } from './space-dropdown-menu'

const MENU_ITEMS = [
  { label: 'Dashboard', path: '', icon: ChartSplineIcon },
  { label: 'Transactions', path: '/transactions', icon: LayersIcon },
  { label: 'Categories', path: '/categories', icon: ChartPieIcon },
  { label: 'Accounts', path: '/accounts', icon: WalletIcon },
]

export type SpaceSidebarProps = {}

export const SpaceSidebar: FC<SpaceSidebarProps> = () => {
  return (
    <Sidebar className="border-r bg-gradient-to-b from-bg-300/70 to-bg-400/70 backdrop-blur">
      <SidebarHeader className="mt-2 flex flex-row items-center justify-between">
        <div className="mx-2 shrink-0 select-none font-serif text-2xl">
          {config.appNameLowercase}
        </div>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent className="bg-transparent">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {MENU_ITEMS.map((item) => (
                <SidebarMenuItem key={item.path} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarRail />
      </SidebarContent>
      <SidebarFooter>
        <SpaceDropdownMenu />
      </SidebarFooter>
    </Sidebar>
  )
}

type SidebarMenuItemProps = {
  label: string
  path: string
  icon: LucideIcon
  className?: string
}

const SidebarMenuItem: FC<SidebarMenuItemProps> = ({
  label,
  path,
  icon: Icon,
  className,
}) => {
  const params = useParams<{ spaceId: string }>()
  const pathname = usePathname()
  const href = `/spaces/[spaceId]${path}`
  const as = `/spaces/${params.spaceId}${path}`
  const isActive = path === '' ? pathname === as : pathname.startsWith(as)

  return (
    <SidebarMenuButton
      asChild
      className={cn(
        'flex items-center rounded-lg text-sm transition-colors hover:bg-bg-400/60 active:bg-bg-400/40',
        isActive && 'active !bg-bg-500/80',
        className,
      )}
    >
      <Link href={href} as={as}>
        {Icon && <Icon className="inline-block size-4" />}
        <span>{label}</span>
      </Link>
    </SidebarMenuButton>
  )
}
