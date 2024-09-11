import { toast } from '@/components/common/toast'
import { getHonoClient } from '@/lib/client'
import { useMeQuery } from '@/queries/auth'
import {
  type Category,
  type CategoryFormValues,
  CategorySchema,
} from '@6pm/validation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { keyBy, omit } from 'lodash-es'
import { usePostHog } from 'posthog-react-native'
import { useMemo } from 'react'
import { z } from 'zod'
import type { StoreHookQueryOptions } from '../core/stores'
import { categoryQueries } from './queries'
import { useCategoryStore } from './store'

export const useCategoryListQueryOptions = (
  queryOptions?: StoreHookQueryOptions,
) => {
  const categories = useCategoryStore().categories
  const setCategoriesState = useCategoryStore((state) => state.setCategories)
  return {
    ...categoryQueries.all({ setCategoriesState }),
    initialData: categories?.length > 0 ? categories : undefined,
    ...queryOptions,
  }
}

export const useCategoryList = (queryOptions?: StoreHookQueryOptions) => {
  const categories = useCategoryStore().categories
  const queryOpts = useCategoryListQueryOptions(queryOptions)

  const query = useQuery(queryOpts)

  const { categoriesDict, incomeCategories, expenseCategories } =
    useMemo(() => {
      const categoriesDict = keyBy(categories, 'id')
      const incomeCategories = categories.filter(
        (category) => category.type === 'INCOME',
      )
      const expenseCategories = categories.filter(
        (category) => category.type === 'EXPENSE',
      )

      return {
        categoriesDict,
        incomeCategories,
        expenseCategories,
      }
    }, [categories])

  return {
    ...query,
    categories,
    categoriesDict,
    incomeCategories,
    expenseCategories,
  }
}

export const useCategory = (categoryId: string) => {
  const categories = useCategoryStore().categories
  const category: Category | null = useMemo(
    () => categories.find((category) => category.id === categoryId) || null,
    [categories, categoryId],
  )

  return { category }
}

export const useUpdateCategory = () => {
  const posthog = usePostHog()
  const updateCategoryInStore = useCategoryStore(
    (state) => state.updateCategory,
  )
  const { categoriesDict } = useCategoryList()
  const queryClient = useQueryClient()

  const mutation = useMutation(
    {
      mutationFn: async ({
        id,
        data,
      }: { id: string; data: CategoryFormValues }) => {
        const hc = await getHonoClient()
        const result = await hc.v1.categories[':categoryId'].$put({
          param: { categoryId: id },
          json: omit(data, 'type'), // prevent updating category type
        })

        if (result.ok) {
          const category = CategorySchema.parse(await result.json())
          return category
        }

        throw result
      },
      onMutate({ id, data }) {
        let category = categoriesDict[id]
        if (!category) {
          return
        }

        category = { ...category, ...data, updatedAt: new Date() }

        updateCategoryInStore(category)

        posthog.capture('category_updated', {
          category_id: category.id,
          category_name: category.name,
          category_type: category.type,
          category_color: category.color,
          category_icon: category.icon,
        })

        return category
      },
    },
    queryClient,
  )

  return mutation
}

export const useCreateCategory = () => {
  const posthog = usePostHog()
  const { data: userData } = useMeQuery()
  const updateCategoryInStore = useCategoryStore(
    (state) => state.updateCategory,
  )

  const mutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: { id: string; data: CategoryFormValues }) => {
      const hc = await getHonoClient()
      const result = await hc.v1.categories.$post({
        json: { id, ...data },
      })

      if (result.ok) {
        const json = await result.json()
        const category = CategorySchema.extend({
          id: z.string(),
        }).parse(json)
        return category
      }

      throw result
    },
    onMutate({ id, data }) {
      const category: Category = {
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: null,
        userId: userData?.id || '',
        description: '',
        color: '',
        icon: '',
        ...data,
      }

      updateCategoryInStore(category)

      posthog.capture('category_created', {
        category_id: category.id,
        category_name: category.name,
        category_type: category.type,
        category_color: category.color,
        category_icon: category.icon,
      })

      return category
    },
  })

  return mutation
}

export function useDeleteCategory() {
  const posthog = usePostHog()
  const deleteCategoryInStore = useCategoryStore(
    (state) => state.deleteCategory,
  )

  const mutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const hc = await getHonoClient()
      await hc.v1.categories[':categoryId'].$delete({
        param: { categoryId },
      })
    },
    onMutate(categoryId) {
      deleteCategoryInStore(categoryId)
      posthog.capture('category_deleted', {
        category_id: categoryId,
      })
    },
    onError(error) {
      toast.error(error.message)
    },
    throwOnError: true,
  })
  return mutation
}
