import { categoryIcon, categoryTone } from "./CategoryIcon";
import { cn } from "@/lib/utils";

export function ProductImage({
  src,
  alt,
  slug,
  toneIndex = 0,
  className,
  iconClassName,
}: {
  src: string | null | undefined;
  alt: string;
  slug?: string;
  toneIndex?: number;
  className?: string;
  iconClassName?: string;
}) {
  if (src) {
    return <img src={src} alt={alt} loading="lazy" className={cn("size-full object-contain", className)} />;
  }
  const Icon = categoryIcon(slug);
  return (
    <div className={cn("grid size-full place-items-center", categoryTone(toneIndex), className)} aria-label={alt}>
      <Icon className={cn("size-1/3 opacity-80", iconClassName)} strokeWidth={1.5} />
    </div>
  );
}
