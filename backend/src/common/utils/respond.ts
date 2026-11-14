import type { Response } from 'express';

/** شكل الرد الموحّد (زي بتاع الـ Auth): { success, status, data } + meta اختياري للـ pagination */
export const sendOk = (res: Response, code: number, data: object, meta?: object) =>
  res.status(code).json({ success: true, status: 'success', data, ...(meta && { meta }) });
