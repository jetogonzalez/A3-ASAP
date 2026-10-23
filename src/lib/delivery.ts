import { withIva } from "@/lib/tax";

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

/** Sin el día de la semana, para los renglones donde el nombre largo no cabe. */
export function formatShortDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-EC", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(isoDate));
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
 * Tres ritmos de entrega. Los días cuentan desde el pedido hasta la puerta,
 * producción y mensajería incluidas. El recargo va una sola vez por pedido:
 * si dos tarjetas piden ritmos distintos, todo sale al más rápido.
 * Los recargos van con IVA: $8 y $15 más el 15 %.
 * Nombres y colores son los del material de marca (Standard, Priority, Express);
 * el ícono de cada uno está en components/delivery-icon.tsx.
 */
export const DELIVERY_OPTIONS = [
  { id: "standard", name: "Standard", cents: 0, earliestDays: 5, latestDays: 8 },
  { id: "priority", name: "Priority", cents: withIva(800), earliestDays: 3, latestDays: 5 },
  { id: "express", name: "Express", cents: withIva(1500), earliestDays: 2, latestDays: 3 },
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

/** El ritmo más rápido entre los que se pidieron: con ese sale todo el pedido. */
export function fastestDelivery(ids: readonly string[]) {
  let fastest: (typeof DELIVERY_OPTIONS)[number] = DELIVERY_OPTIONS[0];
  for (const id of ids) {
    const option = deliveryOption(id);
    if (DELIVERY_OPTIONS.indexOf(option) > DELIVERY_OPTIONS.indexOf(fastest)) fastest = option;
  }
  return fastest;
}
