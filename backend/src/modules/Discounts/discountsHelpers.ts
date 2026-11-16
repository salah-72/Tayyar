import { isDiscountLive } from '../Pricing/pricingAdapters';
import type { DiscountRow } from '../Pricing/pricingAdapters';

export type DiscountStatus =
  | 'LIVE'
  | 'DISABLED'
  | 'SCHEDULED'
  | 'EXPIRED'
  | 'EXHAUSTED';
export interface RuleError {
  code: string;
  message: string;
}

export function discountStatus(d: DiscountRow, now: Date): DiscountStatus {
  if (isDiscountLive(d, now)) return 'LIVE';
  if (!d.isActive) return 'DISABLED';
  if (d.startsAt && d.startsAt > now) return 'SCHEDULED';
  if (d.endsAt && d.endsAt <= now) return 'EXPIRED';
  if (d.maxUses !== null && d.usedCount >= d.maxUses) return 'EXHAUSTED';
  return 'DISABLED';
}

export interface DiscountState {
  kind: 'PERCENT' | 'FIXED';
  value: number;
  minSubtotalMinor: number;
  maxDiscountMinor: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  maxUses: number | null;
}

export const normalizeDiscountState = <T extends DiscountState>(s: T): T =>
  s.kind === 'FIXED' ? { ...s, maxDiscountMinor: null } : s;

export function discountRuleError(
  s: DiscountState,
  usedCount = 0,
): RuleError | null {
  if (s.kind === 'PERCENT' && (s.value < 1 || s.value > 10000))
    return {
      code: 'BAD_PERCENT',
      message: 'النسبة لازم تكون من 0.01% لحد 100%',
    };
  if (s.kind === 'FIXED' && s.value <= 0)
    return { code: 'BAD_AMOUNT', message: 'قيمة الخصم لازم تكون أكبر من صفر' };
  if (s.maxDiscountMinor !== null && s.maxDiscountMinor <= 0)
    return { code: 'BAD_CAP', message: 'سقف الخصم لازم يكون أكبر من صفر' };
  if (s.startsAt && s.endsAt && s.endsAt <= s.startsAt)
    return {
      code: 'BAD_DATES',
      message: 'تاريخ النهاية لازم يكون بعد البداية',
    };
  if (s.maxUses !== null && s.maxUses < 1)
    return {
      code: 'BAD_MAX_USES',
      message: 'أقصى عدد استخدامات لازم يكون 1 أو أكتر',
    };
  if (s.maxUses !== null && s.maxUses < usedCount)
    return {
      code: 'MAX_USES_BELOW_USED',
      message: `الخصم اتستخدم ${usedCount} مرة، مينفعش تخلّي الحد الأقصى أقل من كده`,
    };
  return null;
}

export const toDiscountDto = (d: DiscountRow, now: Date) => ({
  id: d.id,
  name: d.name,
  type: d.code ? ('CODE' as const) : ('AUTOMATIC' as const),
  code: d.code,
  kind: d.kind,
  value: d.value,
  minSubtotalMinor: d.minSubtotalMinor,
  maxDiscountMinor: d.maxDiscountMinor,
  isActive: d.isActive,
  startsAt: d.startsAt ? d.startsAt.toISOString() : null,
  endsAt: d.endsAt ? d.endsAt.toISOString() : null,
  maxUses: d.maxUses,
  usedCount: d.usedCount,
  remainingUses:
    d.maxUses === null ? null : Math.max(0, d.maxUses - d.usedCount),
  status: discountStatus(d, now),
});

export type DiscountDto = ReturnType<typeof toDiscountDto>;
