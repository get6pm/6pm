import { doesUserBelongToSpace } from '@/actions/space-permission'
import { prisma } from '@6pm/db'
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
  const { data: userBelongs } = await doesUserBelongToSpace({ spaceId })

  if (!userBelongs) {
    return redirect('/spaces', RedirectType.replace)
  }

  const space = await prisma.space.findUnique({
    where: {
      id: spaceId,
    },
    include: {
      spaceMemberships: true,
    },
  })

  const cookieStore = await cookies()
  const defaultOpen =
    !cookieStore.get('sidebar_state')?.value ||
    cookieStore.get('sidebar_state')?.value === 'true'

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
