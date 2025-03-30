import type { CategoryValues } from '@/schemas/category'
import { useAppContext } from '@/store/app-provider'
import { useState } from 'react'
import { useSpace } from './spaces'

export const useCategories = () => {
  const space = useSpace()
  const { categories } = useAppContext((state) => ({
    categories: state.spaces[space.id]?.categories,
  }))
  return categories ?? {}
}

export const useCategoryList = ({
  includeDeleted,
}: { includeDeleted?: boolean }) => {
  const categories = useCategories()
  const categoryList = Object.values(categories)

  if (!includeDeleted) {
    return categoryList.filter((category) => !category.deletedAt)
  }

  return categoryList
}

export const useCategory = (categoryId: string) => {
  const categories = useCategories()
  return categories[categoryId] ?? null
}

export const useCreateCategory = () => {
  const [isPending, setIsPending] = useState(false)

  const { createCategory: createCategoryAction } = useAppContext((state) => ({
    createCategory: state.createCategory,
  }))

  const createCategory = async (args: {
    spaceId: string
    data: CategoryValues
  }) => {
    setIsPending(true)

    try {
      const { spaceId, data } = args
      const result = await createCategoryAction({ spaceId, data })
      return result
    } catch (error) {
      console.error('Failed to create category', error)
    } finally {
      setIsPending(false)
    }
  }

  return { createCategory, isPending }
}

export const useUpdateCategory = () => {
  const [isPending, setIsPending] = useState(false)

  const { updateCategory: updateCategoryAction } = useAppContext((state) => ({
    updateCategory: state.updateCategory,
  }))

  const updateCategory = async (args: {
    spaceId: string
    data: CategoryValues
  }) => {
    setIsPending(true)

    try {
      const { spaceId, data } = args
      const result = await updateCategoryAction({ spaceId, data })
      return result
    } catch (error) {
      console.error('Failed to update category', error)
    } finally {
      setIsPending(false)
    }
  }

  return { updateCategory, isPending }
}

export const useDeleteCategory = () => {
  const [isPending, setIsPending] = useState(false)

  const { deleteCategory: deleteCategoryAction } = useAppContext((state) => ({
    deleteCategory: state.deleteCategory,
  }))

  const deleteCategory = async (args: {
    id: string
  }) => {
    setIsPending(true)

    try {
      const result = await deleteCategoryAction({ id: args.id })
      return result
    } catch (error) {
      console.error('Failed to delete category', error)
    } finally {
      setIsPending(false)
    }
  }

  return { deleteCategory, isPending }
}
