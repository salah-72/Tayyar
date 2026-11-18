/** Backend money is integer piasters (قروش). 100 piasters = 1 EGP. */
export function formatMoney(minor: number | null | undefined, opts: { currency?: boolean } = {}) {
  if (minor == null) return "—";
  const v = (minor / 100).toLocaleString("en-US", {
    minimumFractionDigits: minor % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return opts.currency === false ? v : `${v} ج.م`;
}

/** EGP (as typed by an admin) -> piasters. */
export function toMinor(egp: number | string): number {
  const n = typeof egp === "string" ? Number(egp) : egp;
  return Math.round(n * 100);
}

/** basis points -> percent label. 500 -> "5%" */
export function bpsToPercent(bps: number | null | undefined) {
  if (bps == null) return "—";
  return `${(bps / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

export function formatQty(q: number) {
  return q.toLocaleString("en-US", { maximumFractionDigits: 3 });
}
