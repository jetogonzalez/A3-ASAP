import { leadDays } from "@/lib/lead-times";
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
 * Tres niveles de entrega: Standard, Priority y Express. Desde la reunión del
 * 23 de octubre el plazo ya no es igual para todo: depende del producto y de
 * la cantidad (matriz v1.3, hoja Precios, columnas dias_hab_*). Aquí quedan el
 * nombre y el recargo, que va una sola vez por pedido y con IVA: $8 y $15 más
 * el 15 %. Nombres y colores son los del material de marca; el ícono de cada
 * uno está en components/delivery-icon.tsx.
 */
export const DELIVERY_OPTIONS = [
  { id: "standard", name: "Standard", cents: 0 },
  { id: "priority", name: "Priority", cents: withIva(800) },
  { id: "express", name: "Express", cents: withIva(1500) },
] as const;

export type DeliverySpeed = (typeof DELIVERY_OPTIONS)[number]["id"];

export function deliveryOption(id: string) {
  return DELIVERY_OPTIONS.find((option) => option.id === id) ?? DELIVERY_OPTIONS[0];
}

/*
 * Días hábiles hasta la puerta de las tarjetas, por cantidad y nivel. Cada
 * fila vale hasta esa cantidad. Express 24 h, Priority 48 h y Standard 72 h,
 * como se acordó; si una cantidad grande tarda más, se agrega otra fila.
 * Cuentan desde que se confirma el pago y está el archivo.
 */
export const CARD_LEAD_DAYS: ReadonlyArray<{ upTo: number } & Record<DeliverySpeed, number>> = [
  { upTo: 1000, express: 1, priority: 2, standard: 3 },
];

/** Días hábiles de las tarjetas: los de la matriz para esa cantidad; si faltan, la tabla de arriba. */
export function cardLeadDays(quantity: number, speed: DeliverySpeed = "standard"): number {
  const fromMatrix = leadDays("TPR", quantity, speed);
  if (fromMatrix !== null) return fromMatrix;
  const row = CARD_LEAD_DAYS.find((candidate) => quantity <= candidate.upTo) ?? CARD_LEAD_DAYS[CARD_LEAD_DAYS.length - 1];
  return row[speed];
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

/** Una línea por nivel con el plazo de 100 tarjetas y su recargo, para Ayuda y llms.txt. */
export function cardDeliverySummary(format: (cents: number) => string): string[] {
  return DELIVERY_OPTIONS.map(
    (option) =>
      `${option.name}: ${businessDaysLabel(cardLeadDays(100, option.id))}${option.cents === 0 ? " (incluido)" : ` (+ ${format(option.cents)})`}`,
  );
}
