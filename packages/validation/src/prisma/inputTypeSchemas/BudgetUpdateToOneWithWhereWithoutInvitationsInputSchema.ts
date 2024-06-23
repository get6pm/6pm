import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetWhereInputSchema } from './BudgetWhereInputSchema';
import { BudgetUpdateWithoutInvitationsInputSchema } from './BudgetUpdateWithoutInvitationsInputSchema';
import { BudgetUncheckedUpdateWithoutInvitationsInputSchema } from './BudgetUncheckedUpdateWithoutInvitationsInputSchema';

export const BudgetUpdateToOneWithWhereWithoutInvitationsInputSchema: z.ZodType<Prisma.BudgetUpdateToOneWithWhereWithoutInvitationsInput> = z.object({
  where: z.lazy(() => BudgetWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => BudgetUpdateWithoutInvitationsInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutInvitationsInputSchema) ]),
}).strict();

export default BudgetUpdateToOneWithWhereWithoutInvitationsInputSchema;
