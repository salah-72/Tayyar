import * as z from 'zod';

const passwordValidation = z
  .string()
  .trim()
  .min(6, { message: 'password must be at least 6 character' })
  .max(50, { message: 'password must be less than 50' });

export const addAdminValidation = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: 'username is required' })
    .max(30, { message: 'name must be less than 30' }),
  password: passwordValidation,
});

export const loginValidation = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: 'username is required' })
    .max(30, { message: 'name must be less than 30' }),
  password: passwordValidation,
});

export const updatePasswordValidation = z
  .object({
    oldPassword: z.string().min(1, { message: 'old password is required' }),
    newPassword: passwordValidation,
    passwordConfirm: passwordValidation,
  })
  .refine((data) => data.newPassword === data.passwordConfirm, {
    message: 'passwords do not match',
    path: ['passwordConfirm'],
  });

export const deleteAdminValidation = z.object({
  adminId: z.coerce.number().int().gt(0),
});
