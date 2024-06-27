import { getHonoClient } from '@/lib/client'
import { type CategoryFormValues, CategorySchema } from '@6pm/validation'

export async function createCategory(data: CategoryFormValues) {
  const hc = await getHonoClient()
  const result = await hc.v1.categories.$post({
    json: data,
  })

  if (result.ok) {
    const category = CategorySchema.parse(await result.json())
    return category
  }

  return result
}
