import data from "@/data/prices.json";

/*
 * Precios referenciales de los productos de lanzamiento. Salen de la matriz
 * (hoja Precios, precio_unit_sin_iva) con scripts/importar-precios.py, que
 * escribe src/data/prices.json. Son por unidad y SIN IVA; el total se sigue
 * confirmando por WhatsApp (acabados y envío se suman).
 *
 * Solo se usan las cantidades que la web ofrece para ese producto: si la
 * matriz trae un precio para 1000 y la ficha llega a 500, ese no se muestra.
 */

type Row = { variante: string; cantidad: number; precio: number };
const TABLE = data as Record<string, Row[]>;

function rowsFor(productId: string, quantities: readonly number[]): Row[] {
  return (TABLE[productId] ?? []).filter((row) => quantities.includes(row.cantidad));
}

/** El precio unitario más bajo del producto, o null si la matriz no lo trae. */
export function launchPriceFrom(productId: string, quantities: readonly number[]): number | null {
  const rows = rowsFor(productId, quantities);
  return rows.length ? Math.min(...rows.map((row) => row.precio)) : null;
}

/** El más alto, para el rango de precios de los datos para Google. */
export function launchPriceTo(productId: string, quantities: readonly number[]): number | null {
  const rows = rowsFor(productId, quantities);
  return rows.length ? Math.max(...rows.map((row) => row.precio)) : null;
}

export type PriceTable = {
  quantities: number[];
  variants: { name: string; prices: Array<number | null> }[];
};

/** Tabla variante × cantidad para la ficha. Una celda sin precio queda en null («a confirmar»). */
export function launchPriceTable(productId: string, quantities: readonly number[]): PriceTable | null {
  const rows = rowsFor(productId, quantities);
  if (!rows.length) return null;
  const columns = quantities.filter((quantity) => rows.some((row) => row.cantidad === quantity));
  const names = [...new Set(rows.map((row) => row.variante))];
  return {
    quantities: columns,
    variants: names.map((name) => ({
      name,
      prices: columns.map((quantity) => rows.find((row) => row.variante === name && row.cantidad === quantity)?.precio ?? null),
    })),
  };
}

/** «$0,47» o, para precios de centavos como las etiquetas, «$0,033». */
export function formatUnitPrice(value: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 0.1 ? 3 : 2,
  }).format(value);
}
