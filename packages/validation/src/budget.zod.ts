import { z } from 'zod'
import { BudgetPeriodTypeSchema, BudgetTypeSchema } from './prisma'

export const zCreateBudget = z.object({
  id: z.string().cuid2().optional(),
  name: z.string().min(1, 'Budget name is required'),
  description: z.string().optional(),
  preferredCurrency: z.string(),
  type: BudgetTypeSchema,
  inviteeEmails: z.array(z.string().email()).optional(),
  period: z
    .object({
      id: z.string().optional(),
      type: BudgetPeriodTypeSchema,
      amount: z
        .string({ coerce: true })
        .transform((val) => Number(`${val}`.replace(',', '.')))
        .pipe(z.number({ coerce: true }).min(0))
        .optional(),
      startDate: z.date({ coerce: true }).optional(),
      endDate: z.date({ coerce: true }).optional(),
    })
    .refine(({ type, startDate, endDate }) => {
      if (type === 'CUSTOM') {
        return !!startDate && !!endDate
      }
      return true
    }, 'Select period range'),
  isDefault: z.boolean().optional(),
})
export type CreateBudget = z.infer<typeof zCreateBudget>

export const zUpdateBudget = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  preferredCurrency: z.string().optional(),
  type: BudgetTypeSchema,
  period: z
    .object({
      type: BudgetPeriodTypeSchema.optional(),
      amount: z
        .string({ coerce: true })
        .transform((val) => Number(`${val}`.replace(',', '.')))
        .pipe(z.number({ coerce: true }).min(0))
        .optional(),
      startDate: z.date({ coerce: true }).optional(),
      endDate: z.date({ coerce: true }).optional(),
    })
    .refine(({ type, startDate, endDate }) => {
      if (type === 'CUSTOM') {
        return !!startDate && !!endDate
      }
      return true
    }, 'Select period range'),
  isDefault: z.boolean().optional(),
})
export type UpdateBudget = z.infer<typeof zUpdateBudget>

export const zBudgetFormValues = zCreateBudget
export type BudgetFormValues = z.infer<typeof zBudgetFormValues>
