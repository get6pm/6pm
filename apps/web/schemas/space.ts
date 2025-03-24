import { z } from '@6pm/ui/lib/zod'

export const zCreateSpace = z.object({
  name: z.string().trim().min(3).max(50),
})
export type CreateSpaceValues = z.infer<typeof zCreateSpace>

export const zUpdateSpace = z.object({
  name: z.string().trim().min(3).max(50),
})
export type UpdateSpaceValues = z.infer<typeof zUpdateSpace>
