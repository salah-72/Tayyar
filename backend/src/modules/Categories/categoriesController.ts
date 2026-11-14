import { Request, Response } from 'express';
import catchAsync from '../../common/utils/catchAsync';
import { sendOk } from '../../common/utils/respond';
import { categoriesService } from './categoriesService';
import type { ListCategoriesQuery } from './categoriesValidation';

export const listCategories = catchAsync(
  async (req: Request, res: Response) => {
    const categories = await categoriesService.list(
      req.query as unknown as ListCategoriesQuery,
    );
    sendOk(res, 200, { categories });
  },
);

export const getCategory = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, {
    category: await categoriesService.get(String(req.params.id)),
  });
});

export const createCategory = catchAsync(
  async (req: Request, res: Response) => {
    sendOk(res, 201, { category: await categoriesService.create(req.body) });
  },
);

export const updateCategory = catchAsync(
  async (req: Request, res: Response) => {
    sendOk(res, 200, {
      category: await categoriesService.update(String(req.params.id), req.body),
    });
  },
);

export const archiveCategory = catchAsync(
  async (req: Request, res: Response) => {
    await categoriesService.archive(String(req.params.id));
    res.status(204).send();
  },
);

export const restoreCategory = catchAsync(
  async (req: Request, res: Response) => {
    sendOk(res, 200, {
      category: await categoriesService.restore(String(req.params.id)),
    });
  },
);
