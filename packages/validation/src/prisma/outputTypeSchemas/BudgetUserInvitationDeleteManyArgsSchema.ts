import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserInvitationWhereInputSchema } from '../inputTypeSchemas/BudgetUserInvitationWhereInputSchema'

export const BudgetUserInvitationDeleteManyArgsSchema: z.ZodType<Prisma.BudgetUserInvitationDeleteManyArgs> = z.object({
  where: BudgetUserInvitationWhereInputSchema.optional(),
}).strict() ;

export default BudgetUserInvitationDeleteManyArgsSchema;
