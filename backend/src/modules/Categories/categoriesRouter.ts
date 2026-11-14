import { Router } from 'express';
import { validateRequest } from '../../common/middlewares/validation';
import { protect } from '../Auth/authController';
import {
  archiveCategory,
  createCategory,
  getCategory,
  listCategories,
  restoreCategory,
  updateCategory,
} from './categoriesController';
import {
  categoryIdParams,
  createCategoryValidation,
  listCategoriesQuery,
  updateCategoryValidation,
} from './categoriesValidation';

const router = Router();

router.use(protect);

router.get(
  '/',
  validateRequest({ query: listCategoriesQuery }),
  listCategories,
);
router.post(
  '/',
  validateRequest({ body: createCategoryValidation }),
  createCategory,
);
router.get('/:id', validateRequest({ params: categoryIdParams }), getCategory);
router.patch(
  '/:id',
  validateRequest({ params: categoryIdParams, body: updateCategoryValidation }),
  updateCategory,
);
router.delete(
  '/:id',
  validateRequest({ params: categoryIdParams }),
  archiveCategory,
);
router.post(
  '/:id/restore',
  validateRequest({ params: categoryIdParams }),
  restoreCategory,
);

export default router;
