import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationCreateWithoutResponsesInputSchema } from './BudgetUserInvitationCreateWithoutResponsesInputSchema';
import { BudgetUserInvitationUncheckedCreateWithoutResponsesInputSchema } from './BudgetUserInvitationUncheckedCreateWithoutResponsesInputSchema';
import { BudgetUserInvitationCreateOrConnectWithoutResponsesInputSchema } from './BudgetUserInvitationCreateOrConnectWithoutResponsesInputSchema';
import { BudgetUserInvitationUpsertWithoutResponsesInputSchema } from './BudgetUserInvitationUpsertWithoutResponsesInputSchema';
import { BudgetUserInvitationWhereUniqueInputSchema } from './BudgetUserInvitationWhereUniqueInputSchema';
import { BudgetUserInvitationUpdateToOneWithWhereWithoutResponsesInputSchema } from './BudgetUserInvitationUpdateToOneWithWhereWithoutResponsesInputSchema';
import { BudgetUserInvitationUpdateWithoutResponsesInputSchema } from './BudgetUserInvitationUpdateWithoutResponsesInputSchema';
import { BudgetUserInvitationUncheckedUpdateWithoutResponsesInputSchema } from './BudgetUserInvitationUncheckedUpdateWithoutResponsesInputSchema';

export const BudgetUserInvitationUpdateOneRequiredWithoutResponsesNestedInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateOneRequiredWithoutResponsesNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutResponsesInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutResponsesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutResponsesInputSchema).optional(),
  upsert: z.lazy(() => BudgetUserInvitationUpsertWithoutResponsesInputSchema).optional(),
  connect: z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => BudgetUserInvitationUpdateToOneWithWhereWithoutResponsesInputSchema),z.lazy(() => BudgetUserInvitationUpdateWithoutResponsesInputSchema),z.lazy(() => BudgetUserInvitationUncheckedUpdateWithoutResponsesInputSchema) ]).optional(),
}).strict();

export default BudgetUserInvitationUpdateOneRequiredWithoutResponsesNestedInputSchema;
