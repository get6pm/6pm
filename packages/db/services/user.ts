import type { Prisma, User } from '../.generated/client/index.js'
import { prisma } from '../client.js'
import { clerkClient } from './clerk.js'

export async function findUser({ id }: { id: string }): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } })
}

export async function getUser({ id }: { id: string }): Promise<User> {
  const user = await findUser({ id })

  if (!user) {
    throw new Error(`User not found: ${id}`)
  }

  return user
}

export async function syncUserFromClerk(userId: string): Promise<User> {
  const clerkUser = await clerkClient.users.getUser(userId)

  const userData: Prisma.UserCreateInput = {
    id: clerkUser.id,
    createdAt: new Date(clerkUser.createdAt),
    updatedAt: new Date(clerkUser.updatedAt),
    primaryEmail: clerkUser.primaryEmailAddress?.emailAddress!,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    profilePictureUrl: clerkUser.imageUrl,
  }

  const user = await prisma.user.upsert({
    where: { id: clerkUser.id },
    update: {
      ...userData,
    },
    create: {
      ...userData,
    },
  })

  return user
}
