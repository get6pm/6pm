'use client'

import { useAppContext } from '@/store/app-provider'
import { Spinner } from '@6pm/ui/components/spinner'
import type { PropsWithChildren } from 'react'

export default function SPage({ children }: PropsWithChildren) {
  const { lastSyncedAt } = useAppContext((state) => ({
    lastSyncedAt: state.lastSyncedAt,
  }))

  if (!lastSyncedAt) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return children
}
