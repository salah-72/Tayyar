import { Router } from 'express';
import { validateRequest } from '../../common/middlewares/validation';
import { idParams } from '../../common/utils/idParam';
import { protect } from '../Auth/authController';
import {
  removeImage,
  removeLogo,
  setImage,
  setLogo,
} from './uploadsController';
import { singleImage } from './uploadsMiddleware';

const router = Router();
const params = validateRequest({ params: idParams });

for (const entity of ['products', 'categories', 'stores'] as const) {
  router.post(
    `/${entity}/:id/image`,
    protect,
    params,
    singleImage,
    setImage(entity),
  );
  router.delete(`/${entity}/:id/image`, protect, params, removeImage(entity));
}

router.post('/settings/logo', protect, singleImage, setLogo);
router.delete('/settings/logo', protect, removeLogo);

export default router;
