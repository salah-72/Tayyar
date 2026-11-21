import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUpLeft, Plane } from "lucide-react";
import { toast } from "sonner";
import { cart } from "@/lib/cart";
import { cn } from "@/lib/utils";

export function CustomItemRequest({
  defaultText = "",
  className,
}: {
  defaultText?: string;
  defaultOpen?: boolean;
  className?: string;
}) {
  const navigate = useNavigate();
  const [text, setText] = useState(defaultText);
  const [note, setNote] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const hasText = text.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim().length < 2) {
          toast.error("اكتب اسم الصنف");
          inputRef.current?.focus();
          return;
        }
        cart.addCustom(text.trim(), note.trim() || undefined);
        setText("");
        setNote("");
        toast.success("اتضاف للسلة", {
          action: { label: "افتح السلة", onClick: () => void navigate({ to: "/cart" }) },
        });
      }}
      className={cn(
        // نفس لون كروت المنتجات
        "rounded-2xl border border-border bg-[oklch(0.955_0.012_145)] p-4 transition-colors focus-within:border-primary/50",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Plane className="size-5 rtl:-scale-x-100" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-foreground sm:text-base">
            مش لاقي اللي عايزه؟ اكتبه هنا وهنشتريهولك
          </h4>
        </div>
      </div>

      {/* حقل مدمج مع الزر جواه */}
      <div className="mt-3.5 flex items-center gap-1.5 rounded-xl border border-border bg-card p-1.5 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          aria-label="اسم الصنف اللي عايزه"
          placeholder="اكتب اسم الصنف هنا…"
          className="h-9 min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-deep active:scale-95"
        >
          <span>ضيفه للسلة</span>
          <ArrowUpLeft className="size-3.5" />
        </button>
      </div>

      {hasText && (
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          aria-label="ملاحظة"
          placeholder="ملاحظة (اختياري): الماركة، الحجم…"
          className="mt-2 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs outline-none transition-colors focus:border-primary"
        />
      )}
    </form>
  );
}
