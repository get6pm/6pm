import { SpaceRole } from '../.generated/client'
import { prisma } from '../client'
import { doesUserBelongToSpace, doesUserHaveSpaceRole } from './space'

export function canUserCreateSpendingCategory({
  userId,
  spaceId,
}: {
  userId: string
  spaceId: string
}) {
  return doesUserHaveSpaceRole({
    userId,
    spaceId,
    anyRole: [SpaceRole.OWNER, SpaceRole.ADMIN],
  })
}

export async function createSpendingCategory({
  userId,
  spaceId,
  data,
}: {
  userId: string
  spaceId: string
  data: { name: string; icon: string; color?: string }
}) {
  const canCreate = await canUserCreateSpendingCategory({ userId, spaceId })
  if (!canCreate) {
    throw new Error(
      `User does not have permission to create a spending category`,
    )
  }

  return prisma.spendingCategory.create({
    data: {
      name: data.name,
      icon: data.icon,
      color: data.color,
      spaceId,
    },
    include: {
      group: true,
      budget: true,
    },
  })
}

export async function getSpaceSpendingCategories({
  spaceId,
  userId,
}: {
  spaceId: string
  userId: string
}) {
  const canRead = await doesUserBelongToSpace({ userId, spaceId })
  if (!canRead) {
    throw new Error(`User does not have permission to read spending categories`)
  }

  return prisma.spendingCategory.findMany({
    where: { spaceId },
    include: {
      group: true,
      budget: true,
    },
  })
}

export async function findSpendingCategory({
  categoryId,
  userId,
}: { categoryId: string; userId: string }) {
  const category = await prisma.spendingCategory.findUnique({
    where: { id: categoryId },
    include: {
      group: true,
      budget: true,
    },
  })

  if (!category) {
    return null
  }

  const canRead = await doesUserBelongToSpace({
    userId,
    spaceId: category.spaceId,
  })
  if (!canRead) {
    return null
  }

  return category
}
