import { timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

type HeaderValue = string | string[] | undefined;

const first = (v: HeaderValue): string | undefined =>
  typeof v === 'string' ? v.trim() : undefined;

const safeEqual = (a: string, b: string): boolean => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};

export function resolveClientIp(opts: {
  secret?: string;
  headerSecret?: HeaderValue;
  headerIp?: HeaderValue;
  fallbackIp: string;
}): { ip: string; viaBridge: boolean } {
  const { secret, fallbackIp } = opts;
  const sent = first(opts.headerSecret);
  const ip = first(opts.headerIp);

  if (secret && sent && ip && isIP(ip) !== 0 && safeEqual(sent, secret)) {
    return { ip, viaBridge: true };
  }
  return { ip: fallbackIp, viaBridge: false };
}
