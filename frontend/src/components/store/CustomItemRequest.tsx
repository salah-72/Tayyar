import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PencilLine } from "lucide-react";
import { toast } from "sonner";
import { cart } from "@/lib/cart";
import { cn } from "@/lib/utils";

/**
 * "Order anything you need" — adds a free-text `custom` line to the cart (priced by the store after buying).
 * Shared by the home page, the categories page and the cart. Use `key` to reset it when `defaultText` changes.
 */
export function CustomItemRequest({
  defaultText = "",
  defaultOpen = false,
  className,
}: {
  defaultText?: string;
  defaultOpen?: boolean;
  className?: string;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(defaultOpen);
  const [text, setText] = useState(defaultText);
  const [note, setNote] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={cn("flex w-full items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary-soft/40 p-4 text-start", className)}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <PencilLine className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-primary-deep">عايز حاجة مش موجودة؟</p>
          <p className="text-xs text-muted-foreground">اكتبها وإحنا نشتريهالك، وسعرها يتحسب بعد الشراء</p>
        </div>
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim().length < 2) {
          toast.error("اكتب اسم الصنف");
          return;
        }
        cart.addCustom(text.trim(), note.trim() || undefined);
        setText("");
        setNote("");
        setOpen(false);
        toast.success("اتضاف للسلة", { action: { label: "افتح السلة", onClick: () => void navigate({ to: "/cart" }) } });
      }}
      className={cn("space-y-2 rounded-2xl bg-card p-4 shadow-card", className)}
    >
      <p className="text-sm font-semibold">اطلب أي حاجة محتاجها</p>
      <input
        autoFocus={!defaultOpen}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={200}
        placeholder="مثال: ٢ كيلو مانجا عويسي"
        className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={200}
        placeholder="ملاحظة (اختياري)"
        className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
      />
      <div className="flex gap-2">
        <button type="submit" className="h-10 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
          أضف للسلة
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-xl px-4 text-sm text-muted-foreground">
          إلغاء
        </button>
      </div>
    </form>
  );
}
