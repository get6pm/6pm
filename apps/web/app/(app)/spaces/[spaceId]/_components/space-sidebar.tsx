'use client'
import NoSsr from '@/components/no-ssr'
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
  XIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { type FC, useState } from 'react'
import { SpaceDropdownMenu } from './space-dropdown-menu'

const MENU_ITEMS = [
  { label: 'dashboard', path: '', icon: ChartSplineIcon },
  { label: 'transactions', path: '/transactions', icon: LayersIcon },
  { label: 'categories', path: '/categories', icon: ChartPieIcon },
  { label: 'accounts', path: '/accounts', icon: WalletIcon },
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
        <NoSsr>
          <BetaNotice />
        </NoSsr>
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
  const t = useTranslations('space-sidebar')
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
      <Link prefetch href={href} as={as}>
        {Icon && <Icon className="inline-block size-4" />}
        <span>{t(label)}</span>
      </Link>
    </SidebarMenuButton>
  )
}

const BetaNotice: FC = () => {
  const t = useTranslations()
  const defaultDismissed =
    typeof window === 'undefined'
      ? false
      : document.cookie.includes('beta-notice-dismissed=true')

  const [isDismissed, setIsDismissed] = useState(defaultDismissed)

  if (isDismissed) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    document.cookie = 'beta-notice-dismissed=true; max-age=604800' // 7 days
  }

  return (
    <div className="relative space-y-1.5 rounded-md border p-2 text-xs opacity-80 backdrop-blur-2xl">
      <div>
        {t('szilkCEdhAM_DDwW-cp_D')}{' '}
        <b className="font-serif">{config.appNameLowercase}</b>.{' '}
        {t('rUVAl6NhJecuFbCVNU121')}{' '}
        <a
          href="https://github.com/get6pm/6pm/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {t('mHaSs3n8WUhm7eD35grgL')}
        </a>{' '}
        {t('lrlcNhSckdcTv9zT0X97Z')}.
      </div>
      <div className="text-accent-main-200">{t('EpV13KSgVY5ZOlDP4rj7Q')}</div>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-1 right-1 opacity-60 transition-opacity hover:opacity-100"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  )
}
