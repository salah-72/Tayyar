import { Router } from 'express';
import { validateRequest } from '../../common/middlewares/validation';
import { protect } from '../Auth/authController';
import { getShoppingList, markPurchased } from './purchasesController';
import {
  markPurchasedValidation,
  shoppingListQuery,
} from './purchasesValidation';

const router = Router();

router.use(protect);

router.get('/', validateRequest({ query: shoppingListQuery }), getShoppingList);
router.post(
  '/mark',
  validateRequest({ body: markPurchasedValidation }),
  markPurchased,
);

export default router;
