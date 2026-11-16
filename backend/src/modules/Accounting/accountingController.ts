import { Request, Response } from 'express';
import catchAsync from '../../common/utils/catchAsync';
import { sendOk } from '../../common/utils/respond';
import { accountingService } from './accountingService';
import type { DayListQuery, StoreRangeQuery } from './accountingValidation';

export const getDayList = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, await accountingService.dayList(req.query as unknown as DayListQuery));
});

export const getStoreRange = catchAsync(async (req: Request, res: Response) => {
  sendOk(
    res,
    200,
    await accountingService.storeRange(
      String(req.params.storeId),
      req.query as unknown as StoreRangeQuery,
    ),
  );
});

export const settleDay = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 201, { settlement: await accountingService.settle(req.body) });
});

export const unsettleDay = catchAsync(async (req: Request, res: Response) => {
  await accountingService.unsettle(String(req.params.id));
  res.status(204).send();
});
