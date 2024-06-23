import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserCreateWithoutUserInputSchema } from './BudgetUserCreateWithoutUserInputSchema';
import { BudgetUserUncheckedCreateWithoutUserInputSchema } from './BudgetUserUncheckedCreateWithoutUserInputSchema';
import { BudgetUserCreateOrConnectWithoutUserInputSchema } from './BudgetUserCreateOrConnectWithoutUserInputSchema';
import { BudgetUserUpsertWithWhereUniqueWithoutUserInputSchema } from './BudgetUserUpsertWithWhereUniqueWithoutUserInputSchema';
import { BudgetUserCreateManyUserInputEnvelopeSchema } from './BudgetUserCreateManyUserInputEnvelopeSchema';
import { BudgetUserWhereUniqueInputSchema } from './BudgetUserWhereUniqueInputSchema';
import { BudgetUserUpdateWithWhereUniqueWithoutUserInputSchema } from './BudgetUserUpdateWithWhereUniqueWithoutUserInputSchema';
import { BudgetUserUpdateManyWithWhereWithoutUserInputSchema } from './BudgetUserUpdateManyWithWhereWithoutUserInputSchema';
import { BudgetUserScalarWhereInputSchema } from './BudgetUserScalarWhereInputSchema';

export const BudgetUserUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.BudgetUserUncheckedUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutUserInputSchema),z.lazy(() => BudgetUserCreateWithoutUserInputSchema).array(),z.lazy(() => BudgetUserUncheckedCreateWithoutUserInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserCreateOrConnectWithoutUserInputSchema),z.lazy(() => BudgetUserCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => BudgetUserUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => BudgetUserUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => BudgetUserUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => BudgetUserUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => BudgetUserUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => BudgetUserUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => BudgetUserScalarWhereInputSchema),z.lazy(() => BudgetUserScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default BudgetUserUncheckedUpdateManyWithoutUserNestedInputSchema;
