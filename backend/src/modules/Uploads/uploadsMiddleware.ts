import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import appError from '../../common/utils/appError';
import { MAX_IMAGE_BYTES } from './uploadsHelpers';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 0 },
});

export const singleImage = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE')
        return next(
          new appError('الصورة أكبر من 5 ميجا', 413, 'IMAGE_TOO_LARGE'),
        );
      return next(
        new appError('ابعت صورة واحدة في الحقل file', 400, 'BAD_UPLOAD'),
      );
    }
    next(err);
  });
};
