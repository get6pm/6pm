import { z } from 'zod';
import { BudgetUserPermissionSchema } from '../inputTypeSchemas/BudgetUserPermissionSchema'
import type { UserWithRelations } from './UserSchema'
import type { BudgetWithRelations } from './BudgetSchema'
import { UserWithRelationsSchema } from './UserSchema'
import { BudgetWithRelationsSchema } from './BudgetSchema'

/////////////////////////////////////////
// BUDGET USER SCHEMA
/////////////////////////////////////////

export const BudgetUserSchema = z.object({
  permission: BudgetUserPermissionSchema,
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  userId: z.string(),
  budgetId: z.string(),
})

export type BudgetUser = z.infer<typeof BudgetUserSchema>

/////////////////////////////////////////
// BUDGET USER RELATION SCHEMA
/////////////////////////////////////////

export type BudgetUserRelations = {
  user: UserWithRelations;
  budget: BudgetWithRelations;
};

export type BudgetUserWithRelations = z.infer<typeof BudgetUserSchema> & BudgetUserRelations

export const BudgetUserWithRelationsSchema: z.ZodType<BudgetUserWithRelations> = BudgetUserSchema.merge(z.object({
  user: z.lazy(() => UserWithRelationsSchema),
  budget: z.lazy(() => BudgetWithRelationsSchema),
}))

export default BudgetUserSchema;
