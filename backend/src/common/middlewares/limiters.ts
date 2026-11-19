import rateLimit from 'express-rate-limit';
import { rateLimitKey } from './clientIp';

const fail = (message: string, code: string) => ({
  success: false,
  status: 'fail',
  message,
  code,
});

/**
 * /orders/quote بيتنادى مع كل تعديل في السلة، فالحد واسع ومخصوص للتسعير بس.
 * (الـ limiter العام 300/دقيقة لسه شغال فوقه)
 */
export const quoteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 90,
  keyGenerator: rateLimitKey,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: fail('طلبات كتير ورا بعض، استنى دقيقة وجرّب تاني', 'RATE_LIMITED'),
});

/**
 * إنشاء أوردر: حد لكل IP. الرقم واسع شوية لأن شبكات الموبايل بتخلي ناس كتير تشارك نفس الـ IP.
 * الحد الأدق (لكل رقم موبايل) في ordersService.
 */
export const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  keyGenerator: rateLimitKey,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: fail(
    'عملت طلبات كتير في وقت قصير، جرّب بعد شوية',
    'ORDER_RATE_LIMITED',
  ),
});

/**
 * تخمين أكواد الخصم: بيعدّ المحاولات الفاشلة بس (الكود الغلط بيرجّع 422)،
 * وبيتخطى أي طلب مفيهوش كود أصلًا.
 */
export const discountGuessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  keyGenerator: rateLimitKey,
  skip: (req) => !req.body?.discountCode,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: fail(
    'جرّبت أكواد كتير غلط، استنى شوية وجرّب تاني',
    'DISCOUNT_RATE_LIMITED',
  ),
});
