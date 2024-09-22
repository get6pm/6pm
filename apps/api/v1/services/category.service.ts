import { getPlanConfig } from '@6pm/utilities'
import type { CreateCategory, UpdateCategory } from '@6pm/validation'
import { type Category, CategoryType, type User } from '@prisma/client'
import prisma from '../../lib/prisma'
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '../constants/category.const'
import { getUserPlan } from './user.service'

export async function canUserCreateCategory({
  user,
}: { user: User }): Promise<boolean> {
  const userPlan = getUserPlan(user)
  const canCreateCategories = getPlanConfig(userPlan, 'canCreateCategories')

  return canCreateCategories === true
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
  const { id, name, type, color, description, icon } = data

  const category = await prisma.category.create({
    data: {
      id,
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

export async function bootstrapUserDefaultCategories({
  user,
  language = 'en',
}: { user: User; language?: string }) {
  const defaultCategories = [
    ...DEFAULT_INCOME_CATEGORIES.map((c) => ({
      ...c,
      type: CategoryType.INCOME,
    })),
    ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
      ...c,
      type: CategoryType.EXPENSE,
    })),
  ].map(({ en, vi, ...category }) => ({
    ...category,
    name: language === 'vi' ? vi : en,
  }))

  return prisma.category.createMany({
    data: defaultCategories.map((category) => ({
      ...category,
      userId: user.id,
    })),
  })
}
