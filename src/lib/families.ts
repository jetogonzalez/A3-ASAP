import { productHref } from "@/lib/catalog";

export type Family = {
  slug: string;
  label: string;
  live: boolean;
  note: string;
};

/**
 * El portal es de productos personalizados. Las tarjetas se arman y piden en
 * línea; las familias con productos de lanzamiento (launch-products.ts) los
 * muestran y se cotizan por WhatsApp; las demás quedan como «pronto».
 */
export const FAMILIES: Family[] = [
  {
    slug: "tarjetas",
    label: "Tarjetas",
    live: true,
    note: "Tarjetas de presentación en couche 300 g.",
  },
  {
    slug: "promocionales",
    label: "Promocionales",
    live: false,
    note: "Esferos, toma todos y tazas con tu marca.",
  },
  {
    slug: "textil",
    label: "Textil",
    live: false,
    note: "Camisetas, hoodies, gorras y tote bags en DTF.",
  },
  {
    slug: "empaque",
    label: "Empaque y etiquetas",
    live: false,
    note: "Papel de regalo, etiquetas y tarjetas de regalo.",
  },
  {
    slug: "papeleria",
    label: "Papelería",
    live: false,
    note: "Calendarios y cuadernos con tu marca.",
  },
  {
    slug: "pegatinas",
    label: "Pegatinas",
    live: false,
    note: "Adhesivos en hoja o en rollo.",
  },
  {
    slug: "catalogos",
    label: "Catálogos",
    live: false,
    note: "Revistas y catálogos grapados o encolados.",
  },
  {
    slug: "gran-formato",
    label: "Gran formato",
    live: false,
    note: "Lonas, pendones y señalización.",
  },
];

export function familyBySlug(slug: string): Family | undefined {
  return FAMILIES.find((family) => family.slug === slug);
}

export function familyHref(family: Family): string {
  return family.live ? productHref() : `/productos/${family.slug}`;
}
