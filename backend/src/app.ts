import express, { urlencoded } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import authRouter from './modules/Auth/authRouter';
import errorHandler, { notFound } from './common/middlewares/errorHandler';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import env from './config/env';
import { buildSwaggerDocument } from './config/swagger';
import settingsRouter from './modules/Settings/settingsRouter';
import areasRouter from './modules/Areas/areasRouter';
import storesRouter from './modules/Stores/storesRouter';
import categoriesRouter from './modules/Categories/categoriesRouter';
import optionGroupsRouter from './modules/OptionGroups/optionGroupsRouter';
import productsRouter from './modules/Products/productsRouter';
import uploadsRouter from './modules/Uploads/uploadsRouter';
import catalogRouter from './modules/Catalog/catalogRouter';
import ordersRouter from './modules/Orders/ordersRouter';
import discountsRouter from './modules/Discounts/discountsRouter';
import accountingRouter from './modules/Accounting/accountingRouter';

const app = express();

const swaggerDocument = buildSwaggerDocument();

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
app.use('/catalog', catalogRouter);
app.use(uploadsRouter);
app.use('/settings', settingsRouter);
app.use('/areas', areasRouter);
app.use('/stores', storesRouter);
app.use('/categories', categoriesRouter);
app.use('/option-groups', optionGroupsRouter);
app.use('/products', productsRouter);
app.use('/orders', ordersRouter);
app.use('/discounts', discountsRouter);
app.use('/accounting', accountingRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
