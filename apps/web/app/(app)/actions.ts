'use server'

import ErrorCode from '@/constants/error-codes'
import { updateUserMetadata } from '@6pm/db/services/user'
import { auth } from '@clerk/nextjs/server'

export async function updateUserMetadataAction({
  key,
  value,
}: {
  key: string
  value: string
}) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error(ErrorCode.Unauthorized)
  }

  if (!(key && value)) {
    throw new Error(ErrorCode.InvalidInput)
  }

  return await updateUserMetadata({
    userId,
    key,
    value,
  })
}
