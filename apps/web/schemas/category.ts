import { z } from '@6pm/ui/lib/zod'

export const zCategory = z.object({
  id: z.string().cuid2(),
  name: z.string().trim().nonempty(),
  icon: z.string().trim().nonempty(),
  color: z.string().optional(),
})
export type CategoryValues = z.infer<typeof zCategory>
