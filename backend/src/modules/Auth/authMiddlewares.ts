import rateLimit from 'express-rate-limit';
import appError from '../../common/utils/appError';
import catchAsync from '../../common/utils/catchAsync';
import { prisma } from '../../config/postgres';
import { Request, Response, NextFunction } from 'express';
import { rateLimitKey } from '../../common/middlewares/clientIp';

export const checkNoOfAdmins = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const admins = await prisma.admin.count();
    if (admins <= 1) return next(new appError('You are the only admin', 400));

    next();
  },
);

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: rateLimitKey,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    status: 'fail',
    message: 'Too many login attempts, please try again after 15 minutes',
  },
});
