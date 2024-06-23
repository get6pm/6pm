import { z } from 'zod';

export const CategoryScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','name','description','icon','color','userId','parentId']);

export default CategoryScalarFieldEnumSchema;
