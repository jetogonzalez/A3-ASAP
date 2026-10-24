import data from "@/data/lead-times.json";

/*
 * Plazos por producto, cantidad y nivel de entrega. Salen de la matriz (hoja
 * Precios, columnas horas_express / horas_priority / horas_standard) con
 * scripts/importar-plazos.py, que escribe src/data/lead-times.json. Así el
 * plazo depende de cuántas unidades se piden, no hay un valor único para todo.
 *
 * Una celda vacía en la matriz es un nivel que no se ofrece para esa
 * cantidad: la web dice «a confirmar».
 */

export type LeadLevel = "express" | "priority" | "standard";
export const LEAD_LEVELS: readonly LeadLevel[] = ["standard", "priority", "express"];

type Row = { cantidad: number } & Record<LeadLevel, number | null>;
const TABLE = data as Record<string, Row[]>;

/** La fila que aplica a esa cantidad: la primera cantidad de la matriz que la cubre. */
function rowFor(productId: string, quantity: number): Row | null {
  const rows = TABLE[productId];
  if (!rows?.length) return null;
  return rows.find((row) => quantity <= row.cantidad) ?? rows[rows.length - 1];
}

/** Horas laborables hasta la entrega, o null si ese nivel no se ofrece para esa cantidad. */
export function leadHours(productId: string, quantity: number, level: LeadLevel): number | null {
  return rowFor(productId, quantity)?.[level] ?? null;
}

/** En días hábiles (24 h = 1 día), redondeando hacia arriba. */
export function leadDays(productId: string, quantity: number, level: LeadLevel): number | null {
  const hours = leadHours(productId, quantity, level);
  return hours === null ? null : Math.max(1, Math.ceil(hours / 24));
}

/** «24 horas», «3 días hábiles», «a confirmar». */
export function leadLabel(hours: number | null): string {
  if (hours === null) return "a confirmar";
  if (hours < 24) return `${hours} horas`;
  const days = Math.ceil(hours / 24);
  return `${days} ${days === 1 ? "día hábil" : "días hábiles"}`;
}

export type LeadRange = { from: number; to: number } & Record<LeadLevel, number | null>;

/**
 * Los plazos de un producto agrupados por rangos de cantidad: si 50, 100 y
 * 250 tardan lo mismo, sale una sola fila «50 a 250 u.».
 */
export function leadRanges(productId: string): LeadRange[] {
  const rows = TABLE[productId] ?? [];
  const ranges: LeadRange[] = [];
  for (const row of rows) {
    const last = ranges[ranges.length - 1];
    if (last && LEAD_LEVELS.every((level) => last[level] === row[level])) last.to = row.cantidad;
    else ranges.push({ from: row.cantidad, to: row.cantidad, express: row.express, priority: row.priority, standard: row.standard });
  }
  return ranges;
}

export function rangeLabel(range: { from: number; to: number }): string {
  const format = (value: number) => value.toLocaleString("es-EC");
  return range.from === range.to ? `${format(range.from)} u.` : `${format(range.from)} a ${format(range.to)} u.`;
}

/** Si el plazo cambia con la cantidad (para decirlo en la ficha). */
export function varies(productId: string): boolean {
  return leadRanges(productId).length > 1;
}

/**
 * Filas «Producto · cantidades | Standard | Priority | Express» para las
 * tablas de Envío y de la ayuda. Una fila por rango de cantidad.
 */
export function leadTableRows(products: ReadonlyArray<{ id: string; name: string }>): string[][] {
  return products.flatMap((product) =>
    leadRanges(product.id).map((range) => [
      `${product.name} · ${rangeLabel(range)}`,
      leadLabel(range.standard),
      leadLabel(range.priority),
      leadLabel(range.express),
    ]),
  );
}
