import type { AdminDiscountKind } from "@/lib/api/admin-types";
import { Input } from "@/components/ui/input";
import { Field } from "./form";
import { cn } from "@/lib/utils";

/** kind: null = inherit (product follows category), "NONE" = explicitly no discount. Value as typed (% or EGP). */
export function DiscountFields({
  kind,
  value,
  onChange,
  allowInherit,
}: {
  kind: AdminDiscountKind;
  value: string;
  onChange: (kind: AdminDiscountKind, value: string) => void;
  allowInherit?: boolean;
}) {
  const opts: { k: AdminDiscountKind; l: string }[] = [
    ...(allowInherit ? [{ k: null, l: "زي القسم" }] : []),
    { k: "NONE", l: "من غير خصم" },
    { k: "PERCENT", l: "نسبة %" },
    { k: "FIXED", l: "مبلغ ثابت" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => (
          <button
            key={String(o.k)}
            type="button"
            onClick={() => onChange(o.k, o.k === "PERCENT" || o.k === "FIXED" ? value : "")}
            className={cn("rounded-xl border px-3 py-2 text-sm font-medium", kind === o.k ? "border-primary bg-primary-soft text-primary-deep" : "bg-card")}
          >
            {o.l}
          </button>
        ))}
      </div>
      {(kind === "PERCENT" || kind === "FIXED") && (
        <Field label={kind === "PERCENT" ? "نسبة الخصم (%)" : "قيمة الخصم (جنيه للوحدة/الكيلو)"}>
          <Input type="number" required min={0.01} step="0.01" max={kind === "PERCENT" ? 100 : undefined} value={value} onChange={(e) => onChange(kind, e.target.value)} />
        </Field>
      )}
    </div>
  );
}

export function discountToForm(kind: AdminDiscountKind, value: number | null) {
  if (kind === "PERCENT") return String((value ?? 0) / 100);
  if (kind === "FIXED") return String((value ?? 0) / 100);
  return "";
}

/** Both PERCENT (bps) and FIXED (piasters) scale by 100 from what the admin types. */
export function discountFromForm(kind: AdminDiscountKind, value: string) {
  if (kind === "PERCENT" || kind === "FIXED") return { discountKind: kind, discountValue: Math.round(Number(value || 0) * 100) };
  return { discountKind: kind, discountValue: null };
}

export function discountText(kind: AdminDiscountKind, value: number | null) {
  if (kind === "PERCENT") return `خصم ${(value ?? 0) / 100}%`;
  if (kind === "FIXED") return `خصم ${(value ?? 0) / 100} ج.م`;
  return null;
}
