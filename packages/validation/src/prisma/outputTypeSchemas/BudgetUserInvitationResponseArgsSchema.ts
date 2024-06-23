import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserInvitationResponseSelectSchema } from '../inputTypeSchemas/BudgetUserInvitationResponseSelectSchema';
import { BudgetUserInvitationResponseIncludeSchema } from '../inputTypeSchemas/BudgetUserInvitationResponseIncludeSchema';

export const BudgetUserInvitationResponseArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseDefaultArgs> = z.object({
  select: z.lazy(() => BudgetUserInvitationResponseSelectSchema).optional(),
  include: z.lazy(() => BudgetUserInvitationResponseIncludeSchema).optional(),
}).strict();

export default BudgetUserInvitationResponseArgsSchema;
