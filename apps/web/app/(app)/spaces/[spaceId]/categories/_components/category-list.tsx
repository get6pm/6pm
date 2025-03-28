'use client'

import { getColorValue } from '@/lib/get-color-value'
import { getCurrencyInputProps } from '@/lib/get-currency-input-props'
import { useSpaceCategories } from '@/store/hooks'
import { NumericFormat } from '@6pm/ui/components/number-format'
import { cn } from '@6pm/ui/lib/utils'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { FC } from 'react'
import { useSpaceContext } from '../../_components/space-context'

export type CategoryListProps = {}

export const CategoryList: FC<CategoryListProps> = () => {
  const categoryDict = useSpaceCategories()
  const categories = Object.values(categoryDict)
  const { spaceId, categoryId } = useParams<{
    spaceId: string
    categoryId?: string
  }>()
  const { space } = useSpaceContext()

  if (!categories.length) {
    return (
      <p>Your space doesn't have any categories yet. Add one to get started!</p>
    )
  }

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
                prefetch
                href="/spaces/[spaceId]/categories/[categoryId]"
                as={`/spaces/${spaceId}/categories/${category.id}`}
                className="flex flex-nowrap items-center gap-4 overflow-hidden"
              >
                <div
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: getColorValue(category.color) }}
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
            <td>
              <NumericFormat
                className="text-right font-bold text-sm"
                value={0}
                {...getCurrencyInputProps(space.baseCurrencyCode, {
                  noCode: true,
                })}
              />
            </td>
            <td>
              {/* {category.budget && (
                <div className="h-2 w-full rounded-sm border bg-bg-200" />
              )} */}
            </td>
            <td>
              {/* {category.budget && (
                <NumericFormat
                  className="text-right font-bold text-sm"
                  value={category.budget.amount}
                  {...getCurrencyInputProps(space.baseCurrencyCode, {
                    noCode: true,
                  })}
                />
              )} */}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
