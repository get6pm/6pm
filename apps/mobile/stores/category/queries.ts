import { getHonoClient } from '@/lib/client'
import { type Category, CategorySchema } from '@6pm/validation'
import { createQueryKeys } from '@lukemorales/query-key-factory'
import { z } from 'zod'

export const categoryQueries = createQueryKeys('categories', {
  all: ({
    setCategoriesState,
  }: { setCategoriesState: (categories: Category[]) => void }) => ({
    queryKey: [{}],
    queryFn: async () => {
      const hc = await getHonoClient()
      const res = await hc.v1.categories.$get()
      if (!res.ok) {
        throw new Error(await res.text())
      }

      const items = await res.json()
      const categories = items.map((item) =>
        CategorySchema.extend({
          id: z.string().cuid2(),
        }).parse(item),
      )

      setCategoriesState(categories)

      return categories
    },
  }),
})
