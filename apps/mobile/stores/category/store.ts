import type { Category } from '@6pm/validation'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { orderBy, uniqBy } from 'lodash-es'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface CategoryStore {
  categories: Category[]
  _reset: () => void
  setCategories: (categories: Category[]) => void
  updateCategory: (category: Category) => void
  deleteCategory: (categoryId: string) => void
}

function normalizeCategories(categories: Category[]) {
  return orderBy(uniqBy(categories, 'id'), 'name')
}

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set) => ({
      categories: [],
      // biome-ignore lint/style/useNamingConvention: <explanation>
      _reset: () => set({ categories: [] }),
      setCategories: (categories: Category[]) =>
        set({ categories: normalizeCategories(categories) }),
      updateCategory: (category: Category) =>
        set((state) => {
          const index = state.categories.findIndex((c) => c.id === category.id)
          if (index === -1) {
            return {
              categories: normalizeCategories([...state.categories, category]),
            }
          }

          state.categories[index] = category
          return { categories: normalizeCategories(state.categories) }
        }),
      deleteCategory: (categoryId) =>
        set((state) => {
          return {
            categories: state.categories.filter((c) => c.id !== categoryId),
          }
        }),
    }),
    {
      name: 'category-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
