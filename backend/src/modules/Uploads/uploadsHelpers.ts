export type ImageKind = 'jpeg' | 'png' | 'webp';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const sniffImage = (b: Buffer): ImageKind | null => {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
    return 'jpeg';
  if (
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  )
    return 'png';
  if (
    b.length >= 12 &&
    b.toString('ascii', 0, 4) === 'RIFF' &&
    b.toString('ascii', 8, 12) === 'WEBP'
  )
    return 'webp';
  return null;
};

export const imageVariant = (
  url: string | null,
  opts: { width: number; height?: number },
): string | null => {
  if (!url) return null;
  const marker = '/image/upload/';
  const i = url.indexOf(marker);
  if (i === -1) return url;
  const t = [
    opts.height ? 'c_fill' : 'c_limit',
    `w_${opts.width}`,
    ...(opts.height ? [`h_${opts.height}`] : []),
    'f_auto',
    'q_auto',
  ].join(',');
  return (
    url.slice(0, i + marker.length) + t + '/' + url.slice(i + marker.length)
  );
};

export const FOLDER = 'tayyar';
export const LOGO_PUBLIC_ID = `${FOLDER}/logo`;
