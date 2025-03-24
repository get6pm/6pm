import { prisma } from '@6pm/db'
import { Button } from '@6pm/ui/components/button'
import { TooltipProvider } from '@6pm/ui/components/tooltip'
import { EllipsisIcon, Pencil } from 'lucide-react'
import { redirect } from 'next/navigation'
import { SpaceMainLayout } from '../../_components/space-main-layout'

export default async function CategoryIdPage({
  params,
}: { params: Promise<{ spaceId: string; categoryId: string }> }) {
  const { spaceId, categoryId } = await params
  const category = await prisma.spendingCategory.findUnique({
    where: { id: categoryId },
    include: {
      group: true,
      budget: true,
    },
  })

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
