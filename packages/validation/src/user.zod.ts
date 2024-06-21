import { z } from 'zod'

export const zCreateUser = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  name: z.string().optional(),
})

export type CreateUser = z.infer<typeof zCreateUser>
