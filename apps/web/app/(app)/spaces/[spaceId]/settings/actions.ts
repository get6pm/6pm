'use server'

import { updateSpace } from '@6pm/db/services/space'
import { getUser } from '@6pm/db/services/user'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function updateSpaceSettingsAction(
  spaceId: string,
  data: { name: string },
) {
  const { userId } = await auth()
  const user = await getUser({ id: userId! })

  const updatedSpace = await updateSpace({
    user,
    id: spaceId,
    data,
  })

  revalidatePath(`/spaces/${spaceId}`, 'layout')

  return updatedSpace
}
