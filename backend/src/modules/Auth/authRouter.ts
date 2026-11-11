import { validateRequest } from '@/common/middlewares/validation';
import {
  createAdmin,
  deleteAdmin,
  getAdmins,
  getMe,
  login,
  logout,
  protect,
  refreshAccessToken,
  updatePassword,
} from './authController';
import {
  addAdminValidation,
  deleteAdminValidation,
  loginValidation,
  updatePasswordValidation,
} from './authValidation';
import { Router } from 'express';
import { checkNoOfAdmins, loginLimiter } from './authMiddlewares';

const router = Router();

router.post(
  '/newAdmin',
  protect,
  validateRequest({ body: addAdminValidation }),
  createAdmin,
);

router.post(
  '/login',
  loginLimiter,
  validateRequest({ body: loginValidation }),
  login,
);

router.post('/logout', protect, logout);

router.post('/refresh', refreshAccessToken);

router.get('/me', protect, getMe);

router.patch(
  '/password',
  protect,
  validateRequest({ body: updatePasswordValidation }),
  updatePassword,
);

router.get('/admins', protect, getAdmins);

router.delete(
  '/:adminId',
  protect,
  validateRequest({ params: deleteAdminValidation }),
  checkNoOfAdmins,
  deleteAdmin,
);

export default router;
