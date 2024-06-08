import {
  BudgetPeriodTypeSchema,
  BudgetTypeSchema,
} from '@/prisma/generated/zod'
import { z } from 'zod'

export const zCreateBudget = z.object({
  name: z.string(),
  description: z.string().optional(),
  preferredCurrency: z.string(),
  type: BudgetTypeSchema,
  inviteeEmails: z.array(z.string().email()).optional(),
  period: z.object({
    type: BudgetPeriodTypeSchema,
    amount: z.number().min(0),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  }),
})
export type CreateBudget = z.infer<typeof zCreateBudget>

export const zUpdateBudget = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  preferredCurrency: z.string().optional(),
  type: BudgetTypeSchema.optional(),
  period: z.object({
    type: BudgetPeriodTypeSchema.optional(),
    amount: z.number().min(0).optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  }),
})
export type UpdateBudget = z.infer<typeof zUpdateBudget>
