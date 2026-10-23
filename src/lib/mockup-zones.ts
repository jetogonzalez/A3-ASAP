/*
 * Dónde cae el diseño del cliente sobre cada foto de referencia, en % de la
 * foto (1200 × 896). Con esto la galería arma el mockup: la imagen que subió
 * encima del producto, en la zona que se imprime. Si se cambia una foto, se
 * ajusta aquí su zona.
 */
export type MockupZone = {
  left: number;
  top: number;
  width: number;
  height: number;
  /** Giro en grados, para productos fotografiados en diagonal. */
  rotate?: number;
  /** Etiquetas y sellos redondos. */
  round?: boolean;
};

export const MOCKUP_ZONES: Record<string, MockupZone> = {
  "tarjetas-de-presentacion": { left: 41, top: 33, width: 33, height: 23 },
  esferos: { left: 43, top: 46, width: 15, height: 4.5, rotate: -28 },
  "toma-todos": { left: 34, top: 44, width: 11, height: 18 },
  "tazas-mugs": { left: 41, top: 39, width: 16, height: 21 },
  "camisetas-hoodies": { left: 52, top: 39, width: 14, height: 15 },
  gorras: { left: 50.5, top: 36, width: 12.5, height: 15.5, rotate: -10 },
  "tote-bags": { left: 40, top: 54, width: 21, height: 25 },
  "papel-regalo": { left: 60, top: 32, width: 8, height: 9, round: true },
  etiquetas: { left: 37, top: 35, width: 10, height: 12, round: true },
  "tarjetas-de-regalo": { left: 55, top: 35, width: 22, height: 24 },
  calendarios: { left: 31, top: 35, width: 40, height: 33 },
  cuadernos: { left: 32, top: 38, width: 16, height: 13 },
};
