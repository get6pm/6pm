import { z } from 'zod';

export const RelationLoadStrategySchema = z.enum(['query','join']);

export default RelationLoadStrategySchema;
