import { findSpace } from '@6pm/db/services/space'
import { SidebarProvider } from '@6pm/ui/components/sidebar'
import { cookies } from 'next/headers'
import { RedirectType, redirect } from 'next/navigation'
import type { PropsWithChildren } from 'react'
import SpaceProvider from './_components/space-provider'
import { SpaceSidebar } from './_components/space-sidebar'
import { SyncLastVisitedSpace } from './_components/sync-last-visited-space'

export default async function SpaceLayout(
  props: {
    params: Promise<{ spaceId: string }>
  } & PropsWithChildren,
) {
  const { spaceId } = await props.params
  const cookieStore = await cookies()
  const defaultOpen =
    !cookieStore.get('sidebar_state')?.value ||
    cookieStore.get('sidebar_state')?.value === 'true'
  const space = await findSpace({ id: spaceId })

  if (!space) {
    return redirect('/spaces', RedirectType.replace)
  }

  return (
    <SpaceProvider space={space}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <SyncLastVisitedSpace spaceId={spaceId} />
        <SpaceSidebar />
        <main className="w-full">{props.children}</main>
      </SidebarProvider>
    </SpaceProvider>
  )
}
