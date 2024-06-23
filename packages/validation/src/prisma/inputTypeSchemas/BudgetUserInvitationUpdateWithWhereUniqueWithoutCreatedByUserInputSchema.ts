import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationWhereUniqueInputSchema } from './BudgetUserInvitationWhereUniqueInputSchema';
import { BudgetUserInvitationUpdateWithoutCreatedByUserInputSchema } from './BudgetUserInvitationUpdateWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationUncheckedUpdateWithoutCreatedByUserInputSchema } from './BudgetUserInvitationUncheckedUpdateWithoutCreatedByUserInputSchema';

export const BudgetUserInvitationUpdateWithWhereUniqueWithoutCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateWithWhereUniqueWithoutCreatedByUserInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => BudgetUserInvitationUpdateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUncheckedUpdateWithoutCreatedByUserInputSchema) ]),
}).strict();

export default BudgetUserInvitationUpdateWithWhereUniqueWithoutCreatedByUserInputSchema;
