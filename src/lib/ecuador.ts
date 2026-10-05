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
  /**
   * El envío de Quito y los valles depende del peso del paquete, así que no se
   * puede cerrar en la web: se cotiza al confirmar el pedido y no entra al total.
   */
  byWeight: boolean;
  label: string;
  detail: string;
};

/** La hoja de costos solo cubre la impresión. El envío se cotiza aparte. */
export function shippingQuote(): ShippingQuote {
  return {
    cents: 0,
    byWeight: true,
    label: "Envío en Quito y valles",
    detail: "El costo depende del peso del paquete. Te lo confirmamos al cerrar el pedido.",
  };
}

export const SHIPPING_TABLE: Array<{ zone: string; price: string; time: string }> = [
  { zone: "Quito y valles", price: "Según el peso", time: "4 días hábiles" },
];
