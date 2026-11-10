import data from "@/data/matriz.json";

/*
 * La matriz de productos y precios (Excel de la tienda) convertida en datos.
 * Se regenera con `python3 scripts/importar-matriz.py ruta/al/archivo.xlsx`.
 * Todo lo que sea precio, recargo o plazo sale de aquí: si cambia la matriz,
 * cambia la web sin tocar código.
 *
 * Los precios vienen SIN IVA y en centavos (con decimales: hay etiquetas que
 * cuestan fracciones de centavo). La web suma el IVA al final de cada renglón.
 */

export type SpeedId = "standard" | "priority" | "express";

export type MatrixVariant = {
  code: string;
  name: string;
  hours: Record<SpeedId, number | null>;
  /** Precio por unidad sin IVA, en centavos, por cantidad. */
  unitCents: Record<string, number>;
};

export type MatrixProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string;
  quantities: number[];
  minimum: number;
  priority: boolean;
  express: boolean;
  variants: MatrixVariant[];
};

export type FinishId = "laminado" | "uv" | "corte";

type MatrixFinish = { product: string; variant: string; quantity: number; finish: FinishId; cents: number };

type Matrix = {
  version: string;
  updated: string;
  ivaPercent: number;
  speeds: Record<SpeedId, { name: string; surchargePercent: number }>;
  products: MatrixProduct[];
  finishes: MatrixFinish[];
};

export const MATRIZ = data as Matrix;

export function matrixProduct(id: string): MatrixProduct | undefined {
  return MATRIZ.products.find((product) => product.id === id);
}

export function matrixVariant(productId: string, code: string): MatrixVariant | undefined {
  return matrixProduct(productId)?.variants.find((variant) => variant.code === code);
}

/** Las cantidades que tienen precio para esa variante, de menor a mayor. */
export function pricedQuantities(productId: string, code: string): number[] {
  const variant = matrixVariant(productId, code);
  return variant ? Object.keys(variant.unitCents).map(Number).sort((a, b) => a - b) : [];
}

/** Lo que cuesta la tirada sin IVA, en centavos enteros. */
export function runCentsWithoutIva(productId: string, code: string, quantity: number): number | null {
  const unit = matrixVariant(productId, code)?.unitCents[String(quantity)];
  return unit === undefined ? null : Math.round(unit * quantity);
}

/** Recargo por tirada de un acabado, sin IVA. Null si ese acabado no existe para esa combinación. */
export function finishCentsWithoutIva(productId: string, code: string, quantity: number, finish: FinishId): number | null {
  const row = MATRIZ.finishes.find(
    (candidate) =>
      candidate.product === productId && candidate.variant === code && candidate.quantity === quantity && candidate.finish === finish,
  );
  return row ? row.cents : null;
}

/** Qué acabados ofrece la matriz para ese producto (en cualquier variante). */
export function finishesFor(productId: string): FinishId[] {
  const found = new Set(MATRIZ.finishes.filter((row) => row.product === productId).map((row) => row.finish));
  return (["laminado", "uv", "corte"] as const).filter((finish) => found.has(finish));
}

/** Horas hasta la puerta de una variante con ese nivel de entrega. */
export function leadHours(productId: string, code: string, speed: SpeedId): number {
  const variant = matrixVariant(productId, code) ?? matrixProduct(productId)?.variants[0];
  return variant?.hours[speed] ?? variant?.hours.standard ?? 120;
}

/** 120 h laborables son 5 días hábiles: la matriz cuenta jornadas de 24 h. */
export function hoursToBusinessDays(hours: number): number {
  return Math.max(1, Math.ceil(hours / 24));
}

/** El precio unitario más bajo con IVA, en centavos, para el «desde». */
export function fromUnitCents(productId: string): number | null {
  const product = matrixProduct(productId);
  if (!product) return null;
  let lowest = Infinity;
  for (const variant of product.variants) for (const unit of Object.values(variant.unitCents)) lowest = Math.min(lowest, unit);
  return Number.isFinite(lowest) ? Math.round((lowest * (100 + MATRIZ.ivaPercent)) / 100) : null;
}
