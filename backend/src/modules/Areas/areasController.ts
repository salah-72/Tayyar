import { Request, Response } from 'express';
import catchAsync from '../../common/utils/catchAsync';
import { areasService } from './areasService';
import type { ListAreasQuery } from './areasValidation';

const ok = (res: Response, code: number, data: object) =>
  res.status(code).json({ success: true, status: 'success', data });

export const listAreas = catchAsync(async (req: Request, res: Response) => {
  const areas = await areasService.list(req.query as unknown as ListAreasQuery);
  ok(res, 200, { areas });
});

export const getArea = catchAsync(async (req: Request, res: Response) => {
  ok(res, 200, { area: await areasService.get(String(req.params.id)) });
});

export const createArea = catchAsync(async (req: Request, res: Response) => {
  ok(res, 201, { area: await areasService.create(req.body) });
});

export const updateArea = catchAsync(async (req: Request, res: Response) => {
  ok(res, 200, {
    area: await areasService.update(String(req.params.id), req.body),
  });
});

export const archiveArea = catchAsync(async (req: Request, res: Response) => {
  await areasService.archive(String(req.params.id));
  res.status(204).send();
});

export const restoreArea = catchAsync(async (req: Request, res: Response) => {
  ok(res, 200, { area: await areasService.restore(String(req.params.id)) });
});
