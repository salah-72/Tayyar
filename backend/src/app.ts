import express, { urlencoded } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import authRouter from './modules/Auth/authRouter';
import errorHandler, { notFound } from './common/middlewares/errorHandler';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import env from './config/env';

const app = express();

const authSwagger = YAML.load(
  path.join(process.cwd(), 'src/docs/auth.swagger.yaml'),
);

const swaggerDocument = {
  ...authSwagger,
  paths: {
    ...authSwagger.paths,
  },
  components: {
    ...authSwagger.components,
    schemas: {
      ...authSwagger.components?.schemas,
    },
  },
};

const limiter = rateLimit({
  limit: 300,
  windowMs: 60000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    status: 'fail',
    message: 'too many requests from same ip, try again later',
  },
});

app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: env.CLIENT_URL!.split(','),
    credentials: true,
  }),
);
app.use(limiter);
app.use(express.json({ limit: '100kb' }));
app.use(urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression({ threshold: 1024 }));

app.get('/', async (req, res) => {
  res.send('welcome');
});

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/auth', authRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
