import { productHref } from "@/lib/catalog";

export type Family = {
  slug: string;
  label: string;
  live: boolean;
  note: string;
};

/** El portal es de productos personalizados. Hoy solo las tarjetas se piden. */
export const FAMILIES: Family[] = [
  {
    slug: "tarjetas",
    label: "Tarjetas",
    live: true,
    note: "Tarjetas de presentación en couche 300 g.",
  },
  {
    slug: "papeleria",
    label: "Papelería",
    live: false,
    note: "Hojas, sobres y cuadernos con la marca.",
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
  {
    slug: "pegatinas",
    label: "Pegatinas",
    live: false,
    note: "Adhesivos en hoja o en rollo.",
  },
  {
    slug: "empaque",
    label: "Empaque",
    live: false,
    note: "Bolsas, cajas y etiquetas de producto.",
  },
  {
    slug: "textil",
    label: "Textil y regalos",
    live: false,
    note: "Ropa, bolsas de tela y objetos de marca.",
  },
];

export function familyBySlug(slug: string): Family | undefined {
  return FAMILIES.find((family) => family.slug === slug);
}

export function familyHref(family: Family): string {
  return family.live ? productHref() : `/productos/${family.slug}`;
}
