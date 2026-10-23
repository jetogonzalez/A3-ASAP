import Link from "next/link";
import { ProductArt } from "@/components/product-art";
import { ProductPhoto } from "@/components/product-photo";
import { inkFor } from "@/lib/palette";
import { WhatsappLogo } from "@/components/whatsapp-logo";
import { defaultConfiguration } from "@/lib/catalog";
import { FAMILIES, familyHref } from "@/lib/families";
import { launchProductsFor } from "@/lib/launch-products";
import { formatUsd } from "@/lib/money";
import { quote } from "@/lib/pricing";

/* La foto que representa a cada familia. */
const FAMILY_PHOTO: Record<string, string> = {
  tarjetas: "tarjetas-de-presentacion",
  promocionales: "tazas-mugs",
  textil: "camisetas-hoodies",
  empaque: "papel-regalo",
  papeleria: "calendarios",
  pegatinas: "pegatinas",
  catalogos: "catalogos",
  "gran-formato": "gran-formato",
};

/**
 * Todas las familias de productos en una grilla. Las que ya se piden en línea
 * muestran el precio de entrada; las demás llevan a cotizar. Una familia nueva
 * en FAMILIES aparece aquí sola.
 */
export function FamilyGrid() {
  const cardsFrom = formatUsd(quote({ ...defaultConfiguration("85x55"), quantity: 100 }).printingCents);

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {FAMILIES.map((family, index) => (
        <li key={family.slug} className="reveal-up" style={{ animationDelay: `${index * 50}ms` }}>
          <Link
            href={familyHref(family)}
            className="family-card group flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-sheet"
          >
            {FAMILY_PHOTO[family.slug] ? (
              <span className="relative block aspect-[4/3] w-full overflow-hidden" style={{ background: inkFor(family.slug).tint }}>
                <ProductPhoto
                  slug={FAMILY_PHOTO[family.slug]}
                  alt=""
                  sizes="(min-width: 1024px) 280px, 50vw"
                  className="family-photo"
                />
              </span>
            ) : (
              <ProductArt kind={family.slug} className="aspect-[4/3] w-full" />
            )}
            <span className="flex flex-1 flex-col gap-1 p-4">
              <span className="flex items-center justify-between gap-2">
                <span className="text-base font-semibold tracking-tight sm:text-lg">{family.label}</span>
                <span
                  aria-hidden="true"
                  className="family-arrow grid size-7 shrink-0 place-items-center rounded-full bg-paper-deep text-ink"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </span>
              <span className="text-sm leading-5 text-ink-soft">{family.note}</span>
              <span className="mt-auto pt-3">
                {family.live ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
                    Pídelo en línea · desde {cardsFrom}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-paper-deep px-2.5 py-1 text-xs font-semibold text-ink-soft">
                    {launchProductsFor(family.slug).length > 0 ? null : <WhatsappLogo size={13} brand />}
                    {launchProductsFor(family.slug).length > 0
                      ? `${launchProductsFor(family.slug).length} productos para armar`
                      : "Cotiza por WhatsApp"}
                  </span>
                )}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
