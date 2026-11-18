import type { OrderPricing } from "@/lib/api/types";
import { formatMoney } from "@/lib/money";

export function PricingSummary({
  pricing,
  isEstimated,
  needsPricing,
  showDelivery = true,
}: {
  pricing: OrderPricing;
  isEstimated?: boolean;
  needsPricing?: boolean;
  showDelivery?: boolean;
}) {
  return (
    <div className="space-y-2 text-sm">
      <Row label="المنتجات" value={formatMoney(pricing.grossMinor)} />
      {pricing.productDiscountMinor > 0 && (
        <Row label="خصم المنتجات" value={`- ${formatMoney(pricing.productDiscountMinor)}`} tone="sale" />
      )}
      {pricing.invoiceDiscountMinor > 0 && (
        <Row label={pricing.discountLabel ?? "خصم الفاتورة"} value={`- ${formatMoney(pricing.invoiceDiscountMinor)}`} tone="sale" />
      )}
      {pricing.serviceFeeMinor > 0 && <Row label="رسوم خدمة المطاعم" value={formatMoney(pricing.serviceFeeMinor)} />}
      {showDelivery && (
        <Row
          label="التوصيل"
          value={
            pricing.deliveryFeeMinor == null
              ? "حسب البلد"
              : pricing.freeDeliveryApplied || pricing.deliveryFeeMinor === 0
                ? "مجاني"
                : formatMoney(pricing.deliveryFeeMinor)
          }
          tone={pricing.freeDeliveryApplied ? "success" : undefined}
        />
      )}
      <div className="flex items-center justify-between border-t pt-3 text-base font-bold">
        <span>الإجمالي{isEstimated ? " (تقريبي)" : ""}</span>
        <span className="tabular-nums text-primary-deep">{formatMoney(pricing.totalMinor)}</span>
      </div>
      {isEstimated && <p className="text-xs text-muted-foreground">فيه أصناف بالوزن، السعر النهائي بيتحدد بعد الوزن الفعلي.</p>}
      {needsPricing && <p className="text-xs text-muted-foreground">الأصناف اللي كتبتها بإيدك هيتحسب سعرها بعد الشراء.</p>}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "sale" | "success" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={tone === "sale" ? "font-medium text-sale tabular-nums" : tone === "success" ? "font-medium text-success" : "font-medium tabular-nums"}>
        {value}
      </span>
    </div>
  );
}
