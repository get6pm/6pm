import { prisma } from '@6pm/db'
import { PieChartIcon } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function CategoriesPage({
  params,
}: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params

  const categories = await prisma.spendingCategory.findMany({
    where: { spaceId },
    select: { id: true },
  })

  if (!categories.length) {
    return (
      <div className="grid h-full w-full place-items-center">
        <PieChartIcon className="size-[300px] text-[300px] text-accent-main-900/80" />
      </div>
    )
  }

  return redirect(`/spaces/${spaceId}/categories/${categories[0]?.id}`)
}
