import { z } from 'zod'

export const zCreateBudget = z.object({
  name: z.string(),
  description: z.string().optional(),
  preferredCurrency: z.string(),
  type: z.enum(['SPENDING', 'SAVING', 'INVESTING', 'DEBT']),
  inviteeEmails: z.array(z.string().email()).optional(),
  period: z.object({
    type: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']),
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
  type: z.enum(['SPENDING', 'SAVING', 'INVESTING', 'DEBT']).optional(),
  period: z.object({
    type: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']).optional(),
    amount: z.number().min(0).optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  }),
})
export type UpdateBudget = z.infer<typeof zUpdateBudget>
