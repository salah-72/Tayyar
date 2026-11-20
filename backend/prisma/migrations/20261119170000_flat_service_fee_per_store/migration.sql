-- رسوم الخدمة بقت مبلغ ثابت على كل محل/مصدر مختلف في الأوردر (بالقرش، 1000 = 10 جنيه)
ALTER TABLE "Settings" ADD COLUMN "serviceFeePerStoreMinor" INTEGER NOT NULL DEFAULT 1000;

-- إلغاء نسبة المطاعم (العمود فضل موجود عشان الكود القديم ما يقعش أثناء النشر)
UPDATE "Store" SET "commissionBps" = 0 WHERE "commissionBps" <> 0;
