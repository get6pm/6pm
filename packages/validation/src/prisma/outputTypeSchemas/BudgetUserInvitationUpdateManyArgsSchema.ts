import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserInvitationUpdateManyMutationInputSchema } from '../inputTypeSchemas/BudgetUserInvitationUpdateManyMutationInputSchema'
import { BudgetUserInvitationUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/BudgetUserInvitationUncheckedUpdateManyInputSchema'
import { BudgetUserInvitationWhereInputSchema } from '../inputTypeSchemas/BudgetUserInvitationWhereInputSchema'

export const BudgetUserInvitationUpdateManyArgsSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateManyArgs> = z.object({
  data: z.union([ BudgetUserInvitationUpdateManyMutationInputSchema,BudgetUserInvitationUncheckedUpdateManyInputSchema ]),
  where: BudgetUserInvitationWhereInputSchema.optional(),
}).strict() ;

export default BudgetUserInvitationUpdateManyArgsSchema;
