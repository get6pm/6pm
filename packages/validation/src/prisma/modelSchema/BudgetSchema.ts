import { z } from 'zod';
import { BudgetTypeSchema } from '../inputTypeSchemas/BudgetTypeSchema'
import type { BudgetPeriodConfigWithRelations } from './BudgetPeriodConfigSchema'
import type { BudgetUserWithRelations } from './BudgetUserSchema'
import type { TransactionWithRelations } from './TransactionSchema'
import type { BudgetUserInvitationWithRelations } from './BudgetUserInvitationSchema'
import { BudgetPeriodConfigWithRelationsSchema } from './BudgetPeriodConfigSchema'
import { BudgetUserWithRelationsSchema } from './BudgetUserSchema'
import { TransactionWithRelationsSchema } from './TransactionSchema'
import { BudgetUserInvitationWithRelationsSchema } from './BudgetUserInvitationSchema'

/////////////////////////////////////////
// BUDGET SCHEMA
/////////////////////////////////////////

export const BudgetSchema = z.object({
  type: BudgetTypeSchema,
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  name: z.string(),
  description: z.string().nullable(),
  preferredCurrency: z.string(),
})

export type Budget = z.infer<typeof BudgetSchema>

/////////////////////////////////////////
// BUDGET RELATION SCHEMA
/////////////////////////////////////////

export type BudgetRelations = {
  periodConfig?: BudgetPeriodConfigWithRelations | null;
  budgetUsers: BudgetUserWithRelations[];
  transactions: TransactionWithRelations[];
  invitations: BudgetUserInvitationWithRelations[];
};

export type BudgetWithRelations = z.infer<typeof BudgetSchema> & BudgetRelations

export const BudgetWithRelationsSchema: z.ZodType<BudgetWithRelations> = BudgetSchema.merge(z.object({
  periodConfig: z.lazy(() => BudgetPeriodConfigWithRelationsSchema).nullable(),
  budgetUsers: z.lazy(() => BudgetUserWithRelationsSchema).array(),
  transactions: z.lazy(() => TransactionWithRelationsSchema).array(),
  invitations: z.lazy(() => BudgetUserInvitationWithRelationsSchema).array(),
}))

export default BudgetSchema;
