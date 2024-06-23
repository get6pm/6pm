import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationResponseWhereUniqueInputSchema } from './BudgetUserInvitationResponseWhereUniqueInputSchema';
import { BudgetUserInvitationResponseUpdateWithoutInvitationInputSchema } from './BudgetUserInvitationResponseUpdateWithoutInvitationInputSchema';
import { BudgetUserInvitationResponseUncheckedUpdateWithoutInvitationInputSchema } from './BudgetUserInvitationResponseUncheckedUpdateWithoutInvitationInputSchema';
import { BudgetUserInvitationResponseCreateWithoutInvitationInputSchema } from './BudgetUserInvitationResponseCreateWithoutInvitationInputSchema';
import { BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema } from './BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema';

export const BudgetUserInvitationResponseUpsertWithWhereUniqueWithoutInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpsertWithWhereUniqueWithoutInvitationInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateWithoutInvitationInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema) ]),
}).strict();

export default BudgetUserInvitationResponseUpsertWithWhereUniqueWithoutInvitationInputSchema;
