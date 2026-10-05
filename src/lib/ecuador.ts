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

/* Solo entrega a domicilio: no hay retiro en el taller. */
export type ShippingMethod = "envio";

export type ShippingQuote = {
  cents: number;
  grams: number;
  label: string;
  detail: string;
};

/* Tarifa de mensajería en Quito y los valles: un primer kilo y recargo por kilo empezado. */
const FIRST_KILO_CENTS = 350;
const EXTRA_KILO_CENTS = 75;

/**
 * El envío se cobra por peso, y el peso lo calcula la web a partir del papel y
 * la cantidad. Así la persona ve el costo antes de pagar, sin tener que
 * preguntarlo.
 */
export function shippingQuote(grams: number): ShippingQuote {
  const kilos = Math.max(1, Math.ceil(grams / 1000));
  return {
    cents: FIRST_KILO_CENTS + EXTRA_KILO_CENTS * (kilos - 1),
    grams,
    label: "Envío en Quito y valles",
    detail: "Llega en 4 días hábiles.",
  };
}

export const SHIPPING_TABLE: Array<{ zone: string; price: string; time: string }> = [
  { zone: "Quito y valles · hasta 1 kg", price: "$3.50", time: "4 días hábiles" },
  { zone: "Cada kilo adicional", price: "+ $0.75", time: "4 días hábiles" },
];
