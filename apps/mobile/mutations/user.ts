import { getHonoClient } from '@/lib/client'
import type { CreateUser } from '@6pm/validation'

export async function createUser(data: CreateUser) {
  const hc = await getHonoClient()
  await hc.v1.users.$post({
    json: data,
  })
}
