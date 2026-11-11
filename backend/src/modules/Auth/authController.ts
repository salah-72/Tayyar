import appError from '../../common/utils/appError';
import catchAsync from '../../common/utils/catchAsync';
import { prisma } from '../../config/postgres';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { generateAccessToken, generateRefreshToken } from './authFunctions';
import env from '../../config/env';
import jwt from 'jsonwebtoken';

const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

const refreshCookie = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production' || env.COOKIE_SAMESITE === 'none',
  sameSite: env.COOKIE_SAMESITE as 'strict' | 'lax' | 'none',
  path: '/auth',
} as const;

const setRefreshCookie = (res: Response, token: string) => {
  const { exp } = jwt.decode(token) as { exp: number };
  res.cookie('refreshToken', token, {
    ...refreshCookie,
    maxAge: exp * 1000 - Date.now(),
  });
};

export const createAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;
    const adminExist = await prisma.admin.findUnique({
      where: { username },
      select: { id: true },
    });

    if (adminExist) return next(new appError('this username is used', 409));

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.admin.create({
      data: { username, password: hashedPassword },
    });

    res.status(201).json({ success: true, status: 'success' });
  },
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;
    const user = await prisma.admin.findUnique({
      where: {
        username,
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new appError('Invalid username or password', 401));
    }

    const refreshToken = generateRefreshToken(user.id);
    const accessToken = generateAccessToken(user.id);

    await prisma.refreshToken.upsert({
      where: { adminId: user.id },
      update: { token: hashToken(refreshToken) },
      create: { adminId: user.id, token: hashToken(refreshToken) },
    });

    setRefreshCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      status: 'success',
      user: { id: user.id, username: user.username },
      accessToken,
    });
  },
);

interface JwtPayload extends jwt.JwtPayload {
  id: number;
}

export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer '))
      return next(new appError('Access denied, no token provided', 401));

    const token = auth.split(' ')[1];

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, env.ACCESS_TOKEN_KEY as string) as JwtPayload;
    } catch (err) {
      return next(new appError('Invalid or expired token', 401));
    }

    const user = await prisma.admin.findUnique({
      where: { id: payload.id },
      select: { id: true, username: true },
    });

    if (!user) return next(new appError('admin not found', 401));

    req.user = user;
    next();
  },
);

export const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ success: true, status: 'success', user: req.user });
  },
);

export const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies?.refreshToken as string | undefined;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: hashToken(refreshToken) },
      });
    }

    res.clearCookie('refreshToken', refreshCookie);

    res.status(200).json({
      success: true,
      status: 'success',
      message: 'logout successfully',
    });
  },
);

export const refreshAccessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken =
      (req.cookies?.refreshToken as string | undefined) ||
      (req.body?.refreshToken as string | undefined);
    if (!refreshToken)
      return next(new appError('refresh token not exist', 401));

    let payload: JwtPayload;
    try {
      payload = jwt.verify(
        refreshToken,
        env.REFRESH_TOKEN_KEY as string,
      ) as JwtPayload;
    } catch (err) {
      return next(new appError('Invalid or expired token', 401));
    }

    const stored = await prisma.refreshToken.findFirst({
      where: { token: hashToken(refreshToken), adminId: payload.id },
    });
    if (!stored)
      return next(new appError('refresh token not exist, log in again', 401));

    const admin = await prisma.admin.findUnique({
      where: { id: payload.id },
      select: { id: true, username: true },
    });
    if (!admin) return next(new appError('User no longer exists', 401));

    res.status(200).json({
      success: true,
      status: 'success',
      user: admin,
      accessToken: generateAccessToken(admin.id),
    });
  },
);

export const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { oldPassword, newPassword } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { id: req.user!.id },
    });
    if (!admin || !(await bcrypt.compare(oldPassword, admin.password))) {
      return next(new appError('Old password is wrong', 401));
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedNewPassword },
    });

    await prisma.refreshToken.deleteMany({ where: { adminId: admin.id } });
    res.clearCookie('refreshToken', refreshCookie);

    res.status(200).json({
      success: true,
      status: 'success',
      message: 'password changed successfully, please log in again',
    });
  },
);

export const deleteAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const adminId = Number(req.params.adminId);

    await prisma.admin.delete({ where: { id: adminId } });

    res.status(204).send();
  },
);
export const getAdmins = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const admins = await prisma.admin.findMany({
      select: { id: true, username: true },
    });
    res.status(200).json({
      success: true,
      status: 'success',
      data: { admins },
    });
  },
);
