import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/appError';

const isDev = () => process.env.NODE_ENV === 'development';

const fromPrisma = (err: any): AppError | null => {
  if (err?.name !== 'PrismaClientKnownRequestError') return null;
  switch (err.code) {
    case 'P2002':
      return new AppError(
        'A record with the same unique value already exists',
        409,
      );
    case 'P2003':
      return new AppError('This record is used by other records', 409);
    case 'P2025':
      return new AppError('Record not found', 404);
    case 'P2034':
      return new AppError('Two requests collided: please try again', 409);
    case 'P2028':
      return new AppError('The database was busy: please try again', 503);
    default:
      return null;
  }
};

const fromExpress = (err: any): AppError | null => {
  if (err?.type === 'entity.parse.failed')
    return new AppError('Request body is not valid JSON', 400);
  if (err?.type === 'entity.too.large')
    return new AppError('Request body is too large', 413);
  return null;
};

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
};

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const known =
    err instanceof AppError ? err : (fromPrisma(err) ?? fromExpress(err));

  if (known) {
    return res.status(known.statusCode).json({
      success: false,
      status: known.status,
      message: known.message,
      ...(known.code && { code: known.code }),
      ...(known.details !== undefined && { details: known.details }),
      ...(isDev() && { stack: err?.stack }),
    });
  }

  console.error(`[${req.method} ${req.originalUrl}]`, err);
  res.status(500).json({
    success: false,
    status: 'error',
    message: isDev()
      ? (err?.message ?? 'Something went wrong!')
      : 'Something went wrong!',
    ...(isDev() && { stack: err?.stack }),
  });
};

export default errorHandler;
