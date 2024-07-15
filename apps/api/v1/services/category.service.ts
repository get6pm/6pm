import type { CreateCategory, UpdateCategory } from '@6pm/validation'
import type { Category, User } from '@prisma/client'
import prisma from '../../lib/prisma'

export async function canUserCreateCategory({
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  user,
}: { user: User }): Promise<boolean> {
  return true
}

// biome-ignore lint/correctness/noEmptyPattern: <explanation>
export async function canUserReadCategory({}: {
  user: User
  category: Category
}): Promise<boolean> {
  return true
}

export async function isUserCategoryOwner({
  user,
  category,
}: {
  user: User
  category: Category
}): Promise<boolean> {
  return category.userId === user.id
}

export async function canUserUpdateCategory({
  user,
  category,
}: {
  user: User
  category: Category
}): Promise<boolean> {
  return isUserCategoryOwner({ user, category })
}

export async function canUserDeleteCategory({
  user,
  category,
}: {
  user: User
  category: Category
}): Promise<boolean> {
  return isUserCategoryOwner({ user, category })
}

export async function createCategory({
  user,
  data,
}: {
  user: User
  data: CreateCategory
}) {
  const { name, type, color, description, icon } = data

  const category = await prisma.category.create({
    data: {
      name,
      type,
      color,
      description,
      icon,
      userId: user.id,
    },
  })

  return category
}

export async function updateCategory({
  category,
  data,
}: {
  category: Category
  data: UpdateCategory
}) {
  const { name, color, description, icon } = data

  const updatedCategory = await prisma.category.update({
    where: { id: category.id },
    data: {
      name,
      color,
      description,
      icon,
    },
  })

  return updatedCategory
}

export async function deleteCategory({ categoryId }: { categoryId: string }) {
  await prisma.category.delete({
    where: { id: categoryId },
  })
}

export async function findCategory({
  id,
  userId,
}: { id: string; userId?: string }) {
  return prisma.category.findUnique({
    where: { id, userId },
  })
}

export async function findCategoriesOfUser({
  user,
}: {
  user: User
}): Promise<Category[]> {
  return prisma.category.findMany({
    where: { userId: user.id },
  })
}
