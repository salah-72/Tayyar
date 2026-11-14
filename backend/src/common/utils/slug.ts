import { randomBytes } from 'crypto';

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '');

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function uniqueSlug(
  wanted: string,
  prefix: string,
  exists: (slug: string) => Promise<boolean>,
  random: () => string = () => randomBytes(3).toString('hex'),
): Promise<string> {
  const base = slugify(wanted) || `${prefix}-${random()}`;
  let candidate = base;
  for (let i = 2; await exists(candidate); i++) candidate = `${base}-${i}`;
  return candidate;
}
