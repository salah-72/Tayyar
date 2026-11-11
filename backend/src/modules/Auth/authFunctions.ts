import env from './../../config/env';
import jwt from 'jsonwebtoken';

export const generateAccessToken = (id: number): string => {
  return jwt.sign({ id }, env.ACCESS_TOKEN_KEY as string, {
    expiresIn: env.ACCESS_TOKEN_EXPIRED_IN as jwt.SignOptions['expiresIn'],
  });
};

export const generateRefreshToken = (id: number): string => {
  return jwt.sign({ id }, env.REFRESH_TOKEN_KEY as string, {
    expiresIn: env.REFRESH_TOKEN_EXPIRED_IN as jwt.SignOptions['expiresIn'],
  });
};
