import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetCreateWithoutInvitationsInputSchema } from './BudgetCreateWithoutInvitationsInputSchema';
import { BudgetUncheckedCreateWithoutInvitationsInputSchema } from './BudgetUncheckedCreateWithoutInvitationsInputSchema';
import { BudgetCreateOrConnectWithoutInvitationsInputSchema } from './BudgetCreateOrConnectWithoutInvitationsInputSchema';
import { BudgetUpsertWithoutInvitationsInputSchema } from './BudgetUpsertWithoutInvitationsInputSchema';
import { BudgetWhereUniqueInputSchema } from './BudgetWhereUniqueInputSchema';
import { BudgetUpdateToOneWithWhereWithoutInvitationsInputSchema } from './BudgetUpdateToOneWithWhereWithoutInvitationsInputSchema';
import { BudgetUpdateWithoutInvitationsInputSchema } from './BudgetUpdateWithoutInvitationsInputSchema';
import { BudgetUncheckedUpdateWithoutInvitationsInputSchema } from './BudgetUncheckedUpdateWithoutInvitationsInputSchema';

export const BudgetUpdateOneRequiredWithoutInvitationsNestedInputSchema: z.ZodType<Prisma.BudgetUpdateOneRequiredWithoutInvitationsNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetCreateWithoutInvitationsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutInvitationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetCreateOrConnectWithoutInvitationsInputSchema).optional(),
  upsert: z.lazy(() => BudgetUpsertWithoutInvitationsInputSchema).optional(),
  connect: z.lazy(() => BudgetWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => BudgetUpdateToOneWithWhereWithoutInvitationsInputSchema),z.lazy(() => BudgetUpdateWithoutInvitationsInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutInvitationsInputSchema) ]).optional(),
}).strict();

export default BudgetUpdateOneRequiredWithoutInvitationsNestedInputSchema;
