import { Router } from 'express';
import { validateRequest } from '../../common/middlewares/validation';
import { protect } from '../Auth/authController';
import {
  archiveProduct,
  bulkDiscount,
  createProduct,
  getProduct,
  listProducts,
  restoreProduct,
  updateProduct,
} from './productsController';
import {
  bulkDiscountValidation,
  createProductValidation,
  listProductsQuery,
  productIdParams,
  updateProductValidation,
} from './productsValidation';

const router = Router();

router.use(protect);

router.get('/', validateRequest({ query: listProductsQuery }), listProducts);
router.post(
  '/',
  validateRequest({ body: createProductValidation }),
  createProduct,
);

router.post(
  '/bulk-discount',
  validateRequest({ body: bulkDiscountValidation }),
  bulkDiscount,
);

router.get('/:id', validateRequest({ params: productIdParams }), getProduct);
router.patch(
  '/:id',
  validateRequest({ params: productIdParams, body: updateProductValidation }),
  updateProduct,
);
router.delete(
  '/:id',
  validateRequest({ params: productIdParams }),
  archiveProduct,
);
router.post(
  '/:id/restore',
  validateRequest({ params: productIdParams }),
  restoreProduct,
);

export default router;
