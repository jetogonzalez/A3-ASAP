import { leadHours, leadLabel, varies } from "@/lib/lead-times";
/*
 * Productos de lanzamiento: cada uno tiene su página y se arma eligiendo
 * opciones, cantidad y entrega. Salen de la matriz de productos
 * (Matriz_Productos_ASAP.xlsx, hojas Productos y Opciones); si se cambia algo
 * allá, se cambia aquí. Todavía no llevan precio: la matriz no los tiene, y el
 * precio que ve el cliente lo calcula solo el servidor. El pedido sale por
 * WhatsApp con todo lo elegido y la tienda responde con precio y plazo.
 */

export type LaunchOption = {
  id: string;
  label: string;
  /** Con una sola opción no hay nada que elegir: se muestra como dato. */
  choices: readonly string[];
};

export type LaunchProduct = {
  /** product_id de la matriz. */
  id: string;
  slug: string;
  name: string;
  /** slug de la familia en FAMILIES. */
  family: string;
  /** Una frase que dice qué es, para la ficha y las tarjetas. */
  summary: string;
  options: readonly LaunchOption[];
  quantities: readonly number[];
  /**
   * Resumen del plazo Standard para la cantidad mínima («8 días hábiles»,
   * «desde 3 días hábiles» si cambia con la cantidad). Se calcula con la tabla
   * de plazos de la matriz (lib/lead-times.ts); el texto escrito aquí abajo
   * solo se usa si la matriz no trae ese producto.
   */
  leadTime: string;
};

const PRODUCTS: readonly LaunchProduct[] = [
  {
    id: "ESF",
    slug: "esferos",
    name: "Esferos",
    family: "promocionales",
    summary: "Esferos con tu logo estampado, en versión económica o premium.",
    options: [
      { id: "tipo", label: "Tipo", choices: ["Económico", "Premium"] },
      { id: "impresion", label: "Impresión", choices: ["Estampado"] },
    ],
    quantities: [100, 250, 500, 1000],
    leadTime: "8 días",
  },
  {
    id: "TMT",
    slug: "toma-todos",
    name: "Toma todos",
    family: "promocionales",
    summary: "Botellas de plástico o metal con tu diseño a todo color.",
    options: [
      { id: "material", label: "Material", choices: ["Plástico", "Metálico"] },
      { id: "tintas", label: "Tintas", choices: ["Full color"] },
      { id: "impresion", label: "Impresión", choices: ["UV DTF"] },
    ],
    quantities: [5, 10, 50, 100, 250, 500],
    leadTime: "8 días",
  },
  {
    id: "TAZ",
    slug: "tazas-mugs",
    name: "Tazas y mugs",
    family: "promocionales",
    summary: "Tazas con fotos, frases o tu logo, desde 5 unidades.",
    options: [
      { id: "impresion", label: "Impresión", choices: ["Sublimación", "UV DTF"] },
      { id: "tintas", label: "Tintas", choices: ["Full color"] },
    ],
    quantities: [5, 10, 50, 100, 250, 500],
    leadTime: "8 días",
  },
  {
    id: "CAM",
    slug: "camisetas-hoodies",
    name: "Camisetas y hoodies",
    family: "textil",
    summary: "Prendas estampadas en DTF para equipos, eventos o tu marca.",
    options: [
      { id: "prenda", label: "Prenda", choices: ["Camiseta", "Hoodie"] },
      { id: "talla", label: "Tallas", choices: ["S", "M", "L", "XL", "Varias tallas"] },
      { id: "tintas", label: "Tintas", choices: ["Full color"] },
      { id: "impresion", label: "Impresión", choices: ["DTF"] },
    ],
    quantities: [25, 50, 100, 250, 500],
    leadTime: "8 días",
  },
  {
    id: "GOR",
    slug: "gorras",
    name: "Gorras",
    family: "textil",
    summary: "Gorras talla única con tu logo al frente.",
    options: [
      { id: "talla", label: "Talla", choices: ["Única"] },
      { id: "tintas", label: "Tintas", choices: ["Full color"] },
      { id: "impresion", label: "Impresión", choices: ["DTF"] },
    ],
    quantities: [25, 50, 100, 250, 500],
    leadTime: "8 días",
  },
  {
    id: "TOT",
    slug: "tote-bags",
    name: "Tote bags",
    family: "textil",
    summary: "Bolsas de tela para tu tienda, ferias o regalos de marca.",
    options: [
      { id: "tamano", label: "Tamaño", choices: ["30 × 40 cm", "44 × 34 cm"] },
      { id: "tintas", label: "Tintas", choices: ["Full color"] },
      { id: "impresion", label: "Impresión", choices: ["DTF"] },
    ],
    quantities: [25, 50, 100, 250, 500],
    leadTime: "8 días",
  },
  {
    id: "PRG",
    slug: "papel-regalo",
    name: "Papel de regalo",
    family: "empaque",
    summary: "Papel cera con tu patrón para envolver cada pedido.",
    options: [
      { id: "tamano", label: "Tamaño", choices: ["45 × 32 cm", "68 × 48 cm"] },
      { id: "tintas", label: "Tintas", choices: ["Full color", "Un color"] },
      { id: "papel", label: "Papel", choices: ["Papel cera"] },
      { id: "corte", label: "Corte", choices: ["Recto"] },
    ],
    quantities: [100, 250, 500, 1000],
    leadTime: "48 a 72 horas",
  },
  {
    id: "ETQ",
    slug: "etiquetas",
    name: "Etiquetas",
    family: "empaque",
    summary: "Stickers adhesivos para sellar empaques o marcar productos.",
    options: [
      { id: "tamano", label: "Tamaño", choices: ["3 × 3 cm", "5 × 5 cm", "6 × 6 cm"] },
      { id: "corte", label: "Corte", choices: ["Recto", "Troquelado"] },
      { id: "tintas", label: "Tintas", choices: ["Full color", "Un color"] },
      { id: "papel", label: "Papel", choices: ["Adhesivo"] },
    ],
    quantities: [50, 100, 250, 500, 1000],
    leadTime: "48 a 72 horas",
  },
  {
    id: "TRJ",
    slug: "tarjetas-de-regalo",
    name: "Tarjetas de regalo",
    family: "empaque",
    summary: "Tarjetas de agradecimiento para acompañar cada compra.",
    options: [
      { id: "tamano", label: "Tamaño", choices: ["A6", "A5", "9 × 5 cm plegada"] },
      { id: "papel", label: "Papel", choices: ["Couché 300 g", "Cartulina fina"] },
      { id: "impresion", label: "Impresión", choices: ["Tiro", "Tiro y retiro"] },
      { id: "corte", label: "Corte", choices: ["Recto", "Troquelado"] },
      { id: "tintas", label: "Tintas", choices: ["Full color", "Un color"] },
    ],
    quantities: [50, 100, 250, 500, 1000],
    leadTime: "48 a 72 horas",
  },
  {
    id: "CAL",
    slug: "calendarios",
    name: "Calendarios",
    family: "papeleria",
    summary: "Calendarios de escritorio con tu marca para todo el año.",
    options: [
      { id: "tipo", label: "Tipo", choices: ["Sobre mesa (12 páginas)", "Plegado"] },
      { id: "tamano", label: "Tamaño", choices: ["15 × 21 cm", "30 × 10 cm"] },
      { id: "impresion", label: "Impresión", choices: ["Tiro", "Tiro y retiro"] },
      { id: "tintas", label: "Tintas", choices: ["Full color", "Un color"] },
      { id: "papel", label: "Papel", choices: ["Couché 300 g, laminado"] },
    ],
    quantities: [50, 100, 250, 500, 1000],
    leadTime: "72 horas",
  },
  {
    id: "CUA",
    slug: "cuadernos",
    name: "Cuadernos",
    family: "papeleria",
    summary: "Cuadernos con portada de tu marca, en A5 o A4.",
    options: [
      { id: "tamano", label: "Tamaño", choices: ["A5", "A4"] },
      { id: "portada", label: "Portada", choices: ["Blanda", "Dura"] },
      { id: "tintas", label: "Tintas", choices: ["Full color", "Un color"] },
      { id: "papel", label: "Hojas", choices: ["Bond 90 g, tiro y retiro"] },
    ],
    quantities: [50, 100, 250, 500, 1000],
    leadTime: "5 días en adelante",
  },
];

export const LAUNCH_PRODUCTS: readonly LaunchProduct[] = PRODUCTS.map((product) => {
  const hours = leadHours(product.id, product.quantities[0], "standard");
  if (hours === null) return product;
  return { ...product, leadTime: `${varies(product.id) ? "desde " : ""}${leadLabel(hours)}` };
});

export function launchProductBySlug(slug: string): LaunchProduct | undefined {
  return LAUNCH_PRODUCTS.find((product) => product.slug === slug);
}

export function launchProductsFor(familySlug: string): LaunchProduct[] {
  return LAUNCH_PRODUCTS.filter((product) => product.family === familySlug);
}

export function launchProductHref(product: LaunchProduct): string {
  return `/producto/${product.slug}`;
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Para el buscador: coincide por nombre, descripción u opciones. */
export function searchLaunchProducts(query: string): LaunchProduct[] {
  const needle = normalize(query.trim());
  if (!needle) return [];
  return LAUNCH_PRODUCTS.filter((product) => {
    const haystack = [product.name, product.summary, ...product.options.flatMap((option) => option.choices)];
    return normalize(haystack.join(" ")).includes(needle);
  });
}

export function formatUnits(quantity: number): string {
  return `${quantity.toLocaleString("es-EC")} ${quantity === 1 ? "unidad" : "unidades"}`;
}

/** Cada opción elegida, en el orden de la ficha. */
export type LaunchSelection = Record<string, string>;

export function defaultSelection(product: LaunchProduct): LaunchSelection {
  return Object.fromEntries(product.options.map((option) => [option.id, option.choices[0]]));
}

export type LaunchRequest = {
  product: LaunchProduct;
  selection: LaunchSelection;
  quantity: number;
  speed: string;
  /** La línea del diseño tal como va en el mensaje: enlace al archivo, a Canva, o qué hacer. */
  design: string;
  notes: string;
};

/** El mensaje de WhatsApp con todo lo que la tienda necesita para cotizar. */
export function launchRequestMessage(request: LaunchRequest): string {
  const { product, selection } = request;
  const lines = [
    "Hola ASAP, quiero pedir:",
    "",
    `Producto: ${product.name}`,
    ...product.options.map((option) => `${option.label}: ${selection[option.id] ?? option.choices[0]}`),
    `Cantidad: ${formatUnits(request.quantity)}`,
    `Entrega: ${request.speed}`,
    `Diseño: ${request.design}`,
  ];
  const notes = request.notes.trim();
  if (notes) lines.push(`Notas: ${notes}`);
  lines.push("", "¿Me pasan precio y plazo?");
  return lines.join("\n");
}
