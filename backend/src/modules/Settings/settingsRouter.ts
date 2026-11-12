import { Router } from 'express';
import { validateRequest } from '../../common/middlewares/validation';
import { protect } from '../Auth/authController';
import { getSettings, updateSettings } from './settingsController';
import { updateSettingsValidation } from './settingsValidation';

const router = Router();

router.use(protect);

router.get('/', getSettings);
router.patch(
  '/',
  validateRequest({ body: updateSettingsValidation }),
  updateSettings,
);

export default router;
