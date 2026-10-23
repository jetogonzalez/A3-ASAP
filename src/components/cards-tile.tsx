import Link from "next/link";
import { ProductPhoto } from "@/components/product-photo";
import { PRODUCT, defaultConfiguration, productHref } from "@/lib/catalog";
import { formatUsd } from "@/lib/money";
import { quote } from "@/lib/pricing";

/* Las tarjetas de presentación en el slider: son las únicas con precio en línea. */
export function CardsTile() {
  const price = formatUsd(quote({ ...defaultConfiguration("85x55"), quantity: 100 }).printingCents);
  return (
    <Link href={productHref()} className="family-card group flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-sheet">
      <span className="relative block aspect-[4/3] w-full overflow-hidden bg-tint-lilac">
        <ProductPhoto
          slug="tarjetas-de-presentacion"
          alt="Tarjetas de presentación"
          sizes="(min-width: 1024px) 280px, (min-width: 640px) 42vw, 74vw"
          className="family-photo"
        />
      </span>
      <span className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-semibold text-[#2d43d6]">Tarjetas</span>
        <span className="text-base font-semibold tracking-tight sm:text-lg">{PRODUCT.name}</span>
        <span className="text-sm leading-5 text-ink-soft">Couché 300 g, mate o brillante, con acabados.</span>
        <span className="mt-auto flex flex-wrap gap-1.5 pt-3 text-xs font-semibold">
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[#2d43d6]">Pídelo en línea · desde {price}</span>
        </span>
      </span>
    </Link>
  );
}
