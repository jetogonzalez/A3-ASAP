import { MATRIZ, hoursToBusinessDays, leadHours, type SpeedId } from "@/lib/matriz";

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
 * Tres niveles de entrega: Standard, Priority y Express. Desde la matriz v1.4
 * el recargo ya no es fijo: es un porcentaje del subtotal de impresión
 * (50 % Priority, 75 % Express), como Helloprint, y va una sola vez por pedido.
 * El plazo depende del producto y la cantidad (hoja PRECIOS, horas_*). Nombres
 * y colores son los del material de marca; el ícono de cada uno está en
 * components/delivery-icon.tsx.
 */
export const DELIVERY_OPTIONS = (["standard", "priority", "express"] as const).map((id) => ({
  id,
  name: MATRIZ.speeds[id]?.name ?? id,
  percent: MATRIZ.speeds[id]?.surchargePercent ?? 0,
}));

export type DeliverySpeed = SpeedId;

export function deliveryOption(id: string) {
  return DELIVERY_OPTIONS.find((option) => option.id === id) ?? DELIVERY_OPTIONS[0];
}

/** El recargo de entrega sobre un subtotal que ya trae IVA, así sale con IVA. */
export function surchargeCents(id: string, subtotalCents: number): number {
  return Math.round((subtotalCents * deliveryOption(id).percent) / 100);
}

/** «Incluido», «+ 50 %». */
export function surchargeLabel(id: string): string {
  const { percent } = deliveryOption(id);
  return percent === 0 ? "Incluido" : `+ ${percent} %`;
}

/** Días hábiles hasta la puerta de un producto de la matriz con ese nivel. */
export function productLeadDays(productId: string, variantCode: string, speed: DeliverySpeed = "standard"): number {
  return hoursToBusinessDays(leadHours(productId, variantCode, speed));
}

/** Las tarjetas toman sus horas de la matriz (producto TPR). */
export function cardLeadDays(_quantity: number, speed: DeliverySpeed = "standard"): number {
  return productLeadDays("TPR", "CLA1L", speed);
}

export type DeliveryWindow = { days: number; earliest: string; latest: string };

/** Cuándo llega un pedido de esa cantidad de tarjetas con ese nivel. */
export function deliveryWindow(orderedAtIso: string, id: DeliverySpeed = "standard", quantity = 100): DeliveryWindow {
  return deliveryInDays(orderedAtIso, cardLeadDays(quantity, id));
}

export function deliveryInDays(orderedAtIso: string, days: number): DeliveryWindow {
  const date = addBusinessDays(orderedAtIso, days);
  return { days, earliest: date, latest: date };
}

/** El nivel más rápido entre los que se pidieron: con ese sale todo el pedido y se cobra una vez. */
export function fastestDelivery(ids: readonly string[]) {
  let fastest: (typeof DELIVERY_OPTIONS)[number] = DELIVERY_OPTIONS[0];
  for (const id of ids) {
    const option = deliveryOption(id);
    if (DELIVERY_OPTIONS.indexOf(option) > DELIVERY_OPTIONS.indexOf(fastest)) fastest = option;
  }
  return fastest;
}

/**
 * La fecha de un pedido con varios productos: todo sale al nivel más rápido
 * que se eligió y llega cuando está listo el que más demora. Así se acordó:
 * «se toma el tiempo mayor».
 */
export function orderLeadDays(quantities: readonly number[], speed: DeliverySpeed): number {
  return quantities.reduce((longest, quantity) => Math.max(longest, cardLeadDays(quantity, speed)), 0) || cardLeadDays(100, speed);
}

/** «1 día hábil», «3 días hábiles». */
export function businessDaysLabel(days: number): string {
  return `${days} ${days === 1 ? "día hábil" : "días hábiles"}`;
}

/** Una línea por nivel con el plazo de las tarjetas y su recargo, para Ayuda y llms.txt. */
export function cardDeliverySummary(): string[] {
  return DELIVERY_OPTIONS.map(
    (option) =>
      `${option.name}: ${businessDaysLabel(cardLeadDays(100, option.id))}${option.percent === 0 ? " (incluido)" : ` (+ ${option.percent} % del subtotal)`}`,
  );
}
