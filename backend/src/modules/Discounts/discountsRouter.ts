import { Router } from 'express';
import { validateRequest } from '../../common/middlewares/validation';
import { protect } from '../Auth/authController';
import {
  createDiscount,
  deleteDiscount,
  getDiscount,
  listDiscounts,
  updateDiscount,
} from './discountsController';
import {
  createDiscountValidation,
  discountIdParams,
  listDiscountsQuery,
  updateDiscountValidation,
} from './discountsValidation';

const router = Router();

router.use(protect);

router.get('/', validateRequest({ query: listDiscountsQuery }), listDiscounts);
router.post(
  '/',
  validateRequest({ body: createDiscountValidation }),
  createDiscount,
);
router.get('/:id', validateRequest({ params: discountIdParams }), getDiscount);
router.patch(
  '/:id',
  validateRequest({ params: discountIdParams, body: updateDiscountValidation }),
  updateDiscount,
);
router.delete(
  '/:id',
  validateRequest({ params: discountIdParams }),
  deleteDiscount,
);

export default router;
