import * as z from 'zod';
import { cuid, idParams } from '../../common/utils/idParam';
import { paginationQuery } from '../../common/utils/pagination';
import { UNIT_VALUES } from '../../common/utils/units';

const unitEnum = z.enum(UNIT_VALUES);
const saleModeEnum = z.enum(['UNIT', 'WEIGHT', 'PIECE_WEIGHT']);
const discountKindEnum = z.enum(['PERCENT', 'FIXED', 'NONE']);

const fields = z.object({
  name: z.string().trim().min(2, { message: 'اسم المنتج قصير' }).max(150),
  description: z.string().trim().max(500).nullable(),
  categoryId: cuid.nullable(),
  storeId: cuid.nullable(),
  menuSection: z.string().trim().min(1).max(60).nullable(),
  unit: unitEnum,
  saleMode: saleModeEnum,
  priceMinor: z.number().int().min(0).max(10_000_000),
  minQty: z.number().positive().max(1000),
  qtyStep: z.number().positive().max(1000),
  weightChoices: z.array(z.number().positive().max(20)).max(12),
  discountKind: discountKindEnum.nullable(),
  discountValue: z.number().int().min(0).max(100_000_000).nullable(),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(100_000),
  optionGroupIds: z.array(cuid).max(10),
});

export const createProductValidation = fields
  .pick({ name: true, unit: true, priceMinor: true })
  .extend(
    fields.omit({ name: true, unit: true, priceMinor: true }).partial().shape,
  );

export const updateProductValidation = fields
  .partial()
  .refine((o) => Object.keys(o).length > 0, {
    message: 'ابعت حقل واحد على الأقل للتعديل',
  });

const bool = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true')
  .optional();

export const listProductsQuery = paginationQuery.extend({
  q: z.string().trim().max(80).optional(),
  categoryId: cuid.optional(),
  storeId: cuid.optional(),
  saleMode: saleModeEnum.optional(),
  active: bool,
  featured: bool,
  archived: bool,
});

export const bulkDiscountValidation = z.object({
  productIds: z.array(cuid).min(1).max(200),
  discountKind: discountKindEnum.nullable(),
  discountValue: z.number().int().min(0).max(100_000_000).nullable().optional(),
});

export const productIdParams = idParams;

export type CreateProductInput = z.infer<typeof createProductValidation>;
export type UpdateProductInput = z.infer<typeof updateProductValidation>;
export type ListProductsQuery = z.infer<typeof listProductsQuery>;
export type BulkDiscountInput = z.infer<typeof bulkDiscountValidation>;
