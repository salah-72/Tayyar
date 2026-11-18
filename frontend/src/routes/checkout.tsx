import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, MessageCircle, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { catalogQuery, useCatalog } from "@/lib/catalog";
import { cart, toPayload, useCart } from "@/lib/cart";
import { useQuote } from "@/lib/quote";
import { api, errorMessage } from "@/lib/api/client";
import { formatMoney } from "@/lib/money";
import type { CreateOrderResult } from "@/lib/api/types";
import { StoreLayout } from "@/components/store/StoreLayout";
import { PricingSummary } from "@/components/store/PricingSummary";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/checkout")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  head: () => ({
    meta: [
      { title: "إتمام الطلب — البيه الطيار" },
      { name: "description", content: "اكتب بياناتك وعنوانك وأكّد الأوردر." },
      { property: "og:title", content: "إتمام الطلب — البيه الطيار" },
      { property: "og:description", content: "اكتب بياناتك وعنوانك وأكّد الأوردر." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function newToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function CheckoutPage() {
  const c = useCatalog();
  const state = useCart();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [areaId, setAreaId] = useState<string>("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [code, setCode] = useState<string | undefined>();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<CreateOrderResult | null>(null);

  // Prefill from the last order (stored with the cart, browser only).
  useEffect(() => {
    setToken(newToken());
    const s = cart.get();
    if (s.customer) {
      setName(s.customer.name);
      setPhone(s.customer.phone);
      setAddress(s.customer.address);
    }
    if (s.areaId) setAreaId(s.areaId);
    if (s.discountCode) {
      setCode(s.discountCode);
      setCodeInput(s.discountCode);
    }
  }, []);

  const quote = useQuote(state.lines, { areaId: areaId || undefined, discountCode: code });
  const codeRejected = !!code && !!quote.data && quote.data.pricing.invoiceDiscountMinor === 0 && !quote.error;

  if (done) return <OrderDone result={done} />;

  if (state.lines.length === 0) {
    return (
      <StoreLayout hideNav>
        <div className="mx-auto mt-24 max-w-sm px-4 text-center">
          <p className="text-lg font-bold">السلة فاضية</p>
          <Link to="/categories" className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">تصفح الأقسام</Link>
        </div>
      </StoreLayout>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!areaId) { toast.error("اختار البلد"); return; }
    if (!c.settings.acceptingOrders) { toast.error("المتجر مش بيستقبل أوردرات دلوقتي"); return; }
    setBusy(true);
    try {
      const res = await api<CreateOrderResult>("/orders", {
        method: "POST",
        auth: false,
        body: {
          clientToken: token,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          areaId,
          addressDetails: address.trim(),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
          lines: toPayload(state.lines),
          ...(code ? { discountCode: code } : {}),
        },
      });
      cart.setMeta({ customer: { name: name.trim(), phone: phone.trim(), address: address.trim() }, areaId, discountCode: undefined });
      cart.clear();
      setDone(res);
      window.scrollTo({ top: 0 });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <StoreLayout hideNav>
      <div className="flex items-center gap-3 px-4 pb-4 pt-6 md:px-6">
        <button onClick={() => navigate({ to: "/cart" })} aria-label="رجوع" className="grid size-10 place-items-center rounded-full bg-card shadow-card">
          <ArrowRight className="size-5" />
        </button>
        <h1 className="text-2xl font-bold">إتمام الطلب</h1>
      </div>

      <form onSubmit={submit} className="grid gap-4 px-4 md:px-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <section className="space-y-4 rounded-2xl bg-card p-5 shadow-card">
            <h2 className="font-bold">بياناتك</h2>
            <Field id="name" label="الاسم">
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} placeholder="أحمد محمد" className="h-11 rounded-xl" />
            </Field>
            <Field id="phone" label="رقم الموبايل">
              <Input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="01012345678" dir="ltr" className="h-11 rounded-xl text-right" />
            </Field>
          </section>

          <section className="space-y-4 rounded-2xl bg-card p-5 shadow-card">
            <h2 className="font-bold">عنوان التوصيل</h2>
            <Field id="area" label="البلد">
              <Select value={areaId} onValueChange={setAreaId} dir="rtl">
                <SelectTrigger id="area" className="h-11 rounded-xl">
                  <SelectValue placeholder="اختار البلد" />
                </SelectTrigger>
                <SelectContent>
                  {c.areas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} — توصيل {formatMoney(a.feeMinor)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="address" label="العنوان بالتفصيل">
              <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} required minLength={5} maxLength={300} placeholder="الشارع، رقم العمارة، الدور، علامة مميزة" className="min-h-20 rounded-xl" />
            </Field>
            <Field id="notes" label="ملاحظات (اختياري)">
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="أي حاجة عايز الطيار يعرفها" className="min-h-16 rounded-xl" />
            </Field>
          </section>

          <section className="rounded-2xl bg-card p-5 shadow-card">
            <h2 className="mb-3 font-bold">كود خصم</h2>
            {code ? (
              <div className="flex items-center justify-between rounded-xl bg-primary-soft px-3 py-2.5">
                <span className="flex items-center gap-2 text-sm font-semibold text-primary-deep">
                  <Tag className="size-4" /> {code}
                  {codeRejected && <span className="text-xs font-normal text-sale">الكود مش متاح للطلب ده</span>}
                </span>
                <button type="button" aria-label="شيل الكود" onClick={() => { setCode(undefined); setCodeInput(""); cart.setMeta({ discountCode: undefined }); }}>
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} placeholder="اكتب الكود" dir="ltr" className="h-11 rounded-xl text-right" />
                <button
                  type="button"
                  onClick={() => {
                    const v = codeInput.trim();
                    if (v.length < 2) return;
                    setCode(v);
                    cart.setMeta({ discountCode: v });
                  }}
                  className="h-11 rounded-xl bg-secondary px-5 text-sm font-semibold text-secondary-foreground"
                >
                  طبّق
                </button>
              </div>
            )}
          </section>
        </div>

        <aside>
          <div className="space-y-4 rounded-2xl bg-card p-5 shadow-card lg:sticky lg:top-6">
            <h2 className="font-bold">ملخص الطلب</h2>
            <ul className="max-h-48 space-y-1.5 overflow-y-auto text-sm">
              {(quote.data?.items ?? []).map((it, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="truncate">{it.name} <span className="text-muted-foreground">× {it.quantity}</span></span>
                  <span className="shrink-0 tabular-nums">{it.lineTotalMinor == null ? "بعد الشراء" : formatMoney(it.lineTotalMinor)}</span>
                </li>
              ))}
            </ul>
            {quote.error && <p className="rounded-xl bg-destructive/5 p-3 text-sm text-destructive">{quote.error.message}</p>}
            {quote.data && <PricingSummary pricing={quote.data.pricing} isEstimated={quote.data.isEstimated} needsPricing={quote.data.needsPricing} />}
            <button
              type="submit"
              disabled={busy || !quote.data || !!quote.error || !c.settings.acceptingOrders}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-50"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {c.settings.acceptingOrders ? "أكّد الطلب" : "المتجر مقفول دلوقتي"}
            </button>
          </div>
        </aside>
      </form>
    </StoreLayout>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function OrderDone({ result }: { result: CreateOrderResult }) {
  const { order, whatsapp } = result;
  return (
    <StoreLayout>
      <div className="mx-auto max-w-md px-4 pt-10 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-11" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">طلبك وصل!</h1>
        <p className="mt-1 text-muted-foreground">رقم الأوردر <span className="font-bold text-foreground">#{order.number}</span></p>
        <p className="mt-3 text-sm text-muted-foreground">ابعت الطلب على واتساب علشان نأكد معاك بسرعة.</p>
        <a
          href={whatsapp.url}
          target="_blank"
          rel="noreferrer"
          className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-success font-semibold text-success-foreground"
        >
          <MessageCircle className="size-5" /> ابعت على واتساب
        </a>
        <div className="mt-6 rounded-2xl bg-card p-5 text-start shadow-card">
          <p className="mb-1 text-sm"><span className="text-muted-foreground">التوصيل لـ:</span> {order.area} — {order.addressDetails}</p>
          <p className="mb-4 text-sm"><span className="text-muted-foreground">الموبايل:</span> <span dir="ltr">{order.customer.phone}</span></p>
          <PricingSummary pricing={order.pricing} isEstimated={order.isEstimated} needsPricing={order.needsPricing} />
        </div>
        <Link to="/" className="mt-6 inline-block text-sm font-semibold text-primary">ارجع للرئيسية</Link>
      </div>
    </StoreLayout>
  );
}
