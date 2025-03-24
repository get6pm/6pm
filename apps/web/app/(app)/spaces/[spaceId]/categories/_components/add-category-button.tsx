'use client'
import { createCategory } from '@/actions/create-category'
import type { CreateCategoryValues } from '@/schemas/category'
import { SPENDING_CATEGORY_SUGGESTIONS } from '@6pm/db/static-data/category'
import { Button } from '@6pm/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@6pm/ui/components/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@6pm/ui/components/tooltip'
import { PlusIcon } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import type { FC } from 'react'

export type AddCategoryButtonProps = {}

export const AddCategoryButton: FC<AddCategoryButtonProps> = () => {
  const { spaceId } = useParams<{ spaceId: string }>()
  const router = useRouter()

  const handleCreateCategory = async (values: CreateCategoryValues) => {
    const { data: category, success } = await createCategory({
      spaceId,
      data: values,
    })

    if (!success) {
      return
    }

    router.push(`/spaces/${spaceId}/categories/${category.id}`)
  }

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline">
                <PlusIcon />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Add category</TooltipContent>
        </Tooltip>
        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuItem className="py-2">
            Start a new one from scratch
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {SPENDING_CATEGORY_SUGGESTIONS.map((category) => (
            <DropdownMenuItem
              key={category.name}
              className="py-1"
              onClick={() => handleCreateCategory(category)}
            >
              <span className="text-lg">{category.icon}</span>
              {category.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
