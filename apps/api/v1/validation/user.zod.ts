import { z } from 'zod'

export const zCreateUser = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  name: z.string().min(3),
})

export type CreateUser = z.infer<typeof zCreateUser>
