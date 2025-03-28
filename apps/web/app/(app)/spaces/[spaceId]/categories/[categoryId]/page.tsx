'use client'
import { Redirect } from '@/components/redirect'
import { useSpaceCategories } from '@/store/hooks'
import { Button } from '@6pm/ui/components/button'
import { TooltipProvider } from '@6pm/ui/components/tooltip'
import { EllipsisIcon, Pencil } from 'lucide-react'
import { useParams } from 'next/navigation'
import { SpaceMainLayout } from '../../_components/space-main-layout'

export default function CategoryIdPage() {
  const { spaceId, categoryId } = useParams<{
    spaceId: string
    categoryId: string
  }>()
  const categories = useSpaceCategories()
  const category = categories[categoryId]

  if (!category) {
    return <Redirect to={`/spaces/${spaceId}/categories`} />
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
