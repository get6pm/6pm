import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationCreateWithoutBudgetInputSchema } from './BudgetUserInvitationCreateWithoutBudgetInputSchema';
import { BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema } from './BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema';
import { BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema } from './BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema';
import { BudgetUserInvitationUpsertWithWhereUniqueWithoutBudgetInputSchema } from './BudgetUserInvitationUpsertWithWhereUniqueWithoutBudgetInputSchema';
import { BudgetUserInvitationCreateManyBudgetInputEnvelopeSchema } from './BudgetUserInvitationCreateManyBudgetInputEnvelopeSchema';
import { BudgetUserInvitationWhereUniqueInputSchema } from './BudgetUserInvitationWhereUniqueInputSchema';
import { BudgetUserInvitationUpdateWithWhereUniqueWithoutBudgetInputSchema } from './BudgetUserInvitationUpdateWithWhereUniqueWithoutBudgetInputSchema';
import { BudgetUserInvitationUpdateManyWithWhereWithoutBudgetInputSchema } from './BudgetUserInvitationUpdateManyWithWhereWithoutBudgetInputSchema';
import { BudgetUserInvitationScalarWhereInputSchema } from './BudgetUserInvitationScalarWhereInputSchema';

export const BudgetUserInvitationUncheckedUpdateManyWithoutBudgetNestedInputSchema: z.ZodType<Prisma.BudgetUserInvitationUncheckedUpdateManyWithoutBudgetNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationCreateWithoutBudgetInputSchema).array(),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => BudgetUserInvitationUpsertWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUpsertWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserInvitationCreateManyBudgetInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => BudgetUserInvitationUpdateWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUpdateWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => BudgetUserInvitationUpdateManyWithWhereWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUpdateManyWithWhereWithoutBudgetInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => BudgetUserInvitationScalarWhereInputSchema),z.lazy(() => BudgetUserInvitationScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default BudgetUserInvitationUncheckedUpdateManyWithoutBudgetNestedInputSchema;
