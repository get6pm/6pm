import { z } from '@6pm/ui/lib/zod'

export const zTransaction = z.object({
  name: z.string().trim().max(50).nonempty(),
  amount: z.coerce.number(),
  date: z.coerce.date(),
  accountId: z.string().cuid2(),
  categoryId: z.string().cuid2().optional(),
  notes: z.string().trim().optional(),
  isExclusive: z.boolean().optional().default(false),
  tagIds: z.array(z.string().cuid2()).optional().default([]),
})
export type TransactionValues = z.infer<typeof zTransaction>
