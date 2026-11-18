import 'dotenv/config';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import {
  categories,
  stores,
  settings,
  areas,
  products,
  optionGroups,
  discounts,
} from './seed-data';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/**
 * الـ seed ده idempotent: تقدر تشغّله أكتر من مرة من غير ما يكرر بيانات
 * ومن غير ما يمسح تعديلات الأدمن (الأسعار/الأسماء اللي اتعدلت من اللوحة).
 *
 * تشغيل:  npx prisma db seed   (أو)   npx tsx prisma/seed.ts
 * متغيرات اختيارية: SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD
 */

async function seedAdmin() {
  // /auth/newAdmin محمي، فأول أدمن لازم ييجي من هنا
  if ((await prisma.admin.count()) > 0) return;

  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const generated = !process.env.SEED_ADMIN_PASSWORD;
  const password =
    process.env.SEED_ADMIN_PASSWORD ||
    crypto.randomBytes(9).toString('base64url');

  await prisma.admin.create({
    data: { username, password: await bcrypt.hash(password, 12) },
  });

  console.log('👤 Admin created');
  console.log(`   username: ${username}`);
  if (generated)
    console.log(`   password: ${password}   (اتولّد عشوائي - احفظه دلوقتي)`);
}

async function main() {
  await seedAdmin();

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: settings,
  });

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }
  const categoryIds = new Map(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id]),
  );

  for (const s of stores) {
    await prisma.store.upsert({
      where: { slug: s.slug },
      update: {},
      create: s,
    });
  }
  const storeIds = new Map(
    (await prisma.store.findMany()).map((s) => [s.slug, s.id]),
  );

  for (const a of areas) {
    await prisma.area.upsert({
      where: { name: a.name },
      update: {},
      create: a,
    });
  }

  for (const { options, ...g } of optionGroups) {
    const exists = await prisma.optionGroup.findUnique({
      where: { slug: g.slug },
    });
    if (exists) continue;
    await prisma.optionGroup.create({
      data: { ...g, options: { create: options } },
    });
  }
  const groupIds = new Map(
    (await prisma.optionGroup.findMany()).map((g) => [g.slug, g.id]),
  );

  let createdProducts = 0;
  for (const {
    categorySlug,
    storeSlug,
    optionGroupSlugs,
    ...rest
  } of products) {
    const categoryId = categorySlug ? categoryIds.get(categorySlug) : undefined;
    const storeId = storeSlug ? storeIds.get(storeSlug) : undefined;

    if (!categoryId && !storeId) {
      throw new Error(
        `Product "${rest.name}" must belong to either a category or a store`,
      );
    }

    const exists = await prisma.product.findFirst({
      where: {
        name: rest.name,
        categoryId: categoryId ?? null,
        storeId: storeId ?? null,
      },
      select: { id: true },
    });
    if (exists) continue;

    await prisma.product.create({
      data: {
        ...rest,
        categoryId,
        storeId,
        optionGroups: optionGroupSlugs?.length
          ? {
              connect: optionGroupSlugs.map((slug) => {
                const id = groupIds.get(slug);
                if (!id) throw new Error(`Unknown option group "${slug}"`);
                return { id };
              }),
            }
          : undefined,
      },
    });
    createdProducts++;
  }

  for (const d of discounts) {
    const exists = d.code
      ? await prisma.discount.findUnique({ where: { code: d.code } })
      : await prisma.discount.findFirst({
          where: { name: d.name, code: null },
        });
    if (exists) continue;
    await prisma.discount.create({ data: d });
  }

  console.log(
    `✅ Seed done: ${categories.length} categories, ${stores.length} stores, ` +
      `${areas.length} areas, ${optionGroups.length} option groups, ` +
      `${createdProducts} new products (of ${products.length}), ${discounts.length} discounts.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
