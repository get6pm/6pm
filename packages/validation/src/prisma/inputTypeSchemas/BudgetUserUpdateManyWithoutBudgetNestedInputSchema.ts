import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserCreateWithoutBudgetInputSchema } from './BudgetUserCreateWithoutBudgetInputSchema';
import { BudgetUserUncheckedCreateWithoutBudgetInputSchema } from './BudgetUserUncheckedCreateWithoutBudgetInputSchema';
import { BudgetUserCreateOrConnectWithoutBudgetInputSchema } from './BudgetUserCreateOrConnectWithoutBudgetInputSchema';
import { BudgetUserUpsertWithWhereUniqueWithoutBudgetInputSchema } from './BudgetUserUpsertWithWhereUniqueWithoutBudgetInputSchema';
import { BudgetUserCreateManyBudgetInputEnvelopeSchema } from './BudgetUserCreateManyBudgetInputEnvelopeSchema';
import { BudgetUserWhereUniqueInputSchema } from './BudgetUserWhereUniqueInputSchema';
import { BudgetUserUpdateWithWhereUniqueWithoutBudgetInputSchema } from './BudgetUserUpdateWithWhereUniqueWithoutBudgetInputSchema';
import { BudgetUserUpdateManyWithWhereWithoutBudgetInputSchema } from './BudgetUserUpdateManyWithWhereWithoutBudgetInputSchema';
import { BudgetUserScalarWhereInputSchema } from './BudgetUserScalarWhereInputSchema';

export const BudgetUserUpdateManyWithoutBudgetNestedInputSchema: z.ZodType<Prisma.BudgetUserUpdateManyWithoutBudgetNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserCreateWithoutBudgetInputSchema).array(),z.lazy(() => BudgetUserUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => BudgetUserCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => BudgetUserUpsertWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => BudgetUserUpsertWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserCreateManyBudgetInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => BudgetUserUpdateWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => BudgetUserUpdateWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => BudgetUserUpdateManyWithWhereWithoutBudgetInputSchema),z.lazy(() => BudgetUserUpdateManyWithWhereWithoutBudgetInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => BudgetUserScalarWhereInputSchema),z.lazy(() => BudgetUserScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default BudgetUserUpdateManyWithoutBudgetNestedInputSchema;
