import { z } from 'zod';
import type { Prisma } from '@prisma/client';

export const BudgetUserInvitationCountOutputTypeSelectSchema: z.ZodType<Prisma.BudgetUserInvitationCountOutputTypeSelect> = z.object({
  responses: z.boolean().optional(),
}).strict();

export default BudgetUserInvitationCountOutputTypeSelectSchema;
