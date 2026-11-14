import { Request, Response } from 'express';
import catchAsync from '../../common/utils/catchAsync';
import { sendOk } from '../../common/utils/respond';
import { storesService } from './storesService';
import type { ListStoresQuery } from './storesValidation';

export const listStores = catchAsync(async (req: Request, res: Response) => {
  const stores = await storesService.list(req.query as unknown as ListStoresQuery);
  sendOk(res, 200, { stores });
});

export const getStore = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, { store: await storesService.get(String(req.params.id)) });
});

export const createStore = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 201, { store: await storesService.create(req.body) });
});

export const updateStore = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, {
    store: await storesService.update(String(req.params.id), req.body),
  });
});

export const archiveStore = catchAsync(async (req: Request, res: Response) => {
  await storesService.archive(String(req.params.id));
  res.status(204).send();
});

export const restoreStore = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, { store: await storesService.restore(String(req.params.id)) });
});
