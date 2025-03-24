import { getSpaceSpendingCategories } from '@6pm/db/services/category'
import { auth } from '@clerk/nextjs/server'
import { PieChartIcon } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function CategoriesPage({
  params,
}: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params
  const { userId } = await auth()

  const categories = await getSpaceSpendingCategories({
    spaceId,
    userId: userId!,
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
