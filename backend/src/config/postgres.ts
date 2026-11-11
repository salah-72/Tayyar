import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import env from './env';

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 300_000,
  connectionTimeoutMillis: 10_000,
});
const prisma = new PrismaClient({ adapter });

export const testPostgresConnection = async () => {
  try {
    await prisma.$connect();
    console.log('Prisma connected successfully to the database');
  } catch (err) {
    console.error('Prisma connection to the database failed: ', err);
    throw err;
  }
};

export const warmUpPool = async () => {
  await Promise.all(Array.from({ length: 5 }, () => prisma.admin.count()));
};

export { prisma };
