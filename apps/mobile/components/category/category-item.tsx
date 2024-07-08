import type { Category } from '@6pm/validation'
import { Link } from 'expo-router'
import type { FC } from 'react'
import GenericIcon from '../common/generic-icon'
import { MenuItem } from '../common/menu-item'

type CategoryItemProps = {
  category: Category
}

export const CategoryItem: FC<CategoryItemProps> = ({ category }) => {
  return (
    <Link
      asChild
      push
      href={{
        pathname: '/category/[categoryId]',
        params: { categoryId: category.id },
      }}
    >
      <MenuItem
        label={category.name}
        icon={() => (
          <GenericIcon
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            name={category.icon as any}
            className="size-6 text-foreground"
          />
        )}
      />
    </Link>
  )
}
