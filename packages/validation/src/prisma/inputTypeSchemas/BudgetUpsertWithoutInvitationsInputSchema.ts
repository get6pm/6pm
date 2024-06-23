import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUpdateWithoutInvitationsInputSchema } from './BudgetUpdateWithoutInvitationsInputSchema';
import { BudgetUncheckedUpdateWithoutInvitationsInputSchema } from './BudgetUncheckedUpdateWithoutInvitationsInputSchema';
import { BudgetCreateWithoutInvitationsInputSchema } from './BudgetCreateWithoutInvitationsInputSchema';
import { BudgetUncheckedCreateWithoutInvitationsInputSchema } from './BudgetUncheckedCreateWithoutInvitationsInputSchema';
import { BudgetWhereInputSchema } from './BudgetWhereInputSchema';

export const BudgetUpsertWithoutInvitationsInputSchema: z.ZodType<Prisma.BudgetUpsertWithoutInvitationsInput> = z.object({
  update: z.union([ z.lazy(() => BudgetUpdateWithoutInvitationsInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutInvitationsInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetCreateWithoutInvitationsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutInvitationsInputSchema) ]),
  where: z.lazy(() => BudgetWhereInputSchema).optional()
}).strict();

export default BudgetUpsertWithoutInvitationsInputSchema;
