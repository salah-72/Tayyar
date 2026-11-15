import type { UploadApiResponse } from 'cloudinary';
import appError from '../../common/utils/appError';
import { cloudinary, isCloudinaryConfigured } from '../../config/cloudinary';
import { prisma } from '../../config/postgres';
import { settingsService } from '../Settings/settingsService';
import { FOLDER, LOGO_PUBLIC_ID, sniffImage } from './uploadsHelpers';

type Entity = 'products' | 'categories' | 'stores';

interface Target {
  folder: Entity;
  notFound: () => appError;
  find: (id: string) => Promise<{
    imageUrl: string | null;
    imagePublicId: string | null;
  } | null>;
  save: (
    id: string,
    imageUrl: string | null,
    imagePublicId: string | null,
  ) => Promise<unknown>;
}

const select = { imageUrl: true, imagePublicId: true } as const;

const targets: Record<Entity, Target> = {
  products: {
    folder: 'products',
    notFound: () => new appError('المنتج مش موجود', 404, 'PRODUCT_NOT_FOUND'),
    find: (id) => prisma.product.findUnique({ where: { id }, select }),
    save: (id, imageUrl, imagePublicId) =>
      prisma.product.update({
        where: { id },
        data: { imageUrl, imagePublicId },
      }),
  },
  categories: {
    folder: 'categories',
    notFound: () => new appError('القسم مش موجود', 404, 'CATEGORY_NOT_FOUND'),
    find: (id) => prisma.category.findUnique({ where: { id }, select }),
    save: (id, imageUrl, imagePublicId) =>
      prisma.category.update({
        where: { id },
        data: { imageUrl, imagePublicId },
      }),
  },
  stores: {
    folder: 'stores',
    notFound: () => new appError('المحل مش موجود', 404, 'STORE_NOT_FOUND'),
    find: (id) => prisma.store.findUnique({ where: { id }, select }),
    save: (id, imageUrl, imagePublicId) =>
      prisma.store.update({ where: { id }, data: { imageUrl, imagePublicId } }),
  },
};

function assertConfigured() {
  if (!isCloudinaryConfigured())
    throw new appError(
      'رفع الصور لسه متضبطش (مفاتيح Cloudinary)',
      503,
      'UPLOADS_NOT_CONFIGURED',
    );
}

function assertImage(file: { buffer: Buffer } | undefined): Buffer {
  if (!file?.buffer?.length)
    throw new appError('ابعت صورة في الحقل file', 400, 'FILE_REQUIRED');
  if (!sniffImage(file.buffer))
    throw new appError(
      'الملف مش صورة مدعومة (JPEG أو PNG أو WebP)',
      415,
      'UNSUPPORTED_IMAGE',
    );
  return file.buffer;
}

function uploadBuffer(
  buffer: Buffer,
  opts: { folder?: string; publicId?: string; overwrite?: boolean },
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: opts.folder,
        public_id: opts.publicId,
        overwrite: opts.overwrite,
        invalidate: opts.overwrite,
        transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
      },
      (err, result) =>
        err || !result
          ? reject(err ?? new Error('no result'))
          : resolve(result),
    );
    stream.end(buffer);
  });
}

async function upload(
  buffer: Buffer,
  opts: Parameters<typeof uploadBuffer>[1],
) {
  try {
    return await uploadBuffer(buffer, opts);
  } catch (e) {
    console.error('[cloudinary upload]', e);
    throw new appError('فشل رفع الصورة، جرّب تاني', 502, 'UPLOAD_FAILED');
  }
}

async function destroyQuietly(publicId: string | null | undefined) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (e) {
    console.error('[cloudinary destroy]', publicId, e);
  }
}

export const uploadsService = {
  async setImage(
    entity: Entity,
    id: string,
    file: { buffer: Buffer } | undefined,
  ) {
    const t = targets[entity];
    assertConfigured();
    const buffer = assertImage(file);
    const cur = await t.find(id);
    if (!cur) throw t.notFound();

    const up = await upload(buffer, { folder: `${FOLDER}/${t.folder}` });
    try {
      await t.save(id, up.secure_url, up.public_id);
    } catch (e) {
      await destroyQuietly(up.public_id);
      throw e;
    }
    await destroyQuietly(cur.imagePublicId);
    return { imageUrl: up.secure_url };
  },

  async removeImage(entity: Entity, id: string) {
    const t = targets[entity];
    const cur = await t.find(id);
    if (!cur) throw t.notFound();
    if (!cur.imageUrl && !cur.imagePublicId) return;
    await t.save(id, null, null);
    if (isCloudinaryConfigured()) await destroyQuietly(cur.imagePublicId);
  },

  async setLogo(file: { buffer: Buffer } | undefined) {
    assertConfigured();
    const buffer = assertImage(file);
    await settingsService.getRow();
    const up = await upload(buffer, {
      publicId: LOGO_PUBLIC_ID,
      overwrite: true,
    });
    await prisma.settings.update({
      where: { id: 1 },
      data: { logoUrl: up.secure_url },
    });
    return { imageUrl: up.secure_url };
  },

  async removeLogo() {
    const s = await settingsService.getRow();
    if (!s.logoUrl) return;
    await prisma.settings.update({ where: { id: 1 }, data: { logoUrl: null } });
    if (isCloudinaryConfigured()) await destroyQuietly(LOGO_PUBLIC_ID);
  },
};
