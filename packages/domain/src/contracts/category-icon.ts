import { z } from 'zod';

import { CATEGORY_ICONS, isCategoryIcon, type CategoryIcon } from '../categories/icon-suggest';

/**
 * `POST /v1/category-icon`: the icon a category's name points to, chosen by a model when the
 * phone's own word match found none. The phone sends the name as typed and the icons the person
 * may use (the free pack, or every pack with Max); the answer is one of those, or null when the
 * model is not sure.
 */
export const CATEGORY_NAME_MAX = 40;

const categoryIconSchema = z.custom<CategoryIcon>(
  (value) => typeof value === 'string' && isCategoryIcon(value),
  { message: 'not a category icon' },
);

export const categoryIconRequestSchema = z.object({
  name: z.string().trim().min(1).max(CATEGORY_NAME_MAX),
  icons: z
    .array(categoryIconSchema)
    .min(2)
    .max(CATEGORY_ICONS.length)
    .refine((icons) => new Set(icons).size === icons.length, { message: 'icons repeat' }),
});
export type CategoryIconRequest = z.input<typeof categoryIconRequestSchema>;

export const categoryIconResponseSchema = z.object({
  icon: categoryIconSchema.nullable(),
});
export type CategoryIconResponse = z.infer<typeof categoryIconResponseSchema>;
