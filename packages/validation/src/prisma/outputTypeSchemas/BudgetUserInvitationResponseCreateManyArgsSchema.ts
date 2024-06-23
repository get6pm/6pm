import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserInvitationResponseCreateManyInputSchema } from '../inputTypeSchemas/BudgetUserInvitationResponseCreateManyInputSchema'

export const BudgetUserInvitationResponseCreateManyArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateManyArgs> = z.object({
  data: z.union([ BudgetUserInvitationResponseCreateManyInputSchema,BudgetUserInvitationResponseCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default BudgetUserInvitationResponseCreateManyArgsSchema;
