import type { Prisma } from '../.generated/client/index.js'
import { prisma } from '../client.js'
import { clerkClient } from './clerk.js'

export async function findUser({ id }: { id: string }) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      spaceMemberships: { include: { space: true } },
      metadata: true,
    },
  })
}

export async function getUser({ id }: { id: string }) {
  const user = await findUser({ id })

  if (!user) {
    throw new Error(`User not found: ${id}`)
  }

  return user
}

export async function syncUserFromClerk(userId: string) {
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
    include: {
      spaceMemberships: { include: { space: true } },
      metadata: true,
    },
  })

  return user
}

export async function updateUserMetadata({
  userId,
  key,
  value,
}: {
  userId: string
  key: string
  value: string
}) {
  let user = await getUser({ id: userId })

  await prisma.userMetadata.upsert({
    // biome-ignore lint/style/useNamingConvention: predefined by Prisma
    where: { userId_key: { userId, key } },
    update: { value },
    create: { userId, key, value },
  })

  user = await getUser({ id: userId })
  return user.metadata
}
