export const toMilli = (q: number): number => Math.round(q * 1000);

export const hasMaxThreeDecimals = (q: number): boolean =>
  Math.abs(q * 1000 - Math.round(q * 1000)) < 1e-6;

export const mulDivRound = (factors: number[], divisor: number): number => {
  let n = 1n;
  for (const f of factors) n *= BigInt(f);
  const d = BigInt(divisor);
  return Number((n + d / 2n) / d);
};

export const bpsOf = (amountMinor: number, bps: number): number =>
  mulDivRound([amountMinor, bps], 10000);

export const formatMinor = (minor: number): string => {
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(minor);
  const pounds = Math.floor(abs / 100);
  const piasters = abs % 100;
  if (piasters === 0) return `${sign}${pounds}`;
  return `${sign}${pounds}.${String(piasters).padStart(2, '0').replace(/0$/, '')}`;
};
