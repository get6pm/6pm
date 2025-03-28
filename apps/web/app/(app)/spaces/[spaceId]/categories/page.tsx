'use client'
import { Redirect } from '@/components/redirect'
import { useCurrentSpaceId, useSpaceCategories } from '@/store/hooks'
import { isEmpty } from 'lodash-es'
import { PieChartIcon } from 'lucide-react'

export default function CategoriesPage() {
  const spaceId = useCurrentSpaceId()
  const categories = useSpaceCategories()

  if (isEmpty(categories)) {
    return (
      <div className="grid h-full w-full place-items-center">
        <PieChartIcon className="size-[300px] text-[300px] text-accent-main-900/80" />
      </div>
    )
  }

  return (
    <Redirect
      to={`/spaces/${spaceId}/categories/${Object.values(categories)[0]?.id}`}
    />
  )
}
