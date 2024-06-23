import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserInvitationCountOutputTypeSelectSchema } from './BudgetUserInvitationCountOutputTypeSelectSchema';

export const BudgetUserInvitationCountOutputTypeArgsSchema: z.ZodType<Prisma.BudgetUserInvitationCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => BudgetUserInvitationCountOutputTypeSelectSchema).nullish(),
}).strict();

export default BudgetUserInvitationCountOutputTypeSelectSchema;
