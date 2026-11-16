import { Request, Response } from 'express';
import catchAsync from '../../common/utils/catchAsync';
import { sendOk } from '../../common/utils/respond';
import { purchasesService } from './purchasesService';
import type { ShoppingListQuery } from './purchasesValidation';

export const getShoppingList = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, await purchasesService.shoppingList(req.query as unknown as ShoppingListQuery));
});

export const markPurchased = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, await purchasesService.mark(req.body));
});
