import { isArtworkUrl } from "@/lib/artwork";
import { productHref, type Configuration } from "@/lib/catalog";

/** El arte que vuelve de Canva: el PDF para imprimir y las caras en PNG para la muestra. */
export type CanvaDesign = { pdf: string; front: string; back: string | null };

export type CanvaStatus = "listo" | "cancelado" | "error" | "exportar" | "apagado";

export type CanvaReturn = { status: CanvaStatus; design: CanvaDesign | null };

export const CANVA_EXPORT_FILENAME = "Diseño de Canva.pdf";

const STATUSES: CanvaStatus[] = ["listo", "cancelado", "error", "exportar", "apagado"];

type Search = Record<string, string | string[] | undefined>;

function one(search: Search, key: string): string | undefined {
  const value = search[key];
  return Array.isArray(value) ? value[0] : value;
}

/** Lee lo que dejó la vuelta desde Canva. Solo se aceptan archivos de nuestro Blob. */
export function canvaReturnFromSearch(search: Search): CanvaReturn | null {
  const status = one(search, "canva");
  if (!status || !STATUSES.some((known) => known === status)) return null;
  const pdf = one(search, "canva_pdf");
  const front = one(search, "canva_frente");
  const back = one(search, "canva_reverso");
  const design =
    status === "listo" && pdf && front && isArtworkUrl(pdf) && isArtworkUrl(front)
      ? { pdf, front, back: back && isArtworkUrl(back) ? back : null }
      : null;
  return { status: design ? "listo" : status === "listo" ? "error" : (status as CanvaStatus), design };
}

export function pickedFromSearch(search: Search): string[] {
  return (one(search, "elegido") ?? "").split(",").filter(Boolean);
}

/** El botón «Diseñar en Canva»: lleva el tamaño y la página a la que hay que volver. */
export function canvaStartHref(config: Configuration, editId: string | undefined, picked: string[]): string {
  const back = `${productHref(config, editId)}&elegido=${picked.join(",")}`;
  const params = new URLSearchParams({
    tamano: config.sizeId,
    lados: String(config.sides),
    volver: back,
  });
  return `/api/canva/start?${params.toString()}`;
}
