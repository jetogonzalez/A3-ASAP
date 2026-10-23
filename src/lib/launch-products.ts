/*
 * Productos de lanzamiento que todavía no se arman en línea: se muestran con
 * sus especificaciones y se cotizan por WhatsApp. Salen de la matriz de
 * productos (Matriz_Productos_ASAP.xlsx, hojas Productos y Opciones); si se
 * cambia algo allá, se cambia aquí. No llevan precio a propósito: el precio
 * que ve el cliente lo calcula solo el servidor, y para estos aún no hay tabla.
 */

export type LaunchProductSpec = {
  label: string;
  value: string;
};

export type LaunchProduct = {
  /** product_id de la matriz. */
  id: string;
  slug: string;
  name: string;
  /** slug de la familia en FAMILIES. */
  family: string;
  specs: LaunchProductSpec[];
  quantities: number[];
  leadTime: string;
};

export const LAUNCH_PRODUCTS: LaunchProduct[] = [
  {
    id: "ESF",
    slug: "esferos",
    name: "Esferos",
    family: "promocionales",
    specs: [
      { label: "Tipo", value: "Económico o premium" },
      { label: "Impresión", value: "Estampado" },
    ],
    quantities: [100, 250, 500, 1000],
    leadTime: "8 días",
  },
  {
    id: "TMT",
    slug: "toma-todos",
    name: "Toma todos",
    family: "promocionales",
    specs: [
      { label: "Material", value: "Plástico o metálico" },
      { label: "Tintas", value: "Full color" },
      { label: "Impresión", value: "UV DTF" },
    ],
    quantities: [5, 10, 50, 100, 250, 500],
    leadTime: "8 días",
  },
  {
    id: "TAZ",
    slug: "tazas-mugs",
    name: "Tazas y mugs",
    family: "promocionales",
    specs: [
      { label: "Tintas", value: "Full color" },
      { label: "Impresión", value: "UV DTF o sublimación" },
    ],
    quantities: [5, 10, 50, 100, 250, 500],
    leadTime: "8 días",
  },
  {
    id: "CAM",
    slug: "camisetas-hoodies",
    name: "Camisetas y hoodies",
    family: "textil",
    specs: [
      { label: "Tallas", value: "S, M, L, XL" },
      { label: "Tintas", value: "Full color" },
      { label: "Impresión", value: "DTF" },
    ],
    quantities: [25, 50, 100, 250, 500],
    leadTime: "8 días",
  },
  {
    id: "GOR",
    slug: "gorras",
    name: "Gorras",
    family: "textil",
    specs: [
      { label: "Talla", value: "Única" },
      { label: "Tintas", value: "Full color" },
      { label: "Impresión", value: "DTF" },
    ],
    quantities: [25, 50, 100, 250, 500],
    leadTime: "8 días",
  },
  {
    id: "TOT",
    slug: "tote-bags",
    name: "Tote bags",
    family: "textil",
    specs: [
      { label: "Tamaño", value: "30 × 40 cm o 44 × 34 cm" },
      { label: "Tintas", value: "Full color" },
      { label: "Impresión", value: "DTF" },
    ],
    quantities: [25, 50, 100, 250, 500],
    leadTime: "8 días",
  },
  {
    id: "PRG",
    slug: "papel-regalo",
    name: "Papel de regalo",
    family: "empaque",
    specs: [
      { label: "Tamaño", value: "45 × 32 cm o 68 × 48 cm" },
      { label: "Tintas", value: "Full color o un color" },
      { label: "Papel", value: "Papel cera, corte recto" },
    ],
    quantities: [100, 250, 500, 1000],
    leadTime: "48 a 72 horas",
  },
  {
    id: "ETQ",
    slug: "etiquetas",
    name: "Etiquetas",
    family: "empaque",
    specs: [
      { label: "Tamaño", value: "3 × 3, 5 × 5 o 6 × 6 cm" },
      { label: "Tintas", value: "Full color o un color" },
      { label: "Papel", value: "Adhesivo" },
      { label: "Corte", value: "Recto o troquelado" },
    ],
    quantities: [50, 100, 250, 500, 1000],
    leadTime: "48 a 72 horas",
  },
  {
    id: "TRJ",
    slug: "tarjetas-de-regalo",
    name: "Tarjetas de regalo",
    family: "empaque",
    specs: [
      { label: "Tamaño", value: "A5, A6 o 9 × 5 cm plegada" },
      { label: "Tintas", value: "Full color o un color" },
      { label: "Impresión", value: "Tiro o tiro y retiro" },
      { label: "Papel", value: "Couché 300 g o cartulina fina" },
      { label: "Corte", value: "Recto o troquelado" },
    ],
    quantities: [50, 100, 250, 500, 1000],
    leadTime: "48 a 72 horas",
  },
  {
    id: "CAL",
    slug: "calendarios",
    name: "Calendarios",
    family: "papeleria",
    specs: [
      { label: "Tamaño", value: "15 × 21 cm o 30 × 10 cm" },
      { label: "Tipo", value: "Sobre mesa (12 páginas) o plegado" },
      { label: "Tintas", value: "Full color o un color" },
      { label: "Papel", value: "Couché 300 g, laminado" },
    ],
    quantities: [50, 100, 250, 500, 1000],
    leadTime: "72 horas",
  },
  {
    id: "CUA",
    slug: "cuadernos",
    name: "Cuadernos",
    family: "papeleria",
    specs: [
      { label: "Tamaño", value: "A5 o A4" },
      { label: "Portada", value: "Dura o blanda" },
      { label: "Tintas", value: "Full color o un color, tiro y retiro" },
      { label: "Papel", value: "Bond 90 g" },
    ],
    quantities: [50, 100, 250, 500, 1000],
    leadTime: "5 días en adelante",
  },
];

export function launchProductsFor(familySlug: string): LaunchProduct[] {
  return LAUNCH_PRODUCTS.filter((product) => product.family === familySlug);
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Para el buscador: coincide por nombre o por cualquier especificación. */
export function searchLaunchProducts(query: string): LaunchProduct[] {
  const needle = normalize(query.trim());
  if (!needle) return [];
  return LAUNCH_PRODUCTS.filter((product) =>
    normalize([product.name, ...product.specs.map((spec) => spec.value)].join(" ")).includes(needle),
  );
}

/** «25, 50, 100, 250 o 500 unidades». */
export function formatQuantities(quantities: readonly number[]): string {
  const labels = quantities.map((quantity) => quantity.toLocaleString("es-EC"));
  if (labels.length === 1) return `${labels[0]} unidades`;
  return `${labels.slice(0, -1).join(", ")} o ${labels[labels.length - 1]} unidades`;
}
