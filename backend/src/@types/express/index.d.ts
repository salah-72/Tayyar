import type { Admin } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: Pick<Admin, 'id' | 'username'>;
    }
  }
}

export {};
