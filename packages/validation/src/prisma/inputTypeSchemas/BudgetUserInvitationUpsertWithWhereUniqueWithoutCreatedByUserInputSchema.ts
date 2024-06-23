import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationWhereUniqueInputSchema } from './BudgetUserInvitationWhereUniqueInputSchema';
import { BudgetUserInvitationUpdateWithoutCreatedByUserInputSchema } from './BudgetUserInvitationUpdateWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationUncheckedUpdateWithoutCreatedByUserInputSchema } from './BudgetUserInvitationUncheckedUpdateWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationCreateWithoutCreatedByUserInputSchema } from './BudgetUserInvitationCreateWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema } from './BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema';

export const BudgetUserInvitationUpsertWithWhereUniqueWithoutCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpsertWithWhereUniqueWithoutCreatedByUserInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => BudgetUserInvitationUpdateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUncheckedUpdateWithoutCreatedByUserInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema) ]),
}).strict();

export default BudgetUserInvitationUpsertWithWhereUniqueWithoutCreatedByUserInputSchema;
