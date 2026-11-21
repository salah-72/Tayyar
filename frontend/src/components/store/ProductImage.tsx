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
    // object-cover: الصورة بتملا المربع وبتتقص من الأطراف، فصور بأي مقاس (طولي/عرضي) بتطلع شكلها واحد.
    // decoding=async علشان الصور الكبيرة (روابط من مواقع خارجية بتيجي بمقاسها الأصلي) ما تعلّقش الصفحة.
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn("size-full bg-muted object-cover", className)}
      />
    );
  }
  const Icon = categoryIcon(slug);
  return (
    <div
      className={cn("grid size-full place-items-center", categoryTone(toneIndex, slug), className)}
      aria-label={alt}
    >
      <Icon className={cn("size-1/3 opacity-80", iconClassName)} strokeWidth={1.5} />
    </div>
  );
}
