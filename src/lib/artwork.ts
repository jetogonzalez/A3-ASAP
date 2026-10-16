/** PDF, PNG o JPG de hasta 8 MB: lo mismo que pide la ficha de diseño. */
export const MAX_ARTWORK_BYTES = 8 * 1024 * 1024;

export const ARTWORK_TYPES = ["application/pdf", "image/png", "image/jpeg"] as const;

/**
 * Los archivos viven en Vercel Blob. Solo se aceptan enlaces de ahí, para que
 * nadie meta en el pedido un enlace a otro sitio haciéndolo pasar por el arte.
 */
export function isArtworkUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com") &&
      url.pathname.startsWith("/artes/")
    );
  } catch {
    return false;
  }
}

export const CANVA_FILENAME = "Diseño en Canva";

/**
 * Un diseño compartido desde Canva: «Compartir → Copiar enlace». Llega como
 * canva.com/design/… o como enlace corto canva.link/….
 */
export function isCanvaUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return false;
    if (url.hostname === "canva.link") return url.pathname.length > 1;
    return (url.hostname === "www.canva.com" || url.hostname === "canva.com") && url.pathname.startsWith("/design/");
  } catch {
    return false;
  }
}

export type ArtworkSource = "archivo" | "canva";
