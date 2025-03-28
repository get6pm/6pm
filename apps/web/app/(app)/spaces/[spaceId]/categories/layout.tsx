import getMetadata from '@/lib/get-metadata'
import { TooltipProvider } from '@6pm/ui/components/tooltip'
import type { ReactNode } from 'react'
import { SpaceMainLayout } from '../_components/space-main-layout'
import { SpaceSplitLayout } from '../_components/space-split-layout'
import { AddCategoryButton } from './_components/add-category-button'
import { CategoryList } from './_components/category-list'

export const metadata = getMetadata({
  title: 'Categories',
})

export default async function CategoriesLayout({
  children,
}: { children: ReactNode }) {
  return (
    <SpaceSplitLayout
      left={
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
          <CategoryList />
        </SpaceMainLayout>
      }
      right={children}
    />
  )
}
