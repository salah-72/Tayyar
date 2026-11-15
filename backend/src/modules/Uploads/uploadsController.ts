import { Request, Response } from 'express';
import catchAsync from '../../common/utils/catchAsync';
import { sendOk } from '../../common/utils/respond';
import { uploadsService } from './uploadsService';

type Entity = 'products' | 'categories' | 'stores';

export const setImage = (entity: Entity) =>
  catchAsync(async (req: Request, res: Response) => {
    sendOk(
      res,
      200,
      await uploadsService.setImage(entity, String(req.params.id), req.file),
    );
  });

export const removeImage = (entity: Entity) =>
  catchAsync(async (req: Request, res: Response) => {
    await uploadsService.removeImage(entity, String(req.params.id));
    res.status(204).send();
  });

export const setLogo = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, await uploadsService.setLogo(req.file));
});

export const removeLogo = catchAsync(async (_req: Request, res: Response) => {
  await uploadsService.removeLogo();
  res.status(204).send();
});
