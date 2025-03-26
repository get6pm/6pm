import { prisma } from '@6pm/db'
import { WalletIcon } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function AccountsPage({
  params,
}: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params
  const accounts = await prisma.account.findMany({
    where: { spaceId },
    select: { id: true },
  })

  if (!accounts.length) {
    return (
      <div className="grid h-full w-full place-items-center">
        <WalletIcon className="size-[300px] text-[300px] text-accent-main-900/80" />
      </div>
    )
  }

  return redirect(`/spaces/${spaceId}/accounts/${accounts[0]?.id}`)
}
