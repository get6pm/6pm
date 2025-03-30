import { z } from '@6pm/ui/lib/zod'
import { createId } from '@paralleldrive/cuid2'

export const zCategory = z.object({
  id: z.string().cuid2().default(createId).optional(),
  name: z.string().trim().nonempty(),
  icon: z.string().trim().nonempty(),
  color: z.string().optional(),
})
export type CategoryValues = z.infer<typeof zCategory>
