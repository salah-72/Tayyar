import { Minus, Plus, Trash2 } from "lucide-react";
import { formatQty } from "@/lib/money";
import { cn } from "@/lib/utils";

export function QtyStepper({
  value,
  unitLabel,
  onInc,
  onDec,
  canTrash = true,
  size = "md",
  className,
}: {
  value: number;
  unitLabel?: string;
  onInc: () => void;
  onDec: () => void;
  canTrash?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const btn = size === "sm" ? "size-8" : "size-10";
  const atMin = canTrash;
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border bg-card",
        size === "sm" ? "h-9 gap-1 px-0.5" : "h-11 gap-2 px-1",
        className,
      )}
    >
      <button type="button" onClick={onInc} aria-label="زوّد" className={cn("grid place-items-center rounded-lg text-primary hover:bg-primary-soft", btn)}>
        <Plus className="size-4" />
      </button>
      <span className="min-w-8 text-center text-sm font-bold tabular-nums">
        {formatQty(value)}
        {unitLabel && <span className="ms-1 text-xs font-normal text-muted-foreground">{unitLabel}</span>}
      </span>
      <button type="button" onClick={onDec} aria-label="قلّل" className={cn("grid place-items-center rounded-lg hover:bg-muted", btn, atMin ? "text-sale" : "text-foreground")}>
        {atMin ? <Trash2 className="size-4" /> : <Minus className="size-4" />}
      </button>
    </div>
  );
}
