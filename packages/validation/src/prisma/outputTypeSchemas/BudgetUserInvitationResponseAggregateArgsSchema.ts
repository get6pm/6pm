import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserInvitationResponseWhereInputSchema } from '../inputTypeSchemas/BudgetUserInvitationResponseWhereInputSchema'
import { BudgetUserInvitationResponseOrderByWithRelationInputSchema } from '../inputTypeSchemas/BudgetUserInvitationResponseOrderByWithRelationInputSchema'
import { BudgetUserInvitationResponseWhereUniqueInputSchema } from '../inputTypeSchemas/BudgetUserInvitationResponseWhereUniqueInputSchema'

export const BudgetUserInvitationResponseAggregateArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseAggregateArgs> = z.object({
  where: BudgetUserInvitationResponseWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserInvitationResponseOrderByWithRelationInputSchema.array(),BudgetUserInvitationResponseOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetUserInvitationResponseWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default BudgetUserInvitationResponseAggregateArgsSchema;
