import { getHonoClient } from '@/lib/client'
import { CategorySchema } from '@6pm/validation'
import { createQueryKeys } from '@lukemorales/query-key-factory'
import { useQuery } from '@tanstack/react-query'

export const categoryQueries = createQueryKeys('category', {
  list: () => ({
    queryKey: [{}],
    queryFn: async () => {
      const hc = await getHonoClient()
      const res = await hc.v1.categories.$get()
      if (!res.ok) {
        throw new Error(await res.text())
      }

      const items = await res.json()
      return items.map((item) => CategorySchema.parse(item))
    },
  }),
})

export function useCategories() {
  return useQuery(categoryQueries.list())
}
