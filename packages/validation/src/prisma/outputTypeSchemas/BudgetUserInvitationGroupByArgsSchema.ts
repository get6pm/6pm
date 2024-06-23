import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserInvitationWhereInputSchema } from '../inputTypeSchemas/BudgetUserInvitationWhereInputSchema'
import { BudgetUserInvitationOrderByWithAggregationInputSchema } from '../inputTypeSchemas/BudgetUserInvitationOrderByWithAggregationInputSchema'
import { BudgetUserInvitationScalarFieldEnumSchema } from '../inputTypeSchemas/BudgetUserInvitationScalarFieldEnumSchema'
import { BudgetUserInvitationScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/BudgetUserInvitationScalarWhereWithAggregatesInputSchema'

export const BudgetUserInvitationGroupByArgsSchema: z.ZodType<Prisma.BudgetUserInvitationGroupByArgs> = z.object({
  where: BudgetUserInvitationWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserInvitationOrderByWithAggregationInputSchema.array(),BudgetUserInvitationOrderByWithAggregationInputSchema ]).optional(),
  by: BudgetUserInvitationScalarFieldEnumSchema.array(),
  having: BudgetUserInvitationScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default BudgetUserInvitationGroupByArgsSchema;
