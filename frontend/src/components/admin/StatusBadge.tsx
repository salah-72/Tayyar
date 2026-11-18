import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const TONE: Record<OrderStatus, string> = {
  PENDING: "bg-highlight-soft text-highlight-foreground border-highlight/40",
  PREPARING: "bg-info/10 text-info border-info/30",
  OUT_FOR_DELIVERY: "bg-primary-soft text-primary-deep border-primary/30",
  DELIVERED: "bg-success/10 text-success border-success/30",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        TONE[status],
        className,
      )}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
