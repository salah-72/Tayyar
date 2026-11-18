import { useSyncExternalStore } from "react";

let openId: string | null = null;
const ls = new Set<() => void>();
export const productSheet = {
  open(id: string) {
    openId = id;
    ls.forEach((l) => l());
  },
  close() {
    openId = null;
    ls.forEach((l) => l());
  },
};
export function useOpenProductId() {
  return useSyncExternalStore(
    (l) => {
      ls.add(l);
      return () => ls.delete(l);
    },
    () => openId,
    () => null,
  );
}
