import 'dotenv/config';
import { prisma, testPostgresConnection, warmUpPool } from './config/postgres';
import env from './config/env';
import app from './app';

const startServer = async () => {
  try {
    await testPostgresConnection();
    await warmUpPool();

    const server = app.listen(env.PORT, () => {
      console.log(`Server is running on port ${env.PORT}`);
    });

    const shutdown = async () => {
      server.close();
      await prisma.$disconnect();
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Failed to startup:', err);
    process.exit(1);
  }
};

startServer();
