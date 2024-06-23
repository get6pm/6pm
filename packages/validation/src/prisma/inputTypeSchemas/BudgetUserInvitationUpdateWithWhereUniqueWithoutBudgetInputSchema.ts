import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationWhereUniqueInputSchema } from './BudgetUserInvitationWhereUniqueInputSchema';
import { BudgetUserInvitationUpdateWithoutBudgetInputSchema } from './BudgetUserInvitationUpdateWithoutBudgetInputSchema';
import { BudgetUserInvitationUncheckedUpdateWithoutBudgetInputSchema } from './BudgetUserInvitationUncheckedUpdateWithoutBudgetInputSchema';

export const BudgetUserInvitationUpdateWithWhereUniqueWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateWithWhereUniqueWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => BudgetUserInvitationUpdateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUncheckedUpdateWithoutBudgetInputSchema) ]),
}).strict();

export default BudgetUserInvitationUpdateWithWhereUniqueWithoutBudgetInputSchema;
