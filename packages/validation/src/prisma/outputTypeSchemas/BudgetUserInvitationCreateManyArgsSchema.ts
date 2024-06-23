import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserInvitationCreateManyInputSchema } from '../inputTypeSchemas/BudgetUserInvitationCreateManyInputSchema'

export const BudgetUserInvitationCreateManyArgsSchema: z.ZodType<Prisma.BudgetUserInvitationCreateManyArgs> = z.object({
  data: z.union([ BudgetUserInvitationCreateManyInputSchema,BudgetUserInvitationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default BudgetUserInvitationCreateManyArgsSchema;
