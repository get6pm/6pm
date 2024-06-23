import { z } from 'zod';

export const UserScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','email','name']);

export default UserScalarFieldEnumSchema;
