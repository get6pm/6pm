import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { NullableDateTimeFieldUpdateOperationsInputSchema } from './NullableDateTimeFieldUpdateOperationsInputSchema';
import { BudgetUserInvitationUpdateOneRequiredWithoutResponsesNestedInputSchema } from './BudgetUserInvitationUpdateOneRequiredWithoutResponsesNestedInputSchema';
import { UserUpdateOneWithoutCreatedFromInvitationNestedInputSchema } from './UserUpdateOneWithoutCreatedFromInvitationNestedInputSchema';

export const BudgetUserInvitationResponseUpdateInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpdateInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  acceptedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  declinedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invitation: z.lazy(() => BudgetUserInvitationUpdateOneRequiredWithoutResponsesNestedInputSchema).optional(),
  createdUser: z.lazy(() => UserUpdateOneWithoutCreatedFromInvitationNestedInputSchema).optional()
}).strict();

export default BudgetUserInvitationResponseUpdateInputSchema;
