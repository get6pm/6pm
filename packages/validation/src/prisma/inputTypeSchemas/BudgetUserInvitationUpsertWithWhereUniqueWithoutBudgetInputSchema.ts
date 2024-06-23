import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationWhereUniqueInputSchema } from './BudgetUserInvitationWhereUniqueInputSchema';
import { BudgetUserInvitationUpdateWithoutBudgetInputSchema } from './BudgetUserInvitationUpdateWithoutBudgetInputSchema';
import { BudgetUserInvitationUncheckedUpdateWithoutBudgetInputSchema } from './BudgetUserInvitationUncheckedUpdateWithoutBudgetInputSchema';
import { BudgetUserInvitationCreateWithoutBudgetInputSchema } from './BudgetUserInvitationCreateWithoutBudgetInputSchema';
import { BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema } from './BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema';

export const BudgetUserInvitationUpsertWithWhereUniqueWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpsertWithWhereUniqueWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => BudgetUserInvitationUpdateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUncheckedUpdateWithoutBudgetInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema) ]),
}).strict();

export default BudgetUserInvitationUpsertWithWhereUniqueWithoutBudgetInputSchema;
