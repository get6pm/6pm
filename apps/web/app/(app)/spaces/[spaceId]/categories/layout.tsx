import getMetadata from '@/lib/get-metadata'
import { prisma } from '@6pm/db'
import { TooltipProvider } from '@6pm/ui/components/tooltip'
import { type ReactNode, Suspense } from 'react'
import { SpaceMainLayout } from '../_components/space-main-layout'
import { AddCategoryButton } from './_components/add-category-button'
import { CategoryList } from './_components/category-list'

export const metadata = getMetadata({
  title: 'Categories',
})

export default async function CategoriesLayout({
  children,
  params,
}: { children: ReactNode; params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params
  const categories = await prisma.spendingCategory.findMany({
    where: { spaceId },
    include: {
      group: true,
      budget: true,
    },
  })

  return (
    <div className="grid h-screen grid-cols-2 overflow-hidden">
      <div className="col-span-1 border-r">
        <SpaceMainLayout
          headerTitle="Categories"
          toolbar={
            <TooltipProvider>
              <div>
                <AddCategoryButton />
              </div>
            </TooltipProvider>
          }
        >
          {categories.length ? (
            <CategoryList categories={categories} />
          ) : (
            <p>
              Your space doesn't have any categories yet. Add one to get
              started!
            </p>
          )}
        </SpaceMainLayout>
      </div>
      <div className="col-span-1">
        <Suspense fallback="loading...">{children}</Suspense>
      </div>
    </div>
  )
}
