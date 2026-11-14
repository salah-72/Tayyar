import * as z from 'zod';
import { cuid, idParams } from '../../common/utils/idParam';
import { SLUG_REGEX } from '../../common/utils/slug';

const pricingEnum = z.enum(['PER_KG', 'PER_UNIT', 'FLAT']);

const optionFields = z.object({
  name: z.string().trim().min(1, { message: 'اسم الخيار مطلوب' }).max(60),
  pricing: pricingEnum,
  priceMinor: z.number().int().min(0).max(10_000_00),
  sortOrder: z.number().int().min(0).max(100_000),
  isActive: z.boolean(),
});

export const createOptionValidation = optionFields
  .pick({ name: true, pricing: true, priceMinor: true })
  .extend({
    sortOrder: optionFields.shape.sortOrder.optional(),
    isActive: optionFields.shape.isActive.optional(),
  });

export const updateOptionValidation = optionFields
  .partial()
  .refine((o) => Object.keys(o).length > 0, {
    message: 'ابعت حقل واحد على الأقل للتعديل',
  });

const groupFields = z.object({
  name: z.string().trim().min(2, { message: 'اسم المجموعة قصير' }).max(60),
  slug: z.string().trim().toLowerCase().max(60).regex(SLUG_REGEX, {
    message: 'الـ slug حروف إنجليزي صغيرة وأرقام وشرطات بس',
  }),
  minSelect: z.number().int().min(0).max(20),
  maxSelect: z.number().int().min(1).max(20),
  sortOrder: z.number().int().min(0).max(100_000),
  isActive: z.boolean(),
});

export const createGroupValidation = groupFields.pick({ name: true }).extend({
  slug: groupFields.shape.slug.optional(),
  minSelect: groupFields.shape.minSelect.optional(),
  maxSelect: groupFields.shape.maxSelect.optional(),
  sortOrder: groupFields.shape.sortOrder.optional(),
  isActive: groupFields.shape.isActive.optional(),
  options: z.array(createOptionValidation).max(30).optional(),
});

export const updateGroupValidation = groupFields
  .partial()
  .refine((o) => Object.keys(o).length > 0, {
    message: 'ابعت حقل واحد على الأقل للتعديل',
  });

export const listGroupsQuery = z.object({
  q: z.string().trim().max(60).optional(),
  active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const groupIdParams = idParams;
export const optionIdParams = z.object({ id: cuid, optionId: cuid });

export type CreateGroupInput = z.infer<typeof createGroupValidation>;
export type UpdateGroupInput = z.infer<typeof updateGroupValidation>;
export type CreateOptionInput = z.infer<typeof createOptionValidation>;
export type UpdateOptionInput = z.infer<typeof updateOptionValidation>;
export type ListGroupsQuery = z.infer<typeof listGroupsQuery>;
