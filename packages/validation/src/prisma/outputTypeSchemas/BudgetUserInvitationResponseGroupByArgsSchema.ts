import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserInvitationResponseWhereInputSchema } from '../inputTypeSchemas/BudgetUserInvitationResponseWhereInputSchema'
import { BudgetUserInvitationResponseOrderByWithAggregationInputSchema } from '../inputTypeSchemas/BudgetUserInvitationResponseOrderByWithAggregationInputSchema'
import { BudgetUserInvitationResponseScalarFieldEnumSchema } from '../inputTypeSchemas/BudgetUserInvitationResponseScalarFieldEnumSchema'
import { BudgetUserInvitationResponseScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/BudgetUserInvitationResponseScalarWhereWithAggregatesInputSchema'

export const BudgetUserInvitationResponseGroupByArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseGroupByArgs> = z.object({
  where: BudgetUserInvitationResponseWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserInvitationResponseOrderByWithAggregationInputSchema.array(),BudgetUserInvitationResponseOrderByWithAggregationInputSchema ]).optional(),
  by: BudgetUserInvitationResponseScalarFieldEnumSchema.array(),
  having: BudgetUserInvitationResponseScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default BudgetUserInvitationResponseGroupByArgsSchema;
