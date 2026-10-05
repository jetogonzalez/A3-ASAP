import { SIZES } from "@/lib/catalog";
import type { Configuration } from "@/lib/catalog";

/* La cartulina del catálogo: 300 gramos por metro cuadrado. */
const PAPER_GSM = 300;

/* El laminado es una película de BOPP por cada cara, unos 11 g/m² cada una. */
const LAMINATE_GSM_PER_FACE = 11;

/** Caja, papel de envolver y etiqueta. */
const PACKAGING_GRAMS = 80;

/**
 * Lo que pesa el paquete, en gramos. Sale de la superficie impresa y del
 * gramaje del papel, así que no hay nada que estimar a ojo: una tarjeta
 * clásica de 8,5 × 5,5 cm en couché de 300 g pesa 1,4 g.
 */
export function packageGrams(config: Configuration): number {
  const size = SIZES[config.sizeId];
  const squareMeters = (size.widthMm / 1000) * (size.heightMm / 1000);
  const gsm = config.laminate === "none" ? PAPER_GSM : PAPER_GSM + LAMINATE_GSM_PER_FACE * 2;
  return Math.round(squareMeters * gsm * config.quantity + PACKAGING_GRAMS);
}

/** El peso de toda la tanda, sin cobrar el empaque dos veces. */
export function cartGrams(configs: Configuration[]): number {
  if (configs.length === 0) return 0;
  const sum = configs.reduce((total, config) => total + packageGrams(config), 0);
  return sum - PACKAGING_GRAMS * (configs.length - 1);
}

/* Con coma, como el resto de las medidas del sitio: «8,5 × 5,5 cm». */
export function formatWeight(grams: number): string {
  if (grams < 1000) return `${grams} g`;
  const kilos = (grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 2);
  return `${kilos.replace(".", ",")} kg`;
}
