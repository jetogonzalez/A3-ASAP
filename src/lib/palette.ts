/*
 * Tintas de imprenta para las familias: un fondo suave y un acento del mismo
 * tono. Le dan color al sitio sin que todo sea azul; las tarjetas llevan el
 * azul de la marca.
 */
export type Ink = { tint: string; accent: string; deep: string };

export const FAMILY_INK: Record<string, Ink> = {
  tarjetas: { tint: "#ecebff", accent: "#4660ff", deep: "#2d43d6" },
  promocionales: { tint: "#ffe9df", accent: "#ff5a2c", deep: "#a8300c" },
  textil: { tint: "#e3f6e8", accent: "#1f9d48", deep: "#14713a" },
  empaque: { tint: "#fff5cf", accent: "#e09a00", deep: "#7a5300" },
  papeleria: { tint: "#e0f3fb", accent: "#138fc9", deep: "#0c6a96" },
  pegatinas: { tint: "#fce6f1", accent: "#d93d84", deep: "#a3245f" },
  catalogos: { tint: "#ecebff", accent: "#6e4cf5", deep: "#4f30cf" },
  "gran-formato": { tint: "#def3ef", accent: "#13907d", deep: "#0c6b5c" },
};

export function inkFor(family: string): Ink {
  return FAMILY_INK[family] ?? FAMILY_INK.tarjetas;
}
