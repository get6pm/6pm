'use client'
import { cn } from '@6pm/ui/lib/utils'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import type { FC } from 'react'

const MENU_ITEMS = [
  {
    label: 'Space',
    path: '',
  },
  {
    label: 'Profile',
    path: '/profile',
  },
  {
    label: 'Account',
    path: '/account',
  },
]

export type SettingsNavbarProps = {}

export const SettingsNavbar: FC<SettingsNavbarProps> = () => {
  return (
    <nav>
      <ul className="space-y-1">
        {MENU_ITEMS.map((menuItem) => (
          <MenuItem key={menuItem.path} menuItem={menuItem} />
        ))}
      </ul>
    </nav>
  )
}

const MenuItem: FC<{
  menuItem: (typeof MENU_ITEMS)[number]
}> = ({ menuItem: { label, path } }) => {
  const params = useParams<{ spaceId: string }>()
  const pathname = usePathname()
  const href = `/spaces/[spaceId]/settings${path}`
  const as = `/spaces/${params.spaceId}/settings${path}`
  const isActive = path === '' ? pathname === as : pathname.startsWith(as)
  return (
    <li>
      <Link
        href={href}
        as={as}
        className={cn(
          'block rounded-lg px-3 py-3.5 opacity-70 transition-colors hover:bg-bg-300/70 hover:opacity-100 active:bg-bg-300/60 lg:px-4',
          isActive && 'active !bg-bg-400/85 font-semibold',
        )}
      >
        {label}
      </Link>
    </li>
  )
}
