import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationResponseWhereUniqueInputSchema } from './BudgetUserInvitationResponseWhereUniqueInputSchema';
import { BudgetUserInvitationResponseUpdateWithoutInvitationInputSchema } from './BudgetUserInvitationResponseUpdateWithoutInvitationInputSchema';
import { BudgetUserInvitationResponseUncheckedUpdateWithoutInvitationInputSchema } from './BudgetUserInvitationResponseUncheckedUpdateWithoutInvitationInputSchema';

export const BudgetUserInvitationResponseUpdateWithWhereUniqueWithoutInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpdateWithWhereUniqueWithoutInvitationInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateWithoutInvitationInputSchema) ]),
}).strict();

export default BudgetUserInvitationResponseUpdateWithWhereUniqueWithoutInvitationInputSchema;
