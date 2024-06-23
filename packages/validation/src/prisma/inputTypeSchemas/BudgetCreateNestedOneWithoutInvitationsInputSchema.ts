import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetCreateWithoutInvitationsInputSchema } from './BudgetCreateWithoutInvitationsInputSchema';
import { BudgetUncheckedCreateWithoutInvitationsInputSchema } from './BudgetUncheckedCreateWithoutInvitationsInputSchema';
import { BudgetCreateOrConnectWithoutInvitationsInputSchema } from './BudgetCreateOrConnectWithoutInvitationsInputSchema';
import { BudgetWhereUniqueInputSchema } from './BudgetWhereUniqueInputSchema';

export const BudgetCreateNestedOneWithoutInvitationsInputSchema: z.ZodType<Prisma.BudgetCreateNestedOneWithoutInvitationsInput> = z.object({
  create: z.union([ z.lazy(() => BudgetCreateWithoutInvitationsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutInvitationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetCreateOrConnectWithoutInvitationsInputSchema).optional(),
  connect: z.lazy(() => BudgetWhereUniqueInputSchema).optional()
}).strict();

export default BudgetCreateNestedOneWithoutInvitationsInputSchema;
