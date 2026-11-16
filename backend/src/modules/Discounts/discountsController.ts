import { Request, Response } from 'express';
import catchAsync from '../../common/utils/catchAsync';
import { sendOk } from '../../common/utils/respond';
import { discountsService } from './discountsService';
import type { ListDiscountsQuery } from './discountsValidation';

export const listDiscounts = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, {
    discounts: await discountsService.list(req.query as unknown as ListDiscountsQuery),
  });
});

export const getDiscount = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, { discount: await discountsService.get(String(req.params.id)) });
});

export const createDiscount = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 201, { discount: await discountsService.create(req.body) });
});

export const updateDiscount = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, {
    discount: await discountsService.update(String(req.params.id), req.body),
  });
});

export const deleteDiscount = catchAsync(async (req: Request, res: Response) => {
  await discountsService.remove(String(req.params.id));
  res.status(204).send();
});
