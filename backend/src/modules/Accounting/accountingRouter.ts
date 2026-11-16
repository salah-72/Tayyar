import { Router } from 'express';
import { validateRequest } from '../../common/middlewares/validation';
import { protect } from '../Auth/authController';
import {
  getDayList,
  getStoreRange,
  settleDay,
  unsettleDay,
} from './accountingController';
import {
  dayListQuery,
  settleValidation,
  settlementParams,
  storeParams,
  storeRangeQuery,
} from './accountingValidation';

const router = Router();

router.use(protect);

router.get('/stores', validateRequest({ query: dayListQuery }), getDayList);
router.get(
  '/stores/:storeId',
  validateRequest({ params: storeParams, query: storeRangeQuery }),
  getStoreRange,
);
router.post(
  '/settlements',
  validateRequest({ body: settleValidation }),
  settleDay,
);
router.delete(
  '/settlements/:id',
  validateRequest({ params: settlementParams }),
  unsettleDay,
);

export default router;
