import { cn } from "@/lib/utils";

/** Small "≈ تقريبي" pill for prices that are settled after the actual weighing. */
export function ApproxBadge({ className }: { className?: string }) {
  return (
    <div
      title="السعر النهائي بيتحدد بعد الوزن الفعلي"
      className={cn(
        "inline-flex items-center rounded-full bg-highlight-soft px-1.5 py-0.5 text-[10px] font-semibold leading-none text-highlight-foreground",
        className,
      )}
    >
      ≈ تقريبي
    </div>
  );
}
