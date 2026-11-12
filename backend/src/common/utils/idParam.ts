import * as z from 'zod';

export const cuid = z
  .string()
  .regex(/^[a-z][a-z0-9]{20,32}$/, 'المعرّف غير صحيح');

export const idParams = z.object({ id: cuid });
