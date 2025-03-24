'use client'

import type { getSpaceSpendingCategories } from '@6pm/db/services/category'
import { cn } from '@6pm/ui/lib/utils'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { FC } from 'react'

type CategoryListItem = Awaited<
  ReturnType<typeof getSpaceSpendingCategories>
>[number]

export type CategoryListProps = {
  categories: CategoryListItem[]
}

export const CategoryList: FC<CategoryListProps> = ({ categories }) => {
  const { spaceId, categoryId } = useParams<{
    spaceId: string
    categoryId?: string
  }>()

  return (
    <table className="w-full">
      <tbody className="[&_td]:px-2 [&_td]:py-1 [&_th]:pb-3">
        <tr className="text-left">
          <th className="overflow-hidden" />
          <th className="w-[1%] text-right">Spent</th>
          <th className="w-[30%] min-w-[72px]" />
          <th className="w-[1%] text-right">Budget</th>
        </tr>
        {categories.map((category) => (
          <tr key={category.id}>
            <td>
              <Link
                href="/spaces/[spaceId]/categories/[categoryId]"
                as={`/spaces/${spaceId}/categories/${category.id}`}
                className="flex flex-nowrap items-center gap-4 overflow-hidden"
              >
                <div
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: category.color }}
                />
                <span className="shrink-0 text-lg">{category.icon}</span>
                <span
                  className={cn(
                    'line-clamp-1 opacity-80 transition-all hover:opacity-90',
                    categoryId === category.id &&
                      'font-semibold text-accent-main-200 opacity-100',
                  )}
                >
                  {category.name}
                </span>
              </Link>
            </td>
            <td className="text-right font-bold text-sm">$0</td>
            <td>
              {category.budget && (
                <div className="h-2 w-full rounded-sm border bg-bg-200" />
              )}
            </td>
            <td className="font-bold text-sm">
              {category.budget && <span>${category.budget.amount}</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
