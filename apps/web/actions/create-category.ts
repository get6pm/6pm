'use server'

import ErrorCode from '@/constants/error-codes'
import { type CreateCategoryValues, zCreateCategory } from '@/schemas/category'
import { SpaceRole, prisma } from '@6pm/db'
import { revalidatePath } from 'next/cache'
import { createServerAction } from './helpers'
import { doesUserHaveSpaceRole } from './space-permission'

export const canUserCreateSpaceCategory = createServerAction(
  async ({ spaceId }: { spaceId: string }) => {
    const { data: isOwner } = await doesUserHaveSpaceRole({
      spaceId,
      anyRole: [SpaceRole.OWNER, SpaceRole.ADMIN],
    })

    return !!isOwner
  },
)

export const createCategory = createServerAction(
  async ({
    spaceId,
    data,
  }: {
    spaceId: string
    data: CreateCategoryValues
  }) => {
    data = zCreateCategory.parse(data)

    const canCreateCategory = await canUserCreateSpaceCategory({ spaceId })

    if (!canCreateCategory) {
      throw new Error(ErrorCode.Forbidden)
    }

    const newCategory = await prisma.spendingCategory.create({
      data: {
        ...data,
        spaceId,
      },
    })

    revalidatePath(`/app/spaces/${spaceId}/categories`)

    return newCategory
  },
)
