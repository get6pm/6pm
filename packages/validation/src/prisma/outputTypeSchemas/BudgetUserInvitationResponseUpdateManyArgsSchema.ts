import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserInvitationResponseUpdateManyMutationInputSchema } from '../inputTypeSchemas/BudgetUserInvitationResponseUpdateManyMutationInputSchema'
import { BudgetUserInvitationResponseUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/BudgetUserInvitationResponseUncheckedUpdateManyInputSchema'
import { BudgetUserInvitationResponseWhereInputSchema } from '../inputTypeSchemas/BudgetUserInvitationResponseWhereInputSchema'

export const BudgetUserInvitationResponseUpdateManyArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpdateManyArgs> = z.object({
  data: z.union([ BudgetUserInvitationResponseUpdateManyMutationInputSchema,BudgetUserInvitationResponseUncheckedUpdateManyInputSchema ]),
  where: BudgetUserInvitationResponseWhereInputSchema.optional(),
}).strict() ;

export default BudgetUserInvitationResponseUpdateManyArgsSchema;
