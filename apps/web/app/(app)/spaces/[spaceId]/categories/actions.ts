'use server'

import ErrorCode from '@/constants/error-codes'
import { createSpendingCategory } from '@6pm/db/services/category'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function createSpendingCategoryAction({
  spaceId,
  data,
}: {
  spaceId: string
  data: {
    name: string
    icon: string
    color?: string
  }
}) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error(ErrorCode.Unauthorized)
  }

  if (!data.name || !data.icon) {
    throw new Error(ErrorCode.InvalidInput)
  }

  if (data.color && typeof data.color !== 'string') {
    throw new Error(ErrorCode.InvalidInput)
  }

  const category = await createSpendingCategory({
    spaceId,
    userId,
    data,
  })

  revalidatePath(`/app/spaces/${spaceId}`)

  return category
}
