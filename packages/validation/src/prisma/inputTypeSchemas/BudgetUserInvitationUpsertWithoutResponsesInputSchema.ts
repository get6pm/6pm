import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationUpdateWithoutResponsesInputSchema } from './BudgetUserInvitationUpdateWithoutResponsesInputSchema';
import { BudgetUserInvitationUncheckedUpdateWithoutResponsesInputSchema } from './BudgetUserInvitationUncheckedUpdateWithoutResponsesInputSchema';
import { BudgetUserInvitationCreateWithoutResponsesInputSchema } from './BudgetUserInvitationCreateWithoutResponsesInputSchema';
import { BudgetUserInvitationUncheckedCreateWithoutResponsesInputSchema } from './BudgetUserInvitationUncheckedCreateWithoutResponsesInputSchema';
import { BudgetUserInvitationWhereInputSchema } from './BudgetUserInvitationWhereInputSchema';

export const BudgetUserInvitationUpsertWithoutResponsesInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpsertWithoutResponsesInput> = z.object({
  update: z.union([ z.lazy(() => BudgetUserInvitationUpdateWithoutResponsesInputSchema),z.lazy(() => BudgetUserInvitationUncheckedUpdateWithoutResponsesInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutResponsesInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutResponsesInputSchema) ]),
  where: z.lazy(() => BudgetUserInvitationWhereInputSchema).optional()
}).strict();

export default BudgetUserInvitationUpsertWithoutResponsesInputSchema;
