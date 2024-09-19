import { clerkClient } from '@clerk/clerk-sdk-node'
import { getLogger } from '../../lib/log'

export async function deleteClerkUser(userId: string) {
  const logger = getLogger(`clerk.service:${deleteClerkUser.name}:${userId}`)

  try {
    const deletedUser = await clerkClient.users.deleteUser(userId)
    logger.debug(`Deleted user %o`, deletedUser)
    return deletedUser
  } catch (error) {
    logger.error(`Failed to delete user with id: ${userId}`)
    logger.debug(error)
    throw error
  }
}
