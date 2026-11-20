export type SeedProduct = {
  categorySlug?: string;
  storeSlug?: string;
  menuSection?: string;
  name: string;
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
  { slug: 'veg', name: 'خضار وفاكهة', sortOrder: 1 },
  { slug: 'meat', name: 'لحمة', sortOrder: 2 },
  { slug: 'chicken', name: 'فراخ', sortOrder: 3 },
  { slug: 'fish', name: 'سمك', sortOrder: 4 },
  { slug: 'groc', name: 'بقالة وتموين', sortOrder: 5 },
  { slug: 'dairy', name: 'ألبان ومنتجاتها', sortOrder: 6 },
  { slug: 'drinks', name: 'مشروبات', sortOrder: 7 },
  { slug: 'clean', name: 'منظفات ومستلزمات المنزل', sortOrder: 8 },
  { slug: 'bakery', name: 'مخبوزات', sortOrder: 9 },
  { slug: 'frozen', name: 'مجمدات', sortOrder: 10 },
  { slug: 'pharm', name: 'أدوية', sortOrder: 11 },
];

export const stores = [
  // موردين (مش بيظهروا للعميل - بس بيستخدموا في قائمة المشتريات)
  {
    slug: 'el-amana',
    name: 'الأمانة',
    type: 'SUPPLIER' as const,
    sortOrder: 10,
  },
  {
    slug: 'aklyano',
    name: 'اكليانو',
    type: 'SUPPLIER' as const,
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
    name: 'طماطم بلدي',
    unit: 'KG',
    saleMode: 'WEIGHT',
    priceMinor: 1350,
    description: 'حمرا وطازة',
    minQty: 1,
    qtyStep: 0.5,
    weightChoices: [0.25, 0.5, 1, 2],
  },
  {
    categorySlug: 'veg',
    name: 'موز بلدي',
    unit: 'KG',
    saleMode: 'WEIGHT',
    priceMinor: 3500,
    minQty: 1,
    qtyStep: 0.5,
    weightChoices: [0.5, 1, 2],
  },
  {
    categorySlug: 'veg',
    name: 'خيار',
    unit: 'KG',
    saleMode: 'WEIGHT',
    priceMinor: 2200,
    description: 'خيار مقرمش للسلطة',
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'veg',
    name: 'فلفل رومي',
    unit: 'KG',
    saleMode: 'WEIGHT',
    priceMinor: 4500,
    description: 'للحشي والسلطة',
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'veg',
    name: 'بصل',
    unit: 'KG',
    saleMode: 'WEIGHT',
    priceMinor: 1500,
    description: 'للطبيخ والتحمير',
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'veg',
    name: 'بطاطس',
    unit: 'KG',
    saleMode: 'WEIGHT',
    priceMinor: 2000,
    description: 'للتحمير والسلق',
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'veg',
    name: 'ليمون',
    unit: 'KG',
    saleMode: 'WEIGHT',
    priceMinor: 4000,
    minQty: 1,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'veg',
    name: 'نعناع',
    unit: 'BUNCH',
    saleMode: 'UNIT',
    priceMinor: 500,
    description: 'ربطة نعناع أخضر',
    minQty: 1,
    qtyStep: 1,
  },

  // لحوم وفراخ
  {
    categorySlug: 'meat',
    storeSlug: 'el-amana',
    name: 'لحمة من الأمانة',
    unit: 'KG',
    saleMode: 'WEIGHT',
    priceMinor: 32000,
    description: 'بسعر اليوم من الأمانة',
    minQty: 0.5,
    qtyStep: 0.5,
    isFeatured: true,
  },
  {
    categorySlug: 'meat',
    storeSlug: 'aklyano',
    name: 'لحمة من اكليانو',
    unit: 'KG',
    saleMode: 'WEIGHT',
    priceMinor: 35000,
    description: 'بسعر اليوم من اكليانو',
    minQty: 0.5,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'chicken',
    name: 'فرخة كاملة - قائم',
    unit: 'PIECE',
    saleMode: 'PIECE_WEIGHT',
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
    name: 'صدور فراخ',
    unit: 'KG',
    saleMode: 'WEIGHT',
    priceMinor: 14000,
    description: 'صدور نضيفة بدون عضم',
    minQty: 0.5,
    qtyStep: 0.5,
  },
  {
    categorySlug: 'chicken',
    name: 'أوراك فراخ',
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
    name: 'سمك بلطي',
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
    name: 'سمك بوري',
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
    name: 'سمك ماكريل',
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
    name: 'جمبري',
    unit: 'KG',
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
  },
  {
    categorySlug: 'groc',
    name: 'مربى فراولة حلواني - 340 جم',
    unit: 'PACK',
    saleMode: 'UNIT',
    priceMinor: 4000,
    minQty: 1,
    qtyStep: 1,
  },
  {
    categorySlug: 'groc',
    name: 'أرز مصري الضحى - 5 كجم',
    unit: 'SACHET',
    saleMode: 'UNIT',
    priceMinor: 21999,
    minQty: 1,
    qtyStep: 1,
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
  },
  {
    storeSlug: 'el-zahraa',
    menuSection: 'طواجن',
    name: 'طاجن معكرونة بشاميل',
    unit: 'DISH',
    saleMode: 'UNIT',
    priceMinor: 6000,
    minQty: 1,
    qtyStep: 1,
  },

  // منتجات المتاجر (الشريك الثاني: بيتزا بلازا)
  {
    storeSlug: 'pizza-plaza',
    menuSection: 'بيتزا',
    name: 'بيتزا مارجريتا',
    unit: 'PIECE',
    saleMode: 'UNIT',
    priceMinor: 9000,
    minQty: 1,
    qtyStep: 1,
  },
  {
    storeSlug: 'pizza-plaza',
    menuSection: 'بيتزا',
    name: 'بيتزا بيبروني',
    unit: 'PIECE',
    saleMode: 'UNIT',
    priceMinor: 12000,
    minQty: 1,
    qtyStep: 1,
  },
  {
    storeSlug: 'pizza-plaza',
    menuSection: 'كريب',
    name: 'كريب فراخ',
    unit: 'PIECE',
    saleMode: 'UNIT',
    priceMinor: 6000,
    minQty: 1,
    qtyStep: 1,
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
