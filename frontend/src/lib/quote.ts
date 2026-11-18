import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, ApiError } from "./api/client";
import type { Quote } from "./api/types";
import { toPayload, type CartLine } from "./cart";

export function useQuote(lines: CartLine[], opts: { areaId?: string; discountCode?: string } = {}) {
  const payload = toPayload(lines);
  return useQuery<Quote, ApiError>({
    queryKey: ["quote", payload, opts.areaId ?? null, opts.discountCode ?? null],
    queryFn: () =>
      api<Quote>("/orders/quote", {
        method: "POST",
        auth: false,
        body: {
          lines: payload,
          ...(opts.areaId ? { areaId: opts.areaId } : {}),
          ...(opts.discountCode ? { discountCode: opts.discountCode } : {}),
        },
      }),
    enabled: payload.length > 0,
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 15_000,
  });
}

/** productId the backend complained about (422 pricing errors), if any. */
export function badProductId(e: unknown): string | undefined {
  if (e instanceof ApiError && e.details && typeof e.details === "object" && "productId" in e.details) {
    return String((e.details as { productId: unknown }).productId);
  }
  return undefined;
}
