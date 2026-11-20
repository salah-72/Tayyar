import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, ApiError } from "./api/client";
import type { Quote, QuoteItem } from "./api/types";
import { toPayload, type CartLine } from "./cart";

/** A quote plus the cart-line keys it was priced for (items[i] belongs to lineKeys[i]). */
export type KeyedQuote = Quote & { lineKeys: string[] };

export function useQuote(lines: CartLine[], opts: { areaId?: string; discountCode?: string } = {}) {
  const payload = toPayload(lines);
  const lineKeys = lines.map((l) => l.key);
  return useQuery<KeyedQuote, ApiError>({
    queryKey: ["quote", payload, opts.areaId ?? null, opts.discountCode ?? null],
    queryFn: async () => ({
      ...(await api<Quote>("/orders/quote", {
        method: "POST",
        auth: false,
        body: {
          lines: payload,
          ...(opts.areaId ? { areaId: opts.areaId } : {}),
          ...(opts.discountCode ? { discountCode: opts.discountCode } : {}),
        },
      })),
      lineKeys,
    }),
    enabled: payload.length > 0,
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 15_000,
  });
}

/**
 * The quote item that belongs to `line`. While a new quote is loading the previous one is still
 * shown (keepPreviousData), so matching by position would hand a row the item of a different
 * line after a remove/change. Matching by key never does; it returns undefined for new lines.
 */
export function itemForLine(quote: KeyedQuote | undefined, line: CartLine): QuoteItem | undefined {
  if (!quote) return undefined;
  const i = quote.lineKeys.indexOf(line.key);
  return i >= 0 ? quote.items[i] : undefined;
}

/** productId the backend complained about (422 pricing errors), if any. */
export function badProductId(e: unknown): string | undefined {
  if (e instanceof ApiError && e.details && typeof e.details === "object" && "productId" in e.details) {
    return String((e.details as { productId: unknown }).productId);
  }
  return undefined;
}
