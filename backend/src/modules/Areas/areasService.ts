import appError from '../../common/utils/appError';
import { prisma } from '../../config/postgres';
import { toAreaDto } from './areasHelpers';
import type {
  CreateAreaInput,
  ListAreasQuery,
  UpdateAreaInput,
} from './areasValidation';

const notFound = () => new appError('البلد مش موجودة', 404, 'AREA_NOT_FOUND');

async function getOrThrow(id: string) {
  const area = await prisma.area.findUnique({ where: { id } });
  if (!area) throw notFound();
  return area;
}

async function assertNameFree(name: string, exceptId?: string) {
  const same = await prisma.area.findUnique({ where: { name } });
  if (same && same.id !== exceptId) {
    throw new appError(
      same.archivedAt
        ? 'فيه بلد بنفس الاسم مؤرشفة، استرجعها بدل ما تعمل واحدة جديدة'
        : 'فيه بلد بنفس الاسم',
      409,
      same.archivedAt ? 'AREA_ARCHIVED' : 'AREA_NAME_TAKEN',
      same.archivedAt ? { id: same.id } : undefined,
    );
  }
}

export const areasService = {
  async list(q: ListAreasQuery) {
    const areas = await prisma.area.findMany({
      where: q.archived ? { archivedAt: { not: null } } : { archivedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return areas.map(toAreaDto);
  },

  async get(id: string) {
    return toAreaDto(await getOrThrow(id));
  },

  async create(b: CreateAreaInput) {
    await assertNameFree(b.name);
    const area = await prisma.area.create({
      data: {
        name: b.name,
        feeMinor: b.feeMinor,
        sortOrder: b.sortOrder ?? 0,
        isActive: b.isActive ?? true,
      },
    });
    return toAreaDto(area);
  },

  async update(id: string, patch: UpdateAreaInput) {
    const cur = await getOrThrow(id);
    if (cur.archivedAt)
      throw new appError('البلد مؤرشفة: استرجعها الأول', 409, 'AREA_ARCHIVED');
    if (patch.name) await assertNameFree(patch.name, id);
    return toAreaDto(await prisma.area.update({ where: { id }, data: patch }));
  },

  async archive(id: string) {
    await getOrThrow(id);
    await prisma.area.update({
      where: { id },
      data: { archivedAt: new Date(), isActive: false },
    });
  },

  async restore(id: string) {
    await getOrThrow(id);
    return toAreaDto(
      await prisma.area.update({
        where: { id },
        data: { archivedAt: null, isActive: true },
      }),
    );
  },
};
