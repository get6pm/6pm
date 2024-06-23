import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserInvitationResponseWhereInputSchema } from '../inputTypeSchemas/BudgetUserInvitationResponseWhereInputSchema'

export const BudgetUserInvitationResponseDeleteManyArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseDeleteManyArgs> = z.object({
  where: BudgetUserInvitationResponseWhereInputSchema.optional(),
}).strict() ;

export default BudgetUserInvitationResponseDeleteManyArgsSchema;
