import { Request, Response } from 'express';
import catchAsync from '../../common/utils/catchAsync';
import { settingsService } from './settingsService';

export const getSettings = catchAsync(async (_req: Request, res: Response) => {
  const settings = await settingsService.get();
  res.status(200).json({ success: true, status: 'success', data: { settings } });
});

export const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const settings = await settingsService.update(req.body);
  res.status(200).json({ success: true, status: 'success', data: { settings } });
});
