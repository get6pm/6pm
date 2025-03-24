import { z } from '@6pm/ui/lib/zod'

export const zCreateCategory = z.object({
  name: z.string().trim().nonempty(),
  icon: z.string().trim().nonempty(),
  color: z.string().optional(),
})
export type CreateCategoryValues = z.infer<typeof zCreateCategory>
