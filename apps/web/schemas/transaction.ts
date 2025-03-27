import { z } from '@6pm/ui/lib/zod'

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER'
export const TransactionType = {
  EXPENSE: 'EXPENSE',
  INCOME: 'INCOME',
  TRANSFER: 'TRANSFER',
} as const

export const zTransaction = z
  .object({
    name: z.string().trim().max(50).nonempty(),
    amount: z.coerce.number(),
    date: z.coerce.date(),
    accountId: z.string().cuid2(),
    categoryId: z.string().cuid2().optional(),
    notes: z.string().trim().optional(),
    isExclusive: z.boolean().optional().default(false),
    tagIds: z.array(z.string().cuid2()).optional().default([]),
    type: z.nativeEnum(TransactionType),
    isNegative: z.boolean().optional().default(true),
    transactionId: z.string().cuid2().optional(),
  })
  .refine(
    (data) => data.type !== TransactionType.EXPENSE || !!data.categoryId,
    {
      message: 'Category is required for expense transactions',
      path: ['categoryId'],
    },
  )

export type TransactionValues = z.infer<typeof zTransaction>
