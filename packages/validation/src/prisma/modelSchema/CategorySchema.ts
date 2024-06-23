import { z } from 'zod';
import type { UserWithRelations } from './UserSchema'
import type { TransactionWithRelations } from './TransactionSchema'
import { UserWithRelationsSchema } from './UserSchema'
import { TransactionWithRelationsSchema } from './TransactionSchema'

/////////////////////////////////////////
// CATEGORY SCHEMA
/////////////////////////////////////////

export const CategorySchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  userId: z.string(),
  parentId: z.string().nullable(),
})

export type Category = z.infer<typeof CategorySchema>

/////////////////////////////////////////
// CATEGORY RELATION SCHEMA
/////////////////////////////////////////

export type CategoryRelations = {
  user: UserWithRelations;
  parent?: CategoryWithRelations | null;
  children: CategoryWithRelations[];
  transactions: TransactionWithRelations[];
};

export type CategoryWithRelations = z.infer<typeof CategorySchema> & CategoryRelations

export const CategoryWithRelationsSchema: z.ZodType<CategoryWithRelations> = CategorySchema.merge(z.object({
  user: z.lazy(() => UserWithRelationsSchema),
  parent: z.lazy(() => CategoryWithRelationsSchema).nullable(),
  children: z.lazy(() => CategoryWithRelationsSchema).array(),
  transactions: z.lazy(() => TransactionWithRelationsSchema).array(),
}))

export default CategorySchema;
