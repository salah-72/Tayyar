import {
  Beef,
  Carrot,
  Croissant,
  CupSoda,
  Drumstick,
  Fish,
  Milk,
  Package,
  Pill,
  Snowflake,
  SprayCan,
  UtensilsCrossed,
  Wheat,
  type LucideIcon,
} from "lucide-react";

const BY_SLUG: Record<string, LucideIcon> = {
  veg: Carrot,
  meat: Beef,
  chicken: Drumstick,
  fish: Fish,
  groc: Wheat,
  dairy: Milk,
  drinks: CupSoda,
  clean: SprayCan,
  bakery: Croissant,
  frozen: Snowflake,
  pharm: Pill,
  restaurant: UtensilsCrossed,
};

const TONES = [
  "bg-primary-soft text-primary",
  "bg-highlight-soft text-highlight-foreground",
  "bg-info/10 text-info",
  "bg-sale/10 text-sale",
  "bg-success/10 text-success",
];

export function categoryIcon(slug: string | undefined) {
  return (slug && BY_SLUG[slug]) || Package;
}

export function categoryTone(index: number) {
  return TONES[((index % TONES.length) + TONES.length) % TONES.length];
}
