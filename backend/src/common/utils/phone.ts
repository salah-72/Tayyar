const AR_DIGITS = /[٠-٩]/g;

export const normalizePhone = (raw: string): string =>
  raw
    .replace(AR_DIGITS, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[\s\-()]/g, '');

export const toWaNumber = (phone: string): string => {
  let d = normalizePhone(phone).replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '20' + d.slice(1);
  return d;
};
