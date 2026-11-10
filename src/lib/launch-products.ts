import { deliveryOption, surchargeCents } from "@/lib/delivery";
import {
  finishCentsWithoutIva,
  fromUnitCents,
  hoursToBusinessDays,
  leadHours,
  matrixProduct,
  runCentsWithoutIva,
  type SpeedId,
} from "@/lib/matriz";
import { withIva } from "@/lib/tax";

/*
 * Productos de lanzamiento: cada uno tiene su página y se arma eligiendo
 * opciones, cantidad y entrega. Las opciones salen de la hoja Opciones de la
 * matriz; precios, cantidades y plazos, de las hojas PRECIOS, ACABADOS y
 * Tiempos (src/data/matriz.json). Aquí solo se dice qué combinación de
 * opciones corresponde a qué variante de la matriz. El pedido sale por
 * WhatsApp con todo lo elegido y el precio, y la tienda lo confirma.
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
  /** product_id en la matriz, si no es el mismo id. */
  matrixId?: string;
  /** Opciones que suman un acabado de la hoja ACABADOS: opción → valor que lo activa. */
  finishes?: ReadonlyArray<{ option: string; when: string; finish: "laminado" | "uv" | "corte"; label: string }>;
  /** Lo que la matriz aún no tiene con precio: se avisa y se confirma en el chat. */
  unpriced?: ReadonlyArray<{ option: string; when: string }>;
  quantities: readonly number[];
  leadTime: string;
};

export const LAUNCH_PRODUCTS: LaunchProduct[] = [
  {
    id: "ESF",
    slug: "esferos",
    name: "Esferos",
    family: "promocionales",
    summary: "Esferos con tu logo estampado, en versión económica o premium.",
    options: [
      { id: "tipo", label: "Tipo", choices: ["Promocional", "Económico", "Premium"] },
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
      { id: "lados", label: "Estampado", choices: ["1 lado", "2 lados"] },
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
    name: "Gorras dry fit",
    family: "textil",
    summary: "Gorras dry fit talla única con tu logo al frente.",
    matrixId: "GODF",
    options: [
      { id: "talla", label: "Talla", choices: ["Única"] },
      { id: "tintas", label: "Tintas", choices: ["Full color"] },
      { id: "impresion", label: "Impresión", choices: ["DTF"] },
    ],
    quantities: [50, 100, 250, 500, 1000],
    leadTime: "5 días",
  },
  {
    id: "GOC",
    slug: "gorras-camionero",
    name: "Gorras camionero",
    family: "textil",
    summary: "Gorras camioneras talla única, con malla atrás y tu logo al frente.",
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
    unpriced: [{ option: "corte", when: "Troquelado" }],
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
    finishes: [{ option: "corte", when: "Troquelado", finish: "corte", label: "Troquelado" }],
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
      { id: "tamano", label: "Tamaño", choices: ["A5 (15 × 21 cm)", "A6 (10,5 × 15 cm)", "30 × 10 cm"] },
      { id: "impresion", label: "Impresión", choices: ["Tiro", "Tiro y retiro"] },
      { id: "acabado", label: "Acabado", choices: ["Sin laminado", "Laminado"] },
      { id: "tintas", label: "Tintas", choices: ["Full color", "Un color"] },
      { id: "papel", label: "Papel", choices: ["Couché 300 g"] },
    ],
    finishes: [{ option: "acabado", when: "Laminado", finish: "laminado", label: "Laminado" }],
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
    unpriced: [{ option: "portada", when: "Dura" }],
    quantities: [50, 100, 250, 500, 1000],
    leadTime: "5 días en adelante",
  },
];

/*
 * Qué variante de la hoja PRECIOS corresponde a lo elegido. Va aparte de los
 * productos porque una función no puede viajar al navegador dentro de los
 * datos. Null: esa combinación se cotiza por WhatsApp.
 */
const VARIANTS: Record<string, (s: LaunchSelection) => string | null> = {
  ESF: (s) => ({ Promocional: "PROM", "Económico": "ECO", Premium: "PRE" })[s.tipo] ?? null,
  TMT: (s) => (s.material === "Metálico" ? "MET" : "PLA"),
  TAZ: () => "STD",
  CAM: (s) => `${s.prenda === "Hoodie" ? "HOO" : "CAM"}${s.lados === "2 lados" ? "2" : "1"}L`,
  GOR: () => "STD",
  GOC: () => "STD",
  TOT: (s) => (s.tamano === "44 × 34 cm" ? "4434" : "3040"),
  PRG: (s) => (s.tamano === "68 × 48 cm" ? "6848" : "4532"),
  ETQ: (s) => ({ "3 × 3 cm": "3X3", "5 × 5 cm": "5X5", "6 × 6 cm": "6X6" })[s.tamano] ?? null,
  TRJ: (s) => (s.tamano === "A6" || s.tamano === "A5" ? `${s.tamano}-${s.impresion === "Tiro y retiro" ? "2L" : "1L"}` : null),
  CAL: (s) => {
    const size = s.tamano.startsWith("A5") ? "A5" : s.tamano.startsWith("A6") ? "A6" : "30X10";
    if (s.tipo === "Plegado") return size === "A5" ? "PLEG-A5" : size === "30X10" ? "PLEG 30X10" : null;
    if (size === "30X10") return null;
    return `MESA - ${size} - ${s.impresion === "Tiro y retiro" ? "2L" : "1L"}`;
  },
  CUA: (s) => (s.tamano === "A4" ? "A4" : "A5"),
};

export function launchVariant(product: LaunchProduct, selection: LaunchSelection): string | null {
  return VARIANTS[product.id]?.(selection) ?? null;
}

/*
 * Cantidades y plazo de producción salen de la matriz: lo escrito arriba solo
 * queda si el producto aún no está en ella.
 */
for (const product of LAUNCH_PRODUCTS as LaunchProduct[]) {
  const row = matrixProduct(product.matrixId ?? product.id);
  if (!row) continue;
  product.quantities = row.quantities;
  const days = hoursToBusinessDays(leadHours(row.id, row.variants[0]?.code ?? "", "standard"));
  product.leadTime = `${days} ${days === 1 ? "día hábil" : "días hábiles"}`;
}

/** El precio unitario más bajo con IVA, para «desde $X c/u». */
export function launchFromCents(product: LaunchProduct): number | null {
  return fromUnitCents(product.matrixId ?? product.id);
}

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

export type LaunchQuote = {
  variant: string;
  /** La tirada con IVA. */
  runCents: number;
  /** Acabados elegidos con IVA. */
  extras: Array<{ label: string; cents: number }>;
  printingCents: number;
  deliveryCents: number;
  /** Impresión + entrega, con IVA. El envío se suma aparte por peso. */
  totalCents: number;
  unitCents: number;
  /** Días hábiles hasta la puerta con la entrega elegida. */
  days: number;
  /** Algo elegido que la matriz aún no tiene con precio (se confirma en el chat). */
  pending: string[];
};

/**
 * El precio de lo elegido, con IVA, sacado de la matriz. Null cuando esa
 * combinación no tiene precio cargado: entonces se cotiza por WhatsApp.
 */
export function launchQuote(product: LaunchProduct, selection: LaunchSelection, quantity: number, speed: string): LaunchQuote | null {
  const productId = product.matrixId ?? product.id;
  const variant = launchVariant(product, selection);
  if (!variant) return null;
  const run = runCentsWithoutIva(productId, variant, quantity);
  if (run === null) return null;
  const runCents = withIva(run);
  const extras = (product.finishes ?? [])
    .filter((item) => selection[item.option] === item.when)
    .map((item) => ({ label: item.label, cents: withIva(finishCentsWithoutIva(productId, variant, quantity, item.finish) ?? 0) }));
  const printingCents = runCents + extras.reduce((sum, item) => sum + item.cents, 0);
  const speedId = deliveryOption(speed).id as SpeedId;
  const deliveryCents = surchargeCents(speedId, printingCents);
  return {
    variant,
    runCents,
    extras,
    printingCents,
    deliveryCents,
    totalCents: printingCents + deliveryCents,
    unitCents: Math.round(printingCents / quantity),
    days: hoursToBusinessDays(leadHours(productId, variant, speedId)),
    pending: (product.unpriced ?? []).filter((item) => selection[item.option] === item.when).map((item) => item.when),
  };
}

/** El mensaje de WhatsApp con todo lo elegido y el precio que vio el cliente. */
export function launchRequestMessage(request: LaunchRequest, format: (cents: number) => string): string {
  const { product, selection } = request;
  const priced = launchQuote(product, selection, request.quantity, request.speed);
  const lines = [
    "Hola ASAP, quiero pedir:",
    "",
    `Producto: ${product.name}`,
    ...product.options.map((option) => `${option.label}: ${selection[option.id] ?? option.choices[0]}`),
    `Cantidad: ${formatUnits(request.quantity)}`,
    `Entrega: ${deliveryOption(request.speed).name}${priced ? ` (${priced.days} ${priced.days === 1 ? "día hábil" : "días hábiles"})` : ""}`,
    `Diseño: ${request.design}`,
  ];
  if (priced) {
    lines.push("", `Impresión: ${format(priced.runCents)}`);
    for (const extra of priced.extras) lines.push(`${extra.label}: ${format(extra.cents)}`);
    if (priced.deliveryCents > 0) lines.push(`Entrega ${deliveryOption(request.speed).name}: ${format(priced.deliveryCents)}`);
    lines.push(`*Total con IVA: ${format(priced.totalCents)}* (sin envío)`);
    if (priced.pending.length > 0) lines.push(`Por confirmar: ${priced.pending.join(", ")}`);
  }
  const notes = request.notes.trim();
  if (notes) lines.push("", `Notas: ${notes}`);
  lines.push("", priced ? "¿Me confirman el envío y los datos para pagar?" : "¿Me pasan precio y plazo?");
  return lines.join("\n");
}
