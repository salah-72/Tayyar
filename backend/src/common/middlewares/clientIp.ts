import type { NextFunction, Request, Response } from 'express';
import { ipKeyGenerator } from 'express-rate-limit';
import env from '../../config/env';
import { resolveClientIp } from '../utils/clientIpCore';

export const attachClientIp = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { ip, viaBridge } = resolveClientIp({
    secret: env.BRIDGE_SECRET,
    headerSecret: req.headers['x-bridge-secret'],
    headerIp: req.headers['x-client-ip'],
    fallbackIp: req.ip ?? '',
  });
  res.locals.clientIp = ip;
  res.locals.viaBridge = viaBridge;
  next();
};

export const rateLimitKey = (req: Request, res: Response): string =>
  ipKeyGenerator(res.locals.clientIp ?? req.ip ?? '');
