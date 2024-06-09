import { getHonoClient } from '@/lib/client'
import type { CreateUser } from '@6pm/api'
import { useMutation } from '@tanstack/react-query'

export function useCreateUserMutation() {
  return useMutation({
    mutationFn: async (data: CreateUser) => {
      const hc = await getHonoClient()
      await hc.v1.users.$post({
        json: data,
      })
    },
  })
}
