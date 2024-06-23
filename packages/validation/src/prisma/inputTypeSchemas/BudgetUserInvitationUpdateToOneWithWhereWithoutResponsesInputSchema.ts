import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationWhereInputSchema } from './BudgetUserInvitationWhereInputSchema';
import { BudgetUserInvitationUpdateWithoutResponsesInputSchema } from './BudgetUserInvitationUpdateWithoutResponsesInputSchema';
import { BudgetUserInvitationUncheckedUpdateWithoutResponsesInputSchema } from './BudgetUserInvitationUncheckedUpdateWithoutResponsesInputSchema';

export const BudgetUserInvitationUpdateToOneWithWhereWithoutResponsesInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateToOneWithWhereWithoutResponsesInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => BudgetUserInvitationUpdateWithoutResponsesInputSchema),z.lazy(() => BudgetUserInvitationUncheckedUpdateWithoutResponsesInputSchema) ]),
}).strict();

export default BudgetUserInvitationUpdateToOneWithWhereWithoutResponsesInputSchema;
