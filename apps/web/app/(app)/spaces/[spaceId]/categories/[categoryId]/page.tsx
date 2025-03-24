import { findSpendingCategory } from '@6pm/db/services/category'
import { Button } from '@6pm/ui/components/button'
import { TooltipProvider } from '@6pm/ui/components/tooltip'
import { auth } from '@clerk/nextjs/server'
import { EllipsisIcon, Pencil } from 'lucide-react'
import { redirect } from 'next/navigation'
import { SpaceMainLayout } from '../../_components/space-main-layout'

export default async function CategoryIdPage({
  params,
}: { params: Promise<{ spaceId: string; categoryId: string }> }) {
  const { spaceId, categoryId } = await params
  const { userId } = await auth()
  const category = await findSpendingCategory({ userId: userId!, categoryId })

  if (!category) {
    return redirect(`/spaces/${spaceId}/categories`)
  }

  return (
    <SpaceMainLayout
      headerTitle={category.name}
      toolbar={
        <TooltipProvider>
          <div className="ml-auto space-x-3">
            <Button variant="outline">
              <Pencil className="mr-1 size-4" /> Edit budget
            </Button>
            <Button size="icon" variant="outline">
              <EllipsisIcon />
            </Button>
          </div>
        </TooltipProvider>
      }
    >
      Content
    </SpaceMainLayout>
  )
}
