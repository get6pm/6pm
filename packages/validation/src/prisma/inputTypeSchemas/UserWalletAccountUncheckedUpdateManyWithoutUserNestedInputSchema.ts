import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWalletAccountCreateWithoutUserInputSchema } from './UserWalletAccountCreateWithoutUserInputSchema';
import { UserWalletAccountUncheckedCreateWithoutUserInputSchema } from './UserWalletAccountUncheckedCreateWithoutUserInputSchema';
import { UserWalletAccountCreateOrConnectWithoutUserInputSchema } from './UserWalletAccountCreateOrConnectWithoutUserInputSchema';
import { UserWalletAccountUpsertWithWhereUniqueWithoutUserInputSchema } from './UserWalletAccountUpsertWithWhereUniqueWithoutUserInputSchema';
import { UserWalletAccountCreateManyUserInputEnvelopeSchema } from './UserWalletAccountCreateManyUserInputEnvelopeSchema';
import { UserWalletAccountWhereUniqueInputSchema } from './UserWalletAccountWhereUniqueInputSchema';
import { UserWalletAccountUpdateWithWhereUniqueWithoutUserInputSchema } from './UserWalletAccountUpdateWithWhereUniqueWithoutUserInputSchema';
import { UserWalletAccountUpdateManyWithWhereWithoutUserInputSchema } from './UserWalletAccountUpdateManyWithWhereWithoutUserInputSchema';
import { UserWalletAccountScalarWhereInputSchema } from './UserWalletAccountScalarWhereInputSchema';

export const UserWalletAccountUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.UserWalletAccountUncheckedUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserWalletAccountCreateWithoutUserInputSchema),z.lazy(() => UserWalletAccountCreateWithoutUserInputSchema).array(),z.lazy(() => UserWalletAccountUncheckedCreateWithoutUserInputSchema),z.lazy(() => UserWalletAccountUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserWalletAccountCreateOrConnectWithoutUserInputSchema),z.lazy(() => UserWalletAccountCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => UserWalletAccountUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => UserWalletAccountUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => UserWalletAccountCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => UserWalletAccountWhereUniqueInputSchema),z.lazy(() => UserWalletAccountWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => UserWalletAccountWhereUniqueInputSchema),z.lazy(() => UserWalletAccountWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => UserWalletAccountWhereUniqueInputSchema),z.lazy(() => UserWalletAccountWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserWalletAccountWhereUniqueInputSchema),z.lazy(() => UserWalletAccountWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => UserWalletAccountUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => UserWalletAccountUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => UserWalletAccountUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => UserWalletAccountUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => UserWalletAccountScalarWhereInputSchema),z.lazy(() => UserWalletAccountScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default UserWalletAccountUncheckedUpdateManyWithoutUserNestedInputSchema;
