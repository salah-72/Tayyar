import { Router } from 'express';
import { validateRequest } from '../../common/middlewares/validation';
import { protect } from '../Auth/authController';
import {
  archiveStore,
  createStore,
  getStore,
  listStores,
  restoreStore,
  updateStore,
} from './storesController';
import {
  createStoreValidation,
  listStoresQuery,
  storeIdParams,
  updateStoreValidation,
} from './storesValidation';

const router = Router();

router.use(protect);

router.get('/', validateRequest({ query: listStoresQuery }), listStores);
router.post('/', validateRequest({ body: createStoreValidation }), createStore);
router.get('/:id', validateRequest({ params: storeIdParams }), getStore);
router.patch(
  '/:id',
  validateRequest({ params: storeIdParams, body: updateStoreValidation }),
  updateStore,
);
router.delete('/:id', validateRequest({ params: storeIdParams }), archiveStore);
router.post(
  '/:id/restore',
  validateRequest({ params: storeIdParams }),
  restoreStore,
);

export default router;
