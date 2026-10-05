/** Ecuador continental no usa horario de verano. */
const ECUADOR_OFFSET_MS = 5 * 60 * 60 * 1000;

function ecuadorDay(iso: string): Date {
  const shifted = new Date(new Date(iso).getTime() - ECUADOR_OFFSET_MS);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
}

/** Suma días hábiles después del día del pedido, en calendario de Ecuador. */
export function addBusinessDays(iso: string, days: number): string {
  if (!Number.isInteger(days) || days < 0) {
    throw new Error("Días hábiles inválidos");
  }
  let cursor = ecuadorDay(iso);
  let left = days;
  while (left > 0) {
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    const weekday = cursor.getUTCDay();
    if (weekday !== 0 && weekday !== 6) left -= 1;
  }
  return cursor.toISOString();
}

export function formatLongDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  })
    .format(new Date(isoDate))
    .replace(",", "");
}

/**
 * Tres ritmos de entrega, al estilo de un portal de impresión.
 * El recargo es de demostración: no está en la hoja PVP.
 * El envío por provincia se sigue sumando al pagar.
 */
export const DELIVERY_OPTIONS = [
  { id: "standard", name: "Estándar", cents: 0, earliestDays: 5, latestDays: 8 },
  { id: "priority", name: "Prioritario", cents: 800, earliestDays: 3, latestDays: 5 },
  { id: "express", name: "Exprés", cents: 1500, earliestDays: 2, latestDays: 3 },
] as const;

export type DeliverySpeed = (typeof DELIVERY_OPTIONS)[number]["id"];

export function deliveryOption(id: string) {
  return DELIVERY_OPTIONS.find((option) => option.id === id) ?? DELIVERY_OPTIONS[0];
}

export function deliveryWindow(orderedAtIso: string, id: DeliverySpeed = "standard") {
  const option = deliveryOption(id);
  return {
    earliest: addBusinessDays(orderedAtIso, option.earliestDays),
    latest: addBusinessDays(orderedAtIso, option.latestDays),
  };
}
