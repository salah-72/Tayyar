import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Home,
  Loader2,
  MapPin,
  MessageCircle,
  Tag,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { catalogQuery, useCatalog } from "@/lib/catalog";
import { cart, toPayload, useCart, useCartReady } from "@/lib/cart";
import { useQuote } from "@/lib/quote";
import { useApprox } from "@/lib/approx";
import { api, errorMessage } from "@/lib/api/client";
import { formatMoney } from "@/lib/money";
import type { CreateOrderResult } from "@/lib/api/types";
import { StoreLayout } from "@/components/store/StoreLayout";
import { PricingSummary } from "@/components/store/PricingSummary";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const approx = useApprox();
  const state = useCart();
  const ready = useCartReady();
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

  useEffect(() => {
    if (!ready) return;
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
  }, [ready]);

  const quote = useQuote(state.lines, { areaId: areaId || undefined, discountCode: code });
  const codeRejected =
    !!code && !!quote.data && quote.data.pricing.invoiceDiscountMinor === 0 && !quote.error;

  if (done) return <OrderDone result={done} />;

  if (!ready) {
    return (
      <StoreLayout hideNav>
        <div className="mt-24 grid place-items-center">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      </StoreLayout>
    );
  }

  if (state.lines.length === 0) {
    return (
      <StoreLayout hideNav>
        <div className="mx-auto mt-20 max-w-sm rounded-3xl border border-border/70 bg-card px-6 py-12 text-center shadow-sm">
          <p className="text-lg font-extrabold tracking-tight">السلة فاضية</p>
          <p className="mt-1 text-sm text-muted-foreground">أضف منتجات أولاً قبل إتمام الطلب.</p>
          <Link
            to="/categories"
            className="mt-5 inline-block rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
          >
            تصفح الأقسام
          </Link>
        </div>
      </StoreLayout>
    );
  }

  function applyDiscountCode() {
    const v = codeInput.trim();
    if (v.length < 2) return;
    setCode(v);
    cart.setMeta({ discountCode: v });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!areaId) {
      toast.error("اختار البلد");
      return;
    }
    if (!c.settings.acceptingOrders) {
      toast.error("المتجر مش بيستقبل أوردرات دلوقتي");
      return;
    }
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
      cart.setMeta({
        customer: { name: name.trim(), phone: phone.trim(), address: address.trim() },
        areaId,
        discountCode: undefined,
      });
      cart.clear();
      setDone(res);
      window.scrollTo({ top: 0 });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const quoteItems = quote.data?.items ?? [];

  return (
    <StoreLayout hideNav>
      {/* Top Header */}
      <div className="flex items-center gap-3 px-4 pb-4 pt-6 md:px-6">
        <button
          type="button"
          onClick={() => navigate({ to: "/cart" })}
          aria-label="رجوع"
          className="grid size-10 place-items-center rounded-full border border-border/70 bg-card shadow-2xs transition-colors hover:bg-muted/50 active:scale-95"
        >
          <ArrowRight className="size-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">إتمام الطلب</h1>
          <p className="text-xs text-muted-foreground">راجع بياناتك وأكّد الأوردر</p>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="grid gap-5 px-4 pb-10 md:px-6 lg:grid-cols-[1fr_390px] lg:items-start"
      >
        <div className="space-y-4">
          {/* Customer Info */}
          <section className="space-y-4 rounded-3xl border border-border/70 bg-card p-5 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <User className="size-4" />
              </div>
              <h2 className="text-base font-extrabold tracking-tight">بياناتك</h2>
            </div>

            <Field id="name" label="الاسم">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={80}
                placeholder="أحمد محمد"
                className="h-11 rounded-xl border-border/80 bg-background/60 focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </Field>

            <Field id="phone" label="رقم الموبايل">
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="01012345678"
                dir="ltr"
                className="h-11 rounded-xl border-border/80 bg-background/60 text-right tabular-nums focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </Field>
          </section>

          {/* Delivery Address */}
          <section className="space-y-4 rounded-3xl border border-border/70 bg-card p-5 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="size-4" />
              </div>
              <h2 className="text-base font-extrabold tracking-tight">عنوان التوصيل</h2>
            </div>

            <Field id="area" label="البلد">
              <Select value={areaId} onValueChange={setAreaId} dir="rtl">
                <SelectTrigger
                  id="area"
                  className="h-11 rounded-xl border-border/80 bg-background/60"
                >
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
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                minLength={5}
                maxLength={300}
                placeholder="الشارع، رقم العمارة، الدور، علامة مميزة"
                className="min-h-22 rounded-xl border-border/80 bg-background/60 focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </Field>

            <Field id="notes" label="ملاحظات (اختياري)">
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                placeholder="أي حاجة عايز الطيار يعرفها"
                className="min-h-18 rounded-xl border-border/80 bg-background/60 focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </Field>
          </section>

          {/* Discount Code */}
          <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-2xs">
            <div className="mb-3.5 flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <Tag className="size-4" />
              </div>
              <h2 className="text-base font-extrabold tracking-tight">كود خصم</h2>
            </div>

            {code ? (
              <div
                className={`flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 ${
                  codeRejected
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-primary/20 bg-primary/10"
                }`}
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-bold">
                  <span className={codeRejected ? "text-destructive" : "text-primary"}>{code}</span>
                  {codeRejected && (
                    <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                      الكود مش متاح للطلب ده
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="شيل الكود"
                  onClick={() => {
                    setCode(undefined);
                    setCodeInput("");
                    cart.setMeta({ discountCode: undefined });
                  }}
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-background/80 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyDiscountCode();
                    }
                  }}
                  placeholder="اكتب الكود"
                  dir="ltr"
                  className="h-11 rounded-xl border-border/80 bg-background/60 text-right uppercase focus-visible:ring-2 focus-visible:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={applyDiscountCode}
                  className="h-11 shrink-0 rounded-xl bg-secondary px-5 text-sm font-bold text-secondary-foreground transition-colors hover:bg-secondary/80 active:scale-95"
                >
                  طبّق
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Order Summary Aside */}
        <aside>
          <div className="space-y-4 rounded-3xl border border-border/70 bg-card p-5 shadow-sm lg:sticky lg:top-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <h2 className="text-base font-extrabold tracking-tight">ملخص الطلب</h2>
              {quoteItems.length > 0 && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
                  {quoteItems.length} {quoteItems.length === 1 ? "صنف" : "أصناف"}
                </span>
              )}
            </div>

            {quoteItems.length > 0 && (
              <ul className="max-h-52 space-y-2 overflow-y-auto rounded-2xl bg-muted/40 p-3 text-sm">
                {quoteItems.map((it, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">
                      {it.name}{" "}
                      <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                        × {it.quantity}
                      </span>
                    </span>
                    <span className="shrink-0 font-bold tabular-nums text-foreground">
                      {it.lineTotalMinor == null
                        ? "بعد الشراء"
                        : (approx.isApprox(it.productId) ? "≈ " : "") +
                          formatMoney(it.lineTotalMinor)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {quote.error && (
              <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                {quote.error.message}
              </p>
            )}

            {quote.data && (
              <PricingSummary
                pricing={quote.data.pricing}
                isEstimated={approx.any(quote.data.items)}
                needsPricing={quote.data.needsPricing}
              />
            )}

            <button
              type="submit"
              disabled={busy || !quote.data || !!quote.error || !c.settings.acceptingOrders}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              <span>{c.settings.acceptingOrders ? "أكّد الطلب" : "المتجر مقفول دلوقتي"}</span>
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
      <Label htmlFor={id} className="text-xs font-bold text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function OrderDone({ result }: { result: CreateOrderResult }) {
  const approx = useApprox();
  const { order, whatsapp } = result;

  return (
    <StoreLayout>
      <div className="mx-auto max-w-md px-4 pb-10 pt-8 text-center">
        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-success/15 text-success ring-8 ring-success/5">
            <CheckCircle2 className="size-11" />
          </div>

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">طلبك وصل!</h1>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-muted px-3.5 py-1 text-xs font-bold text-foreground">
            <span>رقم الأوردر</span>
            <span className="font-extrabold text-primary tabular-nums">#{order.number}</span>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            ابعت الطلب على واتساب علشان نأكد معاك بسرعة ونبدأ التجهيز.
          </p>

          <a
            href={whatsapp.url}
            target="_blank"
            rel="noreferrer"
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-success text-sm font-bold text-success-foreground shadow-sm transition-all hover:opacity-95 active:scale-[0.98]"
          >
            <MessageCircle className="size-5" />
            <span>ابعت على واتساب</span>
          </a>

          <div className="mt-6 space-y-2 rounded-2xl border border-border/60 bg-muted/40 p-4 text-start text-sm">
            <p className="leading-relaxed">
              <span className="font-semibold text-muted-foreground">التوصيل لـ: </span>
              <span className="font-bold text-foreground">
                {order.area} — {order.addressDetails}
              </span>
            </p>
            <p>
              <span className="font-semibold text-muted-foreground">الموبايل: </span>
              <span dir="ltr" className="font-bold text-foreground tabular-nums">
                {order.customer.phone}
              </span>
            </p>
          </div>

          <div className="mt-4 border-t border-border/60 pt-4 text-start">
            <PricingSummary
              pricing={order.pricing}
              isEstimated={approx.any(order.items)}
              needsPricing={order.needsPricing}
            />
          </div>
        </div>

        <Link
          to="/"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-5 py-2.5 text-sm font-bold text-primary shadow-2xs transition-colors hover:bg-muted/50"
        >
          <Home className="size-4" />
          <span>ارجع للرئيسية</span>
        </Link>
      </div>
    </StoreLayout>
  );
}
