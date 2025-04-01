import { Button } from '@6pm/ui/components/button'
import { cn } from '@6pm/ui/lib/utils'
import {
  ChartPieIcon,
  ChartSplineIcon,
  LayersIcon,
  type LucideIcon,
  WalletIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { type FC, useEffect, useState } from 'react'

const MENU_ITEMS = [
  { label: 'dashboard', path: '', icon: ChartSplineIcon },
  { label: 'transactions', path: '/transactions', icon: LayersIcon },
  { label: 'categories', path: '/categories', icon: ChartPieIcon },
  { label: 'accounts', path: '/accounts', icon: WalletIcon },
]

export type NavBarProps = {}

export const NavBar: FC<NavBarProps> = () => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setShow(true), 500)
    return () => clearTimeout(timeout)
  }, [])

  if (!show) {
    return null
  }

  return (
    <div
      className={cn(
        'slide-in-from-bottom fade-in-10 animate-in duration-500 ease-out',
        'fixed bottom-4 left-1/2 translate-x-[-50%]',
        'flex gap-2 rounded-full border p-2',
        'backdrop-blur',
      )}
    >
      {MENU_ITEMS.map((item) => (
        <NavItem key={item.path} {...item} />
      ))}
    </div>
  )
}

type NavItemProps = {
  label: string
  path: string
  icon: LucideIcon
  className?: string
}

const NavItem: FC<NavItemProps> = ({ label, path, icon: Icon, className }) => {
  const t = useTranslations('space-sidebar')
  const params = useParams<{ spaceId: string }>()
  const pathname = usePathname()
  const href = `/s/[spaceId]${path}`
  const as = `/s/${params.spaceId}${path}`
  const isActive = path === '' ? pathname === as : pathname.startsWith(as)

  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        'flex h-10 min-w-max items-center gap-0 rounded-full text-sm transition-colors duration-500',
        isActive && 'active !bg-primary/5 !text-primary',
        className,
      )}
    >
      <Link prefetch href={href} as={as}>
        {Icon && <Icon className="inline-block size-4 stroke-3" />}
        <span
          className={cn(
            'max-w-0 overflow-hidden opacity-0 transition-[max-width,margin-left,opacity] delay-0 duration-500 ease-in-out',
            isActive &&
              'ml-2 max-w-[150px] opacity-100 delay-300 duration-500 ease-in-out',
          )}
        >
          {t(label)}
        </span>
      </Link>
    </Button>
  )
}
