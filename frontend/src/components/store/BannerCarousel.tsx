import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "@tanstack/react-router";
import groceries from "@/assets/banner-groceries.jpg";
import restaurants from "@/assets/banner-restaurants.jpg";
import delivery from "@/assets/banner-delivery.jpg";
import { cn } from "@/lib/utils";

export type Banner = { title: string; subtitle: string; cta: string; image: string; to: "/categories" | "/cart" | "/"; hash?: string };

export function defaultBanners(freeDeliveryLabel: string | null): Banner[] {
  return [
    { title: "طازة كل يوم", subtitle: "خضار وفاكهة ولحوم وبقالة لحد باب البيت", cta: "اطلب دلوقتي", image: groceries, to: "/categories" },
    { title: "أكل المطاعم", subtitle: "كشري وبيتزا وكريب من أحسن المطاعم حواليك", cta: "شوف المنيو", image: restaurants, to: "/", hash: "restaurants" },
    {
      title: freeDeliveryLabel ? "توصيل مجاني" : "توصيل سريع",
      subtitle: freeDeliveryLabel ?? "الطيار هيوصلك في أسرع وقت",
      cta: "ابدأ التسوق",
      image: delivery,
      to: "/categories",
    },
  ];
}

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [ref, api] = useEmblaCarousel({ loop: true, direction: "rtl" });
  const [index, setIndex] = useState(0);
  const onSelect = useCallback(() => api && setIndex(api.selectedScrollSnap()), [api]);

  useEffect(() => {
    if (!api) return;
    api.on("select", onSelect);
    const t = setInterval(() => api.scrollNext(), 5000);
    return () => {
      clearInterval(t);
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  return (
    <div>
      <div className="overflow-hidden rounded-3xl" ref={ref}>
        <div className="flex">
          {banners.map((b, i) => (
            <Link
              key={b.title}
              to={b.to}
              hash={b.hash}
              className="relative min-w-0 shrink-0 grow-0 basis-full"
            >
              <img
                src={b.image}
                alt={b.title}
                width={1536}
                height={768}
                loading={i === 0 ? "eager" : "lazy"}
                className="aspect-[2/1] w-full object-cover md:aspect-[3/1]"
              />
              <div className="absolute inset-y-0 start-0 flex w-3/5 flex-col justify-center gap-2 bg-gradient-to-l from-transparent via-primary-deep/60 to-primary-deep/90 p-5 text-primary-foreground md:p-10">
                <h2 className="text-xl font-bold leading-tight md:text-4xl">{b.title}</h2>
                <p className="line-clamp-2 text-xs opacity-90 md:text-base">{b.subtitle}</p>
                <span className="mt-1 w-fit rounded-full bg-card px-3.5 py-1.5 text-xs font-semibold text-primary-deep md:text-sm">
                  {b.cta}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {banners.map((b, i) => (
          <button
            key={b.title}
            aria-label={`بانر ${i + 1}`}
            onClick={() => api?.scrollTo(i)}
            className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-primary" : "w-1.5 bg-border")}
          />
        ))}
      </div>
    </div>
  );
}
