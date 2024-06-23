import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationResponseCreateWithoutInvitationInputSchema } from './BudgetUserInvitationResponseCreateWithoutInvitationInputSchema';
import { BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema } from './BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema';
import { BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema } from './BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema';
import { BudgetUserInvitationResponseUpsertWithWhereUniqueWithoutInvitationInputSchema } from './BudgetUserInvitationResponseUpsertWithWhereUniqueWithoutInvitationInputSchema';
import { BudgetUserInvitationResponseCreateManyInvitationInputEnvelopeSchema } from './BudgetUserInvitationResponseCreateManyInvitationInputEnvelopeSchema';
import { BudgetUserInvitationResponseWhereUniqueInputSchema } from './BudgetUserInvitationResponseWhereUniqueInputSchema';
import { BudgetUserInvitationResponseUpdateWithWhereUniqueWithoutInvitationInputSchema } from './BudgetUserInvitationResponseUpdateWithWhereUniqueWithoutInvitationInputSchema';
import { BudgetUserInvitationResponseUpdateManyWithWhereWithoutInvitationInputSchema } from './BudgetUserInvitationResponseUpdateManyWithWhereWithoutInvitationInputSchema';
import { BudgetUserInvitationResponseScalarWhereInputSchema } from './BudgetUserInvitationResponseScalarWhereInputSchema';

export const BudgetUserInvitationResponseUpdateManyWithoutInvitationNestedInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpdateManyWithoutInvitationNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseCreateWithoutInvitationInputSchema).array(),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => BudgetUserInvitationResponseUpsertWithWhereUniqueWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUpsertWithWhereUniqueWithoutInvitationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserInvitationResponseCreateManyInvitationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateWithWhereUniqueWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUpdateWithWhereUniqueWithoutInvitationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateManyWithWhereWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUpdateManyWithWhereWithoutInvitationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => BudgetUserInvitationResponseScalarWhereInputSchema),z.lazy(() => BudgetUserInvitationResponseScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default BudgetUserInvitationResponseUpdateManyWithoutInvitationNestedInputSchema;
