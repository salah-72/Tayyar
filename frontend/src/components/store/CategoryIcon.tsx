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

const GREEN = "bg-primary-soft text-primary";
const AMBER = "bg-highlight-soft text-highlight-foreground";
const BLUE = "bg-info/10 text-info";
const RED = "bg-sale/10 text-sale";

const TONES = [GREEN, AMBER, BLUE, RED, "bg-success/10 text-success"];

// A category keeps the same colour everywhere: fresh = green, meat = red, poultry/bakery/dry goods = amber,
// fish/dairy/frozen/drinks/cleaning = blue. Unknown (new) categories fall back to rotating by position.
const TONE_BY_SLUG: Record<string, string> = {
  veg: GREEN,
  pharm: GREEN,
  meat: RED,
  chicken: AMBER,
  bakery: AMBER,
  groc: AMBER,
  restaurant: AMBER,
  fish: BLUE,
  dairy: BLUE,
  frozen: BLUE,
  drinks: BLUE,
  clean: BLUE,
};

export function categoryIcon(slug: string | undefined) {
  return (slug && BY_SLUG[slug]) || Package;
}

export function categoryTone(index: number, slug?: string) {
  if (slug && TONE_BY_SLUG[slug]) return TONE_BY_SLUG[slug];
  return TONES[((index % TONES.length) + TONES.length) % TONES.length];
}
