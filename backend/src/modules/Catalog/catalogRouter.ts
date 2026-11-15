import { Router } from 'express';
import { getCatalog } from './catalogController';

const router = Router();

router.get('/', getCatalog);

export default router;
