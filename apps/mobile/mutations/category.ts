import { getHonoClient } from '@/lib/client'
import { type CategoryFormValues, CategorySchema } from '@6pm/validation'
import { omit } from 'lodash-es'

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

export async function updateCategory({
  id,
  data,
}: {
  id: string
  data: CategoryFormValues
}) {
  const hc = await getHonoClient()
  const result = await hc.v1.categories[':categoryId'].$put({
    param: { categoryId: id },
    json: omit(data, 'type'),
  })

  if (result.ok) {
    const category = CategorySchema.parse(await result.json())
    return category
  }

  return result
}

export async function deleteCategory(id: string) {
  const hc = await getHonoClient()
  await hc.v1.categories[':categoryId'].$delete({
    param: { categoryId: id },
  })
}
