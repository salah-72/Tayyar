import { Request, Response } from 'express';
import catchAsync from '../../common/utils/catchAsync';
import { sendOk } from '../../common/utils/respond';
import { optionGroupsService } from './optionGroupsService';
import type { ListGroupsQuery } from './optionGroupsValidation';

export const listGroups = catchAsync(async (req: Request, res: Response) => {
  const groups = await optionGroupsService.list(req.query as unknown as ListGroupsQuery);
  sendOk(res, 200, { groups });
});

export const getGroup = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, { group: await optionGroupsService.get(String(req.params.id)) });
});

export const createGroup = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 201, { group: await optionGroupsService.create(req.body) });
});

export const updateGroup = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, {
    group: await optionGroupsService.update(String(req.params.id), req.body),
  });
});

export const deleteGroup = catchAsync(async (req: Request, res: Response) => {
  await optionGroupsService.remove(String(req.params.id));
  res.status(204).send();
});

export const addOption = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 201, {
    option: await optionGroupsService.addOption(String(req.params.id), req.body),
  });
});

export const updateOption = catchAsync(async (req: Request, res: Response) => {
  sendOk(res, 200, {
    option: await optionGroupsService.updateOption(
      String(req.params.id),
      String(req.params.optionId),
      req.body,
    ),
  });
});

export const deleteOption = catchAsync(async (req: Request, res: Response) => {
  await optionGroupsService.removeOption(
    String(req.params.id),
    String(req.params.optionId),
  );
  res.status(204).send();
});
