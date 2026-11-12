import { Router } from 'express';
import { validateRequest } from '../../common/middlewares/validation';
import { protect } from '../Auth/authController';
import {
  archiveArea,
  createArea,
  getArea,
  listAreas,
  restoreArea,
  updateArea,
} from './areasController';
import {
  areaIdParams,
  createAreaValidation,
  listAreasQuery,
  updateAreaValidation,
} from './areasValidation';

const router = Router();

router.use(protect);

router.get('/', validateRequest({ query: listAreasQuery }), listAreas);
router.post('/', validateRequest({ body: createAreaValidation }), createArea);
router.get('/:id', validateRequest({ params: areaIdParams }), getArea);
router.patch(
  '/:id',
  validateRequest({ params: areaIdParams, body: updateAreaValidation }),
  updateArea,
);
router.delete('/:id', validateRequest({ params: areaIdParams }), archiveArea);
router.post(
  '/:id/restore',
  validateRequest({ params: areaIdParams }),
  restoreArea,
);

export default router;
