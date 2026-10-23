/*
 * Datos de la empresa que van en la proforma. Los que están en null aún no se
 * han definido: la proforma no los muestra hasta que se completen aquí.
 */
export const COMPANY = {
  name: "Esto es ASAP",
  /** Razón social con la que se factura (o el nombre, si es persona natural). */
  legalName: null as string | null,
  ruc: null as string | null,
  address: null as string | null,
  email: null as string | null,
  city: "Quito, Ecuador",
  web: "estoesasap.com",
  whatsapp: "096 295 6566",
};
