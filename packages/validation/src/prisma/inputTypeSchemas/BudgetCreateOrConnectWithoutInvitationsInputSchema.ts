import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetWhereUniqueInputSchema } from './BudgetWhereUniqueInputSchema';
import { BudgetCreateWithoutInvitationsInputSchema } from './BudgetCreateWithoutInvitationsInputSchema';
import { BudgetUncheckedCreateWithoutInvitationsInputSchema } from './BudgetUncheckedCreateWithoutInvitationsInputSchema';

export const BudgetCreateOrConnectWithoutInvitationsInputSchema: z.ZodType<Prisma.BudgetCreateOrConnectWithoutInvitationsInput> = z.object({
  where: z.lazy(() => BudgetWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetCreateWithoutInvitationsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutInvitationsInputSchema) ]),
}).strict();

export default BudgetCreateOrConnectWithoutInvitationsInputSchema;
