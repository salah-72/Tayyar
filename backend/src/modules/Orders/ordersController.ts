import { Request, Response } from 'express';
import catchAsync from '../../common/utils/catchAsync';
import { sendOk } from '../../common/utils/respond';
import { ordersService } from './ordersService';
import type { ListOrdersQuery } from './ordersValidation';

export const quoteOrder = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, await ordersService.quote(req.body));
});

export const createOrder = catchAsync(async (req: Request, res: Response) => {
  const { duplicate, ...data } = await ordersService.create(req.body);
  sendOk(res, duplicate ? 200 : 201, { ...data, duplicate });
});

export const listOrders = catchAsync(async (req: Request, res: Response) => {
  const { orders, meta } = await ordersService.list(
    req.query as unknown as ListOrdersQuery,
  );
  sendOk(res, 200, { orders }, meta);
});

export const orderCounts = catchAsync(async (_req: Request, res: Response) => {
  sendOk(res, 200, { counts: await ordersService.counts() });
});

export const getOrder = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, { order: await ordersService.get(String(req.params.id)) });
});

export const updateOrderStatus = catchAsync(
  async (req: Request, res: Response) => {
    sendOk(res, 200, {
      order: await ordersService.updateStatus(String(req.params.id), req.body),
    });
  },
);

export const updateOrder = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, {
    order: await ordersService.update(String(req.params.id), req.body),
  });
});
