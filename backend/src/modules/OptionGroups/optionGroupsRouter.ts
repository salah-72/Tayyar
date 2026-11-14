import { Router } from 'express';
import { validateRequest } from '../../common/middlewares/validation';
import { protect } from '../Auth/authController';
import {
  addOption,
  createGroup,
  deleteGroup,
  deleteOption,
  getGroup,
  listGroups,
  updateGroup,
  updateOption,
} from './optionGroupsController';
import {
  createGroupValidation,
  createOptionValidation,
  groupIdParams,
  listGroupsQuery,
  optionIdParams,
  updateGroupValidation,
  updateOptionValidation,
} from './optionGroupsValidation';

const router = Router();

router.use(protect);

router.get('/', validateRequest({ query: listGroupsQuery }), listGroups);
router.post('/', validateRequest({ body: createGroupValidation }), createGroup);
router.get('/:id', validateRequest({ params: groupIdParams }), getGroup);
router.patch(
  '/:id',
  validateRequest({ params: groupIdParams, body: updateGroupValidation }),
  updateGroup,
);
router.delete('/:id', validateRequest({ params: groupIdParams }), deleteGroup);

router.post(
  '/:id/options',
  validateRequest({ params: groupIdParams, body: createOptionValidation }),
  addOption,
);
router.patch(
  '/:id/options/:optionId',
  validateRequest({ params: optionIdParams, body: updateOptionValidation }),
  updateOption,
);
router.delete(
  '/:id/options/:optionId',
  validateRequest({ params: optionIdParams }),
  deleteOption,
);

export default router;
