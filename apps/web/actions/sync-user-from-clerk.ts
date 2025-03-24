'use server'

import { type Prisma, prisma } from '@6pm/db'
import { currentUser } from '@clerk/nextjs/server'
import { createServerAction } from './helpers'

export const syncUserFromClerk = createServerAction(async () => {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    throw new Error('User not found')
  }

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
})
