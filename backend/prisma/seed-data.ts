export type SeedProduct = {
  categorySlug?: string;
  storeSlug?: string;
  menuSection?: string;
  name: string;
  imageUrl?: string;
  unit:
    | 'KG'
    | 'PIECE'
    | 'PACK'
    | 'BUNCH'
    | 'STRIP'
    | 'BOX'
    | 'INJECTION'
    | 'BOTTLE'
    | 'SACHET'
    | 'DISH'
    | 'TRAY'
    | 'LITER';
  saleMode?: 'UNIT' | 'WEIGHT' | 'PIECE_WEIGHT';
  priceMinor: number;
  description?: string;
  minQty?: number;
  qtyStep?: number;
  weightChoices?: number[];
  discountKind?: 'PERCENT' | 'FIXED' | 'NONE';
  discountValue?: number;
  isFeatured?: boolean;
  optionGroupSlugs?: string[];
};

export const categories = [
  { slug: 'veg', name: 'خضار', sortOrder: 1 },
  { slug: 'fruits', name: 'فاكهة', sortOrder: 2 },
  { slug: 'meat', name: 'لحمة', sortOrder: 3 },
  { slug: 'chicken', name: 'فراخ', sortOrder: 4 },
  { slug: 'fish', name: 'سمك', sortOrder: 5 },
  { slug: 'groc', name: 'بقالة وتموين', sortOrder: 6 },
  { slug: 'dairy', name: 'ألبان ومنتجاتها', sortOrder: 7 },
  { slug: 'drinks', name: 'مشروبات', sortOrder: 8 },
  { slug: 'clean', name: 'منظفات ومستلزمات المنزل', sortOrder: 9 },
  { slug: 'bakery', name: 'مخبوزات', sortOrder: 10 },
  { slug: 'pharm', name: 'أدوية', sortOrder: 12 },
];

export const stores = [
  // موردين (مش بيظهروا للعميل - بس بيستخدموا في قائمة المشتريات)
  {
    slug: 'el-souq',
    name: 'السوق',
    type: 'SUPPLIER' as const,
    sortOrder: 1,
  },
  {
    slug: 'grocery-supplier',
    name: 'بقالة',
    type: 'SUPPLIER' as const,
    sortOrder: 2,
  },
  {
    slug: 'pharma',
    name: 'الصيدلية',
    type: 'SUPPLIER' as const,
    sortOrder: 4,
  },
  {
    slug: 'dairy-supplier',
    name: 'الألبان',
    type: 'SUPPLIER' as const,
    sortOrder: 3,
  },
  {
    slug: 'clean-supplier',
    name: 'المنظفات',
    type: 'SUPPLIER' as const,
    sortOrder: 7,
  },
  {
    slug: 'bakery-supplier',
    name: 'المخبوزات',
    type: 'SUPPLIER' as const,
    sortOrder: 8,
  },
  {
    slug: 'chicken-supplier',
    name: 'محل الفراخ',
    type: 'SUPPLIER' as const,
    sortOrder: 5,
  },
  {
    slug: 'fish-supplier',
    name: 'محل السمك',
    type: 'SUPPLIER' as const,
    sortOrder: 6,
  },
  {
    slug: 'el-amana',
    name: 'الأمانة',
    type: 'RESTAURANT' as const,
    sortOrder: 10,
  },
  {
    slug: 'aklyano',
    name: 'اكليانو',
    type: 'RESTAURANT' as const,
    sortOrder: 11,
  },
  // مطاعم (بتظهر للعميل كمنيو)
  {
    slug: 'el-zahraa',
    name: 'كشري الزهراء',
    type: 'RESTAURANT' as const,
    sortOrder: 1,
  },
  {
    slug: 'pizza-plaza',
    name: 'بيتزا بلازا',
    type: 'RESTAURANT' as const,
    sortOrder: 2,
  },
];

export const settings = {
  id: 1,
  storeName: 'البيه الطيار',
  tagline: 'توصيل كل اللي تحتاجه لحد باب البيت',
  whatsappNumber: '201012345678',
  freeDeliveryThresholdMinor: 50000, // 500 جنيه بالقرش
  serviceFeePerStoreMinor: 1000, // 10 جنيه على كل محل مختلف في الأوردر
  acceptingOrders: true,
};

export const areas = [
  { name: 'أجا', feeMinor: 2500, sortOrder: 1 },
  { name: 'شنيسة', feeMinor: 5000, sortOrder: 2 },
  { name: 'بقطارس', feeMinor: 3500, sortOrder: 3 },
];

export const products: SeedProduct[] = [
  // خضار وفاكهة
  {
    categorySlug: 'veg',
    storeSlug: 'el-souq',
    name: 'طماطم',
    unit: 'KG',
    imageUrl:
      'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'WEIGHT',
    priceMinor: 1350,
    description: 'حمرا وطازة',
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'fruits',
    storeSlug: 'el-souq',
    name: 'موز',
    unit: 'KG',
    imageUrl:
      'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'WEIGHT',
    priceMinor: 3500,
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'fruits',
    storeSlug: 'el-souq',
    name: 'برتقال',
    unit: 'KG',
    imageUrl:
      'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'WEIGHT',
    priceMinor: 4000,
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'veg',
    storeSlug: 'el-souq',
    name: 'خيار',
    unit: 'KG',
    imageUrl:
      'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'WEIGHT',
    priceMinor: 2200,
    description: 'خيار مقرمش للسلطة',
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'veg',
    storeSlug: 'el-souq',
    name: 'فلفل رومي',
    unit: 'KG',
    imageUrl:
      'https://images.unsplash.com/photo-1601648764658-cf37e8c89b70?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'WEIGHT',
    priceMinor: 4500,
    description: 'للحشي والسلطة',
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'veg',
    storeSlug: 'el-souq',
    name: 'بصل',
    unit: 'KG',
    imageUrl:
      'https://plus.unsplash.com/premium_photo-1725902078641-58f44d4a6a4c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'WEIGHT',
    priceMinor: 1500,
    description: 'للطبيخ والتحمير',
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'veg',
    storeSlug: 'el-souq',
    name: 'بطاطس',
    unit: 'KG',
    imageUrl:
      'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'WEIGHT',
    priceMinor: 2000,
    description: 'للتحمير والسلق',
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'veg',
    storeSlug: 'el-souq',
    name: 'ليمون',
    unit: 'KG',
    imageUrl:
      'https://images.unsplash.com/photo-1590502593747-42a996133562?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'WEIGHT',
    priceMinor: 4000,
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'veg',
    storeSlug: 'el-souq',
    name: 'نعناع',
    unit: 'BUNCH',
    imageUrl:
      'https://images.unsplash.com/photo-1603653856395-084002e5d39d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'UNIT',
    priceMinor: 500,
    description: 'ربطة نعناع أخضر',
    minQty: 1,
    qtyStep: 1,
  },
  {
    categorySlug: 'veg',
    storeSlug: 'el-souq',
    name: 'كوسة',
    unit: 'KG',
    imageUrl:
      'https://plus.unsplash.com/premium_photo-1784608770676-be218447ff33?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'WEIGHT',
    priceMinor: 1000,
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'veg',
    storeSlug: 'el-souq',
    name: 'باذنجان',
    unit: 'KG',
    imageUrl:
      'https://images.unsplash.com/photo-1683543122945-513029986574?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'WEIGHT',
    priceMinor: 500,
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'fruits',
    storeSlug: 'el-souq',
    name: 'جوافة',
    unit: 'KG',
    imageUrl:
      'https://images.unsplash.com/photo-1689996647099-a7a0b67fd2f6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'WEIGHT',
    priceMinor: 2200,
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'fruits',
    storeSlug: 'el-souq',
    name: 'تفاح',
    unit: 'KG',
    imageUrl:
      'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'WEIGHT',
    priceMinor: 4500,
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'fruits',
    storeSlug: 'el-souq',
    name: 'رمان',
    unit: 'KG',
    imageUrl:
      'https://images.unsplash.com/photo-1791370196104-3a49269dc4b6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'WEIGHT',
    priceMinor: 2000,
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'fruits',
    storeSlug: 'el-souq',
    name: 'عنب',
    unit: 'KG',
    imageUrl:
      'https://images.unsplash.com/photo-1631299106224-aae61c217164?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'WEIGHT',
    priceMinor: 4000,
    minQty: 1,
    qtyStep: 0.5,
  },

  // لحوم وفراخ
  {
    categorySlug: 'meat',
    storeSlug: 'el-amana',
    name: 'لحمة بلدي',
    unit: 'KG',
    imageUrl:
      'https://images.unsplash.com/photo-1606677661991-446cea8ee182?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'WEIGHT',
    priceMinor: 42000,
    description: 'بسعر اليوم من الأمانة',
    minQty: 0.5,
    qtyStep: 0.5,
    isFeatured: true,
  },
  {
    categorySlug: 'meat',
    storeSlug: 'aklyano',
    name: 'لحمة بلدي',
    unit: 'KG',
    imageUrl:
      'https://images.unsplash.com/photo-1606677661991-446cea8ee182?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'WEIGHT',
    priceMinor: 41000,
    description: 'بسعر اليوم من اكليانو',
    minQty: 0.5,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'chicken',
    storeSlug: 'chicken-supplier',
    name: 'فرخة كاملة',
    unit: 'PIECE',
    saleMode: 'PIECE_WEIGHT',
    imageUrl:
      'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    priceMinor: 7500,
    description: 'الكيلو القائم 75 ج',
    minQty: 1,
    qtyStep: 1,
    weightChoices: [1.5, 1.8, 2, 2.2, 2.5],
    isFeatured: true,
    optionGroupSlugs: ['chicken-cleaning'],
  },
  {
    categorySlug: 'chicken',
    storeSlug: 'chicken-supplier',
    name: 'صدور فراخ',
    imageUrl:
      'https://images.unsplash.com/photo-1682991136736-a2b44623eeba?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    unit: 'KG',
    saleMode: 'WEIGHT',
    priceMinor: 14000,
    description: 'صدور نضيفة بدون عضم',
    minQty: 0.5,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'chicken',
    storeSlug: 'chicken-supplier',
    name: 'أوراك فراخ',
    imageUrl:
      'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    unit: 'KG',
    saleMode: 'WEIGHT',
    priceMinor: 9500,
    description: 'أوراك طازة',
    minQty: 0.5,
    qtyStep: 0.5,
  },

  // سمك
  {
    categorySlug: 'fish',
    storeSlug: 'fish-supplier',
    name: 'سمك بلطي',
    imageUrl:
      'https://images.unsplash.com/photo-1576330383200-2bf325cfec52?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    unit: 'KG',
    saleMode: 'WEIGHT',
    priceMinor: 9000,
    description: 'طازج - اختار التجهيز',
    minQty: 1,
    qtyStep: 0.5,
    optionGroupSlugs: ['fish-prep'],
  },
  {
    categorySlug: 'fish',
    storeSlug: 'fish-supplier',
    name: 'سمك بوري',
    imageUrl:
      'https://images.unsplash.com/photo-1576330383200-2bf325cfec52?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    unit: 'KG',
    saleMode: 'WEIGHT',
    priceMinor: 13000,
    description: 'طازج',
    minQty: 1,
    qtyStep: 0.5,
    optionGroupSlugs: ['fish-prep'],
  },
  {
    categorySlug: 'fish',
    storeSlug: 'fish-supplier',
    name: 'سمك ماكريل',
    imageUrl:
      'https://images.unsplash.com/photo-1576330383200-2bf325cfec52?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    unit: 'KG',
    saleMode: 'WEIGHT',
    priceMinor: 11000,
    description: 'طازج',
    minQty: 1,
    qtyStep: 0.5,
    optionGroupSlugs: ['fish-prep'],
  },
  {
    categorySlug: 'fish',
    storeSlug: 'fish-supplier',
    name: 'جمبري',
    unit: 'KG',
    imageUrl:
      'https://images.unsplash.com/photo-1784043436793-d0139828a7f9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'WEIGHT',
    priceMinor: 32000,
    description: 'جمبري متوسط',
    minQty: 1,
    qtyStep: 0.5,
    optionGroupSlugs: ['fish-prep'],
  },

  // بقالة
  {
    categorySlug: 'groc',
    name: 'صلصة طماطم هاينز - 360 جم',
    unit: 'PACK',
    saleMode: 'UNIT',
    priceMinor: 3500,
    minQty: 1,
    qtyStep: 1,
    storeSlug: 'grocery-supplier',
    imageUrl:
      'https://imgs.search.brave.com/SIwxAdtS2pnnQ1c0Q1Cr7EK7vKb8V453t0Kt1poLvgk/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9hc3Nl/dHMua2VuenouY29t/L3Byb2R1Y3RzLzEx/NjkzOS8wMDFfRk1D/Ry0wMDIuanBlZw',
  },
  {
    categorySlug: 'groc',
    name: 'مربى فراولة حلواني - 340 جم',
    unit: 'PACK',
    saleMode: 'UNIT',
    priceMinor: 4000,
    minQty: 1,
    qtyStep: 1,
    storeSlug: 'grocery-supplier',
    imageUrl:
      'https://imgs.search.brave.com/B9IKJXheL-Ah7fGNESBcFgRAHCJHLLpHJlWWWfqMo8Y/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4u/c2FsbGEuc2Evdndh/eHkvdHd2SXRkNXds/OEc3Q0MxWnJDVWt1/WVYwUE9CUGdHcExX/dmNsRHVyay5wbmc',
  },
  {
    categorySlug: 'groc',
    name: 'أرز مصري الضحى - 5 كجم',
    unit: 'SACHET',
    saleMode: 'UNIT',
    priceMinor: 21999,
    minQty: 1,
    qtyStep: 1,
    storeSlug: 'grocery-supplier',
    imageUrl:
      'https://imgs.search.brave.com/oXxcOpE2-L_i71IVnYyPVPU5W6_4GtMSL3q48AQ4QJM/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9hc3Nl/dHMua2VuenouY29t/L3Byb2R1Y3RzLzEx/NjQyNC8xMTY0MjQt/MDAxXzYyMjMwMDA2/NjAwMjctTi5qcGc',
  },
  {
    categorySlug: 'groc',
    name: 'زيت دوار الشمس عافية - 0.7 لتر',
    unit: 'BOTTLE',
    saleMode: 'UNIT',
    priceMinor: 8750,
    discountKind: 'FIXED',
    discountValue: 1000,
    isFeatured: true,
    storeSlug: 'grocery-supplier',
    imageUrl:
      'https://imgs.search.brave.com/YgMbVYlI2em5OOKPI_lzCGGWDPyk3d-E5B0aepxP0FE/rs:fit:500:0:1:0/g:ce/aHR0cDovL2FtYXJ0/LmNvbS5lZy9pbWFn/ZXMvdGh1bWJzLzAw/MTE4MTFfYWZpYS1z/dW5mbG93ZXItb2ls/LTIybF81MTAuanBl/Zw',
  },
  {
    categorySlug: 'dairy',
    storeSlug: 'dairy-supplier',
    name: 'لبن بلدي طازج',
    unit: 'LITER',
    imageUrl:
      'https://images.unsplash.com/photo-1634141510639-d691d86f47be?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    saleMode: 'WEIGHT',
    priceMinor: 3200,
    description: 'كامل الدسم مبستر أو سايب',
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'dairy',
    storeSlug: 'dairy-supplier',
    name: 'جبنة قريش فلاحي',
    unit: 'KG',
    imageUrl:
      'https://imgs.search.brave.com/Ys3tUM-GCxcte-cxpYxdPbkSK8FQpZLXZ2isnWoyk5E/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbWcu/eW91bTcuY29tL0Fy/dGljbGVJbWdzLzIw/MjMvMTIvMjAvMzU2/NzY1LSVEOCVBNyVE/OSU4NCVEOCVBQyVE/OCVBOCVEOSU4NiVE/OCVBOS0lRDglQTcl/RDklODQlRDklODIl/RDglQjElRDklOEEl/RDglQjQuanBn',
    saleMode: 'WEIGHT',
    priceMinor: 8500,
    description: 'طازة وملح خفيف',
    minQty: 0.25,
    qtyStep: 0.25,
  },
  {
    categorySlug: 'dairy',
    storeSlug: 'dairy-supplier',
    name: 'جبنة رومي قديمة',
    unit: 'KG',
    imageUrl:
      'https://imgs.search.brave.com/a8JrUP-myl9jEDuu0m15rKFCgDVfzrQiQTE5LSeQfGE/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/bWVuLW1hc3IuY29t/L2Nkbi9zaG9wL2Zp/bGVzL1doYXRzQXBw/SW1hZ2UyMDIzLTEx/LTE2YXQ4LjUwLjM3/UE1fMi5qcGc_dj0x/NzY4MDQzOTYwJndp/ZHRoPTE5NDY',
    saleMode: 'WEIGHT',
    priceMinor: 26000,
    description: 'تقطيع شرائح',
    minQty: 0.25,
    qtyStep: 0.25,
  },
  {
    categorySlug: 'dairy',
    storeSlug: 'dairy-supplier',
    name: 'زبادي بلدي',
    unit: 'PIECE',
    imageUrl:
      'https://imgs.search.brave.com/jcGnfIfumNsIMS4OrSWf-mI74bnNRHd9fledAr-NHMs/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9hbGto/YW4tbWFydC5jb20v/aW1hZ2VzL3RodW1i/cy8wMDA1NzE3Xy03/NS1fNDUwLmpwZWc',
    saleMode: 'UNIT',
    priceMinor: 800,
    description: 'علبة فخار أو بلاستيك كبيرة',
    minQty: 1,
    qtyStep: 1,
  },

  // مشروبات (drinks)
  {
    categorySlug: 'drinks',
    storeSlug: 'grocery-supplier',
    name: 'مياه معدنية كبيرة 1.5 لتر',
    unit: 'BOTTLE',
    imageUrl:
      'https://imgs.search.brave.com/wDPgk-Vz4iWxD3bjLqMJ4rSfB4jYLIvOxyyHNseQZG0/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9mLm5v/b25jZG4uY29tL3Av/djE1OTg0MjY0ODUv/TjEyMjc5MjE3QV8y/LmpwZz93aWR0aD04/MDA',
    saleMode: 'UNIT',
    priceMinor: 1000,
    minQty: 1,
    qtyStep: 1,
  },
  {
    categorySlug: 'drinks',
    storeSlug: 'grocery-supplier',
    name: 'عصير مانجو طبيعي 1 لتر',
    unit: 'PACK',
    imageUrl:
      'https://imgs.search.brave.com/3DUzJLzp-4-LtUhSoZ843qS4fpn6FhXC4VJk8hARj0A/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NzFIQ0FycmxiTUwu/anBn',
    saleMode: 'UNIT',
    priceMinor: 3500,
    description: 'بيور بدون سكر مضاف',
    minQty: 1,
    qtyStep: 1,
  },
  {
    categorySlug: 'drinks',
    storeSlug: 'grocery-supplier',
    name: 'شاي أسود ناعم 250 جرام',
    unit: 'PACK',
    imageUrl:
      'https://imgs.search.brave.com/OIVJxvM5aw_KqhqHEZyO4CWkhPIQxRt9roHj9bqYuPI/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4u/c2hvcnRwaXhlbC5h/aS9zcGFpL3FfbG9z/c3krcmV0X2ltZyt0/b19hdXRvL2h0dHBz/Oi8vYmFkYXlhbWFy/a2V0cy5jb20vd3At/Y29udGVudC91cGxv/YWRzLzIwMjMvMDYv/U2NyZWVuc2hvdF8l/RDklQTIlRDklQTAl/RDklQTIlRDklQTMt/JUQ5JUEwJUQ5JUE2/LSVEOSVBMSVEOSVB/NS0lRDklQTAlRDkl/QTctJUQ5JUExJUQ5/JUE1LSVEOSVBMiVE/OSVBNC0lRDklQTQl/RDklQTQlRDklQTIt/ZWRpdF9jb20uYW5k/cm9pZC5jaHJvbWUu/anBn',
    saleMode: 'UNIT',
    priceMinor: 5500,
    minQty: 1,
    qtyStep: 1,
  },

  // منظفات ومستلزمات المنزل (clean)
  {
    categorySlug: 'clean',
    storeSlug: 'clean-supplier',
    name: 'مسحوق غسيل أوتوماتيك 2.5 كيلو',
    unit: 'PACK',
    imageUrl:
      'https://imgs.search.brave.com/OwoERw2lV_rU0GP6n65fziytGWB3yZpsBPbgGS9nO5A/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9lZy5q/dW1pYS5pcy91bnNh/ZmUvZml0LWluLzUy/MHg1MjAvZmlsdGVy/czpmaWxsKHdoaXRl/KS9wcm9kdWN0LzI0/Lzk1NzY0Mi8xLmpw/Zz83Mjc0',
    saleMode: 'UNIT',
    priceMinor: 16500,
    description: 'برائحة اللافندر',
    minQty: 1,
    qtyStep: 1,
  },
  {
    categorySlug: 'clean',
    storeSlug: 'clean-supplier',
    name: 'سائل تنظيف أطباق 1 لتر',
    unit: 'BOTTLE',
    imageUrl:
      'https://imgs.search.brave.com/Cbsj1wZ8LskDe6yaRoSc1jFrtXF2WAacdmxpRYBpgo0/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NTFCYkdhQjI5V0wu/anBn',
    saleMode: 'UNIT',
    priceMinor: 3800,
    description: 'مركز بالليمون',
    minQty: 1,
    qtyStep: 1,
  },
  {
    categorySlug: 'clean',
    storeSlug: 'clean-supplier',
    name: 'مناديل سحب 550 منديل',
    unit: 'PACK',
    imageUrl:
      'https://imgs.search.brave.com/3QPjbq9t90k8hvcNWAH2XFCN9x4TsqkbjonuzX6d8kE/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4u/c2FsbGEuc2EvUXJh/cHEvRm1YZlN3d0tJ/dmpibko5ZHNZcTlS/ajhVS1k0N3VqZEE0/UEN3a081bi5qcGc',
    saleMode: 'UNIT',
    priceMinor: 2800,
    description: '3 طبقات ناعمة',
    minQty: 1,
    qtyStep: 1,
  },

  // مخبوزات (bakery)
  {
    categorySlug: 'bakery',
    storeSlug: 'bakery-supplier',
    name: 'عيش فينو طازج',
    unit: 'PACK',
    imageUrl:
      'https://imgs.search.brave.com/y0JaeL7FatVtRh1jXgoyxAeKMcpbRB1mp0wh4bEQ8Gw/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5lbGJhbGFkLm5l/d3MvQXJ0aWNsZVVw/bG9hZC8yMDI1LzEw/LzIvaHE3MjAtMV82/MjdfMDIwMTM2Lmpw/Zw',
    saleMode: 'UNIT',
    priceMinor: 1500,
    description: 'كيس 5 أرغفة',
    minQty: 1,
    qtyStep: 1,
  },
  {
    categorySlug: 'bakery',
    storeSlug: 'bakery-supplier',
    name: 'توست أبيض شرائح',
    unit: 'PACK',
    imageUrl:
      'https://imgs.search.brave.com/snQSjNxrN7kF4jOrTS5LiHyalVmi4Rz19HV7ybnY26Q/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NzFZTVpJOUNncUwu/anBn',
    saleMode: 'UNIT',
    priceMinor: 3200,
    description: 'طري وطازج يومياً',
    minQty: 1,
    qtyStep: 1,
  },

  // أدوية (pharm)
  {
    categorySlug: 'pharm',
    storeSlug: 'pharma',
    name: 'بنادول أدفانس',
    unit: 'BOX',
    imageUrl:
      'https://imgs.search.brave.com/k_5dk_j_DWv1YIRV30KBicdPe8_GjKXjeCR-cwHohPM/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly90aGV0/cnVzdHBoYXJtYWN5/LmNvbS9jZG4vc2hv/cC9maWxlcy9wYW5h/ZG9sLWFkdmFuY2Uu/anBnP2Nyb3A9Y2Vu/dGVyJmhlaWdodD0x/MDAwJnY9MTc1NDE0/NzQ3MSZ3aWR0aD0x/MDAw',
    saleMode: 'UNIT',
    priceMinor: 4200,
    description: 'علبة 24 قرص',
    minQty: 1,
    qtyStep: 1,
  },
  {
    categorySlug: 'pharm',
    storeSlug: 'pharma',
    name: 'كونجستال',
    unit: 'STRIP',
    imageUrl:
      'https://imgs.search.brave.com/gO7sPJWzvduhl7GiMRijiTI9hPko-7Jw1ucbLBgnbug/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4u/Y2hlZmFhLmNvbS9m/aWx0ZXJzOmZvcm1h/dCh3ZWJwKS9wdWJs/aWMvdXBsb2Fkcy9w/cm9kdWN0cy9jb25n/ZXN0YWwtdGFiLTEx/NjY4OTM1MjIxLnBu/Zw',
    saleMode: 'UNIT',
    priceMinor: 2500,
    description: 'شريط 10 أقراص',
    minQty: 1,
    qtyStep: 1,
  },
  {
    categorySlug: 'pharm',
    storeSlug: 'pharma',
    name: 'كحول إيثيلي مطهر 70% (بخاخ)',
    unit: 'BOTTLE',
    imageUrl:
      'https://imgs.search.brave.com/HkNntOPsOn6rwVERnEILJkXckEQHa6aIlDv_lJemDdM/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/MzFXV3JzUDhnUUwu/anBn',
    saleMode: 'UNIT',
    priceMinor: 2200,
    description: 'عبوة 100 مل',
    minQty: 1,
    qtyStep: 1,
  },

  // منتجات المتاجر (الشريك الأول: كشري الزهراء)
  {
    storeSlug: 'el-zahraa',
    menuSection: 'كشري',
    name: 'كشري صغير',
    unit: 'DISH',
    saleMode: 'UNIT',
    priceMinor: 2500,
    minQty: 1,
    qtyStep: 1,
    imageUrl:
      'https://media.istockphoto.com/id/1991078114/photo/egyptian-koshary-images-traditional-egyptian-food-delicious-koshary-or-kushari.webp?a=1&b=1&s=612x612&w=0&k=20&c=phX0ODkrYwLLfzJA0MGtEztOlZgc6iIwCaqRqF8Br14=',
  },
  {
    storeSlug: 'el-zahraa',
    menuSection: 'كشري',
    name: 'كشري وسط',
    unit: 'DISH',
    saleMode: 'UNIT',
    priceMinor: 3500,
    minQty: 1,
    qtyStep: 1,
    imageUrl:
      'https://media.istockphoto.com/id/1991078114/photo/egyptian-koshary-images-traditional-egyptian-food-delicious-koshary-or-kushari.webp?a=1&b=1&s=612x612&w=0&k=20&c=phX0ODkrYwLLfzJA0MGtEztOlZgc6iIwCaqRqF8Br14=',
  },
  {
    storeSlug: 'el-zahraa',
    menuSection: 'كشري',
    name: 'كشري كبير',
    unit: 'DISH',
    saleMode: 'UNIT',
    priceMinor: 4500,
    minQty: 1,
    qtyStep: 1,
    imageUrl:
      'https://media.istockphoto.com/id/1991078114/photo/egyptian-koshary-images-traditional-egyptian-food-delicious-koshary-or-kushari.webp?a=1&b=1&s=612x612&w=0&k=20&c=phX0ODkrYwLLfzJA0MGtEztOlZgc6iIwCaqRqF8Br14=',
  },
  {
    storeSlug: 'el-zahraa',
    menuSection: 'طواجن',
    name: 'طاجن فراخ',
    unit: 'DISH',
    saleMode: 'UNIT',
    priceMinor: 6000,
    minQty: 1,
    qtyStep: 1,
    imageUrl:
      'https://imgs.search.brave.com/qQ1VUIjcs3iNtkQ87VCfH56PnE2HnZqgpruDbkKPDN8/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/ZWxhb3Nib2EuY29t/L3dwLWNvbnRlbnQv/dXBsb2Fkcy8yMDI2/LzA2L2VsYW9zYm9h/MTcyNTAuanBn',
  },
  {
    storeSlug: 'el-zahraa',
    menuSection: 'طواجن',
    name: 'طاجن لحمة',
    unit: 'DISH',
    saleMode: 'UNIT',
    priceMinor: 6000,
    minQty: 1,
    qtyStep: 1,
    imageUrl:
      'https://imgs.search.brave.com/3-PmhOgkS99Tedm36-9EzvnyJ_eryPMtmGdwClXUTqI/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/Y2Fpcm8yNC5jb20v/VXBsb2FkL2xpYmZp/bGVzLzE0MC8wLzIw/OC5qcGVn',
  },

  // منتجات المتاجر (الشريك الثاني: بيتزا بلازا)
  {
    storeSlug: 'pizza-plaza',
    menuSection: 'بيتزا',
    name: 'بيتزا ناشفيل',
    unit: 'PIECE',
    saleMode: 'UNIT',
    priceMinor: 18000,
    minQty: 1,
    qtyStep: 1,
    imageUrl: 'https://www.pizzaplazaeg.com/api/media/file/1.webp',
  },
  {
    storeSlug: 'pizza-plaza',
    menuSection: 'بيتزا',
    name: 'بيتزا كرانشي بارد',
    unit: 'PIECE',
    saleMode: 'UNIT',
    priceMinor: 19000,
    minQty: 1,
    qtyStep: 1,
    imageUrl:
      'https://www.pizzaplazaeg.com/api/media/file/815de3cb-2c77-42f3-adf6-7f207c07b383.webp',
  },
  {
    storeSlug: 'pizza-plaza',
    menuSection: 'سندوتشات',
    name: 'دبل تشكن برجر',
    unit: 'PIECE',
    saleMode: 'UNIT',
    priceMinor: 17000,
    minQty: 1,
    qtyStep: 1,
    imageUrl:
      'https://www.pizzaplazaeg.com/api/media/file/Daaboul%20cheese%20burger.webp',
  },
  {
    storeSlug: 'pizza-plaza',
    menuSection: 'سندوتشات',
    name: 'سندوتش شاورما لحم - بوكس',
    unit: 'PIECE',
    saleMode: 'UNIT',
    priceMinor: 5500,
    minQty: 1,
    qtyStep: 1,
    imageUrl:
      'https://www.pizzaplazaeg.com/api/media/file/WhatsApp%20Image%202026-08-30%20at%202.44.24%20PM-4.webp',
  },
  {
    storeSlug: 'pizza-plaza',
    menuSection: 'سندوتشات',
    name: 'سندوتش شاورما فراخ - بوكس',
    unit: 'PIECE',
    saleMode: 'UNIT',
    priceMinor: 5500,
    minQty: 1,
    qtyStep: 1,
    imageUrl:
      'https://www.pizzaplazaeg.com/api/media/file/WhatsApp%20Image%202026-08-30%20at%202.44.24%20PM-8.webp',
  },
  {
    storeSlug: 'pizza-plaza',
    menuSection: 'سندوتشات',
    name: 'سنداوتش سوبر ميجا تشكن',
    unit: 'PIECE',
    saleMode: 'UNIT',
    priceMinor: 15000,
    minQty: 1,
    qtyStep: 1,
    imageUrl:
      'https://www.pizzaplazaeg.com/api/media/file/%D8%B3%D9%88%D8%A8%D8%B1%20%D9%85%D9%8A%D8%AC%D8%A7.jpg-2.webp',
  },
  {
    storeSlug: 'pizza-plaza',
    menuSection: 'مكرونات',
    name: 'مكرونة كرانشي',
    unit: 'DISH',
    saleMode: 'UNIT',
    priceMinor: 12000,
    minQty: 1,
    qtyStep: 1,
    imageUrl:
      'https://www.pizzaplazaeg.com/api/media/file/WhatsApp%20Image%202026-08-30%20at%206.53.47%20PM.webp',
  },
  {
    storeSlug: 'pizza-plaza',
    menuSection: 'حلويات',
    name: 'قشطوطه فراوله',
    unit: 'PIECE',
    saleMode: 'UNIT',
    priceMinor: 7500,
    minQty: 1,
    qtyStep: 1,
    imageUrl:
      'https://www.pizzaplazaeg.com/api/media/file/5eeac3f5-ed6f-47c6-8265-902762473121.webp',
  },
  {
    storeSlug: 'pizza-plaza',
    menuSection: 'حلويات',
    name: 'كنافه مانجا',
    unit: 'PIECE',
    saleMode: 'UNIT',
    priceMinor: 5000,
    minQty: 1,
    qtyStep: 1,
    imageUrl:
      'https://www.pizzaplazaeg.com/api/media/file/WhatsApp%20Image%202026-11-06%20at%204.39.39%20PM.webp',
  },
  {
    storeSlug: 'pizza-plaza',
    menuSection: 'حلويات',
    name: 'كنافه دبي',
    unit: 'PIECE',
    saleMode: 'UNIT',
    priceMinor: 9900,
    minQty: 1,
    qtyStep: 1,
    imageUrl:
      'https://www.pizzaplazaeg.com/api/media/file/645417531_122238068450091306_3556290616420995126_n.webp',
  },
  {
    storeSlug: 'pizza-plaza',
    menuSection: 'إضافات وصوصات',
    name: 'صوص تكساس',
    unit: 'PIECE',
    saleMode: 'UNIT',
    priceMinor: 3500,
    minQty: 1,
    qtyStep: 1,
    imageUrl:
      'https://www.pizzaplazaeg.com/api/media/file/%D8%AA%D9%83%D8%B3%D8%A7%D8%B3%202.webp',
  },
];

// مجموعات الخيارات (تجهيز السمك / تنضيف الفراخ)
// ⚠️ أسعار التجهيز للسمك أرقام مبدئية - عدّلها من لوحة الأدمن
export const optionGroups = [
  {
    slug: 'fish-prep',
    name: 'تجهيز السمك',
    minSelect: 0,
    maxSelect: 1,
    sortOrder: 1,
    options: [
      {
        name: 'تنضيف فقط',
        pricing: 'PER_KG' as const,
        priceMinor: 500,
        sortOrder: 1,
      },
      {
        name: 'تحمير',
        pricing: 'PER_KG' as const,
        priceMinor: 1500,
        sortOrder: 2,
      },
      {
        name: 'شوي',
        pricing: 'PER_KG' as const,
        priceMinor: 2000,
        sortOrder: 3,
      },
    ],
  },
  {
    slug: 'chicken-cleaning',
    name: 'تنضيف الفراخ',
    minSelect: 0,
    maxSelect: 1,
    sortOrder: 2,
    options: [
      // 15 ج للفرخة الواحدة
      {
        name: 'تنضيف',
        pricing: 'PER_UNIT' as const,
        priceMinor: 1500,
        sortOrder: 1,
      },
      {
        name: 'شوي',
        pricing: 'PER_UNIT' as const,
        priceMinor: 3500,
        sortOrder: 1,
      },
    ],
  },
];

// خصومات (النسبة بالـ bps: 1000 = 10%)
export const discounts = [
  {
    name: 'خصم الترحيب',
    code: 'WELCOME10',
    kind: 'PERCENT' as const,
    value: 1000,
    minSubtotalMinor: 10000,
    maxDiscountMinor: 5000,
  },
  {
    name: 'خصم 20 جنيه على الطلبات فوق 300',
    code: null,
    kind: 'FIXED' as const,
    value: 2000,
    minSubtotalMinor: 30000,
    maxDiscountMinor: null,
  },
];
