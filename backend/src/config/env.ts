import dotenv from 'dotenv';
dotenv.config();

const env = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  REFRESH_TOKEN_KEY: process.env.REFRESH_TOKEN_KEY,
  ACCESS_TOKEN_KEY: process.env.ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_EXPIRED_IN: process.env.REFRESH_TOKEN_EXPIRED_IN,
  ACCESS_TOKEN_EXPIRED_IN: process.env.ACCESS_TOKEN_EXPIRED_IN,
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE,
  CLIENT_URL: process.env.CLIENT_URL,
  BRIDGE_SECRET: process.env.BRIDGE_SECRET,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  TIMEZONE: process.env.TIMEZONE || 'Africa/Cairo',
};

export default env;
