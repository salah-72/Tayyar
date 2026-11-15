import { Router } from 'express';
import { validateRequest } from '../../common/middlewares/validation';
import { protect } from '../Auth/authController';
import {
  createOrder,
  getOrder,
  listOrders,
  orderCounts,
  quoteOrder,
  updateOrder,
  updateOrderStatus,
} from './ordersController';
import {
  createOrderValidation,
  listOrdersQuery,
  orderIdParams,
  quoteValidation,
  updateOrderValidation,
  updateStatusValidation,
} from './ordersValidation';

const router = Router();

router.post('/quote', validateRequest({ body: quoteValidation }), quoteOrder);
router.post('/', validateRequest({ body: createOrderValidation }), createOrder);

router.get(
  '/',
  protect,
  validateRequest({ query: listOrdersQuery }),
  listOrders,
);
router.get('/counts', protect, orderCounts);
router.get(
  '/:id',
  protect,
  validateRequest({ params: orderIdParams }),
  getOrder,
);
router.patch(
  '/:id',
  protect,
  validateRequest({ params: orderIdParams, body: updateOrderValidation }),
  updateOrder,
);
router.patch(
  '/:id/status',
  protect,
  validateRequest({ params: orderIdParams, body: updateStatusValidation }),
  updateOrderStatus,
);

export default router;
