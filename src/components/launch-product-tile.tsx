import Link from "next/link";
import { ProductIllustration } from "@/components/product-illustration";
import { inkFor } from "@/lib/palette";
import { launchProductHref, type LaunchProduct } from "@/lib/launch-products";

/** Tarjeta de un producto de lanzamiento: lleva a su página para armarlo. */
export function LaunchProductTile({ product, familyLabel }: { product: LaunchProduct; familyLabel?: string }) {
  const ink = inkFor(product.family);
  return (
    <Link
      href={launchProductHref(product)}
      className="family-card group flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-sheet"
    >
      <ProductIllustration productId={product.id} family={product.family} className="aspect-[4/3] w-full" />
      <span className="flex flex-1 flex-col gap-1 p-4">
        {familyLabel ? (
          <span className="text-xs font-semibold" style={{ color: ink.deep }}>
            {familyLabel}
          </span>
        ) : null}
        <span className="flex items-center justify-between gap-2">
          <span className="text-base font-semibold tracking-tight sm:text-lg">{product.name}</span>
          <span
            aria-hidden="true"
            className="family-arrow grid size-7 shrink-0 place-items-center rounded-full bg-paper-deep text-ink"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
        <span className="text-sm leading-5 text-ink-soft">{product.summary}</span>
        <span className="mt-auto flex flex-wrap gap-1.5 pt-3 text-xs font-semibold">
          <span className="rounded-full px-2.5 py-1" style={{ background: ink.tint, color: ink.deep }}>
            Desde {product.quantities[0].toLocaleString("es-EC")} u.
          </span>
          <span className="rounded-full bg-paper-deep px-2.5 py-1 text-ink-soft">{product.leadTime}</span>
        </span>
      </span>
    </Link>
  );
}
