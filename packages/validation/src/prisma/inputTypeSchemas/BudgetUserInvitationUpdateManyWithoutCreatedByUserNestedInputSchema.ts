import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationCreateWithoutCreatedByUserInputSchema } from './BudgetUserInvitationCreateWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema } from './BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema } from './BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationUpsertWithWhereUniqueWithoutCreatedByUserInputSchema } from './BudgetUserInvitationUpsertWithWhereUniqueWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationCreateManyCreatedByUserInputEnvelopeSchema } from './BudgetUserInvitationCreateManyCreatedByUserInputEnvelopeSchema';
import { BudgetUserInvitationWhereUniqueInputSchema } from './BudgetUserInvitationWhereUniqueInputSchema';
import { BudgetUserInvitationUpdateWithWhereUniqueWithoutCreatedByUserInputSchema } from './BudgetUserInvitationUpdateWithWhereUniqueWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationUpdateManyWithWhereWithoutCreatedByUserInputSchema } from './BudgetUserInvitationUpdateManyWithWhereWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationScalarWhereInputSchema } from './BudgetUserInvitationScalarWhereInputSchema';

export const BudgetUserInvitationUpdateManyWithoutCreatedByUserNestedInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateManyWithoutCreatedByUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationCreateWithoutCreatedByUserInputSchema).array(),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => BudgetUserInvitationUpsertWithWhereUniqueWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUpsertWithWhereUniqueWithoutCreatedByUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserInvitationCreateManyCreatedByUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => BudgetUserInvitationUpdateWithWhereUniqueWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUpdateWithWhereUniqueWithoutCreatedByUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => BudgetUserInvitationUpdateManyWithWhereWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUpdateManyWithWhereWithoutCreatedByUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => BudgetUserInvitationScalarWhereInputSchema),z.lazy(() => BudgetUserInvitationScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default BudgetUserInvitationUpdateManyWithoutCreatedByUserNestedInputSchema;
