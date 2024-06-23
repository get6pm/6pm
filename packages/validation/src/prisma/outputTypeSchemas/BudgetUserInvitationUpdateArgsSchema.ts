import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserInvitationIncludeSchema } from '../inputTypeSchemas/BudgetUserInvitationIncludeSchema'
import { BudgetUserInvitationUpdateInputSchema } from '../inputTypeSchemas/BudgetUserInvitationUpdateInputSchema'
import { BudgetUserInvitationUncheckedUpdateInputSchema } from '../inputTypeSchemas/BudgetUserInvitationUncheckedUpdateInputSchema'
import { BudgetUserInvitationWhereUniqueInputSchema } from '../inputTypeSchemas/BudgetUserInvitationWhereUniqueInputSchema'
import { RelationLoadStrategySchema } from '../inputTypeSchemas/RelationLoadStrategySchema'
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
import { BudgetArgsSchema } from "../outputTypeSchemas/BudgetArgsSchema"
import { BudgetUserInvitationResponseFindManyArgsSchema } from "../outputTypeSchemas/BudgetUserInvitationResponseFindManyArgsSchema"
import { BudgetUserInvitationCountOutputTypeArgsSchema } from "../outputTypeSchemas/BudgetUserInvitationCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const BudgetUserInvitationSelectSchema: z.ZodType<Prisma.BudgetUserInvitationSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  email: z.boolean().optional(),
  token: z.boolean().optional(),
  expiresAt: z.boolean().optional(),
  permission: z.boolean().optional(),
  createdByUserId: z.boolean().optional(),
  budgetId: z.boolean().optional(),
  createdByUser: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  budget: z.union([z.boolean(),z.lazy(() => BudgetArgsSchema)]).optional(),
  responses: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationResponseFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const BudgetUserInvitationUpdateArgsSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateArgs> = z.object({
  select: BudgetUserInvitationSelectSchema.optional(),
  include: BudgetUserInvitationIncludeSchema.optional(),
  data: z.union([ BudgetUserInvitationUpdateInputSchema,BudgetUserInvitationUncheckedUpdateInputSchema ]),
  where: BudgetUserInvitationWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export default BudgetUserInvitationUpdateArgsSchema;
