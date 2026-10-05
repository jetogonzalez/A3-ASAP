export type ServicePlace = {
  name: string;
  group: "Quito" | "Valles";
};

/** Cobertura de demostración. Por ahora no salimos de Quito ni de los valles. */
export const SERVICE_PLACES: ServicePlace[] = [
  { name: "Quito", group: "Quito" },
  { name: "Cumbayá", group: "Valles" },
  { name: "Tumbaco", group: "Valles" },
  { name: "Puembo", group: "Valles" },
  { name: "Pifo", group: "Valles" },
  { name: "Tababela", group: "Valles" },
  { name: "Yaruquí", group: "Valles" },
  { name: "Nayón", group: "Valles" },
  { name: "Sangolquí", group: "Valles" },
  { name: "Conocoto", group: "Valles" },
  { name: "San Rafael", group: "Valles" },
  { name: "Amaguaña", group: "Valles" },
  { name: "La Armenia", group: "Valles" },
];

export function isServicePlace(name: string): boolean {
  return SERVICE_PLACES.some((place) => place.name === name);
}

export type ShippingMethod = "retiro" | "envio";

export type ShippingQuote = {
  cents: number;
  label: string;
  detail: string;
};

/**
 * Tarifas de demostración. No vienen de la hoja de costos.
 * El producto sí: la hoja solo cubre la impresión.
 */
export function shippingQuote(method: ShippingMethod): ShippingQuote {
  if (method === "retiro") {
    return {
      cents: 0,
      label: "Retiro en Quito",
      detail: "Sin costo. Lista en 4 días hábiles.",
    };
  }
  return {
    cents: 350,
    label: "Envío en Quito y valles",
    detail: "Tarifa de demostración · 4 días hábiles.",
  };
}

export const SHIPPING_TABLE: Array<{ zone: string; price: string; time: string }> = [
  { zone: "Retiro en Quito", price: "$0.00", time: "4 días hábiles" },
  { zone: "Quito y valles", price: "$3.50", time: "4 días hábiles" },
];
