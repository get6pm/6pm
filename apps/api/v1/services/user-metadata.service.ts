import type { User, UserMetadata } from '@prisma/client'
import prisma from '../../lib/prisma'
import { findUserById } from './user.service'

/**
 * Checks if the user can update the user metadata
 * @returns true if the user can update the metadata, false otherwise
 */
export function canUserUpdateMetadata({
  user,
  metadata,
}: {
  /** The user who wants to update metadata */
  user: User
  /** The target metadata to update */
  metadata: Pick<UserMetadata, 'userId'>
}) {
  return user.id === metadata.userId
}

/**
 * Updates the user metadata
 * @returns the updated user with metadata
 */
export async function updateUserMetadata({
  userId,
  metadataId,
  data,
}: {
  /** The user id who wants to update metadata */
  userId: string
  /** The target metadata to update */
  metadataId?: string
  /** The data to update */
  data: { timezone: string }
}) {
  const metadata = await prisma.userMetadata.upsert({
    where: {
      id: metadataId,
    },
    create: {
      ...data,
      userId,
    },
    update: data,
  })

  return findUserById(metadata.userId)
}
