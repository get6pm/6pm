import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserInvitationSelectSchema } from '../inputTypeSchemas/BudgetUserInvitationSelectSchema';
import { BudgetUserInvitationIncludeSchema } from '../inputTypeSchemas/BudgetUserInvitationIncludeSchema';

export const BudgetUserInvitationArgsSchema: z.ZodType<Prisma.BudgetUserInvitationDefaultArgs> = z.object({
  select: z.lazy(() => BudgetUserInvitationSelectSchema).optional(),
  include: z.lazy(() => BudgetUserInvitationIncludeSchema).optional(),
}).strict();

export default BudgetUserInvitationArgsSchema;
