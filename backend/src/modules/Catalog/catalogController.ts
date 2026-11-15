import { Request, Response } from 'express';
import catchAsync from '../../common/utils/catchAsync';
import { sendOk } from '../../common/utils/respond';
import { catalogService } from './catalogService';

export const getCatalog = catchAsync(async (_req: Request, res: Response) => {
  const catalog = await catalogService.get();
  res.set('Cache-Control', 'public, max-age=20, stale-while-revalidate=60');
  sendOk(res, 200, catalog);
});
