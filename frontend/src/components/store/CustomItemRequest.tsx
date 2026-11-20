import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plane } from "lucide-react";
import { toast } from "sonner";
import { cart } from "@/lib/cart";
import { cn } from "@/lib/utils";

/**
 * "اطلب أي حاجة": بيضيف سطر مكتوب بإيد العميل للسلة (سعره بيتحسب بعد الشراء).
 * الحقل ظاهر دايمًا، علشان العميل يفهم إنه يقدر يكتب من غير ما يدوس على حاجة الأول.
 * بنستخدم الكومبوننت في الرئيسية وصفحة الأقسام والسلة. استخدم `key` لإعادة ضبطه لما `defaultText` يتغيّر.
 */
export function CustomItemRequest({
  defaultText = "",
  className,
}: {
  defaultText?: string;
  /** مابقاش له تأثير: الحقل ظاهر دايمًا. سايبينه علشان الاستخدام القديم في الصفحات ما يتكسرش */
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
        toast.success("اتضاف للسلة", { action: { label: "افتح السلة", onClick: () => void navigate({ to: "/cart" }) } });
      }}
      className={cn("rounded-2xl border border-highlight/40 bg-highlight-soft/60 p-4", className)}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-highlight text-highlight-foreground">
          <Plane className="size-5 rtl:-scale-x-100" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="font-bold leading-snug">مش لاقي اللي عايزه؟ اطلبه من الطيار</h3>
          <p className="text-xs text-muted-foreground">اكتب أي حاجة وهنشتريهالك، وسعرها بيتحسب بعد الشراء.</p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          aria-label="اسم الصنف اللي عايزه"
          placeholder="اكتب اسم الصنف هنا…"
          className="h-12 min-w-0 flex-1 rounded-xl border bg-card px-3 text-base outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
        />
        <button type="submit" className="h-12 shrink-0 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-deep">
          اطلبها
        </button>
      </div>

      {hasText && (
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          aria-label="ملاحظة"
          placeholder="ملاحظة للطيار (اختياري): الماركة، الحجم…"
          className="mt-2 h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
        />
      )}
    </form>
  );
}
