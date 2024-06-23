import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserInvitationWhereInputSchema } from '../inputTypeSchemas/BudgetUserInvitationWhereInputSchema'
import { BudgetUserInvitationOrderByWithRelationInputSchema } from '../inputTypeSchemas/BudgetUserInvitationOrderByWithRelationInputSchema'
import { BudgetUserInvitationWhereUniqueInputSchema } from '../inputTypeSchemas/BudgetUserInvitationWhereUniqueInputSchema'

export const BudgetUserInvitationAggregateArgsSchema: z.ZodType<Prisma.BudgetUserInvitationAggregateArgs> = z.object({
  where: BudgetUserInvitationWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserInvitationOrderByWithRelationInputSchema.array(),BudgetUserInvitationOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetUserInvitationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default BudgetUserInvitationAggregateArgsSchema;
