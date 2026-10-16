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
