'use server'

import ErrorCode from '@/constants/error-codes'
import { createSpace } from '@6pm/db/services/space'
import { getUser } from '@6pm/db/services/user'
import { auth } from '@clerk/nextjs/server'

export async function createSpaceAction(
  params: Parameters<typeof createSpace>[1],
) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error(ErrorCode.Unauthorized)
  }

  const user = await getUser({ id: userId })
  const space = await createSpace(user, params)

  return space
}
