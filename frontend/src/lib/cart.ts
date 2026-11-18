import { useSyncExternalStore } from "react";
import type { CartLinePayload } from "./api/types";

export type CartProductLine = {
  key: string;
  type: "product";
  productId: string;
  quantity: number;
  weightPerUnit?: number;
  optionIds: string[];
};
export type CartCustomLine = { key: string; type: "custom"; text: string; note?: string };
export type CartLine = CartProductLine | CartCustomLine;

export interface CartState {
  lines: CartLine[];
  discountCode?: string;
  areaId?: string;
  customer?: { name: string; phone: string; address: string; notes?: string };
}

const STORAGE_KEY = "tayyar_cart_v1";
const EMPTY: CartState = { lines: [] };
let state: CartState = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full / private mode */
    }
  }
  listeners.forEach((l) => l());
}

function set(next: CartState) {
  state = next;
  emit();
}

export function lineKey(productId: string, weightPerUnit?: number, optionIds: string[] = []) {
  return [productId, weightPerUnit ?? "", [...optionIds].sort().join(",")].join("|");
}

export const cart = {
  hydrate() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartState;
        if (Array.isArray(parsed.lines)) state = parsed;
      }
    } catch {
      /* ignore corrupted cart */
    }
    listeners.forEach((l) => l());
  },
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  addProduct(input: { productId: string; quantity: number; weightPerUnit?: number; optionIds?: string[] }) {
    const optionIds = input.optionIds ?? [];
    const key = lineKey(input.productId, input.weightPerUnit, optionIds);
    const existing = state.lines.find((l) => l.key === key) as CartProductLine | undefined;
    if (existing) {
      set({
        ...state,
        lines: state.lines.map((l) =>
          l.key === key
            ? { ...existing, quantity: Math.round((existing.quantity + input.quantity) * 1000) / 1000 }
            : l,
        ),
      });
    } else {
      set({
        ...state,
        lines: [...state.lines, { key, type: "product", ...input, optionIds }],
      });
    }
  },
  setQuantity(key: string, quantity: number) {
    if (quantity <= 0) return cart.remove(key);
    set({
      ...state,
      lines: state.lines.map((l) => (l.key === key && l.type === "product" ? { ...l, quantity } : l)),
    });
  },
  addCustom(text: string, note?: string) {
    const key = `custom|${Date.now()}|${Math.random().toString(36).slice(2, 7)}`;
    set({ ...state, lines: [...state.lines, { key, type: "custom", text, note }] });
  },
  remove(key: string) {
    set({ ...state, lines: state.lines.filter((l) => l.key !== key) });
  },
  restore(line: CartLine, index: number) {
    const lines = [...state.lines];
    lines.splice(Math.min(index, lines.length), 0, line);
    set({ ...state, lines });
  },
  clear() {
    set({ ...state, lines: [], discountCode: undefined });
  },
  setMeta(meta: Partial<Omit<CartState, "lines">>) {
    set({ ...state, ...meta });
  },
};

export function useCart() {
  return useSyncExternalStore(cart.subscribe, cart.get, () => EMPTY);
}

/** Number of distinct items shown on the cart badge. */
export function useCartCount() {
  return useCart().lines.length;
}

export function quantityInCart(lines: CartLine[], productId: string) {
  return lines.reduce((s, l) => (l.type === "product" && l.productId === productId ? s + l.quantity : s), 0);
}

export function toPayload(lines: CartLine[]): CartLinePayload[] {
  return lines.map((l) =>
    l.type === "product"
      ? {
          type: "product",
          productId: l.productId,
          quantity: l.quantity,
          ...(l.weightPerUnit != null ? { weightPerUnit: l.weightPerUnit } : {}),
          ...(l.optionIds.length ? { optionIds: l.optionIds } : {}),
        }
      : { type: "custom", text: l.text, ...(l.note ? { note: l.note } : {}) },
  );
}
