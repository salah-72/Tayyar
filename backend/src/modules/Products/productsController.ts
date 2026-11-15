import { Request, Response } from 'express';
import catchAsync from '../../common/utils/catchAsync';
import { sendOk } from '../../common/utils/respond';
import { productsService } from './productsService';
import type { ListProductsQuery } from './productsValidation';

export const listProducts = catchAsync(async (req: Request, res: Response) => {
  const { products, meta } = await productsService.list(
    req.query as unknown as ListProductsQuery,
  );
  sendOk(res, 200, { products }, meta);
});

export const getProduct = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, { product: await productsService.get(String(req.params.id)) });
});

export const createProduct = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 201, { product: await productsService.create(req.body) });
});

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, {
    product: await productsService.update(String(req.params.id), req.body),
  });
});

export const archiveProduct = catchAsync(async (req: Request, res: Response) => {
  await productsService.archive(String(req.params.id));
  res.status(204).send();
});

export const restoreProduct = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, { product: await productsService.restore(String(req.params.id)) });
});

export const bulkDiscount = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, await productsService.bulkDiscount(req.body));
});
