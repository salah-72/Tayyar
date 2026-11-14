import * as z from 'zod';
import { cuid, idParams } from '../../common/utils/idParam';
import { SLUG_REGEX } from '../../common/utils/slug';

const fields = z.object({
  name: z.string().trim().min(2, { message: 'اسم القسم قصير' }).max(60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(60)
    .regex(SLUG_REGEX, {
      message: 'الـ slug حروف إنجليزي صغيرة وأرقام وشرطات بس',
    }),
  sortOrder: z.number().int().min(0).max(100_000),
  isActive: z.boolean(),
  discountKind: z.enum(['PERCENT', 'FIXED', 'NONE']).nullable(),
  discountValue: z.number().int().min(0).max(100_000_000).nullable(),
  defaultStoreId: cuid.nullable(),
});

export const createCategoryValidation = fields.pick({ name: true }).extend({
  slug: fields.shape.slug.optional(),
  sortOrder: fields.shape.sortOrder.optional(),
  isActive: fields.shape.isActive.optional(),
  discountKind: fields.shape.discountKind.optional(),
  discountValue: fields.shape.discountValue.optional(),
  defaultStoreId: fields.shape.defaultStoreId.optional(),
});

export const updateCategoryValidation = fields
  .partial()
  .refine((o) => Object.keys(o).length > 0, {
    message: 'ابعت حقل واحد على الأقل للتعديل',
  });

export const listCategoriesQuery = z.object({
  archived: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  q: z.string().trim().max(60).optional(),
});

export const categoryIdParams = idParams;

export type CreateCategoryInput = z.infer<typeof createCategoryValidation>;
export type UpdateCategoryInput = z.infer<typeof updateCategoryValidation>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuery>;
