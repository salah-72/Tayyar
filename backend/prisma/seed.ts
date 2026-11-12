import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { categories, stores, settings, areas, products } from './seed-data';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const categoryCount = await prisma.category.count();
  if (categoryCount > 0) {
    console.log(
      'Database already has data, skipping seed. (Fresh start: npx prisma migrate reset)',
    );
    return;
  }

  // 1. إدخال الأقسام (Categories)
  await prisma.category.createMany({ data: categories });
  const categoryIds = new Map(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id]),
  );

  // 2. إدخال المتاجر (Stores)
  const storeIds = new Map<string, string>();
  for (const storeData of stores) {
    const store = await prisma.store.create({ data: storeData });
    storeIds.set(storeData.slug, store.id);
  }

  // 3. إدخال الإعدادات العامة (Settings)
  await prisma.settings.create({ data: settings });

  // 4. إدخال مناطق التوصيل (Areas)
  await prisma.area.createMany({ data: areas });

  // 5. إدخال المنتجات وربطها بالأقسام أو المتاجر
  for (const { categorySlug, storeSlug, ...rest } of products) {
    const categoryId = categorySlug ? categoryIds.get(categorySlug) : undefined;
    const storeId = storeSlug ? storeIds.get(storeSlug) : undefined;

    if (!categoryId && !storeId) {
      throw new Error(
        `Product "${rest.name}" must belong to either a category or a store`,
      );
    }

    await prisma.product.create({
      data: {
        ...rest,
        categoryId,
        storeId,
      },
    });
  }

  console.log(
    `✅ Seeded successfully: ${categories.length} categories, ${stores.length} stores, ${areas.length} areas, and ${products.length} products.`,
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
