import { z } from 'zod'

export const zCreateUser = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(3),
})

export type CreateUser = z.infer<typeof zCreateUser>
