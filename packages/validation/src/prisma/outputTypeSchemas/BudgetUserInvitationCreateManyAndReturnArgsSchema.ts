import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserInvitationCreateManyInputSchema } from '../inputTypeSchemas/BudgetUserInvitationCreateManyInputSchema'

export const BudgetUserInvitationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.BudgetUserInvitationCreateManyAndReturnArgs> = z.object({
  data: z.union([ BudgetUserInvitationCreateManyInputSchema,BudgetUserInvitationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default BudgetUserInvitationCreateManyAndReturnArgsSchema;
