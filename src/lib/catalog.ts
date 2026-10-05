export const PRODUCT = {
  slug: "tarjetas-de-presentacion",
  name: "Tarjetas de presentación",
  material: "Couche 300 g",
  summary:
    "Cartulina estucada de 300 g. Impresión a uno o dos lados, con laminado, UV selectivo y puntas redondeadas como acabados.",
} as const;

export const QUANTITIES = [50, 100, 250, 500, 1000] as const;
export type Quantity = (typeof QUANTITIES)[number];

export const SIZE_IDS = ["85x55", "55x55"] as const;
export type SizeId = (typeof SIZE_IDS)[number];

export type Finish = "mate" | "brillante";
export type Laminate = "none" | Finish;
export type Sides = 1 | 2;
export type DeliveryId = "standard" | "priority" | "express";

export type Configuration = {
  sizeId: SizeId;
  quantity: Quantity;
  sides: Sides;
  paper: Finish;
  laminate: Laminate;
  uv: boolean;
  rounded: boolean;
  delivery: DeliveryId;
};

type Tier = {
  one: string;
  two: string;
  laminate: string;
  uv: string;
  corners: string;
};

/**
 * PVP en USD, tomados de la hoja «valor PVP».
 * La impresión a 1 lado y a 2 lados son alternativas, no se suman.
 * Laminado, UV y puntas sí se suman.
 */
export const PRICE_BOOK: Record<SizeId, Record<Quantity, Tier>> = {
  "85x55": {
    50: { one: "5.6472", two: "7.2576", laminate: "4.8", uv: "42", corners: "3.6" },
    100: { one: "7.2576", two: "12.1152", laminate: "9.6", uv: "42", corners: "3.6" },
    250: { one: "14.544", two: "24.312", laminate: "9.6", uv: "42", corners: "7.2" },
    500: { one: "24.312", two: "46.224", laminate: "9.6", uv: "42", corners: "7.2" },
    1000: { one: "46.224", two: "80.544", laminate: "9.6", uv: "42", corners: "12" },
  },
  "55x55": {
    50: { one: "5.6472", two: "7.2576", laminate: "4.8", uv: "42", corners: "3.6" },
    100: { one: "7.2708", two: "9.6864", laminate: "9.6", uv: "42", corners: "3.6" },
    250: { one: "10.9008", two: "17.7384", laminate: "9.6", uv: "42", corners: "7.2" },
    500: { one: "16.6428", two: "30.8856", laminate: "9.6", uv: "42", corners: "7.2" },
    1000: { one: "29.79", two: "57.18", laminate: "9.6", uv: "42", corners: "12" },
  },
};

export const SIZES: Record<
  SizeId,
  { id: SizeId; name: string; sizeLabel: string; widthMm: number; heightMm: number; blurb: string }
> = {
  "85x55": {
    id: "85x55",
    name: "Clásica",
    sizeLabel: "8,5 × 5,5 cm",
    widthMm: 85,
    heightMm: 55,
    blurb: "El formato de billetera. Deja sitio para nombre, cargo y una línea de contacto.",
  },
  "55x55": {
    id: "55x55",
    name: "Cuadrada",
    sizeLabel: "5,5 × 5,5 cm",
    widthMm: 55,
    heightMm: 55,
    blurb: "Un cuadrado corto. Funciona cuando la marca cabe en un símbolo.",
  },
};

export function isSizeId(value: string): value is SizeId {
  return value === "85x55" || value === "55x55";
}

export function isQuantity(value: number): value is Quantity {
  return (QUANTITIES as readonly number[]).includes(value);
}

export function defaultConfiguration(sizeId: SizeId = "85x55"): Configuration {
  return {
    sizeId,
    quantity: 100,
    sides: 1,
    paper: "mate",
    laminate: "none",
    uv: false,
    rounded: false,
    delivery: "standard",
  };
}

export function configurationFromSearch(
  sp: Record<string, string | string[] | undefined>,
): Configuration {
  const one = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const sizeRaw = one("tamano");
  const sizeId = sizeRaw && isSizeId(sizeRaw) ? sizeRaw : "85x55";
  const quantityRaw = Number(one("cantidad"));
  const sides = one("lados") === "2" ? 2 : 1;
  const paper = one("papel") === "brillante" ? "brillante" : "mate";
  const laminateRaw = one("laminado");
  const laminate: Laminate =
    laminateRaw === "mate" || laminateRaw === "brillante" ? laminateRaw : "none";

  const deliveryRaw = one("entrega");
  const delivery: DeliveryId =
    deliveryRaw === "priority" || deliveryRaw === "express" ? deliveryRaw : "standard";

  return {
    sizeId,
    quantity: isQuantity(quantityRaw) ? quantityRaw : 100,
    sides,
    paper,
    laminate,
    uv: one("uv") === "1",
    rounded: one("puntas") === "1",
    delivery,
  };
}

export function configurationSearch(config: Configuration, itemId?: string): string {
  const params = new URLSearchParams({
    tamano: config.sizeId,
    cantidad: String(config.quantity),
    lados: String(config.sides),
    papel: config.paper,
    laminado: config.laminate,
    uv: config.uv ? "1" : "0",
    puntas: config.rounded ? "1" : "0",
    entrega: config.delivery,
  });
  if (itemId) params.set("item", itemId);
  return params.toString();
}

export function productHref(config?: Partial<Configuration>, itemId?: string): string {
  const base = `/producto/${PRODUCT.slug}`;
  if (!config) return base;
  const full = { ...defaultConfiguration(config.sizeId ?? "85x55"), ...config };
  return `${base}?${configurationSearch(full, itemId)}`;
}
