import Link from "next/link";
import { CardPreview } from "@/components/card-preview";
import { PRODUCT, defaultConfiguration, productHref } from "@/lib/catalog";
import { formatUsd } from "@/lib/money";
import { fromPrice } from "@/lib/pricing";

export function CatalogCard() {
  return (
    <article className="w-[180px] max-w-full">
      <Link href={productHref()} className="block rounded-xl outline-offset-4">
        <div className="flex aspect-square items-center justify-center rounded-xl bg-paper-deep p-4">
          <CardPreview compact config={defaultConfiguration("85x55")} />
        </div>
        <h3 className="mt-3 text-sm font-medium leading-5">{PRODUCT.name}</h3>
        <p className="mt-1 text-sm text-ink-soft">Couche 300 g · desde 50 u.</p>
        <p className="mt-2 text-base font-semibold">{formatUsd(fromPrice("85x55"))}</p>
      </Link>
    </article>
  );
}
