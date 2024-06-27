import { z } from 'zod'
import { CategoryTypeSchema } from './prisma'

export const zCreateCategory = z.object({
  type: CategoryTypeSchema,
  name: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
})
export type CreateCategory = z.infer<typeof zCreateCategory>

export const zUpdateCategory = z.object({
  type: CategoryTypeSchema.optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
})
export type UpdateCategory = z.infer<typeof zUpdateCategory>
